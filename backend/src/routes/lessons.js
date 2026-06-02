import { Router } from "express";
import { authRequired } from "../middleware/auth.js";
import { prisma } from "../prisma.js";
import { asyncHandler } from "../utils.js";

const router = Router();

async function refreshProgress(userId, courseId) {
  const totalLessons = await prisma.lesson.count({
    where: { module: { courseId } }
  });
  const completedLessons = await prisma.lessonCompletion.count({
    where: {
      userId,
      lesson: { module: { courseId } }
    }
  });
  const attempts = await prisma.testAttempt.groupBy({
    by: ["testId"],
    where: {
      userId,
      test: { lesson: { module: { courseId } } }
    },
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

router.get(
  "/lessons/:id",
  authRequired,
  asyncHandler(async (req, res) => {
    const lesson = await prisma.lesson.findUnique({
      where: { id: req.params.id },
      include: {
        module: { include: { course: true } },
        test: {
          include: {
            attempts: {
              where: { userId: req.user.id },
              orderBy: { createdAt: "desc" },
              select: { id: true, score: true, createdAt: true }
            },
            questions: {
              include: {
                answers: {
                  select: { id: true, text: true }
                }
              }
            }
          }
        },
        comments: {
          orderBy: { createdAt: "desc" },
          include: { user: { select: { id: true, name: true, avatarUrl: true } } }
        }
      }
    });

    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    if (lesson.test) {
      const extension = await prisma.deadlineExtension.findUnique({
        where: { userId_testId: { userId: req.user.id, testId: lesson.test.id } }
      });
      if (extension) {
        lesson.test.deadline = extension.deadline;
        lesson.test.extendedUntil = extension.deadline;
      }
    }

    res.json({ lesson });
  })
);

router.post(
  "/lessons/:id/complete",
  authRequired,
  asyncHandler(async (req, res) => {
    const lesson = await prisma.lesson.findUnique({
      where: { id: req.params.id },
      include: { module: true }
    });

    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    await prisma.lessonCompletion.upsert({
      where: { userId_lessonId: { userId: req.user.id, lessonId: lesson.id } },
      update: {},
      create: { userId: req.user.id, lessonId: lesson.id }
    });

    const progress = await refreshProgress(req.user.id, lesson.module.courseId);
    res.json({ progress });
  })
);

export default router;
