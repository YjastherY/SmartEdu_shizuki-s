import { Router } from "express";
import { authRequired } from "../middleware/auth.js";
import { prisma } from "../prisma.js";
import { ensureCompletedCourseCertificates } from "../services/certificates.js";
import { asyncHandler } from "../utils.js";

const router = Router();

router.get(
  "/progress/me",
  authRequired,
  asyncHandler(async (req, res) => {
    const progress = await prisma.progress.findMany({
      where: { userId: req.user.id },
      include: { course: true },
      orderBy: { updatedAt: "desc" }
    });
    await ensureCompletedCourseCertificates(req.user.id, progress);
    const certificates = await prisma.certificate.findMany({
      where: { userId: req.user.id },
      include: { course: true },
      orderBy: { issuedAt: "desc" }
    });
    const attempts = await prisma.testAttempt.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        test: {
          include: {
            lesson: {
              include: {
                module: {
                  include: { course: true }
                }
              }
            }
          }
        },
        manualSubmissions: true
      }
    });

    res.json({ progress, certificates, attempts });
  })
);

export default router;
