import { Router } from "express";
import { z } from "zod";
import { authRequired } from "../middleware/auth.js";
import { prisma } from "../prisma.js";
import { broadcastToGroup } from "../realtime.js";
import { asyncHandler } from "../utils.js";

const router = Router();
const messageSchema = z.object({
  text: z.string().trim().min(1).max(1000),
  groupId: z.string().optional()
});

async function chatGroupsFor(user) {
  if (user.role === "ADMIN") {
    return prisma.group.findMany({ include: { _count: { select: { students: true } } }, orderBy: { title: "asc" } });
  }

  if (user.role === "TEACHER") {
    return prisma.group.findMany({
      where: { teacherId: user.id },
      include: { _count: { select: { students: true } } },
      orderBy: { title: "asc" }
    });
  }

  return prisma.group.findMany({
    where: { students: { some: { id: user.id } } },
    include: { _count: { select: { students: true } } },
    orderBy: { title: "asc" }
  });
}

function publicGroup(group) {
  return {
    id: group.id,
    title: group.title,
    teacherId: group.teacherId,
    studentCount: group._count?.students || 0
  };
}

async function resolveGroup(user, requestedGroupId) {
  const groups = await chatGroupsFor(user);
  const group = requestedGroupId
    ? groups.find((item) => item.id === requestedGroupId)
    : groups[0];

  return { group, groups };
}

router.get(
  "/chat/groups",
  authRequired,
  asyncHandler(async (req, res) => {
    const groups = await chatGroupsFor(req.user);
    res.json({ groups: groups.map(publicGroup) });
  })
);

router.get(
  "/chat/messages",
  authRequired,
  asyncHandler(async (req, res) => {
    const { group } = await resolveGroup(req.user, req.query.groupId ? String(req.query.groupId) : "");

    if (!group) {
      return res.json({ messages: [], group: null });
    }

    const messages = await prisma.chatMessage.findMany({
      where: { groupId: group.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        group: true,
        user: { select: { id: true, name: true, role: true, avatarUrl: true } }
      }
    });

    res.json({ messages: messages.reverse(), group });
  })
);

router.post(
  "/chat/messages",
  authRequired,
  asyncHandler(async (req, res) => {
    const data = messageSchema.parse(req.body);
    const { group } = await resolveGroup(req.user, data.groupId);

    if (!group) {
      return res.status(403).json({ message: "Group chat is not available for this account" });
    }

    const message = await prisma.chatMessage.create({
      data: { text: data.text, userId: req.user.id, groupId: group.id },
      include: {
        group: true,
        user: { select: { id: true, name: true, role: true, avatarUrl: true } }
      }
    });

    await broadcastToGroup(group.id, { type: "chat_message", message });
    res.status(201).json({ message });
  })
);

export default router;
