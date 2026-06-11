import { Router } from "express";
import { z } from "zod";
import { adminOnly, authRequired } from "../middleware/auth.js";
import { prisma } from "../prisma.js";
import { asyncHandler } from "../utils.js";

const router = Router();

const courseSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  category: z.string().min(2),
  level: z.string().min(2),
  duration: z.string().min(2),
  imageUrl: z.string().url().optional().or(z.literal(""))
});

function visibleLessonFilter() {
  return {
    isPublished: true,
    OR: [{ visibleFrom: null }, { visibleFrom: { lte: new Date() } }]
  };
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
  adminOnly,
  asyncHandler(async (req, res) => {
    const data = courseSchema.parse(req.body);
    const course = await prisma.course.create({
      data: { ...data, imageUrl: data.imageUrl || null }
    });

    res.status(201).json({ course });
  })
);

router.put(
  "/courses/:id",
  authRequired,
  adminOnly,
  asyncHandler(async (req, res) => {
    const data = courseSchema.partial().parse(req.body);
    const course = await prisma.course.update({
      where: { id: req.params.id },
      data: { ...data, imageUrl: data.imageUrl === "" ? null : data.imageUrl }
    });

    res.json({ course });
  })
);

router.delete(
  "/courses/:id",
  authRequired,
  adminOnly,
  asyncHandler(async (req, res) => {
    await prisma.course.delete({ where: { id: req.params.id } });
    res.status(204).end();
  })
);

export default router;
