import { BookOpen, CheckCircle2, ClipboardCheck, Plus, Trash2, Upload, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, assetUrl } from "../services/api.js";

const tabs = [
  { id: "create", label: "Создание теста" },
  { id: "review", label: "Проверка" },
  { id: "progress", label: "Успеваемость" }
];

const emptyQuestion = {
  type: "SINGLE_CHOICE",
  text: "",
  options: ["", ""],
  correctIndexes: [0],
  pairs: [{ left: "", right: "" }],
  maxScore: 10
};

export default function TeacherPanel() {
  const [data, setData] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [draft, setDraft] = useState({
    title: "",
    description: "",
    attemptLimit: 2,
    timeLimitMinutes: 20,
    deadline: "2026-12-31",
    isPublished: true,
    visibleFrom: "",
    courseId: "",
    questions: [{ ...emptyQuestion }]
  });
  const [grade, setGrade] = useState({});
  const [saved, setSaved] = useState("");
  const [savingTest, setSavingTest] = useState(false);
  const [videoState, setVideoState] = useState({ lessonId: "", file: null, message: "", uploading: false });
  const [activityDraft, setActivityDraft] = useState({
    moduleId: "",
    title: "",
    type: "TEXT",
    duration: "10 мин",
    content: "",
    videoUrl: "",
    imageUrl: "",
    isPublished: true,
    visibleFrom: ""
  });
  const [activityMessage, setActivityMessage] = useState("");

  useEffect(() => {
    api("/teacher/overview").then((result) => {
      setData(result);
      setSelectedGroupId(result.groups[0]?.id || "");
      setSelectedStudentId(result.groups[0]?.students[0]?.id || "");
      setDraft((value) => ({ ...value, courseId: value.courseId || result.courses[0]?.id || "" }));
      setActivityDraft((value) => ({ ...value, moduleId: value.moduleId || result.courses[0]?.modules?.[0]?.id || "" }));
    });
  }, []);

  const courses = data?.courses || [];
  const selectedGroup = data?.groups.find((group) => group.id === selectedGroupId);
  const selectedStudent = selectedGroup?.students.find((student) => student.id === selectedStudentId);
  const pending = data?.manualSubmissions.filter((item) => item.status === "PENDING") || [];
  const videoLessons = useMemo(
    () =>
      courses.flatMap((course) =>
        (course.modules || []).flatMap((module) =>
          (module.lessons || [])
            .filter((lesson) => lesson.type === "VIDEO")
            .map((lesson) => ({ ...lesson, courseTitle: course.title, moduleTitle: module.title }))
        )
      ),
    [courses]
  );
  const materialLessons = useMemo(
    () =>
      courses.flatMap((course) =>
        (course.modules || []).flatMap((module) =>
          (module.lessons || []).map((lesson) => ({ ...lesson, courseTitle: course.title, moduleTitle: module.title }))
        )
      ),
    [courses]
  );
  const totalPoints = useMemo(() => draft.questions.reduce((sum, item) => sum + Number(item.maxScore || 0), 0), [draft.questions]);
  const questionSummary = useMemo(() => `${draft.questions.length} заданий • ${totalPoints} баллов`, [draft.questions.length, totalPoints]);
  const modules = useMemo(
    () =>
      courses.flatMap((course) =>
        (course.modules || []).map((module) => ({
          ...module,
          courseTitle: course.title
        }))
      ),
    [courses]
  );

  if (!data) return <div className="panel text-sm text-slate-500">Загружаем раздел проверки...</div>;

  async function saveTest(event) {
    event.preventDefault();
    setSaved("");

    if (!draft.courseId) {
      setSaved("Сначала выберите курс");
      return;
    }

    const validationError = validateTestDraft(draft);
    if (validationError) {
      setSaved(validationError);
      return;
    }

    setSavingTest(true);
    try {
      const result = await api("/teacher/tests", { method: "POST", body: JSON.stringify(normalizeTestDraft(draft)) });
      setData((value) => ({ ...value, customTests: [result.test, ...value.customTests] }));
      setSaved("Тест сохранен");
    } catch (error) {
      setSaved(error.message || "Не удалось сохранить тест");
    } finally {
      setSavingTest(false);
    }
  }

  async function gradeSubmission(id) {
    const submission = data.manualSubmissions.find((item) => item.id === id);
    const payload = {
      score: submission?.score ?? 0,
      autoScore: submission?.autoScore ?? 0,
      feedback: submission?.feedback || "",
      ...(grade[id] || {})
    };
    const result = await api(`/teacher/submissions/${id}/grade`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
    setData((value) => ({
      ...value,
      manualSubmissions: value.manualSubmissions.map((item) => (item.id === id ? { ...item, ...result.submission, student: item.student, group: item.group, course: item.course, answers: item.answers } : item))
    }));
  }

  async function extendDeadline(studentId, assignmentId, deadline) {
    await api(`/teacher/students/${studentId}/extensions/${assignmentId}`, {
      method: "PATCH",
      body: JSON.stringify({ deadline })
    });
    setData(await api("/teacher/overview"));
  }

  async function uploadLessonVideo(event) {
    event.preventDefault();
    setVideoState((value) => ({ ...value, message: "" }));

    if (!videoState.lessonId) {
      setVideoState((value) => ({ ...value, message: "Выберите урок" }));
      return;
    }

    if (!videoState.file) {
      setVideoState((value) => ({ ...value, message: "Выберите видеофайл" }));
      return;
    }

    const formData = new FormData();
    formData.append("video", videoState.file);
    setVideoState((value) => ({ ...value, uploading: true }));

    try {
      await api(`/lessons/${videoState.lessonId}/video`, { method: "PATCH", body: formData });
      const refreshed = await api("/teacher/overview");
      setData(refreshed);
      setVideoState({ lessonId: videoState.lessonId, file: null, message: "Видео загружено", uploading: false });
    } catch (error) {
      setVideoState((value) => ({ ...value, message: error.message || "Не удалось загрузить видео", uploading: false }));
    }
  }

  async function saveActivity(event) {
    event.preventDefault();
    setActivityMessage("");

    if (!activityDraft.moduleId) {
      setActivityMessage("Выберите модуль");
      return;
    }

    try {
      await api(`/modules/${activityDraft.moduleId}/lessons`, {
        method: "POST",
        body: JSON.stringify({
          title: activityDraft.title,
          type: activityDraft.type,
          duration: activityDraft.duration,
          content: activityDraft.content,
          videoUrl: activityDraft.videoUrl,
          imageUrl: activityDraft.imageUrl,
          isPublished: activityDraft.isPublished,
          visibleFrom: activityDraft.visibleFrom
        })
      });
      const refreshed = await api("/teacher/overview");
      setData(refreshed);
      setActivityDraft((value) => ({
        ...value,
        title: "",
        content: "",
        videoUrl: "",
        imageUrl: "",
        visibleFrom: ""
      }));
      setActivityMessage("Материал создан");
    } catch (error) {
      setActivityMessage(error.message || "Не удалось создать материал");
    }
  }

  function updateQuestion(index, patch) {
    setDraft((value) => ({
      ...value,
      questions: value.questions.map((question, current) => (current === index ? { ...question, ...patch } : question))
    }));
  }

  return (
    <div className="page-enter space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Проверка работ</h1>
          <p className="text-sm text-slate-500">Новые ответы, группы и история работ учеников.</p>
        </div>
        <Link className="btn-primary flex w-fit items-center gap-2" to="/courses/builder">
          <BookOpen size={18} /> Конструктор курсов
        </Link>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <Stat icon={BookOpen} label="Курсы" value={courses.length} />
        <Stat icon={UsersRound} label="Группы" value={data.groups.length} />
        <Stat icon={ClipboardCheck} label="К проверке" value={pending.length} />
        <Stat icon={CheckCircle2} label="Проверено" value={data.manualSubmissions.filter((item) => item.status === "GRADED").length} />
      </section>

      <ReviewWorkspace
        groups={data.groups}
        submissions={data.manualSubmissions}
        pending={pending}
        grade={grade}
        setGrade={setGrade}
        gradeSubmission={gradeSubmission}
        selectedGroupId={selectedGroupId}
        selectedStudentId={selectedStudentId}
        selectedGroup={selectedGroup}
        selectedStudent={selectedStudent}
        setSelectedGroupId={(id) => {
          const group = data.groups.find((item) => item.id === id);
          setSelectedGroupId(id);
          setSelectedStudentId(group?.students[0]?.id || "");
        }}
        setSelectedStudentId={setSelectedStudentId}
      />
    </div>
  );
}

function normalizeTestDraft(draft) {
  return {
    ...draft,
    title: draft.title.trim(),
    description: draft.description.trim(),
    attemptLimit: Number(draft.attemptLimit || 1),
    timeLimitMinutes: Number(draft.timeLimitMinutes || 1),
    questions: draft.questions.map((question) => ({
      ...question,
      text: question.text.trim(),
      maxScore: Number(question.maxScore || 1),
      options: question.options?.map((option) => option.trim()),
      pairs: question.pairs?.map((pair) => ({ left: pair.left.trim(), right: pair.right.trim() })).filter((pair) => pair.left && pair.right)
    }))
  };
}

function validateTestDraft(draft) {
  if (draft.title.trim().length < 3) return "Введите название теста";

  for (const [index, question] of draft.questions.entries()) {
    if (question.text.trim().length < 3) return `Заполните текст задания ${index + 1}`;
    if (Number(question.maxScore || 0) < 1) return `Укажите баллы для задания ${index + 1}`;

    if (question.type === "SINGLE_CHOICE" || question.type === "MULTIPLE_CHOICE") {
      const filledOptions = question.options.map((option) => option.trim()).filter(Boolean);
      if (filledOptions.length < 2) return `Добавьте минимум два варианта в задании ${index + 1}`;
      if (!question.correctIndexes.length) return `Отметьте правильный ответ в задании ${index + 1}`;
    }

    if (question.type === "MATCHING") {
      const filledPairs = question.pairs.filter((pair) => pair.left.trim() && pair.right.trim());
      if (!filledPairs.length) return `Добавьте пару для сопоставления в задании ${index + 1}`;
    }
  }

  return "";
}

function TestEditor({ courses, draft, saved, savingTest, questionSummary, setDraft, saveTest, updateQuestion }) {
  return (
    <form className="panel space-y-5" onSubmit={saveTest}>
      <div>
        <p className="text-sm font-semibold text-brand-600">Редактор тестов</p>
        <h2 className="text-xl font-bold">Новый тест</h2>
        {questionSummary && <p className="text-sm text-slate-500">{questionSummary}</p>}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm font-medium">
          Название
          <input className="input mt-1" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
        </label>
        <label className="text-sm font-medium">
          Курс
          <select className="input mt-1" value={draft.courseId} onChange={(event) => setDraft({ ...draft, courseId: event.target.value })}>
            <option value="" disabled>Выберите курс</option>
            {courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium md:col-span-2">
          Описание
          <textarea className="input mt-1 min-h-20" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
        </label>
        <label className="text-sm font-medium">
          Попытки
          <input className="input mt-1" type="number" min="1" value={draft.attemptLimit} onChange={(event) => setDraft({ ...draft, attemptLimit: Number(event.target.value) })} />
        </label>
        <label className="text-sm font-medium">
          Время, мин
          <input className="input mt-1" type="number" min="1" value={draft.timeLimitMinutes} onChange={(event) => setDraft({ ...draft, timeLimitMinutes: Number(event.target.value) })} />
        </label>
        <label className="text-sm font-medium">
          Дедлайн
          <input className="input mt-1" type="date" value={draft.deadline} onChange={(event) => setDraft({ ...draft, deadline: event.target.value })} />
        </label>
        <label className="text-sm font-medium">
          Показать с даты
          <input className="input mt-1" type="datetime-local" value={draft.visibleFrom} onChange={(event) => setDraft({ ...draft, visibleFrom: event.target.value })} />
        </label>
        <label className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm font-medium dark:border-slate-700">
          <input type="checkbox" checked={draft.isPublished} onChange={(event) => setDraft({ ...draft, isPublished: event.target.checked })} />
          Видно студентам
        </label>
      </div>

      <div className="space-y-4">
        {draft.questions.map((question, index) => (
          <QuestionEditor
            key={index}
            index={index}
            question={question}
            onChange={(patch) => updateQuestion(index, patch)}
            onDelete={() => setDraft((value) => ({ ...value, questions: value.questions.filter((_, current) => current !== index) }))}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn-secondary flex items-center gap-2" onClick={() => setDraft((value) => ({ ...value, questions: [...value.questions, { ...emptyQuestion }] }))}>
          <Plus size={16} /> Добавить задание
        </button>
        <button className="btn-primary" disabled={savingTest}>{savingTest ? "Сохраняем..." : "Сохранить тест"}</button>
      </div>
      {saved && <p className={`text-sm font-semibold ${saved === "Тест сохранен" ? "text-emerald-600" : "text-red-600"}`}>{saved}</p>}
    </form>
  );
}

function MaterialsTab({ modules, lessons, videoLessons, videoState, setVideoState, uploadLessonVideo, activityDraft, setActivityDraft, activityMessage, saveActivity, refreshTeacherData }) {
  const selectedLesson = videoLessons.find((lesson) => lesson.id === videoState.lessonId) || videoLessons[0];
  const [visibilityDates, setVisibilityDates] = useState({});

  useEffect(() => {
    if (!videoState.lessonId && videoLessons[0]) {
      setVideoState((value) => ({ ...value, lessonId: videoLessons[0].id }));
    }
  }, [videoLessons, setVideoState, videoState.lessonId]);

  async function updateVisibility(lesson, patch) {
    await api(`/lessons/${lesson.id}`, { method: "PUT", body: JSON.stringify(patch) });
    await refreshTeacherData();
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[380px_1fr]">
      <div className="space-y-6">
        <form className="panel space-y-4" onSubmit={saveActivity}>
          <div>
            <p className="text-sm font-semibold text-brand-600">Учебные активности</p>
            <h2 className="text-xl font-bold">Новый материал</h2>
          </div>
          <label className="text-sm font-medium">
            Модуль
            <select className="input mt-1" value={activityDraft.moduleId} onChange={(event) => setActivityDraft({ ...activityDraft, moduleId: event.target.value })}>
              <option value="" disabled>Выберите модуль</option>
              {modules.map((module) => (
                <option key={module.id} value={module.id}>{module.courseTitle} / {module.title}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            Тип
            <select className="input mt-1" value={activityDraft.type} onChange={(event) => setActivityDraft({ ...activityDraft, type: event.target.value })}>
              <option value="TEXT">Текстовый материал</option>
              <option value="VIDEO">Видео-материал</option>
            </select>
          </label>
          <label className="text-sm font-medium">
            Название
            <input className="input mt-1" value={activityDraft.title} onChange={(event) => setActivityDraft({ ...activityDraft, title: event.target.value })} required />
          </label>
          <label className="text-sm font-medium">
            Длительность
            <input className="input mt-1" value={activityDraft.duration} onChange={(event) => setActivityDraft({ ...activityDraft, duration: event.target.value })} required />
          </label>
          <label className="text-sm font-medium">
            Ссылка на видео
            <input className="input mt-1" type="url" value={activityDraft.videoUrl} onChange={(event) => setActivityDraft({ ...activityDraft, videoUrl: event.target.value })} placeholder="https://..." />
          </label>
          <label className="text-sm font-medium">
            Фото к материалу
            <input className="input mt-1" type="url" value={activityDraft.imageUrl} onChange={(event) => setActivityDraft({ ...activityDraft, imageUrl: event.target.value })} placeholder="https://..." />
          </label>
          <label className="text-sm font-medium">
            Показать с даты
            <input className="input mt-1" type="datetime-local" value={activityDraft.visibleFrom} onChange={(event) => setActivityDraft({ ...activityDraft, visibleFrom: event.target.value })} />
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm font-medium dark:border-slate-700">
            <input type="checkbox" checked={activityDraft.isPublished} onChange={(event) => setActivityDraft({ ...activityDraft, isPublished: event.target.checked })} />
            Видно студентам
          </label>
          <label className="text-sm font-medium">
            Материал
            <textarea className="input mt-1 min-h-28" value={activityDraft.content} onChange={(event) => setActivityDraft({ ...activityDraft, content: event.target.value })} />
          </label>
          <button className="btn-primary">Создать материал</button>
          {activityMessage && <p className={`text-sm font-semibold ${activityMessage === "Материал создан" ? "text-emerald-600" : "text-red-600"}`}>{activityMessage}</p>}
        </form>

        <form className="panel space-y-4" onSubmit={uploadLessonVideo}>
        <div>
          <p className="text-sm font-semibold text-brand-600">Материалы уроков</p>
          <h2 className="text-xl font-bold">Загрузка видео</h2>
        </div>
        <label className="text-sm font-medium">
          Урок
          <select
            className="input mt-1"
            value={videoState.lessonId}
            onChange={(event) => setVideoState((value) => ({ ...value, lessonId: event.target.value, message: "" }))}
          >
            {videoLessons.map((lesson) => (
              <option key={lesson.id} value={lesson.id}>
                {lesson.courseTitle} / {lesson.title}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Видеофайл
          <input
            className="input mt-1"
            type="file"
            accept="video/mp4,video/webm,video/ogg,video/quicktime"
            onChange={(event) => setVideoState((value) => ({ ...value, file: event.target.files?.[0] || null, message: "" }))}
          />
        </label>
        <button className="btn-primary flex items-center gap-2" disabled={videoState.uploading || videoLessons.length === 0}>
          <Upload size={16} />
          {videoState.uploading ? "Загружаем..." : "Загрузить видео"}
        </button>
        {videoState.message && (
          <p className={`text-sm font-semibold ${videoState.message === "Видео загружено" ? "text-emerald-600" : "text-red-600"}`}>
            {videoState.message}
          </p>
        )}
        </form>
      </div>

      <div className="panel space-y-4">
        <h2 className="text-xl font-bold">Материалы курса</h2>
        <div className="grid gap-3">
          {lessons.map((lesson) => (
            <div
              key={lesson.id}
              className={`rounded-lg border p-4 text-left transition hover:-translate-y-0.5 ${
                selectedLesson?.id === lesson.id
                  ? "border-brand-500 bg-brand-50 dark:bg-brand-950"
                  : "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
              }`}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold">{lesson.title}</p>
                  <p className="text-sm text-slate-500">{lesson.courseTitle} / {lesson.moduleTitle}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-300">{lessonTypeLabel(lesson.type)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {lesson.type === "VIDEO" && (
                    <span className={`w-fit rounded-full px-2 py-1 text-xs font-semibold ${lesson.videoUrl ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-100" : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-200"}`}>
                      {lesson.videoUrl ? "Видео есть" : "Нет видео"}
                    </span>
                  )}
                  <VisibilityBadge item={lesson} />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {lesson.type === "VIDEO" && (
                  <button className="btn-secondary px-3 py-1" onClick={() => setVideoState((value) => ({ ...value, lessonId: lesson.id, message: "" }))}>
                    Выбрать для видео
                  </button>
                )}
                <button className="btn-secondary px-3 py-1" onClick={() => updateVisibility(lesson, { isPublished: !lesson.isPublished })}>
                  {lesson.isPublished ? "Скрыть" : "Показать"}
                </button>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
                <input
                  className="input"
                  type="datetime-local"
                  value={visibilityDates[lesson.id] ?? formatDateTimeLocal(lesson.visibleFrom)}
                  onChange={(event) => setVisibilityDates((value) => ({ ...value, [lesson.id]: event.target.value }))}
                />
                <button className="btn-secondary" onClick={() => updateVisibility(lesson, { visibleFrom: visibilityDates[lesson.id] ?? formatDateTimeLocal(lesson.visibleFrom) })}>
                  Запланировать
                </button>
              </div>
              {lesson.videoUrl && (
                <a className="mt-3 inline-flex text-sm font-semibold text-brand-600" href={assetUrl(lesson.videoUrl)} target="_blank" rel="noreferrer">
                  Открыть файл
                </a>
              )}
            </div>
          ))}
          {lessons.length === 0 && <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800">Материалов пока нет.</p>}
        </div>
      </div>
    </section>
  );
}

function lessonTypeLabel(type) {
  const labels = {
    VIDEO: "Видео-материал",
    TEXT: "Текстовый материал",
    TEST: "Тест"
  };
  return labels[type] || "Материал";
}

function formatDateTimeLocal(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function VisibilityBadge({ item }) {
  const scheduled = item.visibleFrom && new Date(item.visibleFrom) > new Date();
  const label = !item.isPublished ? "Скрыто" : scheduled ? "Запланировано" : "Видно";
  const className = !item.isPublished
    ? "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-200"
    : scheduled
      ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-100"
      : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-100";

  return <span className={`w-fit rounded-full px-2 py-1 text-xs font-semibold ${className}`}>{label}</span>;
}

function ReviewWorkspace({
  groups,
  submissions,
  pending,
  grade,
  setGrade,
  gradeSubmission,
  selectedGroupId,
  selectedStudentId,
  selectedGroup,
  selectedStudent,
  setSelectedGroupId,
  setSelectedStudentId
}) {
  const [courseFilter, setCourseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [selectedSubmissionId, setSelectedSubmissionId] = useState("");
  const studentSubmissions = submissions.filter((item) => item.student?.id === selectedStudentId || item.studentId === selectedStudentId);
  const courses = Array.from(new Set(studentSubmissions.map((item) => item.course?.title).filter(Boolean)));
  const filteredSubmissions = studentSubmissions
    .filter((item) => courseFilter === "all" || item.course?.title === courseFilter)
    .filter((item) => statusFilter === "all" || item.status === statusFilter)
    .sort((a, b) => {
      if (sort === "status") return String(a.status).localeCompare(String(b.status), "ru");
      const left = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const right = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return sort === "oldest" ? left - right : right - left;
    });
  const selectedSubmission = filteredSubmissions.find((item) => item.id === selectedSubmissionId) || filteredSubmissions[0];

  useEffect(() => {
    setSelectedSubmissionId(filteredSubmissions[0]?.id || "");
  }, [selectedStudentId, courseFilter, statusFilter, sort]);

  return (
    <div className="space-y-6">
      <section className="panel space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-bold">Актуальные работы к проверке</h2>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-100">
            {pending.length}
          </span>
        </div>
        <div className="grid gap-3 xl:grid-cols-2">
          {pending.map((item) => (
            <SubmissionCard key={item.id} item={item} grade={grade} setGrade={setGrade} gradeSubmission={gradeSubmission} compact autoSave />
          ))}
          {pending.length === 0 && <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800">Сейчас всё проверено.</p>}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <aside className="panel space-y-5">
          <div>
            <h2 className="mb-3 font-bold">Группы</h2>
            <div className="space-y-2">
              {groups.map((group) => (
                <button
                  key={group.id}
                  className={`w-full rounded-lg border p-3 text-left transition ${selectedGroupId === group.id ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-100" : "border-slate-200 hover:border-brand-300 dark:border-slate-700"}`}
                  onClick={() => setSelectedGroupId(group.id)}
                >
                  <span className="block font-semibold">{group.title}</span>
                  <span className="text-sm text-slate-500">{group.students.length} учеников</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <h2 className="mb-3 font-bold">Ученики</h2>
            <div className="space-y-2">
              {selectedGroup?.students.map((student) => (
                <button
                  key={student.id}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${selectedStudentId === student.id ? "bg-brand-600 text-white" : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700"}`}
                  onClick={() => setSelectedStudentId(student.id)}
                >
                  <span className="block font-semibold">{student.name}</span>
                  <span className="text-xs opacity-80">{student.pending} на проверке</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="space-y-5">
          <div className="panel">
            {selectedStudent ? (
              <div className="space-y-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-xl font-bold">{selectedStudent.name}</h2>
                    <p className="text-sm text-slate-500">{selectedStudent.email} • {selectedStudent.group}</p>
                  </div>
                  <Link className="btn-secondary" to="/grades">Открыть журнал оценок</Link>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <select className="input" value={courseFilter} onChange={(event) => setCourseFilter(event.target.value)}>
                    <option value="all">Все курсы</option>
                    {courses.map((course) => <option key={course} value={course}>{course}</option>)}
                  </select>
                  <select className="input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                    <option value="all">Все статусы</option>
                    <option value="PENDING">Непроверенные</option>
                    <option value="GRADED">Проверенные</option>
                  </select>
                  <select className="input" value={sort} onChange={(event) => setSort(event.target.value)}>
                    <option value="newest">Сначала новые</option>
                    <option value="oldest">Сначала старые</option>
                    <option value="status">По статусу</option>
                  </select>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Выберите ученика.</p>
            )}
          </div>

          <div className="grid gap-5 2xl:grid-cols-[340px_1fr]">
            <div className="panel space-y-3">
              <h3 className="font-bold">Работы ученика</h3>
              {filteredSubmissions.map((item) => (
                <button
                  key={item.id}
                  className={`w-full rounded-lg border p-3 text-left transition ${selectedSubmission?.id === item.id ? "border-brand-500 bg-brand-50 dark:bg-brand-950" : "border-slate-200 hover:border-brand-300 dark:border-slate-700"}`}
                  onClick={() => setSelectedSubmissionId(item.id)}
                >
                  <span className="block font-semibold">{item.testTitle}</span>
                  <span className="text-sm text-slate-500">{item.course?.title} • {item.status === "PENDING" ? "на проверке" : "проверено"}</span>
                </button>
              ))}
              {filteredSubmissions.length === 0 && <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800">Работ по фильтрам нет.</p>}
            </div>

            <div>
              {selectedSubmission ? (
                <SubmissionCard item={selectedSubmission} grade={grade} setGrade={setGrade} gradeSubmission={gradeSubmission} autoSave />
              ) : (
                <div className="panel text-sm text-slate-500">Выберите работу, чтобы открыть ответы.</div>
              )}
            </div>
          </div>
        </main>
      </section>
    </div>
  );
}

function ReviewTab({ submissions, pending, grade, setGrade, gradeSubmission }) {
  const [mode, setMode] = useState("pending");
  const [groupId, setGroupId] = useState("all");
  const [query, setQuery] = useState("");
  const graded = submissions.filter((item) => item.status === "GRADED");
  const groups = Array.from(new Map(graded.map((item) => [item.group?.id || "none", item.group || { id: "none", title: "Без группы" }])).values());
  const normalizedQuery = query.trim().toLowerCase();
  const filteredGraded = graded.filter((item) => {
    const matchesGroup = groupId === "all" || (item.group?.id || "none") === groupId;
    const haystack = `${item.testTitle} ${item.student?.name || ""} ${item.student?.email || ""}`.toLowerCase();
    return matchesGroup && (!normalizedQuery || haystack.includes(normalizedQuery));
  });
  const groupedGraded = groups
    .filter((group) => groupId === "all" || group.id === groupId)
    .map((group) => ({
      group,
      items: filteredGraded.filter((item) => (item.group?.id || "none") === group.id)
    }))
    .filter((section) => section.items.length > 0);

  return (
    <section className="panel space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-xl font-bold">Проверка работ</h2>
        <div className="flex gap-2 rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800">
          <button
            className={`rounded-md px-3 py-2 text-sm font-semibold transition ${mode === "pending" ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-900"}`}
            onClick={() => setMode("pending")}
          >
            К проверке
          </button>
          <button
            className={`rounded-md px-3 py-2 text-sm font-semibold transition ${mode === "graded" ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-900"}`}
            onClick={() => setMode("graded")}
          >
            Проверенные работы
          </button>
        </div>
      </div>

      {mode === "pending" && (
        <div className="space-y-3">
          {pending.map((item) => (
            <SubmissionCard key={item.id} item={item} grade={grade} setGrade={setGrade} gradeSubmission={gradeSubmission} />
          ))}
          {pending.length === 0 && <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800">Сейчас всё проверено.</p>}
        </div>
      )}

      {mode === "graded" && (
        <div className="space-y-5">
          <div className="grid gap-3 md:grid-cols-[1fr_220px]">
            <input
              className="input"
              placeholder="Поиск по тесту, имени или фамилии"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <select className="input" value={groupId} onChange={(event) => setGroupId(event.target.value)}>
              <option value="all">Все группы</option>
              {groups.map((group) => <option key={group.id} value={group.id}>{group.title}</option>)}
            </select>
          </div>

          <div className="space-y-5">
            {groupedGraded.map((section) => (
              <div key={section.group.id} className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 dark:border-slate-700">
                  <h3 className="font-bold">{section.group.title}</h3>
                  <span className="text-sm text-slate-500">{section.items.length} работ</span>
                </div>
                {section.items.map((item) => (
                  <SubmissionCard key={item.id} item={item} grade={grade} setGrade={setGrade} gradeSubmission={gradeSubmission} />
                ))}
              </div>
            ))}
            {filteredGraded.length === 0 && <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800">Ничего не найдено.</p>}
          </div>
        </div>
      )}
    </section>
  );
}

function SubmissionCard({ item, grade, setGrade, gradeSubmission, compact = false, autoSave = false }) {
  const [editing, setEditing] = useState(item.status === "PENDING");
  const [autoSaveState, setAutoSaveState] = useState("");
  const currentGrade = grade[item.id] || {};
  const score = currentGrade.score ?? item.score ?? "";
  const autoScore = currentGrade.autoScore ?? item.autoScore ?? 0;
  const feedback = currentGrade.feedback ?? item.feedback ?? "";
  const maxScore = Number(item.maxScore || 100);
  const quickScores = [0.5, 0.75, 0.9, 1].map((value) => Math.round(maxScore * value));
  const manualAnswers = getManualAnswers(item);

  function updateGrade(patch) {
    setAutoSaveState("Сохраняем...");
    setGrade({ ...grade, [item.id]: { ...currentGrade, ...patch } });
  }

  function beginEdit() {
    setGrade({ ...grade, [item.id]: { score: item.score ?? 0, feedback: item.feedback || "" } });
    setEditing(true);
  }

  async function saveGrade(keepEditing = false) {
    setAutoSaveState("Сохраняем...");
    await gradeSubmission(item.id);
    setAutoSaveState("Сохранено");
    if (!keepEditing) setEditing(false);
  }

  useEffect(() => {
    if (!autoSave || !editing || (!("score" in currentGrade) && !("feedback" in currentGrade))) return undefined;
    const timer = setTimeout(() => saveGrade(true), 900);
    return () => clearTimeout(timer);
  }, [autoSave, editing, currentGrade.score, currentGrade.feedback]);

  return (
    <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-semibold">{item.testTitle}</p>
          <p className="text-sm text-slate-500">{item.group?.title || "Без группы"} • {item.student?.name}</p>
          <p className="text-sm text-slate-500">{item.course?.title}</p>
        </div>
        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${item.status === "PENDING" ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-100" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-100"}`}>
          {item.status === "PENDING" ? "На проверке" : "Проверено"}
        </span>
      </div>
      <div className="mt-3 space-y-2">
        {manualAnswers.map((manualAnswer, index) => (
          <div key={`${manualAnswer.question}-${index}`} className="rounded-lg bg-white p-3 text-sm dark:bg-slate-900">
            <p className="font-semibold">{manualAnswer.question}</p>
            <p className="mt-2 text-slate-600 dark:text-slate-300">{manualAnswer.answer}</p>
          </div>
        ))}
      </div>
      {!compact && (
        <div className="mt-3 space-y-2">
          <p className="text-sm font-semibold">Автопроверка</p>
          {item.answers.map((answer) => (
            <div key={answer.question} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700">
              <p className="font-medium">{answer.question}</p>
              <p className="text-slate-500">{answer.answer} • {answer.result}</p>
            </div>
          ))}
        </div>
      )}
      {item.status === "GRADED" && !editing ? (
        <div className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-100">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-semibold">Оценка: {item.score} из {maxScore}</p>
              {item.finalScore != null && <p className="mt-1">Итог за тест: {item.finalScore}%</p>}
              {item.feedback && <p className="mt-1">{item.feedback}</p>}
            </div>
            <button className="btn-secondary bg-white/70 px-3 py-1 dark:bg-white/10" onClick={beginEdit}>Изменить</button>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-semibold">Оценивание</p>
            <div className="flex flex-wrap gap-2">
              {quickScores.map((value) => (
                <button key={value} type="button" className="btn-secondary px-3 py-1" onClick={() => updateGrade({ score: value })}>
                  {value}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_130px]">
            <input className="w-full accent-brand-600" type="range" min="0" max={maxScore} value={score || 0} onChange={(event) => updateGrade({ score: Number(event.target.value) })} />
            <label className="flex items-center gap-2">
              <input className="input" type="number" min="0" max={maxScore} placeholder="Балл" value={score} onChange={(event) => updateGrade({ score: Number(event.target.value) })} />
              <span className="text-sm text-slate-500">из {maxScore}</span>
            </label>
          </div>
          <label className="mt-3 block text-sm font-medium">
            Баллы автопроверки
            <input
              className="input mt-1"
              type="number"
              min="0"
              max={item.totalPoints || 100}
              value={autoScore}
              onChange={(event) => updateGrade({ autoScore: Number(event.target.value) })}
            />
          </label>
          <textarea className="input mt-3 min-h-24" placeholder="Комментарий к оценке" value={feedback} onChange={(event) => updateGrade({ feedback: event.target.value })} />
          <div className="mt-3 flex justify-end gap-2">
            {autoSaveState && <span className="self-center text-sm text-slate-500">{autoSaveState}</span>}
            {item.status === "GRADED" && <button className="btn-secondary" onClick={() => setEditing(false)}>Отмена</button>}
            <button className="btn-primary" onClick={() => saveGrade()}>Сохранить оценку</button>
          </div>
        </div>
      )}
    </div>
  );
}

function getManualAnswers(item) {
  if (item.manualAnswers?.length) return item.manualAnswers;
  if (item.question) return [{ question: item.question, answer: item.answer }];
  const [firstLine, ...rest] = String(item.answer || "").split("\n");
  return [{ question: firstLine || "Развернутый ответ", answer: rest.join("\n").trim() || item.answer }];
}

function ProgressTab({ groups, selectedGroupId, selectedStudentId, selectedGroup, selectedStudent, setSelectedGroupId, setSelectedStudentId, extendDeadline }) {
  return (
    <section className="grid gap-6 xl:grid-cols-[320px_1fr]">
      <div className="panel space-y-4">
        <h2 className="text-xl font-bold">Группы</h2>
        <div className="space-y-2">
          {groups.map((group) => (
            <button
              key={group.id}
              className={`w-full rounded-lg border p-3 text-left transition ${selectedGroupId === group.id ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-100" : "border-slate-200 hover:border-brand-300 dark:border-slate-700"}`}
              onClick={() => setSelectedGroupId(group.id)}
            >
              <span className="block font-semibold">{group.title}</span>
              <span className="text-sm text-slate-500">{group.students.length} студентов</span>
            </button>
          ))}
        </div>
        <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
          <p className="mb-2 text-sm font-semibold">Ученики</p>
          <div className="space-y-2">
            {selectedGroup?.students.map((student) => (
              <button
                key={student.id}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${selectedStudentId === student.id ? "bg-brand-600 text-white" : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700"}`}
                onClick={() => setSelectedStudentId(student.id)}
              >
                {student.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="panel">
        {selectedStudent ? (
          <StudentDetails student={selectedStudent} extendDeadline={extendDeadline} />
        ) : (
          <div className="min-h-40" />
        )}
      </div>
    </section>
  );
}

function StudentDetails({ student, extendDeadline }) {
  const [extensionDates, setExtensionDates] = useState({});

  function setDate(assignmentId, deadline) {
    setExtensionDates((value) => ({ ...value, [assignmentId]: deadline }));
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">{student.name}</h2>
          <p className="text-sm text-slate-500">{student.email} • {student.group}</p>
        </div>
        <div className="rounded-lg bg-brand-50 px-4 py-3 text-brand-700 dark:bg-brand-950 dark:text-brand-100">
          <p className="text-xs font-semibold uppercase">Лучший балл</p>
          <p className="text-2xl font-bold">{student.bestScore}%</p>
        </div>
      </div>
      <div>
        <div className="mb-2 flex justify-between text-sm">
          <span>Прогресс</span>
          <span>{student.progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div className="h-full rounded-full bg-brand-600" style={{ width: `${student.progress}%` }} />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Insight title="Лучше всего получается" courses={student.strengthsByCourse} tone="good" />
        <Insight title="Нужно подтянуть" courses={student.focusByCourse} tone="warn" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 font-bold">Что прошел</h3>
          <div className="space-y-2">
            {student.completed.map((item) => <p key={item} className="rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800">{item}</p>)}
          </div>
        </div>
        <div>
          <h3 className="mb-3 font-bold">Оценки</h3>
          <div className="space-y-2">
            {student.grades.map((grade) => (
              <div key={grade.title} className="rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold">{grade.title}</span>
                  <span className="font-semibold">{grade.score}%</span>
                </div>
                <div className="mt-2 space-y-1 text-slate-500 dark:text-slate-300">
                  {grade.details.map((detail) => (
                    <div key={detail.label} className="flex items-center justify-between gap-3">
                      <span>{detail.label}</span>
                      <span>{detail.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div>
        <h3 className="mb-3 font-bold">Сроки заданий</h3>
        <div className="space-y-2">
          {student.assignments.map((assignment) => (
            <div key={assignment.id} className="rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="font-semibold">{assignment.title}</p>
                  <p className="text-slate-500 dark:text-slate-300">{assignment.course} • до {new Date(assignment.effectiveDate).toLocaleDateString("ru-RU")}</p>
                </div>
                <StatusBadge assignment={assignment} />
              </div>
              {!assignment.submitted && (
                <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
                  <input
                    className="input"
                    type="date"
                    value={extensionDates[assignment.id] || assignment.extendedUntil || getDefaultExtensionDate()}
                    onChange={(event) => setDate(assignment.id, event.target.value)}
                  />
                  <button className="btn-secondary" onClick={() => extendDeadline(student.id, assignment.id, extensionDates[assignment.id] || assignment.extendedUntil || getDefaultExtensionDate())}>
                    Продлить
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function getDefaultExtensionDate() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
}

function StatusBadge({ assignment }) {
  const labels = {
    SUBMITTED: "Сдано",
    OVERDUE: "Просрочено",
    EXTENDED: "Продлено",
    ACTIVE: "Активно"
  };
  const className = assignment.status === "OVERDUE"
    ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-100"
    : assignment.status === "SUBMITTED"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-100"
      : "bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-100";

  return <span className={`w-fit rounded-full px-2 py-1 text-xs font-semibold ${className}`}>{labels[assignment.status]}</span>;
}

function Insight({ title, courses, tone }) {
  return (
    <div className={`rounded-lg p-4 ${tone === "good" ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100" : "bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100"}`}>
      <h3 className="mb-3 font-bold">{title}</h3>
      <div className="space-y-3">
        {courses.map((course) => (
          <div key={course.course}>
            <p className="mb-2 text-sm font-semibold opacity-80">{course.course}</p>
            <div className="flex flex-wrap gap-2">
              {course.topics.map((topic) => <span key={topic} className="rounded-full bg-white/70 px-3 py-1 text-sm dark:bg-white/10">{topic}</span>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuestionEditor({ index, question, onChange, onDelete }) {
  function changeType(type) {
    const presets = {
      SINGLE_CHOICE: { options: question.options?.length ? question.options : ["", ""], correctIndexes: [question.correctIndexes?.[0] || 0] },
      MULTIPLE_CHOICE: { options: question.options?.length ? question.options : ["", ""], correctIndexes: question.correctIndexes?.length ? question.correctIndexes : [0] },
      MATCHING: { pairs: question.pairs?.length ? question.pairs : [{ left: "", right: "" }] },
      MANUAL: {}
    };
    onChange({ type, ...presets[type], maxScore: question.maxScore || 10 });
  }

  return (
    <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="font-bold">Задание {index + 1}</p>
        <button type="button" className="btn-secondary px-3" onClick={onDelete} aria-label="Удалить задание"><Trash2 size={16} /></button>
      </div>
      <div className="grid gap-3 md:grid-cols-[180px_1fr_160px]">
        <select className="input" value={question.type} onChange={(event) => changeType(event.target.value)}>
          <option value="SINGLE_CHOICE">Один вариант</option>
          <option value="MULTIPLE_CHOICE">Несколько вариантов</option>
          <option value="MATCHING">Сопоставление</option>
          <option value="MANUAL">Развернутый ответ</option>
        </select>
        <input className="input" placeholder="Текст задания" value={question.text} onChange={(event) => onChange({ text: event.target.value })} />
        <label className="sr-only" htmlFor={`question-score-${index}`}>Баллы</label>
        <input
          id={`question-score-${index}`}
          className="input"
          type="number"
          min="1"
          placeholder="Баллы"
          value={question.maxScore}
          onChange={(event) => onChange({ maxScore: Number(event.target.value) })}
        />
      </div>

      {(question.type === "SINGLE_CHOICE" || question.type === "MULTIPLE_CHOICE") && (
        <div className="mt-3 space-y-2">
          {question.options.map((option, optionIndex) => (
            <label key={optionIndex} className="flex items-center gap-2">
              <input
                type={question.type === "SINGLE_CHOICE" ? "radio" : "checkbox"}
                name={`question-${index}-correct`}
                checked={question.correctIndexes.includes(optionIndex)}
                onChange={() => {
                  if (question.type === "SINGLE_CHOICE") {
                    onChange({ correctIndexes: [optionIndex] });
                  } else {
                    const exists = question.correctIndexes.includes(optionIndex);
                    onChange({ correctIndexes: exists ? question.correctIndexes.filter((item) => item !== optionIndex) : [...question.correctIndexes, optionIndex] });
                  }
                }}
              />
              <input
                className="input"
                placeholder={`Вариант ${optionIndex + 1}`}
                value={option}
                onChange={(event) => onChange({ options: question.options.map((item, current) => (current === optionIndex ? event.target.value : item)) })}
              />
            </label>
          ))}
          <button type="button" className="btn-secondary" onClick={() => onChange({ options: [...question.options, ""] })}>Добавить вариант</button>
        </div>
      )}

      {question.type === "MATCHING" && (
        <div className="mt-3 space-y-2">
          {question.pairs.map((pair, pairIndex) => (
            <div key={pairIndex} className="grid gap-2 sm:grid-cols-2">
              <input className="input" placeholder="Левая часть" value={pair.left} onChange={(event) => onChange({ pairs: question.pairs.map((item, current) => (current === pairIndex ? { ...item, left: event.target.value } : item)) })} />
              <input className="input" placeholder="Правая часть" value={pair.right} onChange={(event) => onChange({ pairs: question.pairs.map((item, current) => (current === pairIndex ? { ...item, right: event.target.value } : item)) })} />
            </div>
          ))}
          <button type="button" className="btn-secondary" onClick={() => onChange({ pairs: [...question.pairs, { left: "", right: "" }] })}>Добавить пару</button>
        </div>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="panel flex items-center gap-4">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-100">
        <Icon />
      </div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}
