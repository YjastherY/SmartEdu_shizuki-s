import { Router } from "express";
import { z } from "zod";
import { authRequired } from "../middleware/auth.js";
import { prisma } from "../prisma.js";
import { asyncHandler, publicUser } from "../utils.js";

const router = Router();

const settingsSchema = z.object({
  name: z.string().min(2).optional(),
  avatarUrl: z.string().url().optional().or(z.literal("")),
  darkMode: z.boolean().optional()
});

router.patch(
  "/users/settings",
  authRequired,
  asyncHandler(async (req, res) => {
    const data = settingsSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...data,
        avatarUrl: data.avatarUrl === "" ? null : data.avatarUrl
      }
    });

    res.json({ user: publicUser(user) });
  })
);

export default router;
