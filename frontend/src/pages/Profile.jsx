import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { assetUrl } from "../services/api.js";

export default function Profile() {
  const { user, updateSettings, uploadAvatar } = useAuth();
  const [form, setForm] = useState({
    name: user.name,
    avatarUrl: user.avatarUrl?.startsWith("http") ? user.avatarUrl : ""
  });
  const [message, setMessage] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setForm({
      name: user.name,
      avatarUrl: user.avatarUrl?.startsWith("http") ? user.avatarUrl : ""
    });
  }, [user]);

  async function handleSubmit(event) {
    event.preventDefault();
    const settings = { name: form.name };
    const externalAvatar = form.avatarUrl.trim();

    if (externalAvatar) {
      settings.avatarUrl = externalAvatar;
    }

    try {
      await updateSettings(settings);
      setMessage("Профиль обновлен");
    } catch (error) {
      setMessage(error.message || "Не удалось сохранить профиль");
    }
  }

  async function handleAvatarChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setMessage("");
  }

  async function handleAvatarUpload() {
    if (!avatarFile) return;

    setUploading(true);
    try {
      const updatedUser = await uploadAvatar(avatarFile);
      setForm((value) => ({
        ...value,
        avatarUrl: updatedUser.avatarUrl?.startsWith("http") ? updatedUser.avatarUrl : ""
      }));
      setAvatarFile(null);
      setAvatarPreview("");
      setMessage("Аватар обновлен");
    } catch (error) {
      setMessage(error.message || "Не удалось загрузить аватар");
    } finally {
      setUploading(false);
    }
  }

  const avatarSrc = avatarPreview || assetUrl(user.avatarUrl) || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(user.name)}`;

  return (
    <div className="page-enter grid gap-6 lg:grid-cols-[320px_1fr]">
      <aside className="panel text-center hover:shadow-md">
        <img
          className="mx-auto h-28 w-28 rounded-full object-cover ring-4 ring-brand-50 transition hover:scale-105 dark:ring-brand-950"
          src={avatarSrc}
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
          <p className="text-sm text-slate-500">Измените имя или загрузите новый аватар.</p>
        </div>
        <label className="block text-sm font-medium">
          Имя
          <input className="input mt-1" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </label>
        <div className="grid gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700 sm:grid-cols-[1fr_auto] sm:items-end">
          <label className="block text-sm font-medium">
            Файл аватара
            <input className="input mt-1" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleAvatarChange} />
          </label>
          <button type="button" className="btn-secondary" disabled={!avatarFile || uploading} onClick={handleAvatarUpload}>
            {uploading ? "Загружаем..." : "Загрузить"}
          </button>
        </div>
        <label className="block text-sm font-medium">
          Ссылка на аватар, если файл не нужен
          <input className="input mt-1" value={form.avatarUrl} onChange={(event) => setForm({ ...form, avatarUrl: event.target.value })} />
        </label>
        <button className="btn-primary">Сохранить</button>
        {message && (
          <p className={`text-sm font-semibold ${message.includes("Не удалось") ? "text-red-600" : "text-emerald-600"}`}>
            {message}
          </p>
        )}
      </form>
    </div>
  );
}
