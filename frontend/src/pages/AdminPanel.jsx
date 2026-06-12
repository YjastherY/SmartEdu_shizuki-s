import { BookOpen, Plus, ShieldCheck, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";

export default function AdminPanel() {
  const [data, setData] = useState(null);
  const [groupDraft, setGroupDraft] = useState({ title: "", teacherId: "", studentIds: [], courseIds: [] });
  const [groupMessage, setGroupMessage] = useState("");

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

  async function createGroup(event) {
    event.preventDefault();
    setGroupMessage("");

    try {
      await api("/admin/groups", {
        method: "POST",
        body: JSON.stringify({
          ...groupDraft,
          teacherId: groupDraft.teacherId || null
        })
      });
      setGroupDraft({ title: "", teacherId: "", studentIds: [], courseIds: [] });
      setData(await api("/admin/overview"));
      setGroupMessage("Группа создана");
    } catch (error) {
      setGroupMessage(error.message || "Не удалось создать группу");
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
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-brand-600">Курсы</p>
            <h2 className="text-xl font-bold">Менеджмент курсов</h2>
            <p className="text-sm text-slate-500">Создание и редактирование открываются в отдельном конструкторе.</p>
          </div>
          <Link className="btn-primary flex w-fit items-center gap-2" to="/courses/builder/new">
            <Plus size={18} /> Создать новый
          </Link>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {data.courses.map((course) => (
            <div key={course.id} className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-bold">{course.title}</p>
                  <p className="text-sm text-slate-500">{course.category} • {course.modules?.length || 0} модулей</p>
                </div>
                <Link className="btn-secondary flex items-center gap-2" to={`/courses/builder/${course.id}`}>
                  <BookOpen size={16} /> Редактировать
                </Link>
              </div>
            </div>
          ))}
        </div>
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
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-xl font-bold">Группы</h2>
              <p className="text-sm text-slate-500">Создание групп, назначение преподавателей и студентов.</p>
            </div>
          </div>
          <form className="mb-5 rounded-lg border border-slate-200 p-4 dark:border-slate-700" onSubmit={createGroup}>
            <div className="grid gap-3">
              <label className="text-sm font-medium">
                Название группы
                <input className="input mt-1" value={groupDraft.title} onChange={(event) => setGroupDraft({ ...groupDraft, title: event.target.value })} required />
              </label>
              <label className="text-sm font-medium">
                Преподаватель
                <select className="input mt-1" value={groupDraft.teacherId} onChange={(event) => setGroupDraft({ ...groupDraft, teacherId: event.target.value })}>
                  <option value="">Без преподавателя</option>
                  {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}
                </select>
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                <CheckList title="Студенты" items={students} selected={groupDraft.studentIds} onChange={(studentIds) => setGroupDraft({ ...groupDraft, studentIds })} getLabel={(student) => student.name} />
                <CheckList title="Курсы" items={data.courses} selected={groupDraft.courseIds} onChange={(courseIds) => setGroupDraft({ ...groupDraft, courseIds })} getLabel={(course) => course.title} />
              </div>
              <div className="flex items-center gap-3">
                <button className="btn-primary">Создать группу</button>
                {groupMessage && <p className={`text-sm font-semibold ${groupMessage === "Группа создана" ? "text-emerald-600" : "text-red-600"}`}>{groupMessage}</p>}
              </div>
            </div>
          </form>
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

function CheckList({ title, items, selected, onChange, getLabel }) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold">{title}</p>
      <div className="grid max-h-52 gap-2 overflow-y-auto rounded-lg bg-slate-50 p-2 dark:bg-slate-800">
        {items.map((item) => {
          const checked = selected.includes(item.id);
          return (
            <label key={item.id} className="flex items-center gap-2 rounded-lg bg-white p-2 text-sm dark:bg-slate-900">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onChange(checked ? selected.filter((id) => id !== item.id) : [...selected, item.id])}
              />
              {getLabel(item)}
            </label>
          );
        })}
        {items.length === 0 && <p className="p-2 text-sm text-slate-500">Пока пусто.</p>}
      </div>
    </div>
  );
}
