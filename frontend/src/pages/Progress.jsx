import { Award, ClipboardCheck } from "lucide-react";
import { useEffect, useState } from "react";
import ProgressChart from "../components/ProgressChart.jsx";
import { api } from "../services/api.js";

export default function Progress() {
  const [data, setData] = useState({ progress: [], certificates: [], attempts: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/progress/me")
      .then((result) => setData(result))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="panel text-sm text-slate-500">Загружаем прогресс...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Мой прогресс</h1>
        <p className="text-sm text-slate-500">Статистика обучения, тестов и сертификатов.</p>
      </div>
      <ProgressChart data={data.progress} />
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="panel">
          <div className="mb-4 flex items-center gap-2">
            <ClipboardCheck className="text-brand-600" />
            <h2 className="text-lg font-bold">Курсы</h2>
          </div>
          <div className="space-y-3">
            {data.progress.map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                <div className="flex justify-between gap-4">
                  <p className="font-semibold">{item.course.title}</p>
                  <p className="text-sm font-semibold text-brand-600">{item.percent}%</p>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-full bg-brand-600" style={{ width: `${item.percent}%` }} />
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  Уроки: {item.completedLessons}/{item.totalLessons}. Средний балл: {item.averageScore}%
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="mb-4 flex items-center gap-2">
            <Award className="text-amber-500" />
            <h2 className="text-lg font-bold">Сертификаты</h2>
          </div>
          {data.certificates.length === 0 ? (
            <p className="text-sm text-slate-500">Сертификаты появятся после полного прохождения курса.</p>
          ) : (
            <div className="space-y-3">
              {data.certificates.map((item) => (
                <div key={item.id} className="rounded-lg bg-amber-50 p-4 text-amber-900 dark:bg-amber-950 dark:text-amber-100">
                  <p className="font-bold">{item.course.title}</p>
                  <p className="text-sm">Код: {item.code}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
