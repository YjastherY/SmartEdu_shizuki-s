import { Router } from "express";
import fs from "node:fs";
import multer from "multer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
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

const moduleSchema = z.object({
  title: z.string().min(2),
  order: z.number().int().min(1).optional()
});

const lessonSchema = z.object({
  title: z.string().min(2),
  type: z.enum(["VIDEO", "TEXT", "TEST"]).default("VIDEO"),
  order: z.number().int().min(1).optional(),
  duration: z.string().min(1).default("10 мин"),
  content: z.string().optional().or(z.literal("")),
  videoUrl: z.string().url().optional().or(z.literal(""))
});

async function nextModuleOrder(courseId) {
  const last = await prisma.module.findFirst({
    where: { courseId },
    orderBy: { order: "desc" }
  });

  return (last?.order || 0) + 1;
}

async function nextLessonOrder(moduleId) {
  const last = await prisma.lesson.findFirst({
    where: { moduleId },
    orderBy: { order: "desc" }
  });

  return (last?.order || 0) + 1;
}

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

router.post(
  "/courses/:courseId/modules",
  authRequired,
  teacherOrAdmin,
  asyncHandler(async (req, res) => {
    const data = moduleSchema.parse(req.body);
    const course = await prisma.course.findUnique({ where: { id: req.params.courseId } });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const module = await prisma.module.create({
      data: {
        title: data.title,
        order: data.order || (await nextModuleOrder(course.id)),
        courseId: course.id
      },
      include: { lessons: true }
    });

    res.status(201).json({ module });
  })
);

router.put(
  "/modules/:id",
  authRequired,
  teacherOrAdmin,
  asyncHandler(async (req, res) => {
    const data = moduleSchema.partial().parse(req.body);
    const module = await prisma.module.update({
      where: { id: req.params.id },
      data
    });

    res.json({ module });
  })
);

router.delete(
  "/modules/:id",
  authRequired,
  teacherOrAdmin,
  asyncHandler(async (req, res) => {
    await prisma.module.delete({ where: { id: req.params.id } });
    res.status(204).end();
  })
);

router.post(
  "/modules/:moduleId/lessons",
  authRequired,
  teacherOrAdmin,
  asyncHandler(async (req, res) => {
    const data = lessonSchema.parse(req.body);
    const module = await prisma.module.findUnique({ where: { id: req.params.moduleId } });

    if (!module) {
      return res.status(404).json({ message: "Module not found" });
    }

    const lesson = await prisma.lesson.create({
      data: {
        ...data,
        order: data.order || (await nextLessonOrder(module.id)),
        content: data.content || null,
        videoUrl: data.videoUrl || null,
        moduleId: module.id
      }
    });

    res.status(201).json({ lesson });
  })
);

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

router.put(
  "/lessons/:id",
  authRequired,
  teacherOrAdmin,
  asyncHandler(async (req, res) => {
    const data = lessonSchema.partial().parse(req.body);
    const lesson = await prisma.lesson.update({
      where: { id: req.params.id },
      data: {
        ...data,
        content: data.content === "" ? null : data.content,
        videoUrl: data.videoUrl === "" ? null : data.videoUrl
      }
    });

    res.json({ lesson });
  })
);

router.delete(
  "/lessons/:id",
  authRequired,
  teacherOrAdmin,
  asyncHandler(async (req, res) => {
    await prisma.lesson.delete({ where: { id: req.params.id } });
    res.status(204).end();
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
