import { Send } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import LessonPlayer from "../components/LessonPlayer.jsx";
import TestForm from "../components/TestForm.jsx";
import { api, assetUrl } from "../services/api.js";

const blockPrefix = "smartedu-blocks:";

export default function Lesson() {
  const { lessonId } = useParams();
  const [lesson, setLesson] = useState(null);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    api(`/lessons/${lessonId}`).then((data) => setLesson(data.lesson));
  }, [lessonId]);

  async function markComplete() {
    const data = await api(`/lessons/${lessonId}/complete`, { method: "POST" });
    setMessage(`Урок отмечен. Прогресс курса: ${data.progress.percent}%`);
  }

  async function submitComment(event) {
    event.preventDefault();
    if (!comment.trim()) return;
    const data = await api("/comments", {
      method: "POST",
      body: JSON.stringify({ lessonId, text: comment })
    });
    setLesson((value) => ({ ...value, comments: [data.comment, ...value.comments] }));
    setComment("");
  }

  if (!lesson) {
    return <div className="panel text-sm text-slate-500">Загружаем урок...</div>;
  }

  return (
    <div className="page-enter grid gap-6 xl:grid-cols-[1fr_360px]">
      <section className="space-y-5">
        <div>
          <p className="text-sm text-slate-500">{lesson.module.course.title} / {lesson.module.title}</p>
          <h1 className="text-2xl font-bold">{lesson.title}</h1>
        </div>
        {lesson.type === "VIDEO" && <LessonPlayer lesson={lesson} />}
        <div className="panel hover:shadow-md">
          <LessonContent lesson={lesson} />
          {lesson.type !== "TEST" && (
            <button className="btn-primary mt-4" onClick={markComplete}>Отметить урок пройденным</button>
          )}
          {message && <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-100">{message}</p>}
        </div>
        {lesson.type === "TEST" && <TestForm test={lesson.test} onSubmitted={(result) => setMessage(`Прогресс курса: ${result.progress.percent}%`)} />}
      </section>
      <aside className="space-y-4">
        <div className="panel">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold">Комментарии</h2>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-300">{lesson.comments.length}</span>
          </div>
          <form className="flex gap-2" onSubmit={submitComment}>
            <input className="input" placeholder="Написать комментарий" value={comment} onChange={(event) => setComment(event.target.value)} />
            <button className="btn-primary px-3" aria-label="Отправить"><Send size={18} /></button>
          </form>
          <div className="mt-4 max-h-[520px] space-y-3 overflow-y-auto pr-1">
            {lesson.comments.length === 0 && <p className="text-sm text-slate-500">Комментариев пока нет.</p>}
            {lesson.comments.map((item) => (
              <div key={item.id} className="rounded-lg bg-slate-50 p-3 text-sm transition hover:-translate-y-0.5 dark:bg-slate-800">
                <p className="font-semibold">{item.user.name}</p>
                <p className="text-slate-500 dark:text-slate-300">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

function LessonContent({ lesson }) {
  const blocks = parseLessonBlocks(lesson.content, lesson.imageUrl);

  if (lesson.type === "TEST") {
    return <p className="text-slate-600 dark:text-slate-300">{lesson.content}</p>;
  }

  return (
    <div className="space-y-4">
      {blocks.map((block, index) => {
        if (block.type === "link") {
          return (
            <a key={`${block.type}-${index}`} className="inline-flex font-semibold text-brand-600" href={block.value} target="_blank" rel="noreferrer">
              {block.label || block.value}
            </a>
          );
        }

        if (block.type === "image") {
          return (
            <img key={`${block.type}-${index}`} className="max-h-[420px] w-full rounded-lg object-cover" src={assetUrl(block.value)} alt={block.alt || "Иллюстрация к материалу"} />
          );
        }

        return <p key={`${block.type}-${index}`} className="whitespace-pre-line text-slate-600 dark:text-slate-300">{block.value}</p>;
      })}
      {blocks.length === 0 && <p className="text-slate-500">Материал пока пустой.</p>}
    </div>
  );
}

function parseLessonBlocks(content = "", imageUrl = "") {
  if (content?.startsWith(blockPrefix)) {
    try {
      const blocks = JSON.parse(content.slice(blockPrefix.length));
      return Array.isArray(blocks) ? blocks.filter((block) => block.value || block.label || block.alt) : [];
    } catch {
      return [];
    }
  }

  const blocks = content ? [{ type: "text", value: content }] : [];
  if (imageUrl) blocks.push({ type: "image", value: imageUrl, alt: "" });
  return blocks;
}
