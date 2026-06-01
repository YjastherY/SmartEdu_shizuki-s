import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../services/api.js";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    api("/notifications").then((data) => setNotifications(data.notifications)).catch(() => {});
  }, []);

  const unread = notifications.filter((item) => !item.read).length;

  return (
    <div className="relative">
      <button className="btn-secondary relative px-3" onClick={() => setOpen((value) => !value)} aria-label="Уведомления">
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs text-white">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="page-enter absolute right-0 mt-2 w-80 rounded-lg border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <p className="mb-2 text-sm font-semibold">Уведомления</p>
          <div className="space-y-2">
            {notifications.length === 0 && <p className="text-sm text-slate-500">Пока пусто</p>}
            {notifications.slice(0, 5).map((item) => (
              <div key={item.id} className="rounded-lg bg-slate-50 p-3 text-sm transition hover:-translate-y-0.5 dark:bg-slate-800">
                <p className="font-semibold">{item.title}</p>
                <p className="text-slate-500 dark:text-slate-300">{item.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
