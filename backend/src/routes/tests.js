import { Router } from "express";
import { z } from "zod";
import { authRequired } from "../middleware/auth.js";
import { prisma } from "../prisma.js";
import { asyncHandler } from "../utils.js";

const router = Router();

const submitSchema = z.object({
  answers: z.record(z.string(), z.string())
});

async function updateCourseProgress(userId, courseId) {
  const totalLessons = await prisma.lesson.count({ where: { module: { courseId } } });
  const completedLessons = await prisma.lessonCompletion.count({
    where: { userId, lesson: { module: { courseId } } }
  });
  const attempts = await prisma.testAttempt.groupBy({
    by: ["testId"],
    where: { userId, test: { lesson: { module: { courseId } } } },
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

    if (test.deadline && new Date() > test.deadline) {
      return res.status(403).json({ message: "Test deadline has passed" });
    }

    const attemptCount = await prisma.testAttempt.count({
      where: { userId: req.user.id, testId: test.id }
    });

    if (test.attemptLimit && attemptCount >= test.attemptLimit) {
      return res.status(403).json({ message: "No attempts left" });
    }

    const correct = test.questions.filter((question) => {
      const selectedAnswerId = data.answers[question.id];
      return question.answers.some((answer) => answer.id === selectedAnswerId && answer.isCorrect);
    }).length;
    const score = test.questions.length ? Math.round((correct / test.questions.length) * 100) : 0;

    await prisma.testAttempt.create({
      data: { userId: req.user.id, testId: test.id, score }
    });
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
      select: { id: true, score: true, createdAt: true }
    });
    const bestScore = Math.max(...attempts.map((attempt) => attempt.score));

    res.json({ score, bestScore, attempts, correct, total: test.questions.length, progress });
  })
);

export default router;
