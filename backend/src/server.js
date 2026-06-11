import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ZodError } from "zod";
import adminRoutes from "./routes/admin.js";
import authRoutes from "./routes/auth.js";
import certificateRoutes from "./routes/certificates.js";
import commentRoutes from "./routes/comments.js";
import courseRoutes from "./routes/courses.js";
import lessonRoutes from "./routes/lessons.js";
import meRoutes from "./routes/me.js";
import notificationRoutes from "./routes/notifications.js";
import progressRoutes from "./routes/progress.js";
import teacherRoutes from "./routes/teacher.js";
import testRoutes from "./routes/tests.js";
import userRoutes from "./routes/users.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
  })
);
app.use(express.json());
app.use(morgan("dev"));
app.use("/uploads", express.static(path.join(rootDir, "uploads")));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "smartedu-api" });
});

app.use("/api/auth", authRoutes);
app.use("/api", meRoutes);
app.use("/api", userRoutes);
app.use("/api", courseRoutes);
app.use("/api", lessonRoutes);
app.use("/api", testRoutes);
app.use("/api", progressRoutes);
app.use("/api", commentRoutes);
app.use("/api", notificationRoutes);
app.use("/api", certificateRoutes);
app.use("/api", teacherRoutes);
app.use("/api", adminRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((error, req, res, next) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      message: error.issues?.[0]?.message || "Validation error",
      issues: error.issues
    });
  }

  if (["Only image files are allowed", "Only video files are allowed"].includes(error.message) || error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      message: error.code === "LIMIT_FILE_SIZE" ? "File is too large" : error.message
    });
  }

  console.error(error);
  res.status(500).json({ message: "Internal server error" });
});

app.listen(port, () => {
  console.log(`SmartEdu API is running on http://localhost:${port}`);
});
