const videoUrl = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

const initialState = {
  token: "mock-token",
  user: {
    id: "user-1",
    name: "Demo Student",
    email: "student@smartedu.local",
    role: "STUDENT",
    avatarUrl: "",
    darkMode: false
  },
  users: [
    { id: "user-1", name: "Demo Student", email: "student@smartedu.local", role: "STUDENT", groupId: "group-1" },
    { id: "user-2", name: "Anna Teacher", email: "teacher@smartedu.local", role: "TEACHER", groupId: null },
    { id: "user-3", name: "Platform Admin", email: "admin@smartedu.local", role: "ADMIN", groupId: null },
    { id: "user-4", name: "Ivan Petrov", email: "ivan@student.local", role: "STUDENT", groupId: "group-1" },
    { id: "user-5", name: "Maria Smirnova", email: "maria@student.local", role: "STUDENT", groupId: "group-2" }
  ],
  groups: [
    { id: "group-1", title: "FE-101", teacherId: "user-2", courseIds: ["course-1"], studentIds: ["user-1", "user-4"] },
    { id: "group-2", title: "BE-201", teacherId: "user-2", courseIds: ["course-2"], studentIds: ["user-5"] }
  ],
  customTests: [],
  manualSubmissions: [
    {
      id: "submission-1",
      studentId: "user-4",
      testTitle: "Развернутый ответ по компонентам",
      answer: "Компонент нужен, чтобы разбить интерфейс на переиспользуемые части.",
      status: "PENDING",
      score: null
    }
  ],
  progress: [
    {
      id: "progress-1",
      courseId: "course-1",
      completedLessons: 0,
      totalLessons: 3,
      averageScore: 0,
      percent: 0,
      course: null
    }
  ],
  certificates: [],
  attempts: [],
  notifications: [
    {
      id: "notification-1",
      title: "Новый курс доступен",
      message: "Курс React Start уже можно проходить.",
      read: false
    },
    {
      id: "notification-2",
      title: "Проверь прогресс",
      message: "После прохождения теста статистика обновится автоматически.",
      read: false
    }
  ],
  completedLessons: []
};

const courses = [
  {
    id: "course-1",
    title: "React Start",
    description: "Практический курс по созданию интерфейсов на React: компоненты, состояние, роутинг и мини-проект.",
    category: "Frontend",
    level: "Beginner",
    duration: "6 часов",
    imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
    modules: [
      {
        id: "module-1",
        title: "Основы React",
        order: 1,
        lessons: [
          {
            id: "lesson-1",
            title: "Что такое компоненты",
            type: "VIDEO",
            order: 1,
            duration: "12 мин",
            content: "Компоненты помогают разбивать интерфейс на независимые части.",
            videoUrl,
            comments: []
          },
          {
            id: "lesson-2",
            title: "Тест по компонентам",
            type: "TEST",
            order: 2,
            duration: "8 мин",
            content: "Проверьте базовое понимание компонентов.",
            comments: [],
            test: {
              id: "test-1",
              title: "React Components Quiz",
              description: "Короткий тест по компонентам React. Засчитывается лучший результат.",
              attemptLimit: 2,
              timeLimitMinutes: 10,
              deadline: "2026-12-31T20:59:59.000Z",
              questions: [
                {
                  id: "question-1",
                  text: "Что возвращает React-компонент?",
                  answers: [
                    { id: "answer-1", text: "JSX-разметку", isCorrect: true },
                    { id: "answer-2", text: "SQL-запрос", isCorrect: false },
                    { id: "answer-3", text: "Docker image", isCorrect: false }
                  ]
                },
                {
                  id: "question-2",
                  text: "Как передаются данные в компонент?",
                  answers: [
                    { id: "answer-4", text: "Через props", isCorrect: true },
                    { id: "answer-5", text: "Только через localStorage", isCorrect: false },
                    { id: "answer-6", text: "Через CSS selector", isCorrect: false }
                  ]
                }
              ]
            }
          }
        ]
      },
      {
        id: "module-2",
        title: "Навигация и состояние",
        order: 2,
        lessons: [
          {
            id: "lesson-3",
            title: "Роутинг в приложении",
            type: "VIDEO",
            order: 1,
            duration: "15 мин",
            content: "React Router позволяет создавать страницы без перезагрузки.",
            videoUrl,
            comments: []
          }
        ]
      }
    ]
  },
  {
    id: "course-2",
    title: "Backend API на Node.js",
    description: "Курс по REST API, Express, Prisma, PostgreSQL и JWT-авторизации.",
    category: "Backend",
    level: "Intermediate",
    duration: "8 часов",
    imageUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80",
    modules: [
      {
        id: "module-3",
        title: "Express Basics",
        order: 1,
        lessons: [
          {
            id: "lesson-4",
            title: "Первый API endpoint",
            type: "VIDEO",
            order: 1,
            duration: "10 мин",
            content: "Express помогает быстро создавать HTTP API.",
            videoUrl,
            comments: []
          }
        ]
      }
    ]
  }
];

function getState() {
  const saved = localStorage.getItem("smartedu_mock_state");
  const state = saved ? { ...initialState, ...JSON.parse(saved) } : initialState;
  return hydrateProgress(state);
}

function saveState(state) {
  localStorage.setItem("smartedu_mock_state", JSON.stringify(state));
}

function hydrateProgress(state) {
  return {
    ...state,
    progress: state.progress.map((item) => ({
      ...item,
      course: courses.find((course) => course.id === item.courseId)
    }))
  };
}

function findLesson(id) {
  for (const course of courses) {
    for (const module of course.modules) {
      const lesson = module.lessons.find((item) => item.id === id);
      if (lesson) {
        return {
          ...lesson,
          module: { ...module, course },
          comments: lesson.comments || []
        };
      }
    }
  }
  return null;
}

function updateProgress(state, courseId) {
  const course = courses.find((item) => item.id === courseId);
  const totalLessons = course.modules.reduce((sum, module) => sum + module.lessons.length, 0);
  const completedLessons = state.completedLessons.filter((lessonId) =>
    course.modules.some((module) => module.lessons.some((lesson) => lesson.id === lessonId))
  ).length;
  const bestScores = Object.values(
    state.attempts.reduce((best, item) => {
      if (!item.testId) return best;
      best[item.testId] = Math.max(best[item.testId] || 0, item.score);
      return best;
    }, {})
  );
  const averageScore = bestScores.length ? Math.round(bestScores.reduce((sum, score) => sum + score, 0) / bestScores.length) : 0;
  const percent = Math.round((completedLessons / totalLessons) * 100);
  const nextProgress = {
    id: `progress-${courseId}`,
    courseId,
    completedLessons,
    totalLessons,
    averageScore,
    percent,
    course
  };
  state.progress = [nextProgress, ...state.progress.filter((item) => item.courseId !== courseId)];
  return nextProgress;
}

export async function mockApi(path, options = {}) {
  const state = getState();
  const body = options.body ? JSON.parse(options.body) : {};

  if (path === "/auth/login" || path === "/auth/register") {
    if (path === "/auth/register") {
      state.user = { ...state.user, name: body.name, email: body.email };
      saveState(state);
    } else {
      const account = state.users.find((item) => item.email === body.email);
      if (account) {
        state.user = {
          id: account.id,
          name: account.name,
          email: account.email,
          role: account.role,
          avatarUrl: "",
          darkMode: state.user.darkMode
        };
        saveState(state);
      }
    }
    return { user: state.user, token: state.token };
  }

  if (path === "/me") return { user: state.user };
  if (path === "/notifications") return { notifications: state.notifications };
  if (path === "/notifications/read-all") {
    state.notifications = state.notifications.map((item) => ({ ...item, read: true }));
    saveState(state);
    return { notifications: state.notifications };
  }
  if (path === "/courses") return { courses };
  if (path.startsWith("/courses/")) {
    const course = courses.find((item) => item.id === path.split("/").at(-1));
    if (!course) throw new Error("Course not found");
    return { course };
  }
  if (path.startsWith("/lessons/") && path.endsWith("/complete")) {
    const lessonId = path.split("/")[2];
    const lesson = findLesson(lessonId);
    if (!state.completedLessons.includes(lessonId)) state.completedLessons.push(lessonId);
    const progress = updateProgress(state, lesson.module.course.id);
    saveState(state);
    return { progress };
  }
  if (path.startsWith("/lessons/")) {
    const lesson = findLesson(path.split("/").at(-1));
    if (!lesson) throw new Error("Lesson not found");
    if (lesson.test) {
      const attempts = state.attempts.filter((attempt) => attempt.testId === lesson.test.id);
      lesson.test = {
        ...lesson.test,
        attempts,
        bestScore: attempts.length ? Math.max(...attempts.map((attempt) => attempt.score)) : null
      };
    }
    return { lesson };
  }
  if (path.startsWith("/tests/") && path.endsWith("/submit")) {
    const testId = path.split("/")[2];
    const lesson = courses.flatMap((course) => course.modules).flatMap((module) => module.lessons).find((item) => item.test?.id === testId);
    const attempts = state.attempts.filter((attempt) => attempt.testId === testId);
    if (lesson.test.deadline && new Date() > new Date(lesson.test.deadline)) {
      throw new Error("Срок сдачи теста истёк");
    }
    if (lesson.test.attemptLimit && attempts.length >= lesson.test.attemptLimit) {
      throw new Error("Попытки закончились");
    }
    const correct = lesson.test.questions.filter((question) =>
      question.answers.some((answer) => answer.id === body.answers[question.id] && answer.isCorrect)
    ).length;
    const score = Math.round((correct / lesson.test.questions.length) * 100);
    state.attempts.unshift({
      id: `attempt-${Date.now()}`,
      testId,
      score,
      createdAt: new Date().toISOString(),
      test: lesson.test
    });
    if (!state.completedLessons.includes(lesson.id)) state.completedLessons.push(lesson.id);
    const course = courses.find((item) => item.modules.some((module) => module.lessons.some((candidate) => candidate.id === lesson.id)));
    const progress = updateProgress(state, course.id);
    const nextAttempts = state.attempts.filter((attempt) => attempt.testId === testId);
    const bestScore = Math.max(...nextAttempts.map((attempt) => attempt.score));
    saveState(state);
    return { score, bestScore, attempts: nextAttempts, correct, total: lesson.test.questions.length, progress };
  }
  if (path === "/progress/me") {
    return { progress: state.progress, certificates: state.certificates, attempts: state.attempts };
  }
  if (path === "/comments") {
    const lesson = findLesson(body.lessonId);
    const comment = {
      id: `comment-${Date.now()}`,
      text: body.text,
      user: { id: state.user.id, name: state.user.name, avatarUrl: state.user.avatarUrl }
    };
    const sourceLesson = courses.flatMap((course) => course.modules).flatMap((module) => module.lessons).find((item) => item.id === lesson.id);
    sourceLesson.comments = [comment, ...(sourceLesson.comments || [])];
    return { comment };
  }
  if (path === "/users/settings") {
    state.user = { ...state.user, ...body };
    state.users = state.users.map((item) => (item.id === state.user.id ? { ...item, name: state.user.name, email: state.user.email, role: state.user.role } : item));
    saveState(state);
    return { user: state.user };
  }
  if (path === "/teacher/overview") {
    const teacherGroups = state.groups.filter((group) => group.teacherId === state.user.id || state.user.role === "ADMIN");
    const groupIds = teacherGroups.map((group) => group.id);
    const students = state.users.filter((user) => groupIds.includes(user.groupId));
    const rows = students.map((student, index) => ({
      id: student.id,
      name: student.name,
      group: state.groups.find((group) => group.id === student.groupId)?.title || "Без группы",
      progress: index === 0 ? 67 : index === 1 ? 42 : 15,
      bestScore: index === 0 ? 100 : index === 1 ? 78 : 55,
      pending: state.manualSubmissions.filter((item) => item.studentId === student.id && item.status === "PENDING").length
    }));
    return {
      courses,
      groups: teacherGroups.map((group) => ({
        ...group,
        teacher: state.users.find((user) => user.id === group.teacherId),
        students: state.users.filter((user) => group.studentIds.includes(user.id))
      })),
      students: rows,
      customTests: state.customTests,
      manualSubmissions: state.manualSubmissions.map((item) => ({
        ...item,
        student: state.users.find((user) => user.id === item.studentId)
      }))
    };
  }
  if (path === "/teacher/tests") {
    const test = { id: `custom-test-${Date.now()}`, ...body, createdAt: new Date().toISOString() };
    state.customTests = [test, ...state.customTests];
    saveState(state);
    return { test };
  }
  if (path.startsWith("/teacher/submissions/") && path.endsWith("/grade")) {
    const id = path.split("/")[3];
    state.manualSubmissions = state.manualSubmissions.map((item) =>
      item.id === id ? { ...item, status: "GRADED", score: Number(body.score || 0), feedback: body.feedback || "" } : item
    );
    saveState(state);
    return { submission: state.manualSubmissions.find((item) => item.id === id) };
  }
  if (path === "/admin/overview") {
    return {
      users: state.users,
      groups: state.groups.map((group) => ({
        ...group,
        teacher: state.users.find((user) => user.id === group.teacherId),
        students: state.users.filter((user) => group.studentIds.includes(user.id))
      })),
      courses
    };
  }
  if (path.startsWith("/admin/users/") && path.endsWith("/role")) {
    const id = path.split("/")[3];
    state.users = state.users.map((user) => (user.id === id ? { ...user, role: body.role } : user));
    if (state.user.id === id) state.user = { ...state.user, role: body.role };
    saveState(state);
    return { users: state.users, user: state.user };
  }
  if (path.startsWith("/admin/groups/")) {
    const id = path.split("/")[3];
    state.groups = state.groups.map((group) =>
      group.id === id
        ? {
            ...group,
            teacherId: body.teacherId ?? group.teacherId,
            studentIds: body.studentIds ?? group.studentIds
          }
        : group
    );
    state.users = state.users.map((user) => {
      const assignedGroup = state.groups.find((group) => group.studentIds.includes(user.id));
      return user.role === "STUDENT" ? { ...user, groupId: assignedGroup?.id || null } : user;
    });
    saveState(state);
    return { groups: state.groups };
  }

  throw new Error("Mock route not found");
}
