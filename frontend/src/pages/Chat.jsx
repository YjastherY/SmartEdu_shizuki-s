import { SendHorizonal, Wifi, WifiOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api, assetUrl, realtimeUrl } from "../services/api.js";

export default function Chat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    api("/chat/messages").then((data) => setMessages(data.messages)).catch(() => {});

    const url = realtimeUrl();
    if (!url) return undefined;

    const socket = new WebSocket(url);
    socketRef.current = socket;
    socket.onopen = () => setConnected(true);
    socket.onclose = () => setConnected(false);
    socket.onerror = () => setConnected(false);
    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      if (payload.type === "chat_message") {
        setMessages((items) => [...items.filter((item) => item.id !== payload.message.id), payload.message].slice(-50));
      }
    };

    return () => socket.close();
  }, []);

  async function sendMessage(event) {
    event.preventDefault();
    const value = text.trim();
    if (!value) return;

    setText("");
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "chat_message", text: value }));
      return;
    }

    const data = await api("/chat/messages", { method: "POST", body: JSON.stringify({ text: value }) });
    setMessages((items) => [...items, data.message].slice(-50));
  }

  return (
    <div className="page-enter grid min-h-[calc(100vh-9rem)] gap-6 lg:grid-cols-[1fr_280px]">
      <section className="panel flex min-h-[640px] flex-col overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">
          <div>
            <h1 className="text-2xl font-bold">Учебный чат</h1>
            <p className="text-sm text-slate-500">Общие вопросы по курсам и заданиям.</p>
          </div>
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${connected ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-100" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"}`}>
            {connected ? <Wifi size={16} /> : <WifiOff size={16} />}
            {connected ? "Онлайн" : "REST"}
          </span>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {messages.map((message) => {
            const own = message.user?.id === user.id;
            return (
              <div key={message.id} className={`flex gap-3 ${own ? "justify-end" : "justify-start"}`}>
                {!own && <Avatar user={message.user} />}
                <div className={`max-w-[78%] rounded-lg px-4 py-3 ${own ? "bg-brand-600 text-white" : "bg-slate-100 dark:bg-slate-800"}`}>
                  <div className="mb-1 flex items-center gap-2 text-xs opacity-80">
                    <span className="font-semibold">{message.user?.name}</span>
                    <span>{roleLabel(message.user?.role)}</span>
                    <span>{new Date(message.createdAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.text}</p>
                </div>
                {own && <Avatar user={message.user} />}
              </div>
            );
          })}
          {messages.length === 0 && (
            <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800">
              Сообщений пока нет.
            </div>
          )}
        </div>

        <form className="grid gap-3 border-t border-slate-200 p-4 dark:border-slate-800 sm:grid-cols-[1fr_auto]" onSubmit={sendMessage}>
          <input className="input" value={text} onChange={(event) => setText(event.target.value)} placeholder="Напишите сообщение" maxLength={1000} />
          <button className="btn-primary flex items-center justify-center gap-2" disabled={!text.trim()}>
            <SendHorizonal size={18} />
            Отправить
          </button>
        </form>
      </section>

      <aside className="panel h-fit space-y-3">
        <h2 className="font-bold">Как использовать</h2>
        <p className="text-sm text-slate-500 dark:text-slate-300">
          Студенты могут задавать вопросы, а преподаватели отвечать в общем потоке. При активном WebSocket новые сообщения появляются сразу.
        </p>
      </aside>
    </div>
  );
}

function Avatar({ user }) {
  const src = assetUrl(user?.avatarUrl) || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(user?.name || "User")}`;

  return <img className="mt-1 h-9 w-9 rounded-full object-cover" src={src} alt={user?.name || "User"} />;
}

function roleLabel(role) {
  const labels = {
    STUDENT: "Студент",
    TEACHER: "Преподаватель",
    ADMIN: "Администратор"
  };
  return labels[role] || "Участник";
}
