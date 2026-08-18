import React, { useState, useEffect } from "react";
import {
  Plus, Trash2, Pencil, Clock, Play, Check, X, ListChecks, CalendarClock,
  TrendingUp, ChevronRight, ChevronLeft, CircleDot, Lock, LogOut,
  FolderGit2, ExternalLink, Github, MonitorSmartphone,
} from "lucide-react";
import { api, setStoredPin, clearStoredPin, getStoredRole, setStoredRole, clearStoredRole } from "./api.js";

// Both roles get identical, full read/write access to this panel —
// EVGENIYA_PIN is owner-equivalent here, not a restricted viewer.
const ROLE_LABELS = { owner: "Власниця", evgeniya: "Євгенія" };
const SYSADMIN_URL = "https://lyizacarenko-spec.github.io/ikorka-sysadmin/";

// ---------- design tokens (same palette as ikorka-sysadmin) ----------
const T = {
  bg: "#0d1117",
  panel: "#151b23",
  panelAlt: "#1c2430",
  border: "#2a3441",
  text: "#e6edf3",
  sub: "#8b96a5",
  accent: "#3ddc97",
  amber: "#f0b429",
  red: "#f0555a",
  blue: "#5aa9f0",
};

function fmtTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("uk-UA", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}
function fmtDuration(startIso, endIso) {
  if (!startIso || !endIso) return null;
  const ms = new Date(endIso) - new Date(startIso);
  const mins = Math.round(ms / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h} год ${m} хв` : `${m} хв`;
}
function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function getWeekDays(offset) {
  const now = new Date();
  const dow = now.getDay() === 0 ? 7 : now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - dow + 1 + offset * 7);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}
const DOW_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт"];
function useTicker(active) {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [active]);
}

function Pill({ color, children }) {
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600,
        color, background: color + "1a", border: `1px solid ${color}40`,
        fontFamily: "ui-monospace, monospace", letterSpacing: 0.2,
      }}
    >
      <CircleDot size={10} />
      {children}
    </span>
  );
}

// ---------------- Login screen ----------------
// Only a PIN that resolves to 'owner' or 'evgeniya' is accepted —
// api.login() itself rejects anything else, so a valid sysadmin/manager
// PIN still shows "Невірний PIN" here.
function LoginScreen({ onLoggedIn }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!value.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const { role } = await api.login(value.trim());
      setStoredPin(value.trim());
      setStoredRole(role);
      onLoggedIn(role);
    } catch {
      setError("Невірний PIN");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", background: T.bg, color: T.text,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "ui-sans-serif, system-ui",
    }}>
      <div style={{ ...panelStyle, padding: 28, width: 280, textAlign: "center" }}>
        <Lock size={22} color={T.sub} style={{ marginBottom: 10 }} />
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Луіза АІ автоматизатор</div>
        <input
          type="password"
          inputMode="numeric"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="PIN"
          style={{ ...inputStyle, width: "100%", textAlign: "center", fontSize: 18, letterSpacing: 4, boxSizing: "border-box" }}
        />
        {error && <div style={{ color: T.red, fontSize: 12, marginTop: 8 }}>{error}</div>}
        <button onClick={submit} disabled={busy} style={{ ...btnStyle(T.accent), width: "100%", justifyContent: "center", marginTop: 14 }}>
          {busy ? "…" : "Увійти"}
        </button>
      </div>
    </div>
  );
}

function TopBar({ tab, setTab, onLogout, role }) {
  const tabs = [
    { id: "daily", label: "Задачі на день", icon: ListChecks },
    { id: "assigned", label: "Задачі", icon: CalendarClock },
    { id: "weekly", label: "Тижнева аналітика", icon: TrendingUp },
    { id: "projects", label: "Проєкти", icon: FolderGit2 },
  ];

  // Same GitHub Pages origin as ikorka-sysadmin, so sessionStorage is
  // shared across both apps — seed sysadmin's own keys with the PIN and
  // role we already have here (both 'owner' and 'evgeniya' are valid,
  // full-access roles on that backend too), so she lands already logged in.
  function goToSysadmin() {
    const pin = sessionStorage.getItem("ikorka_luiza_pin");
    if (pin) {
      sessionStorage.setItem("ikorka_sysadmin_pin", pin);
      sessionStorage.setItem("ikorka_sysadmin_role", role);
    }
    window.location.href = SYSADMIN_URL;
  }

  return (
    <div style={{ display: "flex", gap: 4, borderBottom: `1px solid ${T.border}`, padding: "0 20px", justifyContent: "space-between", flexWrap: "wrap" }}>
      <div style={{ display: "flex" }}>
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "14px 16px", background: "transparent", border: "none",
                cursor: "pointer", fontSize: 14, fontWeight: 600,
                color: active ? T.text : T.sub,
                borderBottom: active ? `2px solid ${T.accent}` : "2px solid transparent",
                fontFamily: "ui-sans-serif, system-ui",
              }}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button onClick={goToSysadmin} style={{ background: "none", border: "none", color: T.blue, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600 }}>
          <MonitorSmartphone size={14} /> Панель сисадміна →
        </button>
        <span style={{ color: T.sub, fontSize: 12.5 }}>
          Ви увійшли як: <span style={{ color: T.text, fontWeight: 600 }}>{ROLE_LABELS[role] || role}</span>
        </span>
        <button onClick={onLogout} style={{ background: "none", border: "none", color: T.sub, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 12.5 }}>
          <LogOut size={14} /> Вийти
        </button>
      </div>
    </div>
  );
}

// ---------------- Daily tasks tab ----------------
function DailyTab({ items, reload, readOnly }) {
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");

  async function add() {
    if (!text.trim()) return;
    await api.addDaily(text.trim());
    setText("");
    reload();
  }
  async function toggle(item) {
    await api.toggleDaily(item.id, !item.done);
    reload();
  }
  async function remove(id) {
    await api.deleteDaily(id);
    reload();
  }
  function startEdit(item) {
    setEditingId(item.id);
    setEditValue(item.text);
  }
  async function saveEdit(id) {
    if (!editValue.trim()) return;
    await api.editDaily(id, editValue.trim());
    setEditingId(null);
    reload();
  }
  async function changeCompletedDate(id, dateStr) {
    if (!dateStr) return;
    await api.setDailyCompletedAt(id, `${dateStr}T12:00:00`);
    reload();
  }
  const doneCount = items.filter((i) => i.done).length;
  // Unfinished on top, done at the bottom — recomputed from `items` on
  // every render, so toggling a checkbox (which triggers reload()) moves
  // it immediately without any extra state to keep in sync.
  const sortedItems = [...items].sort((a, b) => (a.done === b.done ? 0 : a.done ? 1 : -1));
  return (
    <div style={{ padding: 20, maxWidth: 640 }}>
      {!readOnly && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="Нова задача на сьогодні..."
            style={{ ...inputStyle, flex: 1 }}
          />
          <button onClick={add} style={btnStyle(T.accent)}><Plus size={14} /> Додати</button>
        </div>
      )}
      <div style={{ color: T.sub, fontSize: 12, marginBottom: 10 }}>{doneCount} з {items.length} виконано</div>
      <div style={panelStyle}>
        {sortedItems.map((item, idx) => (
          <div key={item.id} style={{ ...rowStyle, borderTop: idx > 0 ? `1px solid ${T.border}` : "none", gap: 10 }}>
            <input type="checkbox" checked={item.done} disabled={readOnly} onChange={() => toggle(item)} />
            {editingId === item.id ? (
              <input
                autoFocus
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveEdit(item.id)}
                onBlur={() => saveEdit(item.id)}
                style={{ ...inputStyle, flex: 1 }}
              />
            ) : (
              <div
                onDoubleClick={() => startEdit(item)}
                style={{ flex: 1, textDecoration: item.done ? "line-through" : "none", color: item.done ? T.sub : T.text }}
              >
                {item.text}
              </div>
            )}
            {item.done && (
              <input
                type="date"
                title="Дата виконання — можна поставити заднім числом"
                value={item.completed_at ? String(item.completed_at).slice(0, 10) : ""}
                onChange={(e) => changeCompletedDate(item.id, e.target.value)}
                disabled={readOnly}
                style={{ ...inputStyle, padding: "4px 6px", fontSize: 11.5, colorScheme: "dark" }}
              />
            )}
            {!readOnly && (
              <>
                <button onClick={() => startEdit(item)} style={{ background: "none", border: "none", color: T.sub, cursor: "pointer" }}>
                  <Pencil size={14} />
                </button>
                <button onClick={() => remove(item.id)} style={{ background: "none", border: "none", color: T.sub, cursor: "pointer" }}>
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        ))}
        {items.length === 0 && <div style={{ padding: 16, color: T.sub, fontSize: 13 }}>Задач на сьогодні ще немає.</div>}
      </div>
    </div>
  );
}

// ---------------- Assigned tasks tab (time-tracked) ----------------
function LiveElapsed({ startedAt }) {
  useTicker(true);
  const secs = Math.floor((Date.now() - new Date(startedAt)) / 1000);
  const h = String(Math.floor(secs / 3600)).padStart(2, "0");
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
  const s = String(secs % 60).padStart(2, "0");
  return <span style={{ fontFamily: "ui-monospace, monospace", color: T.amber, fontWeight: 700 }}>{h}:{m}:{s}</span>;
}

function AssignedTab({ items, reload, readOnly }) {
  const [title, setTitle] = useState("");
  const [fromUser, setFromUser] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");

  async function addTask() {
    if (!title.trim()) return;
    await api.addAssigned(title.trim(), fromUser.trim() || null);
    setTitle("");
    reload();
  }
  async function start(id) {
    await api.setAssignedStatus(id, "active");
    reload();
  }
  async function finish(id) {
    await api.setAssignedStatus(id, "done");
    reload();
  }
  function startEdit(task) {
    setEditingId(task.id);
    setEditValue(task.title);
  }
  async function saveEdit(id) {
    if (!editValue.trim()) return;
    await api.editAssigned(id, { title: editValue.trim() });
    setEditingId(null);
    reload();
  }
  async function remove(id) {
    await api.deleteAssigned(id);
    reload();
  }
  async function changeDate(id, field, dateStr) {
    if (!dateStr) return;
    await api.editAssigned(id, { [field]: `${dateStr}T12:00:00` });
    reload();
  }

  const statusMeta = {
    queued: { label: "Не почато", color: T.sub },
    active: { label: "В роботі", color: T.amber },
    done: { label: "Завершено", color: T.accent },
  };

  return (
    <div style={{ padding: 20, maxWidth: 760 }}>
      {!readOnly && (
        <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            placeholder="Нова задача, напр. «Аналітика Бінотел за серпень»"
            style={{ ...inputStyle, flex: 2, minWidth: 220 }}
          />
          <input
            value={fromUser}
            onChange={(e) => setFromUser(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            placeholder="Хто поставив (напр. Євгенія)"
            style={{ ...inputStyle, flex: 1, minWidth: 160 }}
          />
          <button onClick={addTask} style={btnStyle(T.accent)}><Plus size={14} /> Поставити</button>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((task) => {
          const meta = statusMeta[task.status];
          const dur = fmtDuration(task.started_at, task.finished_at);
          return (
            <div key={task.id} style={{ ...panelStyle, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  {editingId === task.id ? (
                    <input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveEdit(task.id)}
                      onBlur={() => saveEdit(task.id)}
                      style={{ ...inputStyle, width: "100%", marginBottom: 6, boxSizing: "border-box" }}
                    />
                  ) : (
                    <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
                      {task.title}
                      {!readOnly && (
                        <button onClick={() => startEdit(task)} style={{ background: "none", border: "none", color: T.sub, cursor: "pointer", display: "inline-flex" }}>
                          <Pencil size={12} />
                        </button>
                      )}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 14, fontSize: 12, color: T.sub, flexWrap: "wrap", alignItems: "center" }}>
                    {task.from_user && <span>Від: {task.from_user}</span>}
                    {task.started_at && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        Взято:
                        <input
                          type="date"
                          title="Можна поставити заднім числом"
                          value={String(task.started_at).slice(0, 10)}
                          onChange={(e) => changeDate(task.id, "started_at", e.target.value)}
                          disabled={readOnly}
                          style={{ ...inputStyle, padding: "2px 4px", fontSize: 11, colorScheme: "dark" }}
                        />
                      </span>
                    )}
                    {task.finished_at && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        Завершено:
                        <input
                          type="date"
                          title="Можна поставити заднім числом"
                          value={String(task.finished_at).slice(0, 10)}
                          onChange={(e) => changeDate(task.id, "finished_at", e.target.value)}
                          disabled={readOnly}
                          style={{ ...inputStyle, padding: "2px 4px", fontSize: 11, colorScheme: "dark" }}
                        />
                      </span>
                    )}
                    {dur && <span style={{ color: T.text, fontWeight: 600 }}><Clock size={11} style={{ verticalAlign: -1, marginRight: 3 }} />{dur}</span>}
                    {task.status === "active" && <LiveElapsed startedAt={task.started_at} />}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Pill color={meta.color}>{meta.label}</Pill>
                  {!readOnly && task.status === "queued" && (
                    <button onClick={() => start(task.id)} style={btnStyle(T.blue)}><Play size={13} /> Взяти в роботу</button>
                  )}
                  {!readOnly && task.status === "active" && (
                    <button onClick={() => finish(task.id)} style={btnStyle(T.accent)}><Check size={13} /> Завершити</button>
                  )}
                  {!readOnly && (
                    <button onClick={() => remove(task.id)} style={{ background: "none", border: "none", color: T.sub, cursor: "pointer" }}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {items.length === 0 && <div style={{ ...panelStyle, padding: 16, color: T.sub, fontSize: 13 }}>Задач ще немає.</div>}
      </div>
    </div>
  );
}

// ---------------- Weekly analytics tab ----------------
function WeeklyTab({ daily, assigned }) {
  const [offset, setOffset] = useState(0);
  const days = getWeekDays(offset);
  const monday = days[0], friday = days[4];
  const rangeLabel = `${monday.toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit" })} – ${friday.toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit" })}`;

  const dayData = days.map((d) => ({
    date: d,
    dailyDone: daily.filter((t) => t.completed_at && isSameDay(new Date(t.completed_at), d)),
    assignedDone: assigned.filter((t) => t.finished_at && isSameDay(new Date(t.finished_at), d)),
  }));

  const totals = {
    daily: dayData.reduce((s, d) => s + d.dailyDone.length, 0),
    assigned: dayData.reduce((s, d) => s + d.assignedDone.length, 0),
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setOffset(offset - 1)} style={btnStyle(T.sub, true)}><ChevronLeft size={14} /></button>
          <div style={{ fontWeight: 700, fontSize: 14 }}>
            Тиждень {rangeLabel} {offset === 0 && <span style={{ color: T.accent, fontWeight: 600, fontSize: 12 }}> · поточний</span>}
          </div>
          <button onClick={() => setOffset(offset + 1)} disabled={offset === 0} style={{ ...btnStyle(T.sub, true), opacity: offset === 0 ? 0.35 : 1, cursor: offset === 0 ? "default" : "pointer" }}>
            <ChevronRight size={14} />
          </button>
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 12.5, color: T.sub }}>
          <span><b style={{ color: T.text }}>{totals.daily}</b> задач на день</span>
          <span><b style={{ color: T.text }}>{totals.assigned}</b> задач завершено</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
        {dayData.map((d, i) => {
          const total = d.dailyDone.length + d.assignedDone.length;
          const isToday = isSameDay(d.date, new Date());
          return (
            <div key={i} style={{ ...panelStyle, padding: 12, border: isToday ? `1px solid ${T.accent}60` : panelStyle.border, minHeight: 160 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{DOW_LABELS[i]} <span style={{ color: T.sub, fontWeight: 400 }}>{d.date.getDate()}.{String(d.date.getMonth() + 1).padStart(2, "0")}</span></div>
                {total > 0 && <span style={{ fontSize: 11, color: T.accent, fontWeight: 700 }}>{total}</span>}
              </div>
              {total === 0 && <div style={{ fontSize: 12, color: T.sub, fontStyle: "italic" }}>Нічого не зафіксовано</div>}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {d.assignedDone.map((t) => (
                  <div key={"a" + t.id} style={{ fontSize: 11.5, display: "flex", gap: 5, alignItems: "flex-start" }}>
                    <Check size={11} color={T.accent} style={{ marginTop: 2, flexShrink: 0 }} />
                    <span>{t.title} <span style={{ color: T.sub }}>({fmtDuration(t.started_at, t.finished_at)})</span></span>
                  </div>
                ))}
                {d.dailyDone.map((t) => (
                  <div key={"d" + t.id} style={{ fontSize: 11.5, display: "flex", gap: 5, alignItems: "flex-start" }}>
                    <Check size={11} color={T.blue} style={{ marginTop: 2, flexShrink: 0 }} />
                    <span>{t.text}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------- Projects tab ----------------
const PROJECT_STATUS = {
  active: { label: "В роботі", color: T.amber },
  live: { label: "Активно", color: T.accent },
  done: { label: "Завершено", color: T.blue },
  archived: { label: "Архів", color: T.sub },
};
const EMPTY_PROJECT = { name: "", description: "", repo_url: "", live_url: "", tech_stack: "", status: "active", notes: "" };

function ProjectsTab({ items, reload, readOnly }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_PROJECT);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_PROJECT);
  const [expandedId, setExpandedId] = useState(null);

  async function add() {
    if (!form.name.trim()) return;
    await api.addProject({ ...form, name: form.name.trim() });
    setForm(EMPTY_PROJECT);
    setShowAdd(false);
    reload();
  }
  function startEdit(p) {
    setEditingId(p.id);
    setExpandedId(p.id);
    setEditForm({
      name: p.name || "", description: p.description || "", repo_url: p.repo_url || "",
      live_url: p.live_url || "", tech_stack: p.tech_stack || "", status: p.status || "active",
      notes: p.notes || "",
    });
  }
  async function saveEdit(id) {
    if (!editForm.name.trim()) return;
    await api.updateProject(id, { ...editForm, name: editForm.name.trim() });
    setEditingId(null);
    reload();
  }
  async function setStatus(id, status) {
    await api.updateProject(id, { status });
    reload();
  }
  async function remove(id) {
    await api.deleteProject(id);
    reload();
  }

  // "В роботі" always on top, then everything else in the order the
  // statuses are declared above — recomputed from `items` on every
  // render, so a status change (which triggers reload()) re-sorts
  // automatically without any extra state to keep in sync.
  const STATUS_ORDER = Object.keys(PROJECT_STATUS);
  const sortedItems = [...items].sort(
    (a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)
  );

  return (
    <div style={{ padding: 20 }}>
      {!readOnly && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
          <button onClick={() => setShowAdd(true)} style={btnStyle(T.accent)}>
            <Plus size={14} /> Додати проєкт
          </button>
        </div>
      )}

      {!readOnly && showAdd && (
        <div style={{ ...panelStyle, marginBottom: 16, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Назва проєкту" style={{ ...inputStyle, flex: 1, minWidth: 180 }} />
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={inputStyle}>
              {Object.entries(PROJECT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Короткий опис" style={inputStyle} />
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input value={form.repo_url} onChange={(e) => setForm({ ...form, repo_url: e.target.value })} placeholder="Посилання на репозиторій" style={{ ...inputStyle, flex: 1, minWidth: 180 }} />
            <input value={form.live_url} onChange={(e) => setForm({ ...form, live_url: e.target.value })} placeholder="Посилання на живий сайт" style={{ ...inputStyle, flex: 1, minWidth: 180 }} />
          </div>
          <input value={form.tech_stack} onChange={(e) => setForm({ ...form, tech_stack: e.target.value })} placeholder="Технологічний стек (напр. Vite, React, Railway)" style={inputStyle} />
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Нотатки" rows={2} style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={add} style={btnStyle(T.accent)}>Зберегти</button>
            <button onClick={() => { setShowAdd(false); setForm(EMPTY_PROJECT); }} style={btnStyle(T.sub, true)}><X size={14} /></button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {sortedItems.map((p) => {
          const st = PROJECT_STATUS[p.status] || PROJECT_STATUS.active;
          const editing = editingId === p.id;
          const expanded = editing || expandedId === p.id;
          return (
            <div key={p.id} style={{ ...panelStyle, padding: 16 }}>
              {editing ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} style={{ ...inputStyle, flex: 1, minWidth: 180 }} />
                    <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} style={inputStyle}>
                      {Object.entries(PROJECT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                  <input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} placeholder="Короткий опис" style={inputStyle} />
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <input value={editForm.repo_url} onChange={(e) => setEditForm({ ...editForm, repo_url: e.target.value })} placeholder="Репозиторій" style={{ ...inputStyle, flex: 1, minWidth: 180 }} />
                    <input value={editForm.live_url} onChange={(e) => setEditForm({ ...editForm, live_url: e.target.value })} placeholder="Живий сайт" style={{ ...inputStyle, flex: 1, minWidth: 180 }} />
                  </div>
                  <input value={editForm.tech_stack} onChange={(e) => setEditForm({ ...editForm, tech_stack: e.target.value })} placeholder="Технологічний стек" style={inputStyle} />
                  <textarea value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} rows={2} style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => saveEdit(p.id)} style={btnStyle(T.accent)}>Зберегти</button>
                    <button onClick={() => setEditingId(null)} style={btnStyle(T.sub, true)}><X size={14} /></button>
                  </div>
                </div>
              ) : (
                <>
                  <div
                    onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, cursor: "pointer" }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{p.name}</div>
                      {p.description && (
                        <div
                          style={{
                            fontSize: 13, color: T.sub,
                            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                          }}
                        >
                          {p.description}
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                      <Pill color={st.color}>{st.label}</Pill>
                      <ChevronRight
                        size={16}
                        color={T.sub}
                        style={{ transform: expanded ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}
                      />
                    </div>
                  </div>

                  {expanded && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
                      {p.description && <div style={{ fontSize: 13, color: T.sub, marginBottom: 10, whiteSpace: "pre-wrap" }}>{p.description}</div>}
                      <div style={{ display: "flex", gap: 14, fontSize: 12, flexWrap: "wrap", alignItems: "center", marginBottom: p.notes ? 10 : 0 }}>
                        {p.repo_url && (
                          <a href={p.repo_url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} style={{ color: T.blue, display: "inline-flex", alignItems: "center", gap: 4, textDecoration: "none" }}>
                            <Github size={12} /> Репозиторій
                          </a>
                        )}
                        {p.live_url && (
                          <a href={p.live_url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} style={{ color: T.blue, display: "inline-flex", alignItems: "center", gap: 4, textDecoration: "none" }}>
                            <ExternalLink size={12} /> Сайт
                          </a>
                        )}
                        {p.tech_stack && <span style={{ color: T.sub, fontFamily: "ui-monospace, monospace" }}>{p.tech_stack}</span>}
                      </div>
                      {p.notes && <div style={{ fontSize: 12, color: T.sub, whiteSpace: "pre-wrap", marginBottom: 12 }}>{p.notes}</div>}
                      {!readOnly && (
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }} onClick={(e) => e.stopPropagation()}>
                          <select
                            value={p.status}
                            onChange={(e) => setStatus(p.id, e.target.value)}
                            style={{ background: "transparent", border: "none", color: st.color, fontWeight: 600, fontSize: 12, fontFamily: "ui-monospace, monospace" }}
                          >
                            {Object.entries(PROJECT_STATUS).map(([k, v]) => <option key={k} value={k} style={{ background: T.panel, color: T.text }}>{v.label}</option>)}
                          </select>
                          <button onClick={() => startEdit(p)} style={{ background: "none", border: "none", color: T.sub, cursor: "pointer" }}>
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => remove(p.id)} style={{ background: "none", border: "none", color: T.sub, cursor: "pointer" }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
        {items.length === 0 && <div style={{ ...panelStyle, padding: 16, color: T.sub, fontSize: 13 }}>Проєктів ще немає — додайте перший.</div>}
      </div>
    </div>
  );
}

// ---------------- shared styles ----------------
const panelStyle = { background: T.panel, border: `1px solid ${T.border}`, borderRadius: 10 };
const rowStyle = { display: "flex", alignItems: "center", padding: "10px 14px", fontSize: 13.5 };
const inputStyle = { background: T.panelAlt, border: `1px solid ${T.border}`, borderRadius: 7, padding: "8px 10px", color: T.text, fontSize: 13, outline: "none" };
function btnStyle(color, ghost) {
  return {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "8px 13px", borderRadius: 7, fontSize: 12.5, fontWeight: 700,
    cursor: "pointer", border: `1px solid ${ghost ? T.border : color + "60"}`,
    background: ghost ? "transparent" : color + "1a", color: ghost ? T.sub : color,
  };
}

function Dashboard({ onLogout, role }) {
  // owner and evgeniya are both full-access roles here — see ROLE_LABELS.
  const readOnly = false;
  const [tab, setTab] = useState("daily");
  const [daily, setDaily] = useState([]);
  const [assigned, setAssigned] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  async function reloadAll() {
    setLoadError(null);
    try {
      const [dl, asg, pr] = await Promise.all([api.getDaily(), api.getAssigned(), api.getProjects()]);
      setDaily(dl);
      setAssigned(asg);
      setProjects(pr);
    } catch (e) {
      setLoadError(e.message || "load_failed");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { reloadAll(); }, []);

  const activeCount = assigned.filter((a) => a.status === "active").length;

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "ui-sans-serif, system-ui" }}>
      <div style={{ padding: "18px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.3 }}>Луіза АІ автоматизатор</div>
          <div style={{ fontSize: 12.5, color: T.sub, marginTop: 2 }}>
            {activeCount > 0 ? `${activeCount} задача в роботі` : "немає активних задач"}
          </div>
        </div>
      </div>
      <TopBar tab={tab} setTab={setTab} onLogout={onLogout} role={role} />
      {loading ? (
        <div style={{ padding: 40, color: T.sub, textAlign: "center" }}>Завантаження…</div>
      ) : loadError ? (
        <div style={{ padding: 40, textAlign: "center" }}>
          <div style={{ color: T.red, fontSize: 13, marginBottom: 12 }}>
            Не вдалося завантажити дані: {loadError}
          </div>
          <button onClick={() => { setLoading(true); reloadAll(); }} style={btnStyle(T.accent)}>
            Повторити
          </button>
        </div>
      ) : (
        <>
          {tab === "daily" && <DailyTab items={daily} reload={reloadAll} readOnly={readOnly} />}
          {tab === "assigned" && <AssignedTab items={assigned} reload={reloadAll} readOnly={readOnly} />}
          {tab === "weekly" && <WeeklyTab daily={daily} assigned={assigned} />}
          {tab === "projects" && <ProjectsTab items={projects} reload={reloadAll} readOnly={readOnly} />}
        </>
      )}
    </div>
  );
}

export default function App() {
  const [role, setRole] = useState(getStoredRole());

  function handleLogout() {
    clearStoredPin();
    clearStoredRole();
    setRole(null);
  }

  if (!role) return <LoginScreen onLoggedIn={setRole} />;
  return <Dashboard onLogout={handleLogout} role={role} />;
}
