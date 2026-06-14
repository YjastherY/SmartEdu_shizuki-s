import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { asyncHandler, publicUser, signToken } from "../utils.js";

const router = Router();

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const registerSchema = credentialsSchema.extend({
  name: z.string().min(2)
});

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const data = registerSchema.parse(req.body);
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });

    if (existingUser) {
      return res.status(409).json({ message: "User with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        notifications: {
          create: {
            title: "Добро пожаловать в SmartEdu",
            message: "Начните первый курс и отслеживайте прогресс в dashboard.",
            type: "welcome",
            targetPath: "/courses"
          }
        }
      }
    });

    res.status(201).json({ user: publicUser(user), token: signToken(user) });
  })
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const data = credentialsSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email } });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isValid = await bcrypt.compare(data.password, user.passwordHash);

    if (!isValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({ user: publicUser(user), token: signToken(user) });
  })
);

export default router;
