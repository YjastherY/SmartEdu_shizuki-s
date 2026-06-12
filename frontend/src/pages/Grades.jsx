import { Award, BookOpen, CheckCircle2, Clock3 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api.js";

export default function Grades() {
  const [data, setData] = useState({ progress: [], attempts: [] });
  const [courseId, setCourseId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/progress/me")
      .then((result) => {
        setData(result);
        setCourseId(result.progress[0]?.courseId || result.attempts[0]?.test?.lesson?.module?.course?.id || "");
      })
      .finally(() => setLoading(false));
  }, []);

  const courses = useMemo(() => collectCourses(data), [data]);
  const selectedCourse = courses.find((course) => course.id === courseId) || courses[0];
  const rows = useMemo(() => buildRows(data.attempts, selectedCourse?.id), [data.attempts, selectedCourse?.id]);
  const finalGrade = rows.length ? Math.round(rows.reduce((sum, row) => sum + (row.countedScore ?? 0), 0) / rows.length) : 0;
  const pendingCount = rows.filter((row) => row.status === "PENDING_REVIEW").length;

  if (loading) return <div className="panel text-sm text-slate-500">Загружаем оценки...</div>;

  return (
    <div className="page-enter space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Оценки</h1>
          <p className="text-sm text-slate-500">Выберите курс и смотрите, из чего складывается итог.</p>
        </div>
        <select className="input lg:w-80" value={selectedCourse?.id || ""} onChange={(event) => setCourseId(event.target.value)}>
          {courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
        </select>
      </div>

      {!courses.length ? (
        <div className="panel text-sm text-slate-500">Оценки появятся после прохождения тестов.</div>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <SummaryCard icon={Award} label="Итоговая" value={`${finalGrade}%`} tone="brand" />
            <SummaryCard icon={CheckCircle2} label="Засчитано работ" value={rows.filter((row) => row.status === "GRADED").length} tone="emerald" />
            <SummaryCard icon={Clock3} label="На проверке" value={pendingCount} tone="amber" />
          </section>

          <section className="panel overflow-hidden">
            <div className="mb-4 flex items-center gap-2">
              <BookOpen className="text-brand-600" />
              <h2 className="text-lg font-bold">{selectedCourse?.title}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                  <tr>
                    <th className="px-4 py-3">Работа</th>
                    <th className="px-4 py-3">Урок</th>
                    <th className="px-4 py-3">Лучшая оценка</th>
                    <th className="px-4 py-3">Баллы</th>
                    <th className="px-4 py-3">Попытки</th>
                    <th className="px-4 py-3">Статус</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {rows.map((row) => (
                    <tr key={row.testId} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/80">
                      <td className="px-4 py-4">
                        <p className="font-semibold">{row.title}</p>
                        <p className="text-xs text-slate-500">Засчитывается лучшая завершённая попытка.</p>
                      </td>
                      <td className="px-4 py-4 text-slate-500 dark:text-slate-300">{row.lessonTitle}</td>
                      <td className="px-4 py-4">
                        <span className="text-lg font-bold">{row.countedScore === null ? "—" : `${row.countedScore}%`}</span>
                      </td>
                      <td className="px-4 py-4 text-slate-500 dark:text-slate-300">{row.points}</td>
                      <td className="px-4 py-4">{row.attemptCount}</td>
                      <td className="px-4 py-4"><StatusBadge status={row.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length === 0 && <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800">По этому курсу ещё нет оценок.</p>}
          </section>
        </>
      )}
    </div>
  );
}

function collectCourses(data) {
  const map = new Map();
  data.progress.forEach((item) => {
    if (item.course) map.set(item.course.id, item.course);
  });
  data.attempts.forEach((attempt) => {
    const course = attempt.test?.lesson?.module?.course;
    if (course) map.set(course.id, course);
  });
  return Array.from(map.values());
}

function buildRows(attempts, courseId) {
  const grouped = attempts
    .filter((attempt) => attempt.test?.lesson?.module?.course?.id === courseId)
    .reduce((map, attempt) => {
      const testId = attempt.testId;
      map.set(testId, [...(map.get(testId) || []), attempt]);
      return map;
    }, new Map());

  return Array.from(grouped.entries()).map(([testId, items]) => {
    const first = items[0];
    const graded = items.filter((attempt) => attempt.status === "GRADED");
    const best = graded.length ? graded.reduce((max, attempt) => (attempt.score > max.score ? attempt : max), graded[0]) : null;
    const pending = items.some((attempt) => attempt.status === "PENDING_REVIEW");
    const points = best
      ? `${best.earnedPoints || 0}/${best.totalPoints || 0}`
      : pending
        ? "ждёт ручной проверки"
        : "нет зачёта";

    return {
      testId,
      title: first.test?.title || "Тест",
      lessonTitle: first.test?.lesson?.title || "Урок",
      countedScore: best ? best.score : null,
      points,
      attemptCount: items.length,
      status: best ? "GRADED" : pending ? "PENDING_REVIEW" : "EMPTY"
    };
  });
}

function SummaryCard({ icon: Icon, label, value, tone }) {
  const tones = {
    brand: "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-100",
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-100",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-100"
  };

  return (
    <div className="panel flex items-center gap-4">
      <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${tones[tone]}`}>
        <Icon />
      </div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const labels = {
    GRADED: "Засчитано",
    PENDING_REVIEW: "На проверке",
    EMPTY: "Нет зачёта"
  };
  const classes = {
    GRADED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-100",
    PENDING_REVIEW: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-100",
    EMPTY: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
  };

  return <span className={`rounded-full px-2 py-1 text-xs font-semibold ${classes[status]}`}>{labels[status]}</span>;
}
