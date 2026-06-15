import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import CourseCard from "../components/CourseCard.jsx";
import { api } from "../services/api.js";

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Все");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/courses")
      .then((data) => setCourses(data.courses))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => ["Все", ...new Set(courses.map((course) => course.category))], [courses]);
  const filtered = courses.filter((course) => {
    const matchesSearch = `${course.title} ${course.description}`.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "Все" || course.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="page-enter space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-bold">Каталог курсов</h1>
          <p className="text-sm text-slate-500">Поиск и фильтрация по категориям.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 text-slate-400" size={18} />
            <input className="input pl-10" placeholder="Найти курс" value={search} onChange={(event) => setSearch(event.target.value)} />
          </label>
          <select className="input sm:w-44" value={category} onChange={(event) => setCategory(event.target.value)}>
            {categories.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
      </div>
      {loading ? (
        <div className="panel text-sm text-slate-500">Загружаем курсы...</div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((course, index) => (
            <div key={course.id} style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }} className="page-enter">
              <CourseCard course={course} />
            </div>
          ))}
          {filtered.length === 0 && <div className="panel text-sm text-slate-500 md:col-span-2 xl:col-span-3">Курсы не найдены.</div>}
        </div>
      )}
    </div>
  );
}
