import { BookOpen, CheckCircle2, ClipboardCheck, Plus, Trash2, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api.js";

const emptyQuestion = {
  type: "MULTIPLE_CHOICE",
  text: "",
  options: ["", ""],
  correctIndexes: [0],
  pairs: [{ left: "", right: "" }],
  maxScore: 10
};

export default function TeacherPanel() {
  const [data, setData] = useState(null);
  const [draft, setDraft] = useState({
    title: "",
    description: "",
    attemptLimit: 2,
    timeLimitMinutes: 20,
    deadline: "2026-12-31",
    courseId: "course-1",
    questions: [{ ...emptyQuestion }]
  });
  const [grade, setGrade] = useState({});
  const [saved, setSaved] = useState("");

  useEffect(() => {
    api("/teacher/overview").then(setData);
  }, []);

  const courses = data?.courses || [];
  const questionSummary = useMemo(() => draft.questions.map((item) => item.type).join(" • "), [draft.questions]);

  if (!data) return <div className="panel text-sm text-slate-500">Загружаем кабинет преподавателя...</div>;

  async function saveTest(event) {
    event.preventDefault();
    const result = await api("/teacher/tests", { method: "POST", body: JSON.stringify(draft) });
    setData((value) => ({ ...value, customTests: [result.test, ...value.customTests] }));
    setSaved("Тест сохранен в mock-редакторе");
  }

  async function gradeSubmission(id) {
    const result = await api(`/teacher/submissions/${id}/grade`, {
      method: "PATCH",
      body: JSON.stringify(grade[id] || {})
    });
    setData((value) => ({
      ...value,
      manualSubmissions: value.manualSubmissions.map((item) => (item.id === id ? { ...item, ...result.submission, student: item.student } : item))
    }));
  }

  function updateQuestion(index, patch) {
    setDraft((value) => ({
      ...value,
      questions: value.questions.map((question, current) => (current === index ? { ...question, ...patch } : question))
    }));
  }

  return (
    <div className="page-enter space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Кабинет преподавателя</h1>
        <p className="text-sm text-slate-500">Курсы, тесты, группы, успеваемость и ручная проверка.</p>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <Stat icon={BookOpen} label="Курсы" value={courses.length} />
        <Stat icon={UsersRound} label="Группы" value={data.groups.length} />
        <Stat icon={ClipboardCheck} label="Работы" value={data.manualSubmissions.length} />
        <Stat icon={CheckCircle2} label="Тесты" value={data.customTests.length} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <form className="panel space-y-5" onSubmit={saveTest}>
          <div>
            <p className="text-sm font-semibold text-brand-600">Редактор тестов</p>
            <h2 className="text-xl font-bold">Новый тест</h2>
            <p className="text-sm text-slate-500">{questionSummary || "Добавьте задания"}</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm font-medium">
              Название
              <input className="input mt-1" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
            </label>
            <label className="text-sm font-medium">
              Курс
              <select className="input mt-1" value={draft.courseId} onChange={(event) => setDraft({ ...draft, courseId: event.target.value })}>
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
            <button className="btn-primary">Сохранить тест</button>
          </div>
          {saved && <p className="text-sm font-semibold text-emerald-600">{saved}</p>}
        </form>

        <div className="space-y-6">
          <div className="panel">
            <h2 className="mb-4 text-xl font-bold">Успеваемость групп</h2>
            <div className="space-y-3">
              {data.students.map((student) => (
                <div key={student.id} className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{student.name}</p>
                      <p className="text-sm text-slate-500">{student.group}</p>
                    </div>
                    <p className="text-sm font-bold text-brand-600">{student.bestScore}%</p>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className="h-full rounded-full bg-brand-600" style={{ width: `${student.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <h2 className="mb-4 text-xl font-bold">Ручная проверка</h2>
            <div className="space-y-3">
              {data.manualSubmissions.map((item) => (
                <div key={item.id} className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
                  <p className="font-semibold">{item.testTitle}</p>
                  <p className="text-sm text-slate-500">{item.student?.name}</p>
                  <p className="mt-2 text-sm">{item.answer}</p>
                  {item.status === "GRADED" ? (
                    <p className="mt-3 rounded-lg bg-emerald-50 p-2 text-sm font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-100">Оценка: {item.score}</p>
                  ) : (
                    <div className="mt-3 grid gap-2 sm:grid-cols-[100px_1fr_auto]">
                      <input className="input" type="number" min="0" max="100" placeholder="Балл" value={grade[item.id]?.score || ""} onChange={(event) => setGrade({ ...grade, [item.id]: { ...grade[item.id], score: event.target.value } })} />
                      <input className="input" placeholder="Комментарий" value={grade[item.id]?.feedback || ""} onChange={(event) => setGrade({ ...grade, [item.id]: { ...grade[item.id], feedback: event.target.value } })} />
                      <button className="btn-primary" onClick={() => gradeSubmission(item.id)}>Оценить</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function QuestionEditor({ index, question, onChange, onDelete }) {
  return (
    <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="font-bold">Задание {index + 1}</p>
        <button type="button" className="btn-secondary px-3" onClick={onDelete} aria-label="Удалить задание"><Trash2 size={16} /></button>
      </div>
      <div className="grid gap-3 md:grid-cols-[180px_1fr]">
        <select className="input" value={question.type} onChange={(event) => onChange({ ...emptyQuestion, type: event.target.value })}>
          <option value="MULTIPLE_CHOICE">Варианты</option>
          <option value="MATCHING">Сопоставление</option>
          <option value="MANUAL">Развернутый ответ</option>
        </select>
        <input className="input" placeholder="Текст задания" value={question.text} onChange={(event) => onChange({ text: event.target.value })} />
      </div>

      {question.type === "MULTIPLE_CHOICE" && (
        <div className="mt-3 space-y-2">
          {question.options.map((option, optionIndex) => (
            <label key={optionIndex} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={question.correctIndexes.includes(optionIndex)}
                onChange={() => {
                  const exists = question.correctIndexes.includes(optionIndex);
                  onChange({ correctIndexes: exists ? question.correctIndexes.filter((item) => item !== optionIndex) : [...question.correctIndexes, optionIndex] });
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

      {question.type === "MANUAL" && (
        <label className="mt-3 block text-sm font-medium">
          Максимальный балл
          <input className="input mt-1" type="number" min="1" value={question.maxScore} onChange={(event) => onChange({ maxScore: Number(event.target.value) })} />
        </label>
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
