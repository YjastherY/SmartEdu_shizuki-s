import { GraduationCap } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await register(form.name, form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <form className="page-enter w-full max-w-md rounded-lg border border-slate-200 bg-white/95 p-6 shadow-xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/95" onSubmit={handleSubmit}>
        <div className="mb-6 flex items-center gap-3">
          <div className="soft-ring flex h-11 w-11 items-center justify-center rounded-lg bg-brand-600 text-white">
            <GraduationCap />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-950 dark:text-white">Регистрация</h1>
            <p className="text-sm text-slate-500">Создайте учебный аккаунт</p>
          </div>
        </div>
        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Имя
            <input className="input mt-1" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </label>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Email
            <input className="input mt-1" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          </label>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Пароль
            <input className="input mt-1" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
          </label>
        </div>
        {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-200">{error}</p>}
        <button className="btn-primary mt-6 w-full" disabled={loading}>
          {loading ? "Создаем..." : "Создать аккаунт"}
        </button>
        <p className="mt-4 text-center text-sm text-slate-500">
          Уже есть аккаунт? <Link className="font-semibold text-brand-600" to="/login">Войти</Link>
        </p>
      </form>
    </main>
  );
}
