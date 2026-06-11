import { Router } from "express";
import { prisma } from "../prisma.js";
import { asyncHandler } from "../utils.js";

const router = Router();

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function certificateHtml(certificate) {
  const issuedAt = new Intl.DateTimeFormat("ru-RU", { dateStyle: "long" }).format(certificate.issuedAt);
  const student = escapeHtml(certificate.user.name);
  const course = escapeHtml(certificate.course.title);
  const code = escapeHtml(certificate.code);

  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Certificate ${code}</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: #f1f5f9;
      color: #0f172a;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    main {
      width: min(920px, calc(100% - 32px));
      border: 10px solid #2563eb;
      border-radius: 24px;
      background: linear-gradient(135deg, #ffffff 0%, #eff6ff 100%);
      box-shadow: 0 24px 80px rgba(15, 23, 42, 0.16);
      padding: 56px;
      text-align: center;
    }
    .eyebrow {
      color: #2563eb;
      font-size: 14px;
      font-weight: 800;
      letter-spacing: 0.18em;
      text-transform: uppercase;
    }
    h1 {
      margin: 18px 0 12px;
      font-size: clamp(34px, 6vw, 64px);
      line-height: 1;
    }
    .name {
      margin: 36px 0 10px;
      font-size: clamp(28px, 5vw, 52px);
      font-weight: 800;
    }
    .course {
      margin: 12px auto 0;
      max-width: 720px;
      color: #334155;
      font-size: clamp(20px, 3vw, 30px);
      line-height: 1.35;
    }
    footer {
      margin-top: 44px;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 18px;
      color: #475569;
      font-size: 15px;
      text-align: left;
    }
    strong {
      color: #0f172a;
    }
    @media print {
      body { background: white; }
      main { box-shadow: none; width: auto; min-height: 70vh; }
    }
  </style>
</head>
<body>
  <main>
    <div class="eyebrow">SmartEdu Certificate</div>
    <h1>Сертификат</h1>
    <p>подтверждает успешное прохождение курса</p>
    <div class="name">${student}</div>
    <div class="course">${course}</div>
    <footer>
      <div>Дата выдачи<br /><strong>${issuedAt}</strong></div>
      <div>Код сертификата<br /><strong>${code}</strong></div>
    </footer>
  </main>
</body>
</html>`;
}

router.get(
  "/certificates/:code",
  asyncHandler(async (req, res) => {
    const certificate = await prisma.certificate.findUnique({
      where: { code: req.params.code },
      include: { user: true, course: true }
    });

    if (!certificate) {
      return res.status(404).send("Certificate not found");
    }

    res.type("html").send(certificateHtml(certificate));
  })
);

export default router;
