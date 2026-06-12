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
const bannerUploadRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../uploads/banners");

fs.mkdirSync(bannerUploadRoot, { recursive: true });

const bannerUpload = multer({
  storage: multer.diskStorage({
    destination: bannerUploadRoot,
    filename: (req, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase() || ".jpg";
      callback(null, `${req.params.id || "course"}-${Date.now()}${extension}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.mimetype)) {
      return callback(new Error("Only image files are allowed"));
    }
    callback(null, true);
  }
});

const courseSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  category: z.string().min(2),
  level: z.string().min(2),
  duration: z.string().min(2),
  imageUrl: z.string().url().optional().or(z.literal("")),
  groupIds: z.array(z.string()).optional(),
  userIds: z.array(z.string()).optional()
});

function visibleLessonFilter() {
  return {
    isPublished: true,
    OR: [{ visibleFrom: null }, { visibleFrom: { lte: new Date() } }]
  };
}

function courseData(data) {
  return {
    title: data.title,
    description: data.description,
    category: data.category,
    level: data.level,
    duration: data.duration,
    imageUrl: data.imageUrl === "" ? null : data.imageUrl
  };
}

async function syncCourseAccess(tx, courseId, data) {
  if (data.groupIds) {
    await tx.groupCourse.deleteMany({ where: { courseId } });
    if (data.groupIds.length) {
      await tx.groupCourse.createMany({
        data: data.groupIds.map((groupId) => ({ courseId, groupId })),
        skipDuplicates: true
      });
    }
  }

  if (data.userIds) {
    await tx.courseUser.deleteMany({ where: { courseId } });
    if (data.userIds.length) {
      await tx.courseUser.createMany({
        data: data.userIds.map((userId) => ({ courseId, userId })),
        skipDuplicates: true
      });
    }
  }
}

router.get(
  "/courses",
  asyncHandler(async (req, res) => {
    const { search, category } = req.query;
    const courses = await prisma.course.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  { title: { contains: String(search), mode: "insensitive" } },
                  { description: { contains: String(search), mode: "insensitive" } }
                ]
              }
            : {},
          category ? { category: String(category) } : {}
        ]
      },
      include: {
        groups: true,
        users: true,
        modules: {
          include: {
            lessons: {
              where: visibleLessonFilter(),
              orderBy: { order: "asc" }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json({ courses });
  })
);

router.get(
  "/courses/:id",
  asyncHandler(async (req, res) => {
    const course = await prisma.course.findUnique({
      where: { id: req.params.id },
      include: {
        groups: true,
        users: true,
        modules: {
          orderBy: { order: "asc" },
          include: {
            lessons: {
              where: visibleLessonFilter(),
              orderBy: { order: "asc" },
              include: { test: { include: { questions: { include: { answers: true } } } } }
            }
          }
        }
      }
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.json({ course });
  })
);

router.post(
  "/courses",
  authRequired,
  teacherOrAdmin,
  asyncHandler(async (req, res) => {
    const data = courseSchema.parse(req.body);
    const course = await prisma.$transaction(async (tx) => {
      const created = await tx.course.create({
        data: courseData(data)
      });
      await syncCourseAccess(tx, created.id, data);
      return tx.course.findUnique({
        where: { id: created.id },
        include: { groups: true, users: true }
      });
    });

    res.status(201).json({ course });
  })
);

router.put(
  "/courses/:id",
  authRequired,
  teacherOrAdmin,
  asyncHandler(async (req, res) => {
    const data = courseSchema.partial().parse(req.body);
    const course = await prisma.$transaction(async (tx) => {
      await tx.course.update({
        where: { id: req.params.id },
        data: courseData({ ...data, imageUrl: data.imageUrl })
      });
      await syncCourseAccess(tx, req.params.id, data);
      return tx.course.findUnique({
        where: { id: req.params.id },
        include: { groups: true, users: true }
      });
    });

    res.json({ course });
  })
);

router.delete(
  "/courses/:id",
  authRequired,
  teacherOrAdmin,
  asyncHandler(async (req, res) => {
    await prisma.course.delete({ where: { id: req.params.id } });
    res.status(204).end();
  })
);

router.patch(
  "/courses/:id/banner",
  authRequired,
  teacherOrAdmin,
  bannerUpload.single("banner"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "Banner file is required" });
    }

    const imageUrl = `/uploads/banners/${req.file.filename}`;
    const course = await prisma.course.update({
      where: { id: req.params.id },
      data: { imageUrl }
    });

    res.json({ course, imageUrl });
  })
);

export default router;
