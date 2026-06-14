import { mockApi } from "./mockApi.js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const MOCK_API = import.meta.env.VITE_MOCK_API === "true";
const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");
const cache = new Map();
const CACHE_TTL = 30000;

export function getToken() {
  return localStorage.getItem("smartedu_token");
}

export function setToken(token) {
  cache.clear();
  if (token) {
    localStorage.setItem("smartedu_token", token);
  } else {
    localStorage.removeItem("smartedu_token");
  }
}

export async function api(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const canCache = method === "GET" && !options.body;
  const cached = canCache ? cache.get(path) : null;

  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return cached.data;
  }

  if (MOCK_API) {
    const data = await mockApi(path, options);
    if (canCache) cache.set(path, { data, time: Date.now() });
    else cache.clear();
    return data;
  }

  const token = getToken();
  const isFormData = options.body instanceof FormData;
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  if (canCache) cache.set(path, { data, time: Date.now() });
  else cache.clear();
  return data;
}

export function assetUrl(url) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
  return `${API_ORIGIN}${url}`;
}

export function realtimeUrl() {
  if (MOCK_API) return "";
  const token = getToken();
  if (!token) return "";

  const origin = API_URL.startsWith("http") ? API_ORIGIN : window.location.origin;
  return `${origin.replace(/^http/, "ws")}/ws?token=${encodeURIComponent(token)}`;
}
