import crypto from "node:crypto";
import { prisma } from "../prisma.js";
import { sendNotification } from "../realtime.js";

function certificateCode() {
  return `SE-${new Date().getFullYear()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

async function createCode() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = certificateCode();
    const existing = await prisma.certificate.findUnique({ where: { code } });
    if (!existing) return code;
  }

  return `SE-${Date.now()}`;
}

export async function ensureCourseCertificate(userId, courseId, progress) {
  if (!progress || progress.percent < 100) return null;

  const existing = await prisma.certificate.findUnique({
    where: { userId_courseId: { userId, courseId } },
    include: { course: true }
  });
  if (existing) return existing;

  const certificate = await prisma.certificate.create({
    data: {
      userId,
      courseId,
      code: await createCode()
    },
    include: { course: true }
  });

  const notification = await prisma.notification.create({
    data: {
      userId,
      title: "Сертификат готов",
      message: `Вы получили сертификат за курс «${certificate.course.title}».`,
      type: "certificate",
      targetPath: "/progress",
      metadata: { certificateId: certificate.id, courseId, code: certificate.code }
    }
  });
  sendNotification(userId, notification);

  return certificate;
}

export async function ensureCompletedCourseCertificates(userId, progressItems) {
  const result = [];
  for (const progress of progressItems) {
    const certificate = await ensureCourseCertificate(userId, progress.courseId, progress);
    if (certificate) result.push(certificate);
  }
  return result;
}
