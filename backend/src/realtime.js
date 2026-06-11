import jwt from "jsonwebtoken";
import { WebSocketServer } from "ws";
import { prisma } from "./prisma.js";

const clients = new Map();

function send(socket, payload) {
  if (socket.readyState === socket.OPEN) {
    socket.send(JSON.stringify(payload));
  }
}

function rememberClient(userId, socket) {
  const sockets = clients.get(userId) || new Set();
  sockets.add(socket);
  clients.set(userId, sockets);

  socket.on("close", () => {
    sockets.delete(socket);
    if (sockets.size === 0) clients.delete(userId);
  });
}

async function resolveUser(request) {
  const url = new URL(request.url, "http://localhost");
  const token = url.searchParams.get("token");
  if (!token) return null;

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true, email: true, role: true, avatarUrl: true }
    });
  } catch {
    return null;
  }
}

async function handleChatMessage(socket, user, payload) {
  const text = String(payload.text || "").trim();
  if (text.length < 1 || text.length > 1000) {
    send(socket, { type: "error", message: "Сообщение должно быть от 1 до 1000 символов" });
    return;
  }

  const message = await prisma.chatMessage.create({
    data: { text, userId: user.id },
    include: { user: { select: { id: true, name: true, role: true, avatarUrl: true } } }
  });

  broadcast({ type: "chat_message", message });
}

export function attachRealtime(server) {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", async (socket, request) => {
    const user = await resolveUser(request);
    if (!user) {
      socket.close(1008, "Unauthorized");
      return;
    }

    rememberClient(user.id, socket);
    send(socket, { type: "ready", userId: user.id });

    socket.on("message", async (data) => {
      try {
        const payload = JSON.parse(data.toString());
        if (payload.type === "chat_message") {
          await handleChatMessage(socket, user, payload);
        }
      } catch {
        send(socket, { type: "error", message: "Не удалось обработать сообщение" });
      }
    });
  });
}

export function broadcast(payload) {
  for (const sockets of clients.values()) {
    for (const socket of sockets) send(socket, payload);
  }
}

export function sendToUser(userId, payload) {
  const sockets = clients.get(userId);
  if (!sockets) return;
  for (const socket of sockets) send(socket, payload);
}

export function sendNotification(userId, notification) {
  sendToUser(userId, { type: "notification", notification });
}
