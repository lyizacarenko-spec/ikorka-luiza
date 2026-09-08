// Same backend as ikorka-sysadmin / task-dashboard: task-dashboard-backend
// on Railway. All routes here are under /api/luiza/* and gated server-side
// to 'owner' (full read/write) or 'evgeniya' (read-only) — any other PIN
// (sysadmin/manager) is rejected regardless of what the client sends.
const API_BASE =
  import.meta.env.VITE_API_URL || "https://task-dashboard-backend-production.up.railway.app/api";

function pin() {
  return sessionStorage.getItem("ikorka_luiza_pin") || "";
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-pin": pin(),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error || `request_failed_${res.status}`);
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // Only accepts a PIN that resolves to 'owner' or 'evgeniya' — a valid
  // sysadmin/manager PIN would authenticate fine against /api/login in
  // general, but this panel explicitly rejects anything else.
  login: (candidatePin) =>
    fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: candidatePin }),
    }).then(async (res) => {
      if (!res.ok) throw new Error("invalid_pin");
      const body = await res.json();
      if (body.role !== "owner" && body.role !== "evgeniya") throw new Error("invalid_pin");
      return body;
    }),

  getDaily: () => request("/luiza/daily-tasks"),
  addDaily: (text) => request("/luiza/daily-tasks", { method: "POST", body: JSON.stringify({ text }) }),
  toggleDaily: (id, done) =>
    request(`/luiza/daily-tasks/${id}`, { method: "PATCH", body: JSON.stringify({ done }) }),
  editDaily: (id, text) =>
    request(`/luiza/daily-tasks/${id}`, { method: "PATCH", body: JSON.stringify({ text }) }),
  setDailyCompletedAt: (id, completed_at) =>
    request(`/luiza/daily-tasks/${id}`, { method: "PATCH", body: JSON.stringify({ completed_at }) }),
  deleteDaily: (id) => request(`/luiza/daily-tasks/${id}`, { method: "DELETE" }),

  getAssigned: () => request("/luiza/assigned-tasks"),
  addAssigned: (title, from_user) =>
    request("/luiza/assigned-tasks", { method: "POST", body: JSON.stringify({ title, from_user }) }),
  setAssignedStatus: (id, status) =>
    request(`/luiza/assigned-tasks/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
  editAssigned: (id, patch) =>
    request(`/luiza/assigned-tasks/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  deleteAssigned: (id) => request(`/luiza/assigned-tasks/${id}`, { method: "DELETE" }),

  // Arbitrary files (docs/pdf/xlsx/etc) — stored on disk (Railway Volume),
  // not base64-in-Postgres like report_images. Multipart, so it bypasses
  // the JSON `request()` helper (browser sets its own Content-Type with
  // the multipart boundary).
  uploadFile: async (file) => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API_BASE}/upload`, {
      method: "POST",
      headers: { "x-pin": pin() },
      body: form,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `upload_failed_${res.status}`);
    }
    return res.json(); // { url, name, size }
  },

  getProjects: () => request("/luiza/projects"),
  addProject: (project) => request("/luiza/projects", { method: "POST", body: JSON.stringify(project) }),
  updateProject: (id, patch) =>
    request(`/luiza/projects/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  deleteProject: (id) => request(`/luiza/projects/${id}`, { method: "DELETE" }),
};

// /api/uploads/:filename is not behind the JSON `request()` wrapper (it
// returns the raw file, opened via <a href>, not fetched) — auth is a
// ?pin= query param instead of the x-pin header. See server.js comment.
export function attachmentHref(attachment) {
  return `${API_BASE}${attachment.url}?pin=${encodeURIComponent(pin())}&name=${encodeURIComponent(attachment.name)}`;
}

export function setStoredPin(p) {
  sessionStorage.setItem("ikorka_luiza_pin", p);
}
export function clearStoredPin() {
  sessionStorage.removeItem("ikorka_luiza_pin");
}
export function getStoredRole() {
  return sessionStorage.getItem("ikorka_luiza_role") || null;
}
export function setStoredRole(role) {
  sessionStorage.setItem("ikorka_luiza_role", role);
}
export function clearStoredRole() {
  sessionStorage.removeItem("ikorka_luiza_role");
}
