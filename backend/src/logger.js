import crypto from "node:crypto";
import morgan from "morgan";

function write(level, message, meta = {}) {
  const entry = {
    level,
    message,
    time: new Date().toISOString(),
    ...meta
  };
  const line = JSON.stringify(entry);

  if (level === "error") {
    console.error(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  info: (message, meta) => write("info", message, meta),
  error: (message, meta) => write("error", message, meta)
};

export function requestId(req, res, next) {
  req.id = req.headers["x-request-id"] || crypto.randomUUID();
  res.setHeader("x-request-id", req.id);
  next();
}

morgan.token("id", (req) => req.id);

export function requestLogger() {
  return morgan((tokens, req, res) =>
    JSON.stringify({
      level: "info",
      message: "http_request",
      time: new Date().toISOString(),
      requestId: tokens.id(req, res),
      method: tokens.method(req, res),
      url: tokens.url(req, res),
      status: Number(tokens.status(req, res)),
      responseTimeMs: Number(tokens["response-time"](req, res)),
      contentLength: tokens.res(req, res, "content-length") || "0"
    })
  );
}
