import { ArrowLeft, ChevronDown, ChevronUp, FileText, ImagePlus, Pencil, Plus, Save, Video } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import CourseCard from "../components/CourseCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api, assetUrl } from "../services/api.js";

const blockPrefix = "smartedu-blocks:";

function createId(prefix = "item") {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const emptyQuestion = {
  type: "SINGLE_CHOICE",
  text: "",
  options: ["", ""],
  correctIndexes: [0],
  pairs: [{ left: "", right: "" }],
  maxScore: 10
};

function emptyActivity(type = "TEXT") {
  return {
    tempId: createId("activity"),
    type,
    title: "",
    duration: type === "TEST" ? "20 мин" : "10 мин",
    content: "",
    textBlocks: [{ id: createId("block"), type: "text", value: "" }],
    videoUrl: "",
    imageUrl: "",
    isPublished: true,
    visibleFrom: "",
    collapsed: false,
    attemptLimit: 2,
    timeLimitMinutes: 20,
    deadline: "",
    questions: [{ ...emptyQuestion }]
  };
}

function emptyDraft() {
  return {
    title: "",
    description: "",
    category: "Frontend",
    level: "Beginner",
    duration: "6 часов",
    imageUrl: "",
    moduleTitle: "Основной модуль",
    groupIds: [],
    userIds: []
  };
}

export default function CourseBuilder() {
  const { user } = useAuth();
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [draft, setDraft] = useState(emptyDraft());
  const [activities, setActivities] = useState([]);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const isEditing = Boolean(courseId);
  const isNew = courseId === "new";

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!data || !isEditing) return;

    if (isNew) {
      setDraft(emptyDraft());
      setActivities([]);
      setBannerFile(null);
      setBannerPreview("");
      return;
    }

    const course = data.courses.find((item) => item.id === courseId);
    if (!course) return;

    setDraft({
      title: course.title,
      description: course.description,
      category: course.category,
      level: course.level,
      duration: course.duration,
      imageUrl: course.imageUrl || "",
      moduleTitle: course.modules?.[0]?.title || "Основной модуль",
      groupIds: (course.groups || []).map((item) => item.groupId),
      userIds: (course.users || []).map((item) => item.userId)
    });
    setActivities(courseToActivities(course));
    setBannerFile(null);
    setBannerPreview("");
  }, [data, courseId, isEditing, isNew]);

  async function loadData() {
    const overview = await api(user.role === "ADMIN" ? "/admin/overview" : "/teacher/overview");
    setData(overview);
  }

  const groups = data?.groups || [];
  const students = useMemo(() => {
    const source = data?.users?.filter((item) => item.role === "STUDENT") || data?.groups?.flatMap((group) => group.students) || [];
    return Array.from(new Map(source.map((item) => [item.id, item])).values());
  }, [data]);

  if (!data) return <div className="panel text-sm text-slate-500">Загружаем конструктор курсов...</div>;

  if (!isEditing) {
    return (
      <div className="page-enter space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Конструктор курсов</h1>
            <p className="text-sm text-slate-500">Создавайте курсы, редактируйте материалы и управляйте доступом.</p>
          </div>
          <Link className="btn-primary flex w-fit items-center gap-2" to="/courses/builder/new">
            <Plus size={18} /> Создать новый курс
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {data.courses.map((course) => (
            <div key={course.id} className="relative">
              <CourseCard course={course} />
              <Link className="btn-secondary absolute right-4 top-4 flex items-center gap-2 bg-white/90 dark:bg-slate-950/90" to={`/courses/builder/${course.id}`}>
                <Pencil size={16} /> Редактировать
              </Link>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function updateActivity(tempId, patch) {
    setActivities((items) => items.map((item) => (item.tempId === tempId ? { ...item, ...patch } : item)));
  }

  function updateQuestion(activityId, questionIndex, patch) {
    updateActivity(activityId, {
      questions: activities
        .find((item) => item.tempId === activityId)
        .questions.map((question, index) => (index === questionIndex ? { ...question, ...patch } : question))
    });
  }

  async function saveCourse(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const payload = {
        title: draft.title,
        description: draft.description,
        category: draft.category,
        level: draft.level,
        duration: draft.duration,
        imageUrl: draft.imageUrl,
        groupIds: draft.groupIds,
        userIds: draft.userIds
      };
      const result = isNew
        ? await api("/courses", { method: "POST", body: JSON.stringify(payload) })
        : await api(`/courses/${courseId}`, { method: "PUT", body: JSON.stringify(payload) });
      const savedCourse = result.course;

      if (bannerFile) {
        const formData = new FormData();
        formData.append("banner", bannerFile);
        await api(`/courses/${savedCourse.id}/banner`, { method: "PATCH", body: formData });
      }

      let moduleId = savedCourse.modules?.[0]?.id || data.courses.find((item) => item.id === savedCourse.id)?.modules?.[0]?.id;
      if (!moduleId) {
        const moduleResult = await api(`/courses/${savedCourse.id}/modules`, {
          method: "POST",
          body: JSON.stringify({ title: draft.moduleTitle || "Основной модуль" })
        });
        moduleId = moduleResult.module.id;
      }

      for (const activity of activities) {
        await saveActivity(savedCourse.id, moduleId, activity);
      }

      await loadData();
      setMessage("Курс сохранен");
      if (isNew) navigate(`/courses/builder/${savedCourse.id}`, { replace: true });
    } catch (error) {
      setMessage(error.message || "Не удалось сохранить курс");
    } finally {
      setSaving(false);
    }
  }

  async function saveActivity(courseIdValue, moduleId, activity) {
    const base = {
      title: activity.title,
      type: activity.type === "TEST" ? "TEST" : activity.type,
      duration: activity.duration,
      content: activity.type === "TEXT" ? serializeTextBlocks(activity.textBlocks) : activity.content,
      videoUrl: activity.videoUrl,
      imageUrl: activity.type === "TEXT" ? firstImageUrl(activity.textBlocks) : activity.imageUrl,
      isPublished: activity.isPublished,
      visibleFrom: activity.visibleFrom
    };

    if (activity.lessonId) {
      await api(`/lessons/${activity.lessonId}`, { method: "PUT", body: JSON.stringify(base) });
      if (activity.type === "TEST" && activity.testId) {
        await api(`/teacher/tests/${activity.testId}`, {
          method: "PUT",
          body: JSON.stringify({
            title: activity.title,
            description: activity.content,
            attemptLimit: Number(activity.attemptLimit || 1),
            timeLimitMinutes: Number(activity.timeLimitMinutes || 1),
            deadline: activity.deadline,
            isPublished: activity.isPublished,
            visibleFrom: activity.visibleFrom,
            questions: normalizeQuestions(activity.questions)
          })
        });
      }
      if (activity.type === "VIDEO" && activity.videoFile) {
        const formData = new FormData();
        formData.append("video", activity.videoFile);
        await api(`/lessons/${activity.lessonId}/video`, { method: "PATCH", body: formData });
      }
      return;
    }

    if (activity.type === "TEST") {
      await api("/teacher/tests", {
        method: "POST",
        body: JSON.stringify({
          title: activity.title,
          description: activity.content,
          courseId: courseIdValue,
          attemptLimit: Number(activity.attemptLimit || 1),
          timeLimitMinutes: Number(activity.timeLimitMinutes || 1),
          deadline: activity.deadline,
          isPublished: activity.isPublished,
          visibleFrom: activity.visibleFrom,
          questions: normalizeQuestions(activity.questions)
        })
      });
      return;
    }

    const created = await api(`/modules/${moduleId}/lessons`, { method: "POST", body: JSON.stringify(base) });
    if (activity.videoFile) {
      const formData = new FormData();
      formData.append("video", activity.videoFile);
      await api(`/lessons/${created.lesson.id}/video`, { method: "PATCH", body: formData });
    }
  }

  return (
    <form className="page-enter space-y-6" onSubmit={saveCourse}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-brand-600" to="/courses/builder">
            <ArrowLeft size={16} /> К списку курсов
          </Link>
          <h1 className="text-2xl font-bold">{isNew ? "Новый курс" : "Редактирование курса"}</h1>
          <p className="text-sm text-slate-500">Настройки, доступ, баннер и учебные активности в одном месте.</p>
        </div>
        <button className="btn-primary flex w-fit items-center gap-2" disabled={saving}>
          <Save size={18} /> {saving ? "Сохраняем..." : "Сохранить курс"}
        </button>
      </div>

      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="panel space-y-4">
          <h2 className="text-xl font-bold">Основные настройки</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Название">
              <input className="input" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} required />
            </Field>
            <Field label="Категория">
              <input className="input" value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} required />
            </Field>
            <Field label="Уровень">
              <input className="input" value={draft.level} onChange={(event) => setDraft({ ...draft, level: event.target.value })} required />
            </Field>
            <Field label="Длительность">
              <input className="input" value={draft.duration} onChange={(event) => setDraft({ ...draft, duration: event.target.value })} required />
            </Field>
            <Field label="Первый модуль">
              <input className="input" value={draft.moduleTitle} onChange={(event) => setDraft({ ...draft, moduleTitle: event.target.value })} />
            </Field>
            <Field className="md:col-span-2" label="Описание">
              <textarea className="input min-h-28" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} required />
            </Field>
          </div>
        </div>

        <div className="panel space-y-4">
          <h2 className="text-xl font-bold">Баннер</h2>
          <div className="aspect-video overflow-hidden rounded-lg bg-gradient-to-br from-brand-600 to-cyan-400">
            {bannerPreview || draft.imageUrl ? (
              <img className="h-full w-full object-cover" src={bannerPreview || assetUrl(draft.imageUrl)} alt="Предпросмотр баннера" />
            ) : (
              <div className="flex h-full items-center justify-center text-sm font-semibold text-white">Предпросмотр баннера</div>
            )}
          </div>
          <p className="text-sm text-slate-500">Рекомендуемый формат: 16:9, не меньше 1200x675. Текст лучше держать по центру, края могут обрезаться.</p>
          <Field label="Ссылка на баннер">
            <input className="input" type="url" placeholder="https://..." value={draft.imageUrl} onChange={(event) => setDraft({ ...draft, imageUrl: event.target.value })} />
          </Field>
          <Field label="Файл баннера">
            <input
              className="input"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={(event) => {
                const file = event.target.files?.[0] || null;
                setBannerFile(file);
                setBannerPreview(file ? URL.createObjectURL(file) : "");
              }}
            />
          </Field>
        </div>
      </section>

      <section className="panel space-y-4">
        <h2 className="text-xl font-bold">Доступ</h2>
        <div className="grid gap-5 lg:grid-cols-2">
          <AccessList title="Группы" items={groups} selected={draft.groupIds} onChange={(groupIds) => setDraft({ ...draft, groupIds })} getLabel={(group) => group.title} />
          <AccessList title="Отдельные студенты" items={students} selected={draft.userIds} onChange={(userIds) => setDraft({ ...draft, userIds })} getLabel={(student) => `${student.name} • ${student.email}`} />
        </div>
      </section>

      <section className="panel space-y-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold">Активности</h2>
            <p className="text-sm text-slate-500">Добавляйте видео, текстовые материалы и тесты. Карточки можно свернуть.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <AddButton icon={Video} label="Видео" onClick={() => setActivities((items) => [...items, emptyActivity("VIDEO")])} />
            <AddButton icon={FileText} label="Текст" onClick={() => setActivities((items) => [...items, emptyActivity("TEXT")])} />
            <AddButton icon={Plus} label="Тест" onClick={() => setActivities((items) => [...items, emptyActivity("TEST")])} />
          </div>
        </div>

        <div className="space-y-3">
          {activities.map((activity, index) => (
            <ActivityEditor
              key={activity.tempId}
              activity={activity}
              index={index}
              onChange={(patch) => updateActivity(activity.tempId, patch)}
              onDelete={() => setActivities((items) => items.filter((item) => item.tempId !== activity.tempId))}
              updateQuestion={(questionIndex, patch) => updateQuestion(activity.tempId, questionIndex, patch)}
            />
          ))}
          {activities.length === 0 && <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800">Добавьте первую активность через кнопки выше.</div>}
        </div>
      </section>

      {message && <p className={`text-sm font-semibold ${message === "Курс сохранен" ? "text-emerald-600" : "text-red-600"}`}>{message}</p>}
    </form>
  );
}

function courseToActivities(course) {
  return (course.modules || []).flatMap((module) =>
    (module.lessons || []).map((lesson) => ({
      tempId: lesson.id,
      lessonId: lesson.id,
      moduleId: module.id,
      testId: lesson.test?.id || "",
      type: lesson.type,
      title: lesson.title,
      duration: lesson.duration,
      content: lesson.content || lesson.test?.description || "",
      textBlocks: parseTextBlocks(lesson.content, lesson.imageUrl),
      videoUrl: lesson.videoUrl || "",
      imageUrl: lesson.imageUrl || "",
      isPublished: lesson.isPublished !== false,
      visibleFrom: formatDateTimeLocal(lesson.visibleFrom),
      collapsed: true,
      attemptLimit: lesson.test?.attemptLimit || 2,
      timeLimitMinutes: lesson.test?.timeLimitMinutes || 20,
      deadline: lesson.test?.deadline ? lesson.test.deadline.slice(0, 10) : "",
      questions: lesson.test?.questions?.length ? lesson.test.questions.map(questionFromApi) : [{ ...emptyQuestion }]
    }))
  );
}

function questionFromApi(question) {
  return {
    type: question.type,
    text: question.text,
    maxScore: question.maxScore,
    options: question.answers?.map((answer) => answer.text) || ["", ""],
    correctIndexes: question.answers?.map((answer, index) => (answer.isCorrect ? index : null)).filter((item) => item !== null) || [0],
    pairs: question.type === "MATCHING" ? question.answers.map((answer) => {
      const [left, right] = answer.text.split("→").map((part) => part.trim());
      return { left, right };
    }) : [{ left: "", right: "" }]
  };
}

function ActivityEditor({ activity, index, onChange, onDelete, updateQuestion }) {
  const closed = activity.collapsed;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <button type="button" className="flex items-center gap-2 text-left" onClick={() => onChange({ collapsed: !closed })}>
          {closed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          <span className="font-bold">Активность {index + 1}: {activity.title || activityTypeLabel(activity.type)}</span>
        </button>
        <div className="flex flex-wrap gap-2">
          <VisibilityBadge item={activity} />
          <button type="button" className="btn-secondary px-3 py-1" onClick={onDelete}>Удалить</button>
        </div>
      </div>

      {!closed && (
        <div className="mt-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-[180px_1fr_150px]">
            <select className="input" value={activity.type} onChange={(event) => onChange({ type: event.target.value })}>
              <option value="VIDEO">Видео</option>
              <option value="TEXT">Текст</option>
              <option value="TEST">Тест</option>
            </select>
            <input className="input" placeholder="Название активности" value={activity.title} onChange={(event) => onChange({ title: event.target.value })} />
            <input className="input" placeholder="Длительность" value={activity.duration} onChange={(event) => onChange({ duration: event.target.value })} />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm font-medium dark:border-slate-700">
              <input type="checkbox" checked={activity.isPublished} onChange={(event) => onChange({ isPublished: event.target.checked })} />
              Видно студентам
            </label>
            <Field label="Показать с даты">
              <input className="input" type="datetime-local" value={activity.visibleFrom} onChange={(event) => onChange({ visibleFrom: event.target.value })} />
            </Field>
          </div>

          {activity.type === "VIDEO" && <VideoFields activity={activity} onChange={onChange} />}
          {activity.type === "TEXT" && <TextFields activity={activity} onChange={onChange} />}
          {activity.type === "TEST" && <TestFields activity={activity} onChange={onChange} updateQuestion={updateQuestion} />}
        </div>
      )}
    </div>
  );
}

function VideoFields({ activity, onChange }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Field label="Видео по ссылке">
        <input className="input" type="url" placeholder="https://..." value={activity.videoUrl} onChange={(event) => onChange({ videoUrl: event.target.value })} />
      </Field>
      <Field label="Файл видео">
        <input className="input" type="file" accept="video/mp4,video/webm,video/ogg,video/quicktime" onChange={(event) => onChange({ videoFile: event.target.files?.[0] || null })} />
      </Field>
      <Field className="md:col-span-2" label="Описание">
        <textarea className="input min-h-24" value={activity.content} onChange={(event) => onChange({ content: event.target.value })} />
      </Field>
    </div>
  );
}

function TextFields({ activity, onChange }) {
  const blocks = activity.textBlocks?.length ? activity.textBlocks : parseTextBlocks(activity.content, activity.imageUrl);

  function updateBlock(id, patch) {
    onChange({ textBlocks: blocks.map((block) => (block.id === id ? { ...block, ...patch } : block)) });
  }

  function addBlock(type) {
    onChange({ textBlocks: [...blocks, { id: createId("block"), type, value: type === "link" ? "https://" : "" }] });
  }

  function moveBlock(index, direction) {
    const next = [...blocks];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= next.length) return;
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    onChange({ textBlocks: next });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <AddButton icon={FileText} label="Текстовый блок" onClick={() => addBlock("text")} />
        <AddButton icon={Plus} label="Ссылка" onClick={() => addBlock("link")} />
        <AddButton icon={ImagePlus} label="Картинка" onClick={() => addBlock("image")} />
      </div>
      <div className="space-y-3">
        {blocks.map((block, index) => (
          <div key={block.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold">{blockTypeLabel(block.type)} {index + 1}</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn-secondary px-3 py-1" onClick={() => moveBlock(index, -1)} disabled={index === 0}>Выше</button>
                <button type="button" className="btn-secondary px-3 py-1" onClick={() => moveBlock(index, 1)} disabled={index === blocks.length - 1}>Ниже</button>
                <button type="button" className="btn-secondary px-3 py-1" onClick={() => onChange({ textBlocks: blocks.filter((item) => item.id !== block.id) })}>Удалить</button>
              </div>
            </div>
            {block.type === "text" && (
              <textarea className="input min-h-28" value={block.value} onChange={(event) => updateBlock(block.id, { value: event.target.value })} placeholder="Текст материала" />
            )}
            {block.type === "link" && (
              <div className="grid gap-3 md:grid-cols-2">
                <input className="input" value={block.label || ""} onChange={(event) => updateBlock(block.id, { label: event.target.value })} placeholder="Текст ссылки" />
                <input className="input" type="url" value={block.value} onChange={(event) => updateBlock(block.id, { value: event.target.value })} placeholder="https://..." />
              </div>
            )}
            {block.type === "image" && (
              <div className="grid gap-3 md:grid-cols-2">
                <input className="input" type="url" value={block.value} onChange={(event) => updateBlock(block.id, { value: event.target.value })} placeholder="https://..." />
                <input className="input" value={block.alt || ""} onChange={(event) => updateBlock(block.id, { alt: event.target.value })} placeholder="Описание картинки" />
              </div>
            )}
          </div>
        ))}
        {blocks.length === 0 && <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800">Добавьте блок текста, ссылку или картинку.</p>}
      </div>
    </div>
  );
}

function TestFields({ activity, onChange, updateQuestion }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <Field label="Попытки">
          <input className="input" type="number" min="1" value={activity.attemptLimit} onChange={(event) => onChange({ attemptLimit: Number(event.target.value) })} />
        </Field>
        <Field label="Время, мин">
          <input className="input" type="number" min="1" value={activity.timeLimitMinutes} onChange={(event) => onChange({ timeLimitMinutes: Number(event.target.value) })} />
        </Field>
        <Field label="Дедлайн">
          <input className="input" type="date" value={activity.deadline} onChange={(event) => onChange({ deadline: event.target.value })} />
        </Field>
      </div>
      <Field label="Описание теста">
        <textarea className="input min-h-20" value={activity.content} onChange={(event) => onChange({ content: event.target.value })} />
      </Field>
      {activity.questions.map((question, index) => (
        <QuestionEditor
          key={index}
          index={index}
          question={question}
          onChange={(patch) => updateQuestion(index, patch)}
          onDelete={() => onChange({ questions: activity.questions.filter((_, current) => current !== index) })}
        />
      ))}
      <button type="button" className="btn-secondary" onClick={() => onChange({ questions: [...activity.questions, { ...emptyQuestion }] })}>Добавить задание</button>
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
        <button type="button" className="btn-secondary px-3" onClick={onDelete}>Удалить</button>
      </div>
      <div className="grid gap-3 md:grid-cols-[180px_1fr_130px]">
        <select className="input" value={question.type} onChange={(event) => changeType(event.target.value)}>
          <option value="SINGLE_CHOICE">Один вариант</option>
          <option value="MULTIPLE_CHOICE">Несколько вариантов</option>
          <option value="MATCHING">Сопоставление</option>
          <option value="MANUAL">Развернутый ответ</option>
        </select>
        <input className="input" placeholder="Текст задания" value={question.text} onChange={(event) => onChange({ text: event.target.value })} />
        <input className="input" type="number" min="1" value={question.maxScore} onChange={(event) => onChange({ maxScore: Number(event.target.value) })} />
      </div>
      {(question.type === "SINGLE_CHOICE" || question.type === "MULTIPLE_CHOICE") && (
        <div className="mt-3 space-y-2">
          {question.options.map((option, optionIndex) => (
            <label key={optionIndex} className="flex items-center gap-2">
              <input
                type={question.type === "SINGLE_CHOICE" ? "radio" : "checkbox"}
                name={`builder-question-${index}`}
                checked={question.correctIndexes.includes(optionIndex)}
                onChange={() => {
                  if (question.type === "SINGLE_CHOICE") onChange({ correctIndexes: [optionIndex] });
                  else {
                    const exists = question.correctIndexes.includes(optionIndex);
                    onChange({ correctIndexes: exists ? question.correctIndexes.filter((item) => item !== optionIndex) : [...question.correctIndexes, optionIndex] });
                  }
                }}
              />
              <input className="input" value={option} onChange={(event) => onChange({ options: question.options.map((item, current) => (current === optionIndex ? event.target.value : item)) })} />
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

function AccessList({ title, items, selected, onChange, getLabel }) {
  return (
    <div>
      <h3 className="mb-2 font-bold">{title}</h3>
      <div className="grid max-h-72 gap-2 overflow-y-auto rounded-lg border border-slate-200 p-3 dark:border-slate-700">
        {items.map((item) => {
          const checked = selected.includes(item.id);
          return (
            <label key={item.id} className="flex items-center gap-2 rounded-lg bg-slate-50 p-2 text-sm dark:bg-slate-800">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onChange(checked ? selected.filter((id) => id !== item.id) : [...selected, item.id])}
              />
              {getLabel(item)}
            </label>
          );
        })}
        {items.length === 0 && <p className="text-sm text-slate-500">Пока пусто.</p>}
      </div>
    </div>
  );
}

function Field({ label, children, className = "" }) {
  return (
    <label className={`block text-sm font-medium ${className}`}>
      <span className="mb-1 block">{label}</span>
      {children}
    </label>
  );
}

function AddButton({ icon: Icon, label, onClick }) {
  return (
    <button type="button" className="btn-secondary flex items-center gap-2" onClick={onClick}>
      <Icon size={16} /> {label}
    </button>
  );
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

function activityTypeLabel(type) {
  const labels = { VIDEO: "Видео", TEXT: "Текст", TEST: "Тест" };
  return labels[type] || "Материал";
}

function blockTypeLabel(type) {
  const labels = { text: "Текст", link: "Ссылка", image: "Картинка" };
  return labels[type] || "Блок";
}

function serializeTextBlocks(blocks = []) {
  const cleanBlocks = blocks
    .map((block) => ({
      id: block.id,
      type: block.type,
      value: block.value?.trim() || "",
      label: block.label?.trim() || "",
      alt: block.alt?.trim() || ""
    }))
    .filter((block) => block.value || block.label || block.alt);

  return `${blockPrefix}${JSON.stringify(cleanBlocks)}`;
}

function parseTextBlocks(content = "", imageUrl = "") {
  if (content?.startsWith(blockPrefix)) {
    try {
      const blocks = JSON.parse(content.slice(blockPrefix.length));
      if (Array.isArray(blocks)) {
        return blocks.map((block, index) => ({
          id: block.id || `block-${index}`,
          type: block.type || "text",
          value: block.value || "",
          label: block.label || "",
          alt: block.alt || ""
        }));
      }
    } catch {
      return [{ id: "block-0", type: "text", value: "" }];
    }
  }

  const blocks = content ? [{ id: "block-0", type: "text", value: content }] : [];
  if (imageUrl) blocks.push({ id: "block-image-0", type: "image", value: imageUrl, alt: "" });
  return blocks.length ? blocks : [{ id: "block-0", type: "text", value: "" }];
}

function firstImageUrl(blocks = []) {
  return blocks.find((block) => block.type === "image" && block.value)?.value || "";
}

function normalizeQuestions(questions) {
  return questions.map((question) => ({
    ...question,
    text: question.text.trim(),
    maxScore: Number(question.maxScore || 1),
    options: question.options?.map((option) => option.trim()),
    pairs: question.pairs?.map((pair) => ({ left: pair.left.trim(), right: pair.right.trim() })).filter((pair) => pair.left && pair.right)
  }));
}

function formatDateTimeLocal(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
