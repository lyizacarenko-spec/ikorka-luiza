// Same backend as ikorka-sysadmin / task-dashboard: task-dashboard-backend
// on Railway. All routes here are under /api/luiza/* and gated to the
// 'owner' role server-side — no other PIN (sysadmin/manager) can reach
// them, regardless of what the client sends.
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
  // Only accepts a PIN that resolves to 'owner' — a valid sysadmin/manager
  // PIN would authenticate fine against /api/login in general, but this
  // panel explicitly rejects anything that isn't 'owner'.
  login: (candidatePin) =>
    fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: candidatePin }),
    }).then(async (res) => {
      if (!res.ok) throw new Error("invalid_pin");
      const body = await res.json();
      if (body.role !== "owner") throw new Error("invalid_pin");
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
};

export function setStoredPin(p) {
  sessionStorage.setItem("ikorka_luiza_pin", p);
}
export function clearStoredPin() {
  sessionStorage.removeItem("ikorka_luiza_pin");
}
export function getStoredAuthed() {
  return sessionStorage.getItem("ikorka_luiza_authed") === "1";
}
export function setStoredAuthed() {
  sessionStorage.setItem("ikorka_luiza_authed", "1");
}
export function clearStoredAuthed() {
  sessionStorage.removeItem("ikorka_luiza_authed");
}
