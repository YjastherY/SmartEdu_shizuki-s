import { WebSocket } from "ws";

const baseUrl = process.env.SMARTEDU_BASE_URL || "http://localhost:3000";
const password = process.env.SMARTEDU_DEMO_PASSWORD || "password123";

function apiUrl(path) {
  return new URL(path, baseUrl).toString();
}

function wsUrl(token) {
  const url = new URL("/ws", baseUrl);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.searchParams.set("token", token);
  return url.toString();
}

async function readJson(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

async function request(path, options = {}) {
  const response = await fetch(apiUrl(path), {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...options.headers
    }
  });
  const data = await readJson(response);

  if (!response.ok) {
    throw new Error(`${path} failed with ${response.status}: ${JSON.stringify(data)}`);
  }

  return data;
}

async function login(email) {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
}

async function authorized(path, token, options = {}) {
  return request(path, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers
    }
  });
}

async function expectForbidden(path, token) {
  const response = await fetch(apiUrl(path), {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (response.status !== 403) {
    throw new Error(`${path} expected 403, got ${response.status}`);
  }
}

async function verifyContentCrud(token) {
  const stamp = Date.now();
  const createdCourse = await authorized("/api/courses", token, {
    method: "POST",
    body: JSON.stringify({
      title: `Smoke Course ${stamp}`,
      description: "Temporary course created by SmartEdu smoke test.",
      category: "QA",
      level: "Smoke",
      duration: "1 час",
      imageUrl: ""
    })
  });

  try {
    const createdModule = await authorized(`/api/courses/${createdCourse.course.id}/modules`, token, {
      method: "POST",
      body: JSON.stringify({ title: "Smoke Module" })
    });
    if (!createdModule.module?.id) throw new Error("Module CRUD create failed");

    const updatedModule = await authorized(`/api/modules/${createdModule.module.id}`, token, {
      method: "PUT",
      body: JSON.stringify({ title: "Smoke Module Updated" })
    });
    if (updatedModule.module.title !== "Smoke Module Updated") throw new Error("Module CRUD update failed");

    const createdLesson = await authorized(`/api/modules/${createdModule.module.id}/lessons`, token, {
      method: "POST",
      body: JSON.stringify({
        title: "Smoke Lesson",
        type: "TEXT",
        duration: "5 мин",
        content: "Smoke lesson content"
      })
    });
    if (!createdLesson.lesson?.id) throw new Error("Lesson CRUD create failed");

    const updatedLesson = await authorized(`/api/lessons/${createdLesson.lesson.id}`, token, {
      method: "PUT",
      body: JSON.stringify({ title: "Smoke Lesson Updated" })
    });
    if (updatedLesson.lesson.title !== "Smoke Lesson Updated") throw new Error("Lesson CRUD update failed");

    await authorized(`/api/lessons/${createdLesson.lesson.id}`, token, { method: "DELETE" });
    await authorized(`/api/modules/${createdModule.module.id}`, token, { method: "DELETE" });
  } finally {
    await authorized(`/api/courses/${createdCourse.course.id}`, token, { method: "DELETE" });
  }
}

async function verifyWebSocket(token) {
  await new Promise((resolve, reject) => {
    const socket = new WebSocket(wsUrl(token));
    const timeout = setTimeout(() => reject(new Error("WebSocket timeout")), 6000);

    socket.on("message", (data) => {
      const payload = JSON.parse(data.toString());
      if (payload.type === "ready") {
        clearTimeout(timeout);
        socket.close();
        resolve();
      }
    });
    socket.on("error", reject);
  });
}

async function main() {
  const health = await request("/api/health");
  if (health.status !== "ok") throw new Error("Health check returned unexpected payload");

  const student = await login("student@smartedu.local");
  const teacher = await login("teacher@smartedu.local");
  const admin = await login("admin@smartedu.local");

  await authorized("/api/me", student.token);
  await authorized("/api/progress/me", student.token);
  await authorized("/api/notifications", student.token);

  const courses = await request("/api/courses?search=react");
  if (!courses.courses?.length) throw new Error("No courses returned");

  const course = await request(`/api/courses/${courses.courses[0].id}`);
  if (!course.course?.modules?.length) throw new Error("Course modules missing");

  await authorized("/api/teacher/overview", teacher.token);
  await authorized("/api/admin/overview", admin.token);
  await expectForbidden("/api/admin/overview", teacher.token);
  await verifyContentCrud(admin.token);

  const chat = await authorized("/api/chat/messages", student.token);
  if (!Array.isArray(chat.messages)) throw new Error("Chat response must contain messages array");

  const assistant = await authorized("/api/assistant/ask", student.token, {
    method: "POST",
    body: JSON.stringify({ question: "Что повторить по React перед тестом?" })
  });
  if (!assistant.answer || !Array.isArray(assistant.sources)) throw new Error("Assistant response is invalid");

  await verifyWebSocket(student.token);

  console.log(JSON.stringify({
    status: "ok",
    baseUrl,
    checks: ["health", "auth", "courses", "progress", "teacher", "admin", "access-control", "content-crud", "chat", "assistant", "websocket"]
  }));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
