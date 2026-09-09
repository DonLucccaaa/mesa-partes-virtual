const API_URL = "http://localhost:3000/api";

import { reactive } from "vue";

function getToken() {
  return localStorage.getItem("token") || "";
}

function authHeaders(extra = {}) {
  return {
    Authorization: `Bearer ${getToken()}`,
    ...extra,
  };
}

async function request(path, options = {}, expectBlob = false) {
  const response = await fetch(`${API_URL}${path}`, options);

  if (expectBlob) {
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(
        (data && data.message) || "No se pudo completar la operación"
      );
    }
    return response;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      (data && data.message) || "No se pudo completar la operación"
    );
  }

  return data;
}

export const api = {
  health: () => request("/health"),
  register: (body) =>
    request("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  login: (body) =>
    request("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  createDocument: (formData) =>
    request("/documents", {
      method: "POST",
      headers: authHeaders(),
      body: formData,
    }),
  myDocuments: () => request("/documents/my", { headers: authHeaders() }),
  getDocument: (id) => request(`/documents/${id}`, { headers: authHeaders() }),
  getDocumentPdf: (id) =>
    request(`/documents/${id}/file`, { headers: authHeaders() }, true),
  getDocumentHistory: (id) =>
    request(`/documents/${id}/history`, { headers: authHeaders() }),
  track: (code) =>
    request(`/documents/track/${encodeURIComponent(code.toUpperCase().trim())}`),
  adminDocuments: () => request("/admin/documents", { headers: authHeaders() }),
  adminDocument: (id) =>
    request(`/admin/documents/${id}`, { headers: authHeaders() }),
  adminDocumentPdf: (id) =>
    request(`/admin/documents/${id}/file`, { headers: authHeaders() }, true),
  adminDocumentHistory: (id) =>
    request(`/admin/documents/${id}/history`, { headers: authHeaders() }),
  adminUpdateStatus: (id, body) =>
    request(`/admin/documents/${id}/status`, {
      method: "PATCH",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(body),
    }),
  adminStats: () => request("/admin/stats", { headers: authHeaders() }),
};

export function storeAuth(data) {
  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));
  authState.user = data.user;
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  authState.user = null;
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

export const authState = reactive({ user: getStoredUser() });

export function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateShort(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function initials(name = "") {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export async function openPdfBlob(response) {
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener");
}