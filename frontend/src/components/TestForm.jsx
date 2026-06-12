import { Award, Clock, Medal, RotateCcw, Timer } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../services/api.js";

export default function TestForm({ test, onSubmitted }) {
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState((test?.timeLimitMinutes || 0) * 60);
  const [endAt, setEndAt] = useState(null);
  const submitLock = useRef(false);

  if (!test) {
    return null;
  }

  const attempts = result?.attempts || test.attempts || [];
  const attemptLimit = test.attemptLimit || 0;
  const attemptsLeft = attemptLimit ? Math.max(attemptLimit - attempts.length, 0) : null;
  const bestScore = result ? result.bestScore : test.bestScore ?? getBestScore(attempts);
  const deadlineDate = test.deadline ? new Date(test.deadline) : null;
  const deadlinePassed = deadlineDate ? Date.now() > deadlineDate.getTime() : false;
  const canStart = !deadlinePassed && (attemptsLeft === null || attemptsLeft > 0);
  const totalPoints = test.questions.reduce((sum, question) => sum + getQuestionPoints(question), 0);
  const answeredAll = test.questions.every((question) => hasAnswer(question, answers[question.id]));
  const sessionKey = useMemo(() => (test?.id ? `smartedu-test-session:${test.id}` : ""), [test?.id]);

  useEffect(() => {
    if (!test?.id) return;
    const session = readTestSession(sessionKey);
    submitLock.current = false;

    if (session?.answers) setAnswers(session.answers);

    if (test.timeLimitMinutes && session?.endAt) {
      const nextSeconds = Math.max(Math.ceil((session.endAt - Date.now()) / 1000), 0);
      setEndAt(session.endAt);
      setSecondsLeft(nextSeconds);
      setStarted(true);
      if (nextSeconds === 0) setError("Время вышло. Отправляем сохранённые ответы.");
      return;
    }

    setEndAt(null);
    setSecondsLeft((test.timeLimitMinutes || 0) * 60);
  }, [test?.id, sessionKey, test?.timeLimitMinutes]);

  useEffect(() => {
    if (!started || !test.timeLimitMinutes || !endAt) return undefined;

    const timer = window.setInterval(() => {
      setSecondsLeft(Math.max(Math.ceil((endAt - Date.now()) / 1000), 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [started, test.timeLimitMinutes, endAt]);

  useEffect(() => {
    if (!started || !sessionKey) return;
    const session = readTestSession(sessionKey) || {};
    writeTestSession(sessionKey, {
      ...session,
      answers,
      endAt: endAt || session.endAt || null
    });
  }, [answers, started, endAt, sessionKey]);

  useEffect(() => {
    if (started && test.timeLimitMinutes && secondsLeft === 0 && !submitLock.current) {
      setError("Время вышло. Отправляем сохранённые ответы.");
      submitTest(answers);
    }
  }, [started, secondsLeft]);

  async function handleSubmit(event) {
    event.preventDefault();
    await submitTest(answers);
  }

  async function submitTest(nextAnswers) {
    if (submitLock.current) return;
    submitLock.current = true;
    setLoading(true);
    setError("");
    try {
      const data = await api(`/tests/${test.id}/submit`, {
        method: "POST",
        body: JSON.stringify({ answers: nextAnswers || {} })
      });
      setResult(data);
      onSubmitted?.(data);
      setStarted(false);
      setAnswers({});
      setSecondsLeft((test.timeLimitMinutes || 0) * 60);
      setEndAt(null);
      if (sessionKey) localStorage.removeItem(sessionKey);
    } catch (err) {
      setError(err.message);
      submitLock.current = false;
    } finally {
      setLoading(false);
    }
  }

  function startTest() {
    const existing = readTestSession(sessionKey);
    const existingEnd = existing?.endAt || null;

    if (test.timeLimitMinutes && existingEnd) {
      const remaining = Math.max(Math.ceil((existingEnd - Date.now()) / 1000), 0);
      setAnswers(existing.answers || {});
      setEndAt(existingEnd);
      setSecondsLeft(remaining);
      setStarted(true);
      setError(remaining === 0 ? "Время вышло. Отправляем сохранённые ответы." : "");
      return;
    }

    const nextEndAt = test.timeLimitMinutes ? Date.now() + test.timeLimitMinutes * 60 * 1000 : null;
    setStarted(true);
    setError("");
    setResult(null);
    setAnswers({});
    setSecondsLeft((test.timeLimitMinutes || 0) * 60);
    setEndAt(nextEndAt);
    if (sessionKey) writeTestSession(sessionKey, { answers: {}, endAt: nextEndAt });
  }

  const timeLabel = useMemo(() => {
    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  }, [secondsLeft]);

  if (!started) {
    return (
      <section className="panel space-y-5">
        <div>
          <p className="text-sm font-semibold text-brand-600">Превью теста</p>
          <h2 className="text-xl font-bold">{test.title}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{test.description || "Перед началом проверьте условия прохождения."}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Info icon={RotateCcw} label="Попытки" value={attemptLimit ? `${attempts.length}/${attemptLimit}` : "Без лимита"} />
          <Info icon={Timer} label="Время" value={test.timeLimitMinutes ? `${test.timeLimitMinutes} мин` : "Без лимита"} />
          <Info icon={Clock} label="Дедлайн" value={deadlineDate ? deadlineDate.toLocaleDateString("ru-RU") : "Без дедлайна"} />
          <Info icon={Award} label="Баллы" value={`${totalPoints} баллов`} />
          <Info icon={Medal} label="Лучший балл" value={bestScore === null ? "Пока нет" : `${bestScore}%`} />
        </div>
        {result && (
          <p className={`rounded-lg p-3 text-sm font-semibold ${result.pendingReview ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-100" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-100"}`}>
            {result.pendingReview
              ? `Автопроверка: ${result.earnedPoints} из ${result.totalPoints}. Итог появится после проверки преподавателем.`
              : `Последняя попытка: ${result.score}%. Лучший результат: ${result.bestScore}%.`}
          </p>
        )}
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-200">{error}</p>}
        {!canStart && (
          <p className="rounded-lg bg-amber-50 p-3 text-sm font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-100">
            {deadlinePassed ? "Срок сдачи теста истёк." : "Доступные попытки закончились."}
          </p>
        )}
        <button className="btn-primary" disabled={!canStart} onClick={startTest}>
          {bestScore === null ? "Начать тест" : "Пройти ещё раз"}
        </button>
      </section>
    );
  }

  return (
    <form className="panel space-y-5" onSubmit={handleSubmit}>
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h2 className="text-xl font-bold">{test.title}</h2>
          <p className="text-sm text-slate-500">Заполните все задания. Баллы зависят от веса каждого вопроса.</p>
        </div>
        {test.timeLimitMinutes && (
          <div className="rounded-lg bg-brand-50 px-3 py-2 text-sm font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-100">
            {timeLabel}
          </div>
        )}
      </div>
      {test.questions.map((question, index) => (
        <fieldset key={question.id} className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
          <legend className="px-1">
            <span className="text-sm font-semibold">{index + 1}. {question.text}</span>
            <span className="ml-2 rounded-full bg-brand-50 px-2 py-1 text-xs font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-100">
              {getQuestionPoints(question)} баллов
            </span>
          </legend>
          <QuestionAnswer question={question} value={answers[question.id]} setAnswers={setAnswers} />
        </fieldset>
      ))}
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-200">{error}</p>}
      <button className="btn-primary" disabled={loading || (!answeredAll && secondsLeft > 0)}>
        {loading ? "Проверяем..." : "Отправить тест"}
      </button>
    </form>
  );
}

function QuestionAnswer({ question, value, setAnswers }) {
  const type = question.type || "MULTIPLE_CHOICE";

  if (type === "MATCHING") {
    const selected = value || {};
    const pairs = question.pairs?.length ? question.pairs : (question.answers || []).map((answer) => {
      const [left, right] = answer.text.split("→").map((part) => part.trim());
      return { left, right };
    });
    const rightOptions = pairs.map((pair) => pair.right);

    return (
      <div className="mt-3 space-y-2">
        {pairs.map((pair, pairIndex) => (
          <label key={pairIndex} className="grid gap-2 rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800 sm:grid-cols-[1fr_1fr] sm:items-center">
            <span className="font-medium">{pair.left || `Пункт ${pairIndex + 1}`}</span>
            <select
              className="input"
              value={selected[pairIndex] || ""}
              onChange={(event) => setAnswers((answers) => ({ ...answers, [question.id]: { ...selected, [pairIndex]: event.target.value } }))}
            >
              <option value="">Выберите соответствие</option>
              {rightOptions.map((option, optionIndex) => <option key={optionIndex} value={option}>{option || `Вариант ${optionIndex + 1}`}</option>)}
            </select>
          </label>
        ))}
      </div>
    );
  }

  if (type === "MULTIPLE_CHOICE" && question.answers?.length) {
    const selected = Array.isArray(value) ? value : [];
    return (
      <div className="mt-3 space-y-2">
        {question.answers.map((answer) => (
          <label key={answer.id} className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-slate-50 dark:hover:bg-slate-800">
            <input
              type="checkbox"
              checked={selected.includes(answer.id)}
              onChange={() => {
                const next = selected.includes(answer.id)
                  ? selected.filter((item) => item !== answer.id)
                  : [...selected, answer.id];
                setAnswers((answers) => ({ ...answers, [question.id]: next }));
              }}
            />
            <span className="text-sm">{answer.text}</span>
          </label>
        ))}
      </div>
    );
  }

  if (question.answers?.length) {
    return (
      <div className="mt-3 space-y-2">
        {question.answers.map((answer) => (
          <label key={answer.id} className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-slate-50 dark:hover:bg-slate-800">
            <input
              type="radio"
              name={question.id}
              value={answer.id}
              checked={value === answer.id}
              onChange={() => setAnswers((answers) => ({ ...answers, [question.id]: answer.id }))}
            />
            <span className="text-sm">{answer.text}</span>
          </label>
        ))}
      </div>
    );
  }

  if (type === "SINGLE_CHOICE") {
    return (
      <div className="mt-3 space-y-2">
        {question.options.map((option, optionIndex) => (
          <label key={optionIndex} className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-slate-50 dark:hover:bg-slate-800">
            <input
              type="radio"
              name={question.id}
              checked={value === optionIndex}
              onChange={() => setAnswers((answers) => ({ ...answers, [question.id]: optionIndex }))}
            />
            <span className="text-sm">{option || `Вариант ${optionIndex + 1}`}</span>
          </label>
        ))}
      </div>
    );
  }

  if (type === "MULTIPLE_CHOICE") {
    const selected = Array.isArray(value) ? value : [];
    return (
      <div className="mt-3 space-y-2">
        {question.options.map((option, optionIndex) => (
          <label key={optionIndex} className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-slate-50 dark:hover:bg-slate-800">
            <input
              type="checkbox"
              checked={selected.includes(optionIndex)}
              onChange={() => {
                const next = selected.includes(optionIndex)
                  ? selected.filter((item) => item !== optionIndex)
                  : [...selected, optionIndex];
                setAnswers((answers) => ({ ...answers, [question.id]: next }));
              }}
            />
            <span className="text-sm">{option || `Вариант ${optionIndex + 1}`}</span>
          </label>
        ))}
      </div>
    );
  }

  return (
    <textarea
      className="input mt-3 min-h-28"
      placeholder="Напишите развернутый ответ"
      value={value || ""}
      onChange={(event) => setAnswers((answers) => ({ ...answers, [question.id]: event.target.value }))}
    />
  );
}

function getQuestionPoints(question) {
  return Number(question.maxScore || question.points || 1);
}

function getBestScore(attempts) {
  const graded = attempts.filter((attempt) => attempt.status !== "PENDING_REVIEW");
  return graded.length ? Math.max(...graded.map((attempt) => attempt.score)) : null;
}

function readTestSession(key) {
  if (!key) return null;
  try {
    const session = localStorage.getItem(key);
    return session ? JSON.parse(session) : null;
  } catch {
    return null;
  }
}

function writeTestSession(key, session) {
  if (!key) return;
  localStorage.setItem(key, JSON.stringify(session));
}

function hasAnswer(question, value) {
  const type = question.type || "MULTIPLE_CHOICE";
  if (type === "MULTIPLE_CHOICE" && Array.isArray(value)) return value.length > 0;
  if (type === "SINGLE_CHOICE") return value !== undefined && value !== null && value !== "";
  if (type === "MATCHING") {
    const expected = question.pairs?.length || question.answers?.length || 0;
    return value && Object.values(value).filter(Boolean).length === expected;
  }
  if (type === "MANUAL") return typeof value === "string" && value.trim().length > 0;
  if (question.answers?.length) return Boolean(value);
  if (Array.isArray(value)) return value.length > 0;
  return Boolean(value);
}

function Info({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-2 flex items-center gap-2 text-slate-500 dark:text-slate-300">
        <Icon size={16} />
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="font-bold">{value}</p>
    </div>
  );
}
