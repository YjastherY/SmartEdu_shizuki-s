import { BookOpen, CheckCircle2, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import CourseCard from "../components/CourseCard.jsx";
import ProgressChart from "../components/ProgressChart.jsx";
import { api } from "../services/api.js";

export default function Dashboard() {
  const [courses, setCourses] = useState([]);
  const [progress, setProgress] = useState([]);

  useEffect(() => {
    Promise.all([api("/courses"), api("/progress/me")]).then(([courseData, progressData]) => {
      setCourses(courseData.courses);
      setProgress(progressData.progress);
    });
  }, []);

  const completed = progress.reduce((sum, item) => sum + item.completedLessons, 0);
  const average = progress.length ? Math.round(progress.reduce((sum, item) => sum + item.averageScore, 0) / progress.length) : 0;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <Stat icon={BookOpen} label="Курсы" value={courses.length} />
        <Stat icon={CheckCircle2} label="Завершенные уроки" value={completed} />
        <Stat icon={Trophy} label="Средний балл" value={`${average}%`} />
      </section>
      <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-xl font-bold">Рекомендуемые курсы</h2>
              <p className="text-sm text-slate-500">Начните с базовых модулей и двигайтесь по плану.</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {courses.slice(0, 2).map((course) => <CourseCard key={course.id} course={course} />)}
          </div>
        </div>
        <div>
          <h2 className="mb-4 text-xl font-bold">Статистика</h2>
          <ProgressChart data={progress} />
        </div>
      </section>
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="panel flex items-center gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-100">
        <Icon />
      </div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}
