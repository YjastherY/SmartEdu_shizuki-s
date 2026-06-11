import { Router } from "express";
import fs from "node:fs";
import multer from "multer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { authRequired, teacherOrAdmin } from "../middleware/auth.js";
import { prisma } from "../prisma.js";
import { asyncHandler } from "../utils.js";

const router = Router();
const videoUploadRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../uploads/videos");

fs.mkdirSync(videoUploadRoot, { recursive: true });

const videoStorage = multer.diskStorage({
  destination: videoUploadRoot,
  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase() || ".mp4";
    callback(null, `${req.params.id}-${Date.now()}${extension}`);
  }
});

const videoUpload = multer({
  storage: videoStorage,
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (!["video/mp4", "video/webm", "video/ogg", "video/quicktime"].includes(file.mimetype)) {
      return callback(new Error("Only video files are allowed"));
    }

    callback(null, true);
  }
});

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

router.patch(
  "/lessons/:id/video",
  authRequired,
  teacherOrAdmin,
  videoUpload.single("video"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "Video file is required" });
    }

    const lesson = await prisma.lesson.update({
      where: { id: req.params.id },
      data: {
        type: "VIDEO",
        videoUrl: `/uploads/videos/${req.file.filename}`
      }
    });

    res.json({ lesson, videoUrl: lesson.videoUrl });
  })
);

export default router;
