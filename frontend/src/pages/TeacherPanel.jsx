import { BookOpen, CheckCircle2, ClipboardCheck, Plus, Trash2, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api.js";

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
  const [activeTab, setActiveTab] = useState("review");
  const [data, setData] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
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
    api("/teacher/overview").then((result) => {
      setData(result);
      setSelectedGroupId(result.groups[0]?.id || "");
      setSelectedStudentId(result.groups[0]?.students[0]?.id || "");
    });
  }, []);

  const courses = data?.courses || [];
  const selectedGroup = data?.groups.find((group) => group.id === selectedGroupId);
  const selectedStudent = selectedGroup?.students.find((student) => student.id === selectedStudentId);
  const pending = data?.manualSubmissions.filter((item) => item.status === "PENDING") || [];
  const totalPoints = useMemo(() => draft.questions.reduce((sum, item) => sum + Number(item.maxScore || 0), 0), [draft.questions]);
  const questionSummary = useMemo(() => `${draft.questions.length} заданий • ${totalPoints} баллов`, [draft.questions.length, totalPoints]);

  if (!data) return <div className="panel text-sm text-slate-500">Загружаем кабинет преподавателя...</div>;

  async function saveTest(event) {
    event.preventDefault();
    const result = await api("/teacher/tests", { method: "POST", body: JSON.stringify(draft) });
    setData((value) => ({ ...value, customTests: [result.test, ...value.customTests] }));
    setSaved("Тест сохранен");
  }

  async function gradeSubmission(id) {
    const result = await api(`/teacher/submissions/${id}/grade`, {
      method: "PATCH",
      body: JSON.stringify(grade[id] || {})
    });
    setData((value) => ({
      ...value,
      manualSubmissions: value.manualSubmissions.map((item) => (item.id === id ? { ...item, ...result.submission, student: item.student, group: item.group, course: item.course, answers: item.answers } : item))
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
        <p className="text-sm text-slate-500">Проверка работ, редактор тестов и аналитика по группам.</p>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <Stat icon={BookOpen} label="Курсы" value={courses.length} />
        <Stat icon={UsersRound} label="Группы" value={data.groups.length} />
        <Stat icon={ClipboardCheck} label="К проверке" value={pending.length} />
        <Stat icon={CheckCircle2} label="Тесты" value={data.customTests.length} />
      </section>

      <div className="flex gap-2 overflow-x-auto rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`rounded-md px-4 py-2 text-sm font-semibold transition ${activeTab === tab.id ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "create" && (
        <TestEditor
          courses={courses}
          draft={draft}
          saved={saved}
          questionSummary={questionSummary}
          setDraft={setDraft}
          saveTest={saveTest}
          updateQuestion={updateQuestion}
        />
      )}

      {activeTab === "review" && (
        <ReviewTab
          submissions={data.manualSubmissions}
          pending={pending}
          grade={grade}
          setGrade={setGrade}
          gradeSubmission={gradeSubmission}
        />
      )}

      {activeTab === "progress" && (
        <ProgressTab
          groups={data.groups}
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
      )}
    </div>
  );
}

function TestEditor({ courses, draft, saved, questionSummary, setDraft, saveTest, updateQuestion }) {
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

function SubmissionCard({ item, grade, setGrade, gradeSubmission, compact = false }) {
  const [editing, setEditing] = useState(item.status === "PENDING");
  const currentGrade = grade[item.id] || {};
  const score = currentGrade.score ?? item.score ?? "";
  const feedback = currentGrade.feedback ?? item.feedback ?? "";
  const maxScore = Number(item.maxScore || 100);
  const quickScores = [0.5, 0.75, 0.9, 1].map((value) => Math.round(maxScore * value));
  const manualAnswers = getManualAnswers(item);

  function updateGrade(patch) {
    setGrade({ ...grade, [item.id]: { ...currentGrade, ...patch } });
  }

  function beginEdit() {
    setGrade({ ...grade, [item.id]: { score: item.score ?? 0, feedback: item.feedback || "" } });
    setEditing(true);
  }

  async function saveGrade() {
    await gradeSubmission(item.id);
    setEditing(false);
  }

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
          <p className="text-sm font-semibold">Ответы в других вопросах</p>
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
              <input className="input" type="number" min="0" max={maxScore} placeholder="Балл" value={score} onChange={(event) => updateGrade({ score: event.target.value })} />
              <span className="text-sm text-slate-500">из {maxScore}</span>
            </label>
          </div>
          <textarea className="input mt-3 min-h-24" placeholder="Комментарий к оценке" value={feedback} onChange={(event) => updateGrade({ feedback: event.target.value })} />
          <div className="mt-3 flex justify-end gap-2">
            {item.status === "GRADED" && <button className="btn-secondary" onClick={() => setEditing(false)}>Отмена</button>}
            <button className="btn-primary" onClick={saveGrade}>Сохранить оценку</button>
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

function ProgressTab({ groups, selectedGroupId, selectedStudentId, selectedGroup, selectedStudent, setSelectedGroupId, setSelectedStudentId }) {
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
          <StudentDetails student={selectedStudent} />
        ) : (
          <div className="min-h-40" />
        )}
      </div>
    </section>
  );
}

function StudentDetails({ student }) {
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
        <Insight title="Лучше всего получается" items={student.strengths} tone="good" />
        <Insight title="Проседает" items={student.weaknesses} tone="warn" />
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
              <div key={grade.title} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800">
                <span>{grade.title}</span>
                <span className="font-semibold">{grade.score === null ? grade.type : `${grade.score}%`}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Insight({ title, items, tone }) {
  return (
    <div className={`rounded-lg p-4 ${tone === "good" ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100" : "bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100"}`}>
      <h3 className="mb-3 font-bold">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => <span key={item} className="rounded-full bg-white/70 px-3 py-1 text-sm dark:bg-white/10">{item}</span>)}
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
