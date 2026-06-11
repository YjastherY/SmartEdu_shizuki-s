import { mockApi } from "./mockApi.js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const MOCK_API = import.meta.env.VITE_MOCK_API === "true";
const API_ORIGIN = API_URL.replace(/\/api\/?$/, "");

export function getToken() {
  return localStorage.getItem("smartedu_token");
}

export function setToken(token) {
  if (token) {
    localStorage.setItem("smartedu_token", token);
  } else {
    localStorage.removeItem("smartedu_token");
  }
}

export async function api(path, options = {}) {
  if (MOCK_API) {
    return mockApi(path, options);
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
