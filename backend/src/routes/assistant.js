import { Router } from "express";
import { z } from "zod";
import { authRequired } from "../middleware/auth.js";
import { prisma } from "../prisma.js";
import { asyncHandler } from "../utils.js";

const router = Router();

const askSchema = z.object({
  question: z.string().trim().min(2, "Question is too short").max(1000, "Question is too long")
});

const topicRules = [
  {
    key: "react",
    title: "React",
    match: ["react", "jsx", "компонент", "props", "состояни", "роутинг", "router"],
    answer:
      "По React сейчас важнее всего уверенно понимать компоненты, props, состояние и роутинг. Начни с короткого повторения теории, потом открой тест и проверь, где именно теряются баллы."
  },
  {
    key: "backend",
    title: "Backend",
    match: ["backend", "node", "express", "api", "rest", "prisma", "postgres", "jwt", "сервер"],
    answer:
      "По backend держи фокус на структуре REST API: route, controller logic, Prisma-запрос и JWT-доступ. Если путаешься, сначала проговори путь запроса от frontend до базы."
  },
  {
    key: "tests",
    title: "Тесты",
    match: ["тест", "задани", "балл", "оцен", "попыт", "дедлайн", "сдать"],
    answer:
      "Для тестов смотри на лимит попыток, дедлайн и вес каждого задания. Если есть развернутый ответ, итоговая оценка появится полностью после ручной проверки преподавателем."
  },
  {
    key: "progress",
    title: "Прогресс",
    match: ["прогресс", "статист", "сертификат", "улучш", "повторить"],
    answer:
      "Лучший способ поднять прогресс: закрыть незавершенные уроки, пересдать тесты с доступными попытками и отдельно разобрать темы с низкими баллами."
  }
];

function normalize(value) {
  return value.toLowerCase();
}

function pickTopic(question) {
  const text = normalize(question);
  return topicRules.find((rule) => rule.match.some((item) => text.includes(item))) || null;
}

function lessonSources(courses, topic) {
  const words = topic?.match || [];
  return courses
    .flatMap((course) =>
      course.modules.flatMap((module) =>
        module.lessons.map((lesson) => ({
          course: course.title,
          module: module.title,
          lesson: lesson.title,
          content: lesson.content || lesson.test?.description || ""
        }))
      )
    )
    .filter((item) => {
      if (!topic) return true;
      const text = normalize(`${item.course} ${item.module} ${item.lesson} ${item.content}`);
      return words.some((word) => text.includes(word));
    })
    .slice(0, 4);
}

function progressSummary(progress, attempts) {
  const completed = progress.reduce((sum, item) => sum + item.completedLessons, 0);
  const total = progress.reduce((sum, item) => sum + item.totalLessons, 0);
  const average = attempts.length
    ? Math.round(attempts.reduce((sum, item) => sum + item.score, 0) / attempts.length)
    : progress.length
      ? Math.round(progress.reduce((sum, item) => sum + item.averageScore, 0) / progress.length)
      : 0;

  return { completed, total, average };
}

function buildAnswer({ question, courses, progress, attempts }) {
  const topic = pickTopic(question);
  const sources = lessonSources(courses, topic);
  const stats = progressSummary(progress, attempts);
  const sourceText = sources.length
    ? `В материалах рядом: ${sources.map((item) => `«${item.lesson}»`).join(", ")}.`
    : "В текущих курсах нет точного совпадения, но можно начать с ближайшего модуля в каталоге.";
  const statsText = stats.total
    ? `По прогрессу сейчас закрыто ${stats.completed} из ${stats.total} уроков, средний результат ${stats.average}%.`
    : "Прогресс пока почти пустой, поэтому лучше начать с первого урока и короткого теста.";

  const answer = [
    topic?.answer || "Я могу подсказать по курсам, тестам, прогрессу и дедлайнам. Уточни тему или название урока, и я соберу короткий план повторения.",
    sourceText,
    statsText
  ].join(" ");

  return {
    answer,
    suggestions: [
      "Что повторить перед тестом?",
      "Объясни компоненты простыми словами",
      "Как поднять прогресс?",
      "Чем REST API отличается от обычной страницы?"
    ],
    sources: sources.map((item) => ({
      course: item.course,
      module: item.module,
      lesson: item.lesson
    }))
  };
}

router.post(
  "/assistant/ask",
  authRequired,
  asyncHandler(async (req, res) => {
    const { question } = askSchema.parse(req.body);
    const [courses, progress, attempts] = await Promise.all([
      prisma.course.findMany({
        include: {
          modules: {
            orderBy: { order: "asc" },
            include: {
              lessons: {
                orderBy: { order: "asc" },
                include: { test: true }
              }
            }
          }
        },
        orderBy: { createdAt: "desc" }
      }),
      prisma.progress.findMany({ where: { userId: req.user.id } }),
      prisma.testAttempt.findMany({
        where: { userId: req.user.id, status: "GRADED" },
        orderBy: { createdAt: "desc" },
        take: 10
      })
    ]);

    res.json(buildAnswer({ question, courses, progress, attempts }));
  })
);

export default router;
