import { prisma } from "../src/prisma.js";
import { ensureCourseCertificate } from "../src/services/certificates.js";

async function main() {
  const completedProgress = await prisma.progress.findMany({
    where: { percent: { gte: 100 } },
    select: { userId: true, courseId: true, percent: true }
  });

  let issued = 0;
  for (const progress of completedProgress) {
    const before = await prisma.certificate.findFirst({ where: { userId: progress.userId, courseId: progress.courseId } });
    await ensureCourseCertificate(progress.userId, progress.courseId, progress);
    if (!before) issued += 1;
  }

  console.log(JSON.stringify({ checked: completedProgress.length, issued }));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
