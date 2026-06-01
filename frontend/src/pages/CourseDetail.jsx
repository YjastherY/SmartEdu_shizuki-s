import { CheckCircle2, PlayCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api.js";

export default function CourseDetail() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [error, setError] = useState("");

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
    <div className="space-y-6">
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <img className="h-64 w-full object-cover" src={course.imageUrl} alt={course.title} />
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
          <div key={module.id} className="panel">
            <h3 className="font-bold">{module.order}. {module.title}</h3>
            <div className="mt-4 space-y-2">
              {module.lessons.map((lesson) => (
                <Link
                  key={lesson.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 p-3 transition hover:border-brand-500 dark:border-slate-700"
                  to={`/lessons/${lesson.id}`}
                >
                  <span className="flex items-center gap-3">
                    {lesson.type === "TEST" ? <CheckCircle2 className="text-emerald-500" /> : <PlayCircle className="text-brand-600" />}
                    <span>
                      <span className="block font-medium">{lesson.title}</span>
                      <span className="text-sm text-slate-500">{lesson.duration}</span>
                    </span>
                  </span>
                  <span className="text-sm text-brand-600">Открыть</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
