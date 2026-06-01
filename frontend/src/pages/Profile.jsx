import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Profile() {
  const { user, updateSettings } = useAuth();
  const [form, setForm] = useState({ name: user.name, avatarUrl: user.avatarUrl || "" });
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    await updateSettings(form);
    setMessage("Профиль обновлен");
  }

  return (
    <div className="page-enter grid gap-6 lg:grid-cols-[320px_1fr]">
      <aside className="panel text-center hover:shadow-md">
        <img
          className="mx-auto h-28 w-28 rounded-full object-cover ring-4 ring-brand-50 transition hover:scale-105 dark:ring-brand-950"
          src={user.avatarUrl || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(user.name)}`}
          alt={user.name}
        />
        <h1 className="mt-4 text-2xl font-bold">{user.name}</h1>
        <p className="text-sm text-slate-500">{user.email}</p>
        <span className="mt-4 inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-100">
          {user.role}
        </span>
      </aside>
      <form className="panel space-y-4 hover:shadow-md" onSubmit={handleSubmit}>
        <div>
          <h2 className="text-xl font-bold">Настройки профиля</h2>
          <p className="text-sm text-slate-500">Измените имя и ссылку на аватар.</p>
        </div>
        <label className="block text-sm font-medium">
          Имя
          <input className="input mt-1" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </label>
        <label className="block text-sm font-medium">
          Avatar URL
          <input className="input mt-1" value={form.avatarUrl} onChange={(event) => setForm({ ...form, avatarUrl: event.target.value })} />
        </label>
        <button className="btn-primary">Сохранить</button>
        {message && <p className="text-sm font-semibold text-emerald-600">{message}</p>}
      </form>
    </div>
  );
}
