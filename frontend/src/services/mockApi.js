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
      question: "Зачем выносить интерфейс в отдельный компонент?",
      answer: "Компонент нужен, чтобы разбить интерфейс на переиспользуемые части.",
      status: "PENDING",
      score: null,
      maxScore: 20,
      autoScore: 18,
      totalPoints: 40,
      finalScore: null
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
                  type: "SINGLE_CHOICE",
                  text: "Что возвращает React-компонент?",
                  maxScore: 10,
                  answers: [
                    { id: "answer-1", text: "JSX-разметку", isCorrect: true },
                    { id: "answer-2", text: "SQL-запрос", isCorrect: false },
                    { id: "answer-3", text: "Docker image", isCorrect: false }
                  ]
                },
                {
                  id: "question-2",
                  type: "SINGLE_CHOICE",
                  text: "Как передаются данные в компонент?",
                  maxScore: 10,
                  answers: [
                    { id: "answer-4", text: "Через props", isCorrect: true },
                    { id: "answer-5", text: "Только через localStorage", isCorrect: false },
                    { id: "answer-6", text: "Через CSS selector", isCorrect: false }
                  ]
                },
                {
                  id: "question-3",
                  type: "MANUAL",
                  text: "Объясните, когда компонент лучше вынести в отдельную часть интерфейса.",
                  maxScore: 20
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

const studentInsights = {
  "user-1": {
    completed: ["Что такое компоненты", "Тест по компонентам"],
    strengths: ["JSX", "props", "структура компонентов"],
    weaknesses: ["роутинг", "управление состоянием"],
    grades: [
      { title: "React Components Quiz", score: 100, type: "Авто" },
      { title: "Развернутый ответ", score: null, type: "На проверке" }
    ],
    recentAnswers: [
      { question: "Что возвращает React-компонент?", answer: "JSX-разметку", result: "Верно" },
      { question: "Как передаются данные в компонент?", answer: "Через props", result: "Верно" }
    ]
  },
  "user-4": {
    completed: ["Что такое компоненты"],
    strengths: ["переиспользование компонентов"],
    weaknesses: ["точность терминов", "состояние"],
    grades: [
      { title: "React Components Quiz", score: 78, type: "Авто" },
      { title: "Развернутый ответ", score: null, type: "На проверке" }
    ],
    recentAnswers: [
      { question: "Что возвращает React-компонент?", answer: "UI-блок", result: "Частично" },
      { question: "Как передаются данные в компонент?", answer: "Через props", result: "Верно" }
    ]
  },
  "user-5": {
    completed: ["Первый API endpoint"],
    strengths: ["HTTP методы", "структура endpoint"],
    weaknesses: ["JWT", "Prisma relations"],
    grades: [
      { title: "Express Basics", score: 55, type: "Авто" }
    ],
    recentAnswers: [
      { question: "Что делает Express?", answer: "Создает HTTP API", result: "Верно" },
      { question: "Где хранится токен?", answer: "В базе", result: "Неверно" }
    ]
  }
};

function buildStudentRow(state, student, index) {
  const group = state.groups.find((item) => item.id === student.groupId);
  const insight = studentInsights[student.id] || studentInsights["user-1"];
  return {
    id: student.id,
    name: student.name,
    email: student.email,
    group: group?.title || "Без группы",
    progress: index === 0 ? 67 : index === 1 ? 42 : 15,
    bestScore: index === 0 ? 100 : index === 1 ? 78 : 55,
    pending: state.manualSubmissions.filter((item) => item.studentId === student.id && item.status === "PENDING").length,
    ...insight
  };
}

function getState() {
  const saved = localStorage.getItem("smartedu_mock_state");
  const state = saved ? { ...initialState, ...JSON.parse(saved) } : initialState;
  if (!state.manualSubmissions.some((item) => item.id === "submission-2")) {
    state.manualSubmissions.push({
      id: "submission-2",
      studentId: "user-1",
      testTitle: "Связь props и состояния",
      question: "Чем props отличаются от состояния компонента?",
      answer: "Props передаются сверху вниз, а состояние хранится внутри компонента и меняется через setState или hooks.",
      status: "PENDING",
      score: null,
      maxScore: 15,
      autoScore: 25,
      totalPoints: 40,
      finalScore: null
    });
    saveState(state);
  }
  state.manualSubmissions = state.manualSubmissions.map((item) => ({
    ...item,
    question: item.question ?? (item.id === "submission-2" ? "Чем props отличаются от состояния компонента?" : "Зачем выносить интерфейс в отдельный компонент?"),
    maxScore: item.maxScore ?? (item.id === "submission-2" ? 15 : 20),
    autoScore: item.autoScore ?? (item.id === "submission-2" ? 25 : 18),
    totalPoints: item.totalPoints ?? 40,
    finalScore: item.finalScore ?? null
  }));
  saveState(state);
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
      if (item.status === "PENDING_REVIEW") return best;
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

function getQuestionPoints(question) {
  return Number(question.maxScore || question.points || 1);
}

function isAutoCorrect(question, answer) {
  if (question.answers?.length) {
    return question.answers.some((item) => item.id === answer && item.isCorrect);
  }
  if (question.type === "SINGLE_CHOICE") {
    return question.correctIndexes?.[0] === answer;
  }
  if (question.type === "MULTIPLE_CHOICE") {
    const selected = Array.isArray(answer) ? answer : [];
    const correct = question.correctIndexes || [];
    return selected.length === correct.length && selected.every((item) => correct.includes(item));
  }
  if (question.type === "MATCHING") {
    return question.pairs.every((pair, index) => answer?.[index] === pair.right);
  }
  return false;
}

function getAnswerText(question, answer) {
  if (question.answers?.length) {
    return question.answers.find((item) => item.id === answer)?.text || "Без ответа";
  }
  if (question.type === "SINGLE_CHOICE") {
    return question.options[answer] || "Без ответа";
  }
  if (question.type === "MULTIPLE_CHOICE") {
    return (Array.isArray(answer) ? answer : []).map((index) => question.options[index]).filter(Boolean).join(", ") || "Без ответа";
  }
  if (question.type === "MATCHING") {
    return question.pairs.map((pair, index) => `${pair.left}: ${answer?.[index] || "без ответа"}`).join("; ");
  }
  return answer || "Без ответа";
}

function getBestScore(attempts) {
  const graded = attempts.filter((attempt) => attempt.status !== "PENDING_REVIEW");
  return graded.length ? Math.max(...graded.map((attempt) => attempt.score)) : null;
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
        bestScore: getBestScore(attempts)
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
    const totalPoints = lesson.test.questions.reduce((sum, question) => sum + getQuestionPoints(question), 0);
    const autoQuestions = lesson.test.questions.filter((question) => question.type !== "MANUAL");
    const manualQuestions = lesson.test.questions.filter((question) => question.type === "MANUAL");
    const autoScore = autoQuestions.reduce((sum, question) => sum + (isAutoCorrect(question, body.answers[question.id]) ? getQuestionPoints(question) : 0), 0);
    const manualMaxScore = manualQuestions.reduce((sum, question) => sum + getQuestionPoints(question), 0);
    const score = Math.round((autoScore / totalPoints) * 100);
    const attemptId = `attempt-${Date.now()}`;
    const pendingReview = manualQuestions.length > 0;
    const otherAnswers = autoQuestions.map((question) => ({
      question: question.text,
      answer: getAnswerText(question, body.answers[question.id]),
      result: isAutoCorrect(question, body.answers[question.id]) ? "Верно" : "Неверно"
    }));
    state.attempts.unshift({
      id: attemptId,
      testId,
      score,
      autoScore,
      manualScore: null,
      totalPoints,
      earnedPoints: autoScore,
      status: pendingReview ? "PENDING_REVIEW" : "GRADED",
      createdAt: new Date().toISOString(),
      test: lesson.test
    });
    if (pendingReview) {
      state.manualSubmissions.unshift({
        id: `submission-${Date.now()}`,
        studentId: state.user.id,
        testId,
        attemptId,
        testTitle: lesson.test.title,
        question: manualQuestions.length === 1 ? manualQuestions[0].text : "Развернутые ответы",
        answer: manualQuestions.map((question) => body.answers[question.id] || "Без ответа").join("\n\n"),
        manualAnswers: manualQuestions.map((question) => ({
          question: question.text,
          answer: body.answers[question.id] || "Без ответа"
        })),
        answers: otherAnswers,
        status: "PENDING",
        score: null,
        maxScore: manualMaxScore,
        autoScore,
        totalPoints,
        finalScore: null
      });
    }
    if (!state.completedLessons.includes(lesson.id)) state.completedLessons.push(lesson.id);
    const course = courses.find((item) => item.modules.some((module) => module.lessons.some((candidate) => candidate.id === lesson.id)));
    const progress = updateProgress(state, course.id);
    const nextAttempts = state.attempts.filter((attempt) => attempt.testId === testId);
    const bestScore = getBestScore(nextAttempts);
    saveState(state);
    return {
      score,
      bestScore,
      attempts: nextAttempts,
      correct: otherAnswers.filter((answer) => answer.result === "Верно").length,
      total: lesson.test.questions.length,
      earnedPoints: autoScore,
      totalPoints,
      pendingReview,
      progress
    };
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
    const rows = students.map((student, index) => buildStudentRow(state, student, index));
    return {
      courses,
      groups: teacherGroups.map((group) => ({
        ...group,
        teacher: state.users.find((user) => user.id === group.teacherId),
        students: state.users.filter((user) => group.studentIds.includes(user.id)).map((student, index) => buildStudentRow(state, student, index))
      })),
      students: rows,
      customTests: state.customTests,
      manualSubmissions: state.manualSubmissions.map((item) => ({
        ...item,
        student: state.users.find((user) => user.id === item.studentId),
        group: state.groups.find((group) => group.studentIds.includes(item.studentId)),
        course: courses[0],
        answers: item.answers || studentInsights[item.studentId]?.recentAnswers || []
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
    const submission = state.manualSubmissions.find((item) => item.id === id);
    const manualScore = Math.min(Number(body.score ?? submission?.score ?? 0), Number(submission?.maxScore || 100));
    const earnedPoints = Number(submission?.autoScore || 0) + manualScore;
    const finalScore = submission?.totalPoints ? Math.round((earnedPoints / submission.totalPoints) * 100) : manualScore;
    state.manualSubmissions = state.manualSubmissions.map((item) =>
      item.id === id ? { ...item, status: "GRADED", score: manualScore, finalScore, feedback: body.feedback ?? item.feedback ?? "" } : item
    );
    if (submission?.attemptId) {
      state.attempts = state.attempts.map((attempt) =>
        attempt.id === submission.attemptId
          ? { ...attempt, status: "GRADED", manualScore, earnedPoints, score: finalScore }
          : attempt
      );
      const lesson = courses.flatMap((course) => course.modules).flatMap((module) => module.lessons).find((item) => item.test?.id === submission.testId);
      const course = courses.find((item) => item.modules.some((module) => module.lessons.some((candidate) => candidate.id === lesson?.id)));
      if (course) updateProgress(state, course.id);
    }
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
