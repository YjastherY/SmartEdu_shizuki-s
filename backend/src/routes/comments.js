import { Router } from "express";
import { z } from "zod";
import { authRequired } from "../middleware/auth.js";
import { prisma } from "../prisma.js";
import { asyncHandler } from "../utils.js";

const router = Router();

const commentSchema = z.object({
  lessonId: z.string().min(1),
  text: z.string().min(2)
});

router.post(
  "/comments",
  authRequired,
  asyncHandler(async (req, res) => {
    const data = commentSchema.parse(req.body);
    const comment = await prisma.comment.create({
      data: {
        lessonId: data.lessonId,
        text: data.text,
        userId: req.user.id
      },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } }
    });

    res.status(201).json({ comment });
  })
);

export default router;
