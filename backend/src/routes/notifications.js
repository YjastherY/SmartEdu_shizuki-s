import { Router } from "express";
import { authRequired } from "../middleware/auth.js";
import { prisma } from "../prisma.js";
import { asyncHandler } from "../utils.js";

const router = Router();

router.get(
  "/notifications",
  authRequired,
  asyncHandler(async (req, res) => {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" }
    });

    res.json({ notifications });
  })
);

router.patch(
  "/notifications/read-all",
  authRequired,
  asyncHandler(async (req, res) => {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, read: false },
      data: { read: true }
    });

    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" }
    });

    res.json({ notifications });
  })
);

router.patch(
  "/notifications/:id/read",
  authRequired,
  asyncHandler(async (req, res) => {
    await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user.id },
      data: { read: true }
    });
    const notification = await prisma.notification.findFirst({
      where: { id: req.params.id, userId: req.user.id }
    });

    res.json({ notification });
  })
);

export default router;
