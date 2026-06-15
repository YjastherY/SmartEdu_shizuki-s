import { Bell } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, realtimeUrl } from "../services/api.js";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    api("/notifications").then((data) => setNotifications(data.notifications)).catch(() => {});

    const url = realtimeUrl();
    if (!url) return undefined;

    const socket = new WebSocket(url);
    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      if (payload.type === "notification") {
        setNotifications((items) => [payload.notification, ...items.filter((item) => item.id !== payload.notification.id)]);
      }
    };

    return () => socket.close();
  }, []);

  useEffect(() => {
    function closeOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOutside);
    return () => document.removeEventListener("mousedown", closeOutside);
  }, []);

  const unread = notifications.filter((item) => !item.read).length;

  async function toggleOpen() {
    setOpen((value) => !value);

    if (unread > 0) {
      setNotifications((items) => items.map((item) => ({ ...item, read: true })));
      await api("/notifications/read-all", { method: "PATCH" }).catch(() => {});
    }
  }

  async function openNotification(item) {
    setOpen(false);
    if (!item.read) {
      setNotifications((items) => items.map((notification) => (notification.id === item.id ? { ...notification, read: true } : notification)));
      await api(`/notifications/${item.id}/read`, { method: "PATCH" }).catch(() => {});
    }
    navigate(notificationPath(item));
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <button className="btn-secondary relative px-3" onClick={toggleOpen} aria-label="Уведомления">
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs text-white">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="page-enter absolute right-0 z-50 mt-2 w-80 rounded-lg border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900 sm:w-96">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">Уведомления</p>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-300">{notifications.length}</span>
          </div>
          <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
            {notifications.length === 0 && <p className="text-sm text-slate-500">Пока пусто</p>}
            {notifications.map((item) => (
              <button key={item.id} className="w-full rounded-lg bg-slate-50 p-3 text-left text-sm transition hover:-translate-y-0.5 hover:bg-brand-50 dark:bg-slate-800 dark:hover:bg-slate-700" onClick={() => openNotification(item)}>
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold">{item.title}</p>
                  {!item.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-500" />}
                </div>
                <p className="mt-1 line-clamp-2 text-slate-500 dark:text-slate-300">{item.message}</p>
                <p className="mt-2 text-xs text-slate-400">{formatNotificationDate(item.createdAt)}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatNotificationDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function notificationPath(item) {
  if (item.targetPath) return item.targetPath;
  if (item.lessonId || item.metadata?.lessonId) return `/lessons/${item.lessonId || item.metadata.lessonId}`;
  if (item.courseId || item.metadata?.courseId) return `/courses/${item.courseId || item.metadata.courseId}`;
  if (item.submissionId || item.type === "review") return "/teacher";
  if (item.attemptId || item.type === "grade") return "/grades";
  if (item.type === "deadline") return "/courses";
  return "/dashboard";
}
