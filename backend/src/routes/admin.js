import { Router } from "express";
import { z } from "zod";
import { adminOnly, authRequired } from "../middleware/auth.js";
import { prisma } from "../prisma.js";
import { asyncHandler } from "../utils.js";

const router = Router();

const roleSchema = z.object({
  role: z.enum(["STUDENT", "TEACHER", "ADMIN"])
});

const groupSchema = z.object({
  teacherId: z.string().nullable().optional(),
  studentIds: z.array(z.string()).optional(),
  courseIds: z.array(z.string()).optional()
});

function userSelect() {
  return {
    id: true,
    name: true,
    email: true,
    role: true,
    avatarUrl: true,
    darkMode: true,
    groupId: true
  };
}

router.get(
  "/admin/overview",
  authRequired,
  adminOnly,
  asyncHandler(async (req, res) => {
    const [users, groups, courses] = await Promise.all([
      prisma.user.findMany({ select: userSelect(), orderBy: { name: "asc" } }),
      prisma.group.findMany({
        include: {
          teacher: { select: userSelect() },
          students: { select: userSelect(), orderBy: { name: "asc" } },
          courses: { include: { course: true } }
        },
        orderBy: { title: "asc" }
      }),
      prisma.course.findMany({ orderBy: { title: "asc" } })
    ]);

    res.json({
      users,
      groups: groups.map((group) => ({
        id: group.id,
        title: group.title,
        teacherId: group.teacherId,
        teacher: group.teacher,
        studentIds: group.students.map((student) => student.id),
        students: group.students,
        courseIds: group.courses.map((item) => item.courseId),
        courses: group.courses.map((item) => item.course)
      })),
      courses
    });
  })
);

router.patch(
  "/admin/users/:id/role",
  authRequired,
  adminOnly,
  asyncHandler(async (req, res) => {
    const data = roleSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        role: data.role,
        groupId: data.role === "STUDENT" ? undefined : null
      },
      select: userSelect()
    });
    const users = await prisma.user.findMany({ select: userSelect(), orderBy: { name: "asc" } });

    res.json({ user, users });
  })
);

router.patch(
  "/admin/groups/:id",
  authRequired,
  adminOnly,
  asyncHandler(async (req, res) => {
    const data = groupSchema.parse(req.body);

    await prisma.$transaction(async (tx) => {
      await tx.group.update({
        where: { id: req.params.id },
        data: { teacherId: data.teacherId === undefined ? undefined : data.teacherId }
      });

      if (data.studentIds) {
        await tx.user.updateMany({
          where: { groupId: req.params.id, id: { notIn: data.studentIds } },
          data: { groupId: null }
        });
        await tx.user.updateMany({
          where: { id: { in: data.studentIds }, role: "STUDENT" },
          data: { groupId: req.params.id }
        });
      }

      if (data.courseIds) {
        await tx.groupCourse.deleteMany({ where: { groupId: req.params.id } });
        await tx.groupCourse.createMany({
          data: data.courseIds.map((courseId) => ({ groupId: req.params.id, courseId })),
          skipDuplicates: true
        });
      }
    });

    const groups = await prisma.group.findMany({
      include: {
        teacher: { select: userSelect() },
        students: { select: userSelect(), orderBy: { name: "asc" } },
        courses: { include: { course: true } }
      },
      orderBy: { title: "asc" }
    });

    res.json({ groups });
  })
);

export default router;
