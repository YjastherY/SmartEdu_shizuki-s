import { Router } from "express";
import { z } from "zod";
import { authRequired } from "../middleware/auth.js";
import { prisma } from "../prisma.js";
import { sendNotification } from "../realtime.js";
import { asyncHandler } from "../utils.js";

const router = Router();

const submitSchema = z.object({
  answers: z.record(z.string(), z.any())
});

async function updateCourseProgress(userId, courseId) {
  const totalLessons = await prisma.lesson.count({ where: { module: { courseId } } });
  const completedLessons = await prisma.lessonCompletion.count({
    where: { userId, lesson: { module: { courseId } } }
  });
  const attempts = await prisma.testAttempt.groupBy({
    by: ["testId"],
    where: { userId, status: "GRADED", test: { lesson: { module: { courseId } } } },
    _max: { score: true }
  });
  const averageScore = attempts.length
    ? Math.round(attempts.reduce((sum, attempt) => sum + (attempt._max.score || 0), 0) / attempts.length)
    : 0;
  const percent = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return prisma.progress.upsert({
    where: { userId_courseId: { userId, courseId } },
    update: { completedLessons, totalLessons, averageScore, percent },
    create: { userId, courseId, completedLessons, totalLessons, averageScore, percent }
  });
}

function getQuestionPoints(question) {
  return Number(question.maxScore || 1);
}

function normalizeArray(value) {
  return Array.isArray(value) ? value.map(String) : value ? [String(value)] : [];
}

function isAutoCorrect(question, answer) {
  const correctAnswerIds = question.answers.filter((item) => item.isCorrect).map((item) => item.id);

  if (question.type === "MATCHING") {
    const selected = answer && typeof answer === "object" ? answer : {};
    const pairs = question.answers.map((item) => item.text.split("→").map((part) => part.trim()));
    return pairs.every(([, right], index) => selected[index] === right);
  }

  if (question.type === "MULTIPLE_CHOICE") {
    const selected = normalizeArray(answer);
    return selected.length === correctAnswerIds.length && selected.every((item) => correctAnswerIds.includes(item));
  }

  if (question.type === "SINGLE_CHOICE") {
    return correctAnswerIds.includes(String(answer || ""));
  }

  return false;
}

async function getEffectiveDeadline(userId, test) {
  const extension = await prisma.deadlineExtension.findUnique({
    where: { userId_testId: { userId, testId: test.id } }
  });

  return extension?.deadline || test.deadline;
}

async function notifyTeachersForSubmission(test, user) {
  const teacherIds = new Set();
  const groups = await prisma.group.findMany({
    where: {
      students: { some: { id: user.id } },
      courses: { some: { courseId: test.lesson.module.courseId } },
      teacherId: { not: null }
    },
    select: { teacherId: true }
  });

  groups.forEach((group) => {
    if (group.teacherId) teacherIds.add(group.teacherId);
  });

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true }
  });
  admins.forEach((admin) => teacherIds.add(admin.id));

  await Promise.all(
    Array.from(teacherIds).map(async (teacherId) => {
      const notification = await prisma.notification.create({
        data: {
          userId: teacherId,
          title: "Работа на проверку",
          message: `${user.name} отправил(а) развернутый ответ по тесту «${test.title}».`
        }
      });
      sendNotification(teacherId, notification);
    })
  );
}

router.post(
  "/tests/:id/submit",
  authRequired,
  asyncHandler(async (req, res) => {
    const data = submitSchema.parse(req.body);
    const test = await prisma.test.findUnique({
      where: { id: req.params.id },
      include: {
        lesson: { include: { module: true } },
        questions: { include: { answers: true } }
      }
    });

    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }

    if (req.user.role === "STUDENT") {
      const isScheduled = test.lesson.visibleFrom && test.lesson.visibleFrom > new Date();
      if (!test.lesson.isPublished || isScheduled) {
        return res.status(404).json({ message: "Test not found" });
      }
    }

    const effectiveDeadline = await getEffectiveDeadline(req.user.id, test);

    if (effectiveDeadline && new Date() > effectiveDeadline) {
      return res.status(403).json({ message: "Test deadline has passed" });
    }

    const attemptCount = await prisma.testAttempt.count({
      where: { userId: req.user.id, testId: test.id }
    });

    if (test.attemptLimit && attemptCount >= test.attemptLimit) {
      return res.status(403).json({ message: "No attempts left" });
    }

    const autoQuestions = test.questions.filter((question) => question.type !== "MANUAL");
    const manualQuestions = test.questions.filter((question) => question.type === "MANUAL");
    const totalPoints = test.questions.reduce((sum, question) => sum + getQuestionPoints(question), 0);
    const autoScore = autoQuestions.reduce(
      (sum, question) => sum + (isAutoCorrect(question, data.answers[question.id]) ? getQuestionPoints(question) : 0),
      0
    );
    const pendingReview = manualQuestions.length > 0;
    const score = totalPoints ? Math.round((autoScore / totalPoints) * 100) : 0;

    const attempt = await prisma.testAttempt.create({
      data: {
        userId: req.user.id,
        testId: test.id,
        score,
        autoScore,
        earnedPoints: autoScore,
        totalPoints,
        status: pendingReview ? "PENDING_REVIEW" : "GRADED",
        manualSubmissions: {
          create: manualQuestions.map((question) => ({
            userId: req.user.id,
            questionId: question.id,
            answer: String(data.answers[question.id] || ""),
            maxScore: getQuestionPoints(question)
          }))
        }
      },
      include: { manualSubmissions: true }
    });

    if (pendingReview) {
      await notifyTeachersForSubmission(test, req.user);
    }

    await prisma.lessonCompletion.upsert({
      where: { userId_lessonId: { userId: req.user.id, lessonId: test.lessonId } },
      update: {},
      create: { userId: req.user.id, lessonId: test.lessonId }
    });
    const progress = await updateCourseProgress(req.user.id, test.lesson.module.courseId);

    if (progress.percent >= 100) {
      await prisma.certificate.upsert({
        where: { code: `${req.user.id}-${test.lesson.module.courseId}` },
        update: {},
        create: {
          userId: req.user.id,
          courseId: test.lesson.module.courseId,
          code: `${req.user.id}-${test.lesson.module.courseId}`
        }
      });
    }

    const attempts = await prisma.testAttempt.findMany({
      where: { userId: req.user.id, testId: test.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, score: true, status: true, autoScore: true, manualScore: true, earnedPoints: true, totalPoints: true, createdAt: true }
    });
    const gradedAttempts = attempts.filter((item) => item.status === "GRADED");
    const bestScore = gradedAttempts.length ? Math.max(...gradedAttempts.map((item) => item.score)) : null;

    res.json({
      score,
      bestScore,
      attempts,
      correct: autoQuestions.filter((question) => isAutoCorrect(question, data.answers[question.id])).length,
      total: test.questions.length,
      earnedPoints: autoScore,
      totalPoints,
      pendingReview,
      attempt,
      progress
    });
  })
);

export default router;
