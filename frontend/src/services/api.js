import { mockApi } from "./mockApi.js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const MOCK_API = import.meta.env.VITE_MOCK_API === "true";

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
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
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
