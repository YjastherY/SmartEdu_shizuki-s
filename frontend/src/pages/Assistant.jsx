import { Bot, BookOpen, SendHorizonal, Sparkles } from "lucide-react";
import { useState } from "react";
import { api } from "../services/api.js";

const starters = [
  "Что повторить перед тестом?",
  "Объясни компоненты React",
  "Как поднять прогресс?",
  "Чем REST API отличается от обычной страницы?"
];

export default function Assistant() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Спроси по курсу, тесту, дедлайну или прогрессу. Я подскажу по материалам SmartEdu.",
      sources: []
    }
  ]);

  async function ask(event, value = question) {
    event?.preventDefault();
    const text = value.trim();
    if (!text || loading) return;

    setQuestion("");
    setLoading(true);
    setMessages((items) => [...items, { role: "user", text }]);

    try {
      const data = await api("/assistant/ask", {
        method: "POST",
        body: JSON.stringify({ question: text })
      });
      setMessages((items) => [
        ...items,
        {
          role: "assistant",
          text: data.answer,
          sources: data.sources || [],
          suggestions: data.suggestions || []
        }
      ]);
    } catch (error) {
      setMessages((items) => [
        ...items,
        {
          role: "assistant",
          text: error.message || "Не удалось получить ответ. Попробуйте ещё раз.",
          sources: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  const lastSuggestions = messages.at(-1)?.suggestions?.length ? messages.at(-1).suggestions : starters;

  return (
    <div className="page-enter grid min-h-[calc(100vh-9rem)] gap-6 xl:grid-cols-[1fr_320px]">
      <section className="panel flex min-h-[650px] flex-col overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 p-5 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="soft-ring flex h-11 w-11 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Bot size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Учебный помощник</h1>
              <p className="text-sm text-slate-500 dark:text-slate-300">Ответы по курсам, тестам и прогрессу.</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-100">
            <Sparkles size={16} />
            MVP
          </span>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.map((message, index) => (
            <Message key={`${message.role}-${index}`} message={message} onPick={(text) => ask(null, text)} />
          ))}
          {loading && (
            <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-brand-600" />
              Помощник думает...
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 p-4 dark:border-slate-800">
          <div className="mb-3 flex flex-wrap gap-2">
            {lastSuggestions.slice(0, 4).map((item) => (
              <button
                key={item}
                className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-brand-50 hover:text-brand-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-brand-950"
                type="button"
                onClick={() => ask(null, item)}
              >
                {item}
              </button>
            ))}
          </div>
          <form className="grid gap-3 sm:grid-cols-[1fr_auto]" onSubmit={ask}>
            <input
              className="input"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Например: что повторить по React?"
              maxLength={1000}
            />
            <button className="btn-primary flex items-center justify-center gap-2" disabled={!question.trim() || loading}>
              <SendHorizonal size={18} />
              Спросить
            </button>
          </form>
        </div>
      </section>

      <aside className="panel h-fit space-y-4">
        <div className="flex items-center gap-3">
          <BookOpen className="text-brand-600" />
          <h2 className="text-lg font-bold">Что умеет</h2>
        </div>
        <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
          <p>Подсказывает по темам из курсов и связывает ответ с уроками.</p>
          <p>Учитывает прогресс и последние оценки студента.</p>
          <p>Помогает подготовиться к тестам без перехода между страницами.</p>
        </div>
      </aside>
    </div>
  );
}

function Message({ message, onPick }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[86%] rounded-lg px-4 py-3 shadow-sm ${isUser ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100"}`}>
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.text}</p>
        {message.sources?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.sources.map((source) => (
              <span key={`${source.course}-${source.lesson}`} className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-200">
                {source.course}: {source.lesson}
              </span>
            ))}
          </div>
        )}
        {!isUser && message.suggestions?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.suggestions.slice(0, 2).map((item) => (
              <button
                key={item}
                type="button"
                className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-brand-700 transition hover:bg-brand-50 dark:bg-slate-900 dark:text-brand-100"
                onClick={() => onPick(item)}
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
