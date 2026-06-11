import { SendHorizonal, Wifi, WifiOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api, assetUrl, realtimeUrl } from "../services/api.js";

export default function Chat() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const selectedGroupRef = useRef("");
  const messagesRef = useRef(null);

  useEffect(() => {
    api("/chat/groups")
      .then((data) => {
        setGroups(data.groups || []);
        setSelectedGroupId((current) => current || data.groups?.[0]?.id || "");
      })
      .catch(() => {});

    const url = realtimeUrl();
    if (!url) return undefined;

    const socket = new WebSocket(url);
    socketRef.current = socket;
    socket.onopen = () => setConnected(true);
    socket.onclose = () => setConnected(false);
    socket.onerror = () => setConnected(false);
    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      if (payload.type === "chat_message" && payload.message.groupId === selectedGroupRef.current) {
        setMessages((items) => [...items.filter((item) => item.id !== payload.message.id), payload.message].slice(-50));
      }
    };

    return () => socket.close();
  }, []);

  useEffect(() => {
    selectedGroupRef.current = selectedGroupId;
    if (!selectedGroupId) {
      setMessages([]);
      return;
    }

    api(`/chat/messages?groupId=${encodeURIComponent(selectedGroupId)}`)
      .then((data) => setMessages(data.messages || []))
      .catch(() => setMessages([]));
  }, [selectedGroupId]);

  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function sendMessage(event) {
    event.preventDefault();
    const value = text.trim();
    if (!value || !selectedGroupId) return;

    setText("");
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "chat_message", text: value, groupId: selectedGroupId }));
      return;
    }

    const data = await api("/chat/messages", { method: "POST", body: JSON.stringify({ text: value, groupId: selectedGroupId }) });
    setMessages((items) => [...items, data.message].slice(-50));
  }

  const selectedGroup = groups.find((group) => group.id === selectedGroupId);

  return (
    <div className="page-enter grid min-h-[calc(100vh-9rem)] gap-6 lg:grid-cols-[1fr_280px]">
      <section className="panel flex min-h-[640px] flex-col overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">
          <div>
            <h1 className="text-2xl font-bold">Учебный чат</h1>
            <p className="text-sm text-slate-500">
              {selectedGroup ? `Группа ${selectedGroup.title}` : "Выберите группу для общения."}
            </p>
          </div>
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${connected ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-100" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"}`}>
            {connected ? <Wifi size={16} /> : <WifiOff size={16} />}
            {connected ? "Онлайн" : "REST"}
          </span>
        </div>

        <div ref={messagesRef} className="flex-1 space-y-3 overflow-y-auto p-5">
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
          {messages.length === 0 && selectedGroup && (
            <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800">
              В этой группе пока нет сообщений.
            </div>
          )}
          {!selectedGroup && (
            <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-800">
              Доступных групп пока нет. Администратор может добавить вас в группу.
            </div>
          )}
        </div>

        <form className="grid gap-3 border-t border-slate-200 p-4 dark:border-slate-800 sm:grid-cols-[1fr_auto]" onSubmit={sendMessage}>
          <input className="input" value={text} onChange={(event) => setText(event.target.value)} placeholder="Напишите сообщение" maxLength={1000} disabled={!selectedGroup} />
          <button className="btn-primary flex items-center justify-center gap-2" disabled={!text.trim() || !selectedGroup}>
            <SendHorizonal size={18} />
            Отправить
          </button>
        </form>
      </section>

      <aside className="panel h-fit space-y-3">
        <h2 className="font-bold">Группы</h2>
        <div className="space-y-2">
          {groups.map((group) => (
            <button
              key={group.id}
              className={`w-full rounded-lg border p-3 text-left transition ${
                selectedGroupId === group.id
                  ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-100"
                  : "border-slate-200 hover:border-brand-300 dark:border-slate-700"
              }`}
              onClick={() => setSelectedGroupId(group.id)}
            >
              <span className="block font-semibold">{group.title}</span>
              <span className="text-sm text-slate-500 dark:text-slate-300">
                {group.studentCount ?? group.students?.length ?? 0} студентов
              </span>
            </button>
          ))}
          {groups.length === 0 && <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500 dark:bg-slate-800">Группы не назначены.</p>}
        </div>
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
