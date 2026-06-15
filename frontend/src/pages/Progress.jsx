import { Award, ClipboardCheck, ExternalLink, Search } from "lucide-react";
import { useEffect, useState } from "react";
import ProgressChart from "../components/ProgressChart.jsx";
import { api, assetUrl } from "../services/api.js";

export default function Progress() {
  const [data, setData] = useState({ progress: [], certificates: [], attempts: [] });
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    api("/progress/me")
      .then((result) => setData(result))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="panel text-sm text-slate-500">Загружаем прогресс...</div>;
  }

  const search = query.trim().toLowerCase();
  const progressItems = data.progress.filter((item) => `${item.course.title} ${item.course.category || ""}`.toLowerCase().includes(search));
  const certificateItems = data.certificates.filter((item) => `${item.course.title} ${item.code}`.toLowerCase().includes(search));

  return (
    <div className="page-enter space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Мой прогресс</h1>
          <p className="text-sm text-slate-500">Статистика обучения, тестов и сертификатов.</p>
        </div>
        <label className="relative lg:w-80">
          <Search className="pointer-events-none absolute left-3 top-2.5 text-slate-400" size={18} />
          <input className="input pl-10" placeholder="Найти курс или сертификат" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
      </div>
      <ProgressChart data={data.progress} />
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="panel hover:shadow-md">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="text-brand-600" />
              <h2 className="text-lg font-bold">Курсы</h2>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-300">{progressItems.length}</span>
          </div>
          <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
            {progressItems.map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-200 p-4 transition hover:-translate-y-0.5 hover:border-brand-300 dark:border-slate-700">
                <div className="flex justify-between gap-4">
                  <p className="font-semibold">{item.course.title}</p>
                  <p className="text-sm font-semibold text-brand-600">{item.percent}%</p>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-full rounded-full bg-brand-600 transition-all duration-700" style={{ width: `${item.percent}%` }} />
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  Уроки: {item.completedLessons}/{item.totalLessons}. Средний балл: {item.averageScore}%
                </p>
              </div>
            ))}
            {progressItems.length === 0 && <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800">По запросу ничего не найдено.</p>}
          </div>
        </div>
        <div className="panel hover:shadow-md">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Award className="text-amber-500" />
              <h2 className="text-lg font-bold">Сертификаты</h2>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-300">{certificateItems.length}</span>
          </div>
          {data.certificates.length === 0 ? (
            <p className="text-sm text-slate-500">Сертификаты появятся после полного прохождения курса.</p>
          ) : (
            <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
              {certificateItems.map((item) => (
                <div key={item.id} className="rounded-lg bg-amber-50 p-4 text-amber-900 dark:bg-amber-950 dark:text-amber-100">
                  <p className="font-bold">{item.course.title}</p>
                  <p className="text-sm">Код: {item.code}</p>
                  <a
                    className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-amber-800 transition hover:-translate-y-0.5 dark:bg-white/10 dark:text-amber-100"
                    href={assetUrl(`/api/certificates/${encodeURIComponent(item.code)}`)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Открыть сертификат <ExternalLink size={15} />
                  </a>
                </div>
              ))}
              {certificateItems.length === 0 && <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800">По запросу сертификатов нет.</p>}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
