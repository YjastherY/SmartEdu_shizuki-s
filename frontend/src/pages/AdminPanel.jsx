import { ImagePlus, ShieldCheck, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../services/api.js";

export default function AdminPanel() {
  const [data, setData] = useState(null);
  const [courseDraft, setCourseDraft] = useState({
    title: "",
    description: "",
    category: "Frontend",
    level: "Beginner",
    duration: "6 часов",
    imageUrl: "",
    moduleTitle: "Первый модуль"
  });
  const [courseMessage, setCourseMessage] = useState("");

  useEffect(() => {
    api("/admin/overview").then(setData);
  }, []);

  if (!data) return <div className="panel text-sm text-slate-500">Загружаем админ-панель...</div>;

  async function setRole(userId, role) {
    const result = await api(`/admin/users/${userId}/role`, { method: "PATCH", body: JSON.stringify({ role }) });
    setData((value) => ({ ...value, users: result.users }));
  }

  async function setTeacher(groupId, teacherId) {
    await api(`/admin/groups/${groupId}`, { method: "PATCH", body: JSON.stringify({ teacherId }) });
    setData(await api("/admin/overview"));
  }

  async function toggleStudent(group, studentId) {
    const exists = group.studentIds.includes(studentId);
    const studentIds = exists ? group.studentIds.filter((id) => id !== studentId) : [...group.studentIds, studentId];
    await api(`/admin/groups/${group.id}`, { method: "PATCH", body: JSON.stringify({ studentIds }) });
    setData(await api("/admin/overview"));
  }

  async function createCourse(event) {
    event.preventDefault();
    setCourseMessage("");

    try {
      const result = await api("/courses", {
        method: "POST",
        body: JSON.stringify({
          title: courseDraft.title,
          description: courseDraft.description,
          category: courseDraft.category,
          level: courseDraft.level,
          duration: courseDraft.duration,
          imageUrl: courseDraft.imageUrl
        })
      });

      await api(`/courses/${result.course.id}/modules`, {
        method: "POST",
        body: JSON.stringify({ title: courseDraft.moduleTitle || "Первый модуль" })
      });

      setCourseDraft({
        title: "",
        description: "",
        category: "Frontend",
        level: "Beginner",
        duration: "6 часов",
        imageUrl: "",
        moduleTitle: "Первый модуль"
      });
      setData(await api("/admin/overview"));
      setCourseMessage("Курс создан");
    } catch (error) {
      setCourseMessage(error.message || "Не удалось создать курс");
    }
  }

  const teachers = data.users.filter((user) => user.role === "TEACHER" || user.role === "ADMIN");
  const students = data.users.filter((user) => user.role === "STUDENT");

  return (
    <div className="page-enter space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Панель администратора</h1>
        <p className="text-sm text-slate-500">Роли аккаунтов, группы и назначение преподавателей.</p>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="panel flex items-center gap-4">
          <ShieldCheck className="text-brand-600" />
          <div>
            <p className="text-sm text-slate-500">Аккаунты</p>
            <p className="text-2xl font-bold">{data.users.length}</p>
          </div>
        </div>
        <div className="panel flex items-center gap-4">
          <UsersRound className="text-brand-600" />
          <div>
            <p className="text-sm text-slate-500">Группы</p>
            <p className="text-2xl font-bold">{data.groups.length}</p>
          </div>
        </div>
      </section>

      <section className="panel space-y-4">
        <div>
          <p className="text-sm font-semibold text-brand-600">Курсы</p>
          <h2 className="text-xl font-bold">Создать курс</h2>
          <p className="text-sm text-slate-500">Если баннер не указан или ссылка не загрузится, карточка покажет фирменную заглушку.</p>
        </div>
        <form className="grid gap-3 lg:grid-cols-2" onSubmit={createCourse}>
          <label className="text-sm font-medium">
            Название
            <input className="input mt-1" value={courseDraft.title} onChange={(event) => setCourseDraft({ ...courseDraft, title: event.target.value })} required />
          </label>
          <label className="text-sm font-medium">
            Категория
            <input className="input mt-1" value={courseDraft.category} onChange={(event) => setCourseDraft({ ...courseDraft, category: event.target.value })} required />
          </label>
          <label className="text-sm font-medium lg:col-span-2">
            Описание
            <textarea className="input mt-1 min-h-24" value={courseDraft.description} onChange={(event) => setCourseDraft({ ...courseDraft, description: event.target.value })} required />
          </label>
          <label className="text-sm font-medium">
            Уровень
            <input className="input mt-1" value={courseDraft.level} onChange={(event) => setCourseDraft({ ...courseDraft, level: event.target.value })} required />
          </label>
          <label className="text-sm font-medium">
            Длительность
            <input className="input mt-1" value={courseDraft.duration} onChange={(event) => setCourseDraft({ ...courseDraft, duration: event.target.value })} required />
          </label>
          <label className="text-sm font-medium">
            Первый модуль
            <input className="input mt-1" value={courseDraft.moduleTitle} onChange={(event) => setCourseDraft({ ...courseDraft, moduleTitle: event.target.value })} />
          </label>
          <label className="text-sm font-medium">
            Баннер курса
            <div className="mt-1 flex gap-2">
              <input className="input" type="url" placeholder="https://..." value={courseDraft.imageUrl} onChange={(event) => setCourseDraft({ ...courseDraft, imageUrl: event.target.value })} />
              <span className="hidden items-center rounded-lg bg-slate-100 px-3 text-slate-500 dark:bg-slate-800 sm:flex"><ImagePlus size={18} /></span>
            </div>
          </label>
          <div className="flex items-end gap-3 lg:col-span-2">
            <button className="btn-primary">Создать курс</button>
            {courseMessage && <p className={`text-sm font-semibold ${courseMessage === "Курс создан" ? "text-emerald-600" : "text-red-600"}`}>{courseMessage}</p>}
          </div>
        </form>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="panel">
          <h2 className="mb-4 text-xl font-bold">Пользователи</h2>
          <div className="space-y-3">
            {data.users.map((user) => (
              <div key={user.id} className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-sm text-slate-500">{user.email}</p>
                  </div>
                  <select className="input sm:w-40" value={user.role} onChange={(event) => setRole(user.id, event.target.value)}>
                    <option value="STUDENT">Студент</option>
                    <option value="TEACHER">Преподаватель</option>
                    <option value="ADMIN">Администратор</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <h2 className="mb-4 text-xl font-bold">Группы</h2>
          <div className="space-y-4">
            {data.groups.map((group) => (
              <div key={group.id} className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-bold">{group.title}</p>
                    <p className="text-sm text-slate-500">{group.students.length} студентов</p>
                  </div>
                  <select className="input sm:w-56" value={group.teacherId} onChange={(event) => setTeacher(group.id, event.target.value)}>
                    {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}
                  </select>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {students.map((student) => (
                    <label key={student.id} className="flex items-center gap-2 rounded-lg bg-white p-2 text-sm dark:bg-slate-900">
                      <input type="checkbox" checked={group.studentIds.includes(student.id)} onChange={() => toggleStudent(group, student.id)} />
                      {student.name}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
