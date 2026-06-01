import { Clock, Medal, RotateCcw, Timer } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api.js";

export default function TestForm({ test, onSubmitted }) {
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState((test?.timeLimitMinutes || 0) * 60);

  if (!test) {
    return null;
  }

  const attempts = result?.attempts || test.attempts || [];
  const attemptLimit = test.attemptLimit || 0;
  const attemptsLeft = attemptLimit ? Math.max(attemptLimit - attempts.length, 0) : null;
  const bestScore = result?.bestScore ?? test.bestScore ?? (attempts.length ? Math.max(...attempts.map((attempt) => attempt.score)) : null);
  const deadlineDate = test.deadline ? new Date(test.deadline) : null;
  const deadlinePassed = deadlineDate ? Date.now() > deadlineDate.getTime() : false;
  const canStart = !deadlinePassed && (attemptsLeft === null || attemptsLeft > 0);
  const answeredAll = test.questions.every((question) => answers[question.id]);

  useEffect(() => {
    if (!started || !test.timeLimitMinutes) return;

    const timer = window.setInterval(() => {
      setSecondsLeft((value) => Math.max(value - 1, 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [started, test.timeLimitMinutes]);

  useEffect(() => {
    if (started && secondsLeft === 0) {
      setError("Время вышло. Попытку нужно начать заново.");
      setStarted(false);
      setAnswers({});
    }
  }, [started, secondsLeft]);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await api(`/tests/${test.id}/submit`, {
        method: "POST",
        body: JSON.stringify({ answers })
      });
      setResult(data);
      onSubmitted?.(data);
      setStarted(false);
      setAnswers({});
      setSecondsLeft((test.timeLimitMinutes || 0) * 60);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function startTest() {
    setStarted(true);
    setError("");
    setResult(null);
    setAnswers({});
    setSecondsLeft((test.timeLimitMinutes || 0) * 60);
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
          <Info icon={Medal} label="Лучший балл" value={bestScore === null ? "Пока нет" : `${bestScore}%`} />
        </div>
        {result && (
          <p className="rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-100">
            Последняя попытка: {result.score}%. Лучший результат: {result.bestScore}%.
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
          <p className="text-sm text-slate-500">Выберите один ответ для каждого вопроса.</p>
        </div>
        {test.timeLimitMinutes && (
          <div className="rounded-lg bg-brand-50 px-3 py-2 text-sm font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-100">
            {timeLabel}
          </div>
        )}
      </div>
      {test.questions.map((question, index) => (
        <fieldset key={question.id} className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
          <legend className="px-1 text-sm font-semibold">
            {index + 1}. {question.text}
          </legend>
          <div className="mt-3 space-y-2">
            {question.answers.map((answer) => (
              <label key={answer.id} className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-slate-50 dark:hover:bg-slate-800">
                <input
                  type="radio"
                  name={question.id}
                  value={answer.id}
                  checked={answers[question.id] === answer.id}
                  onChange={() => setAnswers((value) => ({ ...value, [question.id]: answer.id }))}
                />
                <span className="text-sm">{answer.text}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-200">{error}</p>}
      <button className="btn-primary" disabled={loading || !answeredAll}>
        {loading ? "Проверяем..." : "Отправить тест"}
      </button>
    </form>
  );
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
