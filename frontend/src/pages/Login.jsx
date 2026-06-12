import { GraduationCap } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const demoAccounts = [
  { label: "Студент", email: "student@smartedu.local" },
  { label: "Преподаватель", email: "teacher@smartedu.local" },
  { label: "Администратор", email: "admin@smartedu.local" }
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("student@smartedu.local");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
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
            <h1 className="text-2xl font-bold text-slate-950 dark:text-white">Вход в SmartEdu</h1>
            <p className="text-sm text-slate-500">Продолжите обучение</p>
          </div>
        </div>
        <div className="space-y-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Email
            <input className="input mt-1" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Пароль
            <input className="input mt-1" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
        </div>
        {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-200">{error}</p>}
        <button className="btn-primary mt-6 w-full" disabled={loading}>
          {loading ? "Входим..." : "Войти"}
        </button>
        <div className="mt-4 flex flex-wrap gap-2">
          {demoAccounts.map((account) => (
            <button
              key={account.email}
              className="btn-secondary flex-1 whitespace-nowrap px-3"
              type="button"
              onClick={() => {
                setEmail(account.email);
                setPassword("password123");
              }}
            >
              {account.label}
            </button>
          ))}
        </div>
        <p className="mt-4 text-center text-sm text-slate-500">
          Нет аккаунта? <Link className="font-semibold text-brand-600" to="/register">Зарегистрироваться</Link>
        </p>
      </form>
    </main>
  );
}
