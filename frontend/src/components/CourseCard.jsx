import { ArrowRight, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { assetUrl } from "../services/api.js";

export default function CourseCard({ course }) {
  const lessonCount = course.modules?.reduce((sum, module) => sum + module.lessons.length, 0) || 0;
  const [imageFailed, setImageFailed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageUrl = assetUrl(course.imageUrl);

  useEffect(() => {
    setImageFailed(false);
    setImageLoaded(false);
  }, [imageUrl]);

  return (
    <article className="polished-card group">
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-brand-600 via-sky-500 to-cyan-400">
        {imageUrl && !imageFailed && (
          <img
            className={`absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105 ${imageLoaded ? "opacity-55" : "opacity-0"}`}
            src={imageUrl}
            alt=""
            aria-hidden="true"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageFailed(true)}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-transparent" />
        <div className="relative flex h-full w-full items-end p-5 text-white transition duration-500 group-hover:scale-105">
          <div>
            <span className="mb-3 inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur">{course.category}</span>
            <p className="text-2xl font-black leading-tight">{course.title}</p>
          </div>
        </div>
      </div>
      <div className="p-5">
        <div className="mb-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-brand-50 px-2 py-1 font-semibold text-brand-700 transition group-hover:bg-brand-100 dark:bg-brand-950 dark:text-brand-100 dark:group-hover:bg-brand-900 dark:group-hover:text-white">
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
        <Link className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-600 transition group-hover:gap-3" to={`/courses/${course.id}`}>
          Открыть курс <ArrowRight className="transition group-hover:translate-x-1" size={16} />
        </Link>
      </div>
    </article>
  );
}
