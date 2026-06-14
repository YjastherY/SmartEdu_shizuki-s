import { Router } from "express";
import { z } from "zod";
import { authRequired, teacherOrAdmin } from "../middleware/auth.js";
import { prisma } from "../prisma.js";
import { sendNotification } from "../realtime.js";
import { asyncHandler } from "../utils.js";

const router = Router();

const questionSchema = z.object({
  type: z.enum(["SINGLE_CHOICE", "MULTIPLE_CHOICE", "MATCHING", "MANUAL"]).default("SINGLE_CHOICE"),
  text: z.string().min(3),
  maxScore: z.number().int().min(1).default(10),
  options: z.array(z.string()).optional(),
  correctIndexes: z.array(z.number()).optional(),
  pairs: z.array(z.object({ left: z.string(), right: z.string() })).optional()
});

const testSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional().or(z.literal("")),
  courseId: z.string(),
  lessonId: z.string().optional(),
  attemptLimit: z.number().int().min(1).default(2),
  timeLimitMinutes: z.number().int().min(1).default(20),
  deadline: z.string().optional().or(z.literal("")),
  isPublished: z.boolean().optional(),
  visibleFrom: z.string().optional().or(z.literal("")),
  questions: z.array(questionSchema).min(1)
});

const gradeSchema = z.object({
  score: z.number().min(0),
  autoScore: z.number().min(0).optional(),
  feedback: z.string().optional().or(z.literal(""))
});

const extensionSchema = z.object({
  deadline: z.string().min(8)
});

function answerData(question) {
  if (question.type === "MATCHING") {
    return (question.pairs || []).map((pair) => ({ text: `${pair.left} → ${pair.right}`, isCorrect: true }));
  }

  return (question.options || []).map((text, index) => ({
    text,
    isCorrect: (question.correctIndexes || []).includes(index)
  }));
}

function questionsCreateData(questions) {
  return questions.map((question, index) => ({
    text: question.text,
    type: question.type,
    maxScore: question.maxScore,
    order: index + 1,
    answers: { create: answerData(question) }
  }));
}

function assignmentStatus(test, extension) {
  const deadline = extension?.deadline || test.deadline;
  if (!deadline) return "ACTIVE";
  return new Date(deadline) < new Date() ? "OVERDUE" : extension ? "EXTENDED" : "ACTIVE";
}

function answerLabel(question, value) {
  if (value == null || value === "") return "Нет ответа";
  if (question.type === "MATCHING") {
    const selected = value && typeof value === "object" ? value : {};
    const pairs = question.answers.map((item) => item.text.split("→").map((part) => part.trim()));
    return pairs.map(([left], index) => `${left}: ${selected[index] || "нет ответа"}`).join("; ");
  }
  if (Array.isArray(value)) {
    return value.map((id) => question.answers.find((answer) => answer.id === String(id))?.text || String(id)).join(", ");
  }
  return question.answers.find((answer) => answer.id === String(value))?.text || String(value);
}

function correctLabel(question) {
  if (question.type === "MANUAL") return "Проверяется преподавателем";
  if (question.type === "MATCHING") return question.answers.map((item) => item.text).join("; ");
  return question.answers.filter((answer) => answer.isCorrect).map((answer) => answer.text).join(", ") || "Не задано";
}

function questionScoreFromReview(attempt, question) {
  const review = Array.isArray(attempt.reviewSnapshot) ? attempt.reviewSnapshot.find((item) => item.questionId === question.id) : null;
  if (review) return Number(review.score || 0);
  const manual = attempt.manualSubmissions.find((item) => item.questionId === question.id);
  if (manual?.score != null) return manual.score;
  return 0;
}

async function teacherCourseFilter(user) {
  if (user.role === "ADMIN") return {};

  const groups = await prisma.group.findMany({
    where: { teacherId: user.id },
    include: { courses: true }
  });
  const courseIds = groups.flatMap((group) => group.courses.map((item) => item.courseId));

  return { id: { in: courseIds } };
}

async function buildStudentRow(student) {
  const progress = await prisma.progress.findMany({
    where: { userId: student.id },
    include: { course: true }
  });
  const attempts = await prisma.testAttempt.findMany({
    where: { userId: student.id },
    include: { test: { include: { lesson: { include: { module: { include: { course: true } } } } } } },
    orderBy: { createdAt: "desc" }
  });
  const submissions = await prisma.manualSubmission.findMany({
    where: { userId: student.id },
    include: { question: { include: { test: true } } }
  });
  const extensions = await prisma.deadlineExtension.findMany({ where: { userId: student.id } });
  const tests = await prisma.test.findMany({
    where: { lesson: { module: { course: { groups: { some: { groupId: student.groupId || "" } } } } } },
    include: { lesson: { include: { module: { include: { course: true } } } } }
  });

  return {
    id: student.id,
    name: student.name,
    email: student.email,
    group: student.group?.title || "Без группы",
    progress: progress[0]?.percent || 0,
    bestScore: attempts.length ? Math.max(...attempts.filter((item) => item.status === "GRADED").map((item) => item.score), 0) : 0,
    pending: submissions.filter((item) => item.status === "PENDING").length,
    completed: progress.filter((item) => item.percent > 0).map((item) => item.course.title),
    strengthsByCourse: progress
      .filter((item) => item.averageScore >= 75)
      .map((item) => ({ course: item.course.title, topics: ["основные темы курса"] })),
    focusByCourse: progress
      .filter((item) => item.averageScore < 75)
      .map((item) => ({ course: item.course.title, topics: ["повторение материала", "практические задания"] })),
    grades: attempts
      .filter((item) => item.status === "GRADED")
      .map((item) => ({
        attemptId: item.id,
        testId: item.testId,
        title: item.test.title,
        score: item.score,
        autoScore: item.autoScore,
        manualScore: item.manualScore,
        totalPoints: item.totalPoints,
        details: [
          { label: "Автопроверка", value: `${item.autoScore} баллов` },
          ...(item.manualScore === null ? [] : [{ label: "Развернутый ответ", value: `${item.manualScore} баллов` }])
        ]
      })),
    assignments: tests.map((test) => {
      const extension = extensions.find((item) => item.testId === test.id);
      return {
        id: test.id,
        title: test.title,
        course: test.lesson.module.course.title,
        dueDate: test.deadline?.toISOString().slice(0, 10) || "",
        effectiveDate: (extension?.deadline || test.deadline)?.toISOString().slice(0, 10) || "",
        extendedUntil: extension?.deadline?.toISOString().slice(0, 10) || null,
        submitted: attempts.some((item) => item.testId === test.id),
        status: attempts.some((item) => item.testId === test.id) ? "SUBMITTED" : assignmentStatus(test, extension)
      };
    })
  };
}

router.get(
  "/teacher/overview",
  authRequired,
  teacherOrAdmin,
  asyncHandler(async (req, res) => {
    const courseFilter = await teacherCourseFilter(req.user);
    const courses = await prisma.course.findMany({
      where: courseFilter,
      include: {
        groups: true,
        users: true,
        modules: {
          orderBy: { order: "asc" },
          include: { lessons: { orderBy: { order: "asc" }, include: { test: { include: { questions: { include: { answers: true } } } } } } }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    const groups = await prisma.group.findMany({
      where: req.user.role === "ADMIN" ? {} : { teacherId: req.user.id },
      include: {
        teacher: { select: { id: true, name: true, email: true } },
        students: { where: { role: "STUDENT" }, include: { group: true }, orderBy: { name: "asc" } },
        courses: { include: { course: true } }
      },
      orderBy: { title: "asc" }
    });
    const submissions = await prisma.manualSubmission.findMany({
      where:
        req.user.role === "ADMIN"
          ? {}
          : { user: { group: { teacherId: req.user.id } } },
      include: {
        user: { select: { id: true, name: true, email: true, group: true } },
        question: { include: { test: { include: { lesson: { include: { module: { include: { course: true } } } } } } } },
        attempt: true
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }]
    });

    const hydratedGroups = await Promise.all(
      groups.map(async (group) => ({
        id: group.id,
        title: group.title,
        teacherId: group.teacherId,
        courseIds: group.courses.map((item) => item.courseId),
        teacher: group.teacher,
        students: await Promise.all(group.students.map((student) => buildStudentRow(student)))
      }))
    );

    res.json({
      courses,
      groups: hydratedGroups,
      students: hydratedGroups.flatMap((group) => group.students),
      customTests: await prisma.test.findMany({
        where: { creatorId: req.user.role === "ADMIN" ? undefined : req.user.id },
        orderBy: { createdAt: "desc" },
        include: { questions: true }
      }),
      manualSubmissions: submissions.map((item) => ({
        id: item.id,
        studentId: item.userId,
        testTitle: item.question.test.title,
        question: item.question.text,
        answer: item.answer,
        status: item.status,
        score: item.score,
        maxScore: item.maxScore,
        feedback: item.feedback,
        autoScore: item.attempt.autoScore,
        totalPoints: item.attempt.totalPoints,
        finalScore: item.attempt.status === "GRADED" ? item.attempt.score : null,
        student: item.user,
        group: item.user.group,
        course: item.question.test.lesson.module.course,
        answers: []
      }))
    });
  })
);

router.post(
  "/teacher/tests",
  authRequired,
  teacherOrAdmin,
  asyncHandler(async (req, res) => {
    const data = testSchema.parse(req.body);
    const firstModule = await prisma.module.findFirst({
      where: { courseId: data.courseId },
      orderBy: { order: "asc" }
    });

    if (!firstModule) return res.status(404).json({ message: "Course module not found" });

    const lesson =
      data.lessonId
        ? await prisma.lesson.findUnique({ where: { id: data.lessonId } })
        : await prisma.lesson.create({
            data: {
              title: data.title,
              type: "TEST",
              order: 99,
              duration: `${data.timeLimitMinutes} мин`,
              content: data.description || "",
              isPublished: data.isPublished ?? true,
              visibleFrom: data.visibleFrom ? new Date(data.visibleFrom) : null,
              moduleId: firstModule.id
            }
          });

    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    const test = await prisma.test.create({
      data: {
        title: data.title,
        description: data.description || null,
        attemptLimit: data.attemptLimit,
        timeLimitMinutes: data.timeLimitMinutes,
        deadline: data.deadline ? new Date(data.deadline) : null,
        lessonId: lesson.id,
        creatorId: req.user.id,
        questions: {
          create: questionsCreateData(data.questions)
        }
      },
      include: { questions: { include: { answers: true } } }
    });

    res.status(201).json({ test });
  })
);

router.put(
  "/teacher/tests/:id",
  authRequired,
  teacherOrAdmin,
  asyncHandler(async (req, res) => {
    const data = testSchema.omit({ courseId: true, lessonId: true }).parse(req.body);
    const test = await prisma.test.findUnique({
      where: { id: req.params.id },
      include: { lesson: true }
    });

    if (!test) return res.status(404).json({ message: "Test not found" });

    const updated = await prisma.$transaction(async (tx) => {
      await tx.lesson.update({
        where: { id: test.lessonId },
        data: {
          title: data.title,
          type: "TEST",
          duration: `${data.timeLimitMinutes} мин`,
          content: data.description || "",
          isPublished: data.isPublished ?? true,
          visibleFrom: data.visibleFrom ? new Date(data.visibleFrom) : null
        }
      });
      await tx.question.deleteMany({ where: { testId: test.id } });
      return tx.test.update({
        where: { id: test.id },
        data: {
          title: data.title,
          description: data.description || null,
          attemptLimit: data.attemptLimit,
          timeLimitMinutes: data.timeLimitMinutes,
          deadline: data.deadline ? new Date(data.deadline) : null,
          questions: { create: questionsCreateData(data.questions) }
        },
        include: { questions: { include: { answers: true } } }
      });
    });

    res.json({ test: updated });
  })
);

router.patch(
  "/teacher/submissions/:id/grade",
  authRequired,
  teacherOrAdmin,
  asyncHandler(async (req, res) => {
    const data = gradeSchema.parse(req.body);
    const submission = await prisma.manualSubmission.findUnique({
      where: { id: req.params.id },
      include: { user: true, attempt: true, question: { include: { test: true } } }
    });

    if (!submission) return res.status(404).json({ message: "Submission not found" });

    const manualScore = Math.min(data.score, submission.maxScore);
    const autoScore = Math.min(data.autoScore ?? submission.attempt.autoScore, submission.attempt.totalPoints);
    const siblings = await prisma.manualSubmission.findMany({
      where: { attemptId: submission.attemptId, id: { not: submission.id } }
    });
    const manualTotal = siblings.reduce((sum, item) => sum + (item.score || 0), manualScore);
    const earnedPoints = autoScore + manualTotal;
    const finalScore = submission.attempt.totalPoints ? Math.round((earnedPoints / submission.attempt.totalPoints) * 100) : 0;
    const allManualGraded = siblings.every((item) => item.status === "GRADED");

    const updated = await prisma.manualSubmission.update({
      where: { id: submission.id },
      data: {
        score: manualScore,
        feedback: data.feedback || null,
        status: "GRADED",
        gradedAt: new Date()
      }
    });

    if (allManualGraded) {
      await prisma.testAttempt.update({
        where: { id: submission.attemptId },
        data: {
          manualScore: manualTotal,
          autoScore,
          earnedPoints,
          score: finalScore,
          status: "GRADED"
        }
      });
    }

    const notification = await prisma.notification.create({
      data: {
        userId: submission.userId,
        title: "Оценка выставлена",
        message: `Преподаватель оценил работу «${submission.question.test.title}»: ${manualScore} из ${submission.maxScore}.`
      }
    });
    sendNotification(submission.userId, notification);

    res.json({ submission: { ...updated, autoScore, finalScore: allManualGraded ? finalScore : null } });
  })
);

router.patch(
  "/teacher/students/:studentId/extensions/:testId",
  authRequired,
  teacherOrAdmin,
  asyncHandler(async (req, res) => {
    const data = extensionSchema.parse(req.body);
    const extension = await prisma.deadlineExtension.upsert({
      where: { userId_testId: { userId: req.params.studentId, testId: req.params.testId } },
      update: { deadline: new Date(data.deadline) },
      create: { userId: req.params.studentId, testId: req.params.testId, deadline: new Date(data.deadline) },
      include: { test: true, user: true }
    });

    const notification = await prisma.notification.create({
      data: {
        userId: req.params.studentId,
        title: "Срок задания продлён",
        message: `Преподаватель продлил срок задания «${extension.test.title}» до ${extension.deadline.toLocaleDateString("ru-RU")}.`
      }
    });
    sendNotification(req.params.studentId, notification);

    res.json({ extension });
  })
);

router.get(
  "/teacher/attempts/:id",
  authRequired,
  teacherOrAdmin,
  asyncHandler(async (req, res) => {
    const attempt = await prisma.testAttempt.findUnique({
      where: { id: req.params.id },
      include: {
        user: { include: { group: true } },
        manualSubmissions: true,
        test: {
          include: {
            questions: { include: { answers: true }, orderBy: { order: "asc" } },
            lesson: { include: { module: { include: { course: true } } } }
          }
        }
      }
    });

    if (!attempt) return res.status(404).json({ message: "Attempt not found" });
    if (req.user.role !== "ADMIN" && attempt.user.group?.teacherId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const answers = attempt.answerSnapshot && typeof attempt.answerSnapshot === "object" ? attempt.answerSnapshot : {};
    const review = Array.isArray(attempt.reviewSnapshot) ? attempt.reviewSnapshot : [];
    const questions = attempt.test.questions.map((question) => {
      const manual = attempt.manualSubmissions.find((item) => item.questionId === question.id);
      const saved = review.find((item) => item.questionId === question.id);
      const value = question.type === "MANUAL" ? manual?.answer : answers[question.id];
      return {
        id: question.id,
        text: question.text,
        type: question.type,
        maxScore: question.maxScore,
        answer: value,
        answerText: answerLabel(question, value),
        correctText: correctLabel(question),
        score: saved?.score ?? manual?.score ?? 0,
        feedback: manual?.feedback || "",
        hasSnapshot: question.type === "MANUAL" || Object.hasOwn(answers, question.id)
      };
    });

    res.json({
      attempt: {
        id: attempt.id,
        score: attempt.score,
        autoScore: attempt.autoScore,
        manualScore: attempt.manualScore,
        earnedPoints: attempt.earnedPoints,
        totalPoints: attempt.totalPoints,
        status: attempt.status,
        feedback: attempt.feedback,
        createdAt: attempt.createdAt,
        student: { id: attempt.user.id, name: attempt.user.name, email: attempt.user.email },
        course: attempt.test.lesson.module.course.title,
        test: { id: attempt.test.id, title: attempt.test.title },
        questions
      }
    });
  })
);

router.patch(
  "/teacher/attempts/:id/regrade",
  authRequired,
  teacherOrAdmin,
  asyncHandler(async (req, res) => {
    const data = z.object({
      score: z.number().min(0).max(100),
      autoScore: z.number().min(0).optional(),
      questionScores: z.record(z.string(), z.number().min(0)).optional(),
      feedback: z.string().optional().or(z.literal(""))
    }).parse(req.body);
    const attempt = await prisma.testAttempt.findUnique({
      where: { id: req.params.id },
      include: {
        user: { include: { group: true } },
        manualSubmissions: true,
        test: { include: { lesson: { include: { module: { include: { course: true } } } } } }
      }
    });

    if (!attempt) return res.status(404).json({ message: "Attempt not found" });
    if (req.user.role !== "ADMIN" && attempt.user.group?.teacherId !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const questions = await prisma.question.findMany({ where: { testId: attempt.testId } });
    const questionScores = data.questionScores || {};
    const reviewSnapshot = questions.map((question) => {
      const current = questionScoreFromReview(attempt, question);
      const score = Math.min(Number(questionScores[question.id] ?? current), Number(question.maxScore || 0));
      return { questionId: question.id, score, maxScore: question.maxScore, auto: question.type !== "MANUAL" };
    });
    const earnedPoints = data.questionScores
      ? reviewSnapshot.reduce((sum, item) => sum + Number(item.score || 0), 0)
      : Math.round((data.score / 100) * attempt.totalPoints);
    const autoScore = data.autoScore == null
      ? reviewSnapshot.filter((item) => item.auto).reduce((sum, item) => sum + Number(item.score || 0), 0)
      : Math.min(data.autoScore, attempt.totalPoints);
    const manualScore = Math.max(earnedPoints - autoScore, 0);
    const score = attempt.totalPoints ? Math.round((earnedPoints / attempt.totalPoints) * 100) : Math.round(data.score);
    const updated = await prisma.testAttempt.update({
      where: { id: attempt.id },
      data: {
        score,
        autoScore,
        manualScore,
        earnedPoints,
        reviewSnapshot,
        feedback: data.feedback || null,
        status: "GRADED"
      }
    });
    await Promise.all(
      attempt.manualSubmissions.map((submission) => {
        const review = reviewSnapshot.find((item) => item.questionId === submission.questionId);
        return prisma.manualSubmission.update({
          where: { id: submission.id },
          data: {
            score: review?.score ?? submission.score ?? 0,
            feedback: data.feedback || submission.feedback,
            status: "GRADED",
            gradedAt: new Date()
          }
        });
      })
    );

    const notification = await prisma.notification.create({
      data: {
        userId: attempt.userId,
        title: "Оценка обновлена",
        message: `Преподаватель обновил оценку за работу «${attempt.test.title}»: ${updated.score}%.`
      }
    });
    sendNotification(attempt.userId, notification);

    res.json({ attempt: updated, feedback: data.feedback || "" });
  })
);

export default router;
