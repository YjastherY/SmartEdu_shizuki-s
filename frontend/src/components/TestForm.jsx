import { useState } from "react";
import { api } from "../services/api.js";

export default function TestForm({ test, onSubmitted }) {
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!test) {
    return null;
  }

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
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="panel space-y-5" onSubmit={handleSubmit}>
      <div>
        <h2 className="text-xl font-bold">{test.title}</h2>
        <p className="text-sm text-slate-500">Выберите один ответ для каждого вопроса.</p>
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
      {result && (
        <p className="rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-100">
          Результат: {result.score}% ({result.correct}/{result.total})
        </p>
      )}
      <button className="btn-primary" disabled={loading}>
        {loading ? "Проверяем..." : "Отправить тест"}
      </button>
    </form>
  );
}
