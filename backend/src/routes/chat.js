import { Router } from "express";
import { z } from "zod";
import { authRequired } from "../middleware/auth.js";
import { prisma } from "../prisma.js";
import { broadcast } from "../realtime.js";
import { asyncHandler } from "../utils.js";

const router = Router();
const messageSchema = z.object({
  text: z.string().trim().min(1).max(1000)
});

router.get(
  "/chat/messages",
  authRequired,
  asyncHandler(async (req, res) => {
    const messages = await prisma.chatMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { user: { select: { id: true, name: true, role: true, avatarUrl: true } } }
    });

    res.json({ messages: messages.reverse() });
  })
);

router.post(
  "/chat/messages",
  authRequired,
  asyncHandler(async (req, res) => {
    const data = messageSchema.parse(req.body);
    const message = await prisma.chatMessage.create({
      data: { text: data.text, userId: req.user.id },
      include: { user: { select: { id: true, name: true, role: true, avatarUrl: true } } }
    });

    broadcast({ type: "chat_message", message });
    res.status(201).json({ message });
  })
);

export default router;
