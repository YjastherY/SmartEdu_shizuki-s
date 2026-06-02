import jwt from "jsonwebtoken";
import { prisma } from "../prisma.js";

export async function authRequired(req, res, next) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization token is required" });
  }

  try {
    const token = header.replace("Bearer ", "");
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true, email: true, role: true, avatarUrl: true, darkMode: true }
    });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function adminOnly(req, res, next) {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ message: "Admin access required" });
  }

  next();
}

export function teacherOrAdmin(req, res, next) {
  if (!["TEACHER", "ADMIN"].includes(req.user?.role)) {
    return res.status(403).json({ message: "Teacher access required" });
  }

  next();
}
