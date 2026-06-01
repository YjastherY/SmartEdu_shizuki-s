import { ArrowRight, Clock } from "lucide-react";
import { Link } from "react-router-dom";

export default function CourseCard({ course }) {
  const lessonCount = course.modules?.reduce((sum, module) => sum + module.lessons.length, 0) || 0;

  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <img
        className="h-40 w-full object-cover"
        src={course.imageUrl || "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80"}
        alt={course.title}
      />
      <div className="p-5">
        <div className="mb-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-brand-50 px-2 py-1 font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-100">
            {course.category}
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {course.level}
          </span>
        </div>
        <h3 className="text-lg font-bold">{course.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-slate-500 dark:text-slate-300">{course.description}</p>
        <div className="mt-4 flex items-center justify-between text-sm text-slate-500 dark:text-slate-300">
          <span className="flex items-center gap-1">
            <Clock size={16} />
            {course.duration}
          </span>
          <span>{lessonCount} урока</span>
        </div>
        <Link className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-600" to={`/courses/${course.id}`}>
          Открыть курс <ArrowRight size={16} />
        </Link>
      </div>
    </article>
  );
}
