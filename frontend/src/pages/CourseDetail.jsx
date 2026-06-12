import { CheckCircle2, PlayCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, assetUrl } from "../services/api.js";

export default function CourseDetail() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [error, setError] = useState("");
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    api(`/courses/${courseId}`).then((data) => setCourse(data.course)).catch((err) => setError(err.message));
  }, [courseId]);

  if (error) {
    return <div className="panel text-red-600">{error}</div>;
  }

  if (!course) {
    return <div className="panel text-sm text-slate-500">Загружаем курс...</div>;
  }

  return (
    <div className="page-enter space-y-6">
      <section className="polished-card group">
        <div className="h-64 overflow-hidden">
          {course.imageUrl && !imageFailed ? (
            <img
              className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
              src={assetUrl(course.imageUrl)}
              alt=""
              aria-hidden="true"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="flex h-full w-full flex-col justify-between bg-gradient-to-br from-brand-600 via-sky-500 to-cyan-400 p-6 text-white transition duration-700 group-hover:scale-105">
              <span className="w-fit rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur">{course.category}</span>
              <div>
                <p className="mt-2 text-4xl font-black leading-tight">{course.title}</p>
              </div>
            </div>
          )}
        </div>
        <div className="p-6">
          <div className="mb-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-brand-50 px-2 py-1 font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-100">{course.category}</span>
            <span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">{course.level}</span>
            <span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">{course.duration}</span>
          </div>
          <h1 className="text-3xl font-bold">{course.title}</h1>
          <p className="mt-3 max-w-3xl text-slate-500 dark:text-slate-300">{course.description}</p>
        </div>
      </section>
      <section className="space-y-4">
        <h2 className="text-xl font-bold">Модули и уроки</h2>
        {course.modules.map((module) => (
          <div key={module.id} className="panel hover:shadow-md">
            <h3 className="font-bold">{module.order}. {module.title}</h3>
            <div className="mt-4 space-y-2">
              {module.lessons.map((lesson) => (
                <Link
                  key={lesson.id}
                  className="group flex items-center justify-between rounded-lg border border-slate-200 p-3 transition duration-200 hover:-translate-y-0.5 hover:border-brand-500 hover:bg-brand-50/40 dark:border-slate-700 dark:hover:bg-brand-950/20"
                  to={`/lessons/${lesson.id}`}
                >
                  <span className="flex items-center gap-3">
                    {lesson.type === "TEST" ? <CheckCircle2 className="text-emerald-500 transition group-hover:scale-110" /> : <PlayCircle className="text-brand-600 transition group-hover:scale-110" />}
                    <span>
                      <span className="block font-medium">{lesson.title}</span>
                      <span className="text-sm text-slate-500">{lesson.duration}</span>
                    </span>
                  </span>
                  <span className="text-sm text-brand-600 transition group-hover:translate-x-1">Открыть</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
