import { Router } from "express";
import fs from "node:fs";
import multer from "multer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { authRequired } from "../middleware/auth.js";
import { prisma } from "../prisma.js";
import { asyncHandler, publicUser } from "../utils.js";

const router = Router();
const uploadRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../uploads");

fs.mkdirSync(uploadRoot, { recursive: true });

const settingsSchema = z.object({
  name: z.string().min(2).optional(),
  avatarUrl: z.string().url().optional().or(z.literal("")),
  darkMode: z.boolean().optional()
});

const storage = multer.diskStorage({
  destination: uploadRoot,
  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase() || ".jpg";
    callback(null, `${req.user.id}-${Date.now()}${extension}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.mimetype)) {
      return callback(new Error("Only image files are allowed"));
    }
    callback(null, true);
  }
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

router.post(
  "/users/avatar",
  authRequired,
  upload.single("avatar"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "Avatar file is required" });
    }

    const avatarUrl = `/uploads/${req.file.filename}`;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { avatarUrl }
    });

    res.json({ user: publicUser(user), avatarUrl });
  })
);

export default router;
