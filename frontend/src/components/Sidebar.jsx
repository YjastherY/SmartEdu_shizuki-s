import { BarChart3, BookOpen, Bot, GraduationCap, LayoutDashboard, MessageCircle, ShieldCheck, User, UsersRound } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/courses", label: "Курсы", icon: BookOpen },
  { to: "/assistant", label: "Помощник", icon: Bot },
  { to: "/chat", label: "Чат", icon: MessageCircle },
  { to: "/progress", label: "Прогресс", icon: BarChart3 },
  { to: "/profile", label: "Профиль", icon: User }
];

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  const visibleItems = [
    ...items,
    ...(user?.role === "TEACHER" || user?.role === "ADMIN" ? [{ to: "/teacher", label: "Преподаватель", icon: UsersRound }] : []),
    ...(user?.role === "ADMIN" ? [{ to: "/admin", label: "Админ", icon: ShieldCheck }] : [])
  ];

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-950/50 lg:hidden ${open ? "block" : "hidden"}`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-slate-200 bg-white/95 px-4 py-5 shadow-xl backdrop-blur transition-transform duration-300 lg:translate-x-0 lg:shadow-none dark:border-slate-800 dark:bg-slate-900/95 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-8 flex items-center gap-3">
          <div className="soft-ring flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white">
            <GraduationCap size={24} />
          </div>
          <div>
            <p className="text-lg font-bold">SmartEdu</p>
            <p className="text-xs text-slate-500">Learning platform</p>
          </div>
        </div>
        <nav className="space-y-2">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition duration-200 hover:translate-x-1 ${
                    isActive
                      ? "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-100"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`
                }
              >
                <Icon size={18} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
