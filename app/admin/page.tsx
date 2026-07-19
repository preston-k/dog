"use client";

import { useState, useEffect, useCallback } from "react";

type Activity = "pee" | "poop" | "eat" | "drink";

interface Entry {
  id: number;
  activity_type: Activity;
  logged_at: string;
  notes: string | null;
}

type Cfg = { icon: string; color: string; label: string };

const TYPE_CONFIG: Record<string, Cfg> = {
  pee: { icon: "bi-droplet", color: "#d97706", label: "Pee" },
  poop: { icon: "bi-moon", color: "#78350f", label: "Poop" },
  eat: { icon: "bi-egg-fried", color: "#dc2626", label: "Food" },
  drink: { icon: "bi-cup-straw", color: "#2563eb", label: "Water" },
  food: { icon: "bi-egg-fried", color: "#dc2626", label: "Food" },
  water: { icon: "bi-cup-straw", color: "#2563eb", label: "Water" },
};

const FALLBACK_CFG: Cfg = { icon: "bi-question-circle", color: "#9ca3af", label: "Unknown" };

function fmt(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function toLocalInputValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<Activity | "all">("all");

  const [bfType, setBfType] = useState<Activity>("pee");
  const [bfTime, setBfTime] = useState("");
  const [bfNotes, setBfNotes] = useState("");
  const [bfAdding, setBfAdding] = useState(false);

  const [trendEntries, setTrendEntries] = useState<Entry[]>([]);

  const [editing, setEditing] = useState<Entry | null>(null);
  const [editTime, setEditTime] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editType, setEditType] = useState<Activity>("pee");

  const load = useCallback(async () => {
    setLoading(true);
    const url = filterType === "all" ? "/api/activities" : `/api/activities?type=${filterType}`;
    const res = await fetch(url);
    const data = await res.json();
    setEntries(data);
    setLoading(false);
  }, [filterType]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    fetch("/api/activities?limit=500")
      .then((r) => r.json())
      .then(setTrendEntries);
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this entry?")) return;
    await fetch(`/api/activities/${id}`, { method: "DELETE" });
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const handleBackfill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bfTime) return;
    setBfAdding(true);
    const res = await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        activity_type: bfType,
        logged_at: new Date(bfTime).toISOString(),
        notes: bfNotes || null,
      }),
    });
    const entry = await res.json();
    setEntries((prev) =>
      [entry, ...prev].sort(
        (a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()
      )
    );
    setBfTime("");
    setBfNotes("");
    setBfAdding(false);
  };

  const openEdit = (entry: Entry) => {
    setEditing(entry);
    setEditTime(toLocalInputValue(entry.logged_at));
    setEditNotes(entry.notes ?? "");
    setEditType(entry.activity_type);
  };

  const handleEditSave = async () => {
    if (!editing) return;
    const res = await fetch(`/api/activities/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        activity_type: editType,
        logged_at: new Date(editTime).toISOString(),
        notes: editNotes || null,
      }),
    });
    const updated = await res.json();
    setEntries((prev) =>
      prev
        .map((e) => (e.id === updated.id ? updated : e))
        .sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime())
    );
    setEditing(null);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEntries = entries.filter((e) => new Date(e.logged_at) >= today);
  const counts = (list: Entry[]) =>
    (["pee", "poop", "eat", "drink"] as Activity[]).map((t) => ({
      type: t,
      count: list.filter((e) => e.activity_type === t).length,
    }));

  return (
    <div style={{ minHeight: "100dvh", background: "#f9fafb", padding: "1.5rem 1rem" }}>
      <div style={{ maxWidth: "680px", margin: "0 auto" }}>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
          <a href="/" style={{ color: "#6b7280", textDecoration: "none", fontSize: "0.9rem" }}>
            <i className="bi bi-arrow-left" /> Home
          </a>
          <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "#111827", letterSpacing: "-0.02em", flex: 1 }}>
            Admin
          </h1>
          <a href="/api/auth/logout" style={{ color: "#9ca3af", textDecoration: "none", fontSize: "0.85rem" }}>
            Sign out
          </a>
        </div>

        {/* Today stats */}
        <section style={{ marginBottom: "1.5rem" }}>
          <h2 style={sectionTitle}>Today</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem" }}>
            {counts(todayEntries).map(({ type, count }) => {
              const cfg = TYPE_CONFIG[type] ?? FALLBACK_CFG;
              return (
                <div key={type} style={statCard}>
                  <i className={`bi ${cfg.icon}`} style={{ fontSize: "1.75rem", color: cfg.color }} />
                  <span style={{ fontSize: "1.5rem", fontWeight: 800, color: cfg.color }}>{count}</span>
                  <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{cfg.label}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Trends */}
        <section style={{ marginBottom: "1.5rem" }}>
          <h2 style={sectionTitle}>Trends · last 30 days</h2>
          <div style={card}>
            {(() => {
              const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
              const recent = trendEntries.filter((e) => new Date(e.logged_at).getTime() >= cutoff);
              const daySet = new Set(
                recent.map((e) => {
                  const d = new Date(e.logged_at);
                  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
                })
              );
              const numDays = Math.max(daySet.size, 1);

              return (["pee", "poop", "eat", "drink"] as Activity[]).map((type) => {
                const cfg = TYPE_CONFIG[type];
                const typeEntries = recent.filter((e) => e.activity_type === type);
                const hourCounts = Array.from({ length: 24 }, (_, h) =>
                  typeEntries.filter((e) => new Date(e.logged_at).getHours() === h).length
                );
                const maxCount = Math.max(...hourCounts, 1);
                const avgPerDay = (typeEntries.length / numDays).toFixed(1);

                return (
                  <div key={type} style={{ marginBottom: "0.85rem" }}>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: "0.6rem" }}>
                      <i
                        className={`bi ${cfg.icon}`}
                        style={{ color: cfg.color, fontSize: "1rem", width: "1rem", flexShrink: 0, marginBottom: "2px" }}
                      />
                      <div style={{ flex: 1, height: "36px", display: "flex", alignItems: "flex-end", gap: "1px" }}>
                        {hourCounts.map((count, h) => (
                          <div
                            key={h}
                            title={`${h === 0 ? "12am" : h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`}: ${count}`}
                            style={{
                              flex: 1,
                              background: cfg.color,
                              borderRadius: "2px 2px 0 0",
                              opacity: count === 0 ? 0.08 : 0.2 + (count / maxCount) * 0.8,
                              height: count === 0 ? "2px" : `${Math.max((count / maxCount) * 100, 14)}%`,
                            }}
                          />
                        ))}
                      </div>
                      <span style={{ fontSize: "0.7rem", color: "#9ca3af", flexShrink: 0, width: "3.5rem", textAlign: "right", marginBottom: "2px" }}>
                        {avgPerDay}×/day
                      </span>
                    </div>
                  </div>
                );
              });
            })()}

            <div style={{ position: "relative", height: "14px", marginLeft: "1.6rem", marginRight: "4.1rem" }}>
              {[
                { pct: 0, label: "12a" },
                { pct: 25, label: "6a" },
                { pct: 50, label: "12p" },
                { pct: 75, label: "6p" },
                { pct: 100, label: "12a" },
              ].map(({ pct, label }, i) => (
                <span
                  key={i}
                  style={{
                    position: "absolute",
                    left: `${pct}%`,
                    transform: pct === 100 ? "translateX(-100%)" : pct === 0 ? "none" : "translateX(-50%)",
                    fontSize: "0.62rem",
                    color: "#d1d5db",
                  }}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Backfill */}
        <section style={{ marginBottom: "1.5rem" }}>
          <h2 style={sectionTitle}>Backfill Entry</h2>
          <form onSubmit={handleBackfill} style={card}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <label style={labelStyle}>
                Activity
                <select
                  value={bfType}
                  onChange={(e) => setBfType(e.target.value as Activity)}
                  style={inputStyle}
                >
                  {(["pee", "poop", "eat", "drink"] as Activity[]).map((t) => (
                    <option key={t} value={t}>{TYPE_CONFIG[t].label}</option>
                  ))}
                </select>
              </label>
              <label style={labelStyle}>
                Time
                <input
                  type="datetime-local"
                  value={bfTime}
                  onChange={(e) => setBfTime(e.target.value)}
                  required
                  style={inputStyle}
                />
              </label>
            </div>
            <label style={{ ...labelStyle, marginTop: "0.5rem" }}>
              Notes (optional)
              <input
                type="text"
                value={bfNotes}
                onChange={(e) => setBfNotes(e.target.value)}
                placeholder="e.g. after walk"
                style={inputStyle}
              />
            </label>
            <button type="submit" disabled={bfAdding} style={primaryBtn}>
              {bfAdding ? "Adding…" : "Add Entry"}
            </button>
          </form>
        </section>

        {/* Log */}
        <section>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
            <h2 style={{ ...sectionTitle, marginBottom: 0 }}>Log</h2>
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
              {(["all", "pee", "poop", "eat", "drink"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  style={{
                    padding: "0.3rem 0.75rem",
                    borderRadius: "999px",
                    border: "1.5px solid",
                    borderColor: filterType === t ? "#111827" : "#e5e7eb",
                    background: filterType === t ? "#111827" : "#fff",
                    color: filterType === t ? "#fff" : "#374151",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                  }}
                >
                  {t === "all" ? (
                    "All"
                  ) : (
                    <>
                      <i className={`bi ${TYPE_CONFIG[t].icon}`} style={{ fontSize: "0.85rem" }} />
                      {TYPE_CONFIG[t].label}
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <p style={{ color: "#9ca3af", textAlign: "center" }}>Loading…</p>
          ) : entries.length === 0 ? (
            <p style={{ color: "#9ca3af", textAlign: "center" }}>No entries yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {entries.map((e) => {
                const cfg = TYPE_CONFIG[e.activity_type] ?? FALLBACK_CFG;
                return (
                  <div
                    key={e.id}
                    style={{ ...card, display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.85rem 1rem" }}
                  >
                    <i className={`bi ${cfg.icon}`} style={{ fontSize: "1.4rem", color: cfg.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: cfg.color, fontSize: "0.95rem" }}>{cfg.label}</div>
                      <div style={{ color: "#6b7280", fontSize: "0.82rem" }}>{fmt(e.logged_at)}</div>
                      {e.notes && (
                        <div style={{ color: "#9ca3af", fontSize: "0.8rem", marginTop: "0.1rem" }}>{e.notes}</div>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
                      <button onClick={() => openEdit(e)} style={iconBtn} title="Edit">
                        <i className="bi bi-pencil" style={{ fontSize: "1rem", color: "#6b7280" }} />
                      </button>
                      <button onClick={() => handleDelete(e.id)} style={iconBtn} title="Delete">
                        <i className="bi bi-trash" style={{ fontSize: "1rem", color: "#ef4444" }} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "1rem", zIndex: 50,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setEditing(null); }}
        >
          <div style={{ background: "#fff", borderRadius: "1.25rem", padding: "1.5rem", width: "100%", maxWidth: "400px" }}>
            <h3 style={{ margin: "0 0 1rem", fontWeight: 800, fontSize: "1.1rem" }}>Edit Entry</h3>
            <label style={labelStyle}>
              Activity
              <select value={editType} onChange={(e) => setEditType(e.target.value as Activity)} style={inputStyle}>
                {(["pee", "poop", "eat", "drink"] as Activity[]).map((t) => (
                  <option key={t} value={t}>{TYPE_CONFIG[t].label}</option>
                ))}
              </select>
            </label>
            <label style={{ ...labelStyle, marginTop: "0.75rem" }}>
              Time
              <input type="datetime-local" value={editTime} onChange={(e) => setEditTime(e.target.value)} style={inputStyle} />
            </label>
            <label style={{ ...labelStyle, marginTop: "0.75rem" }}>
              Notes
              <input type="text" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} style={inputStyle} />
            </label>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
              <button onClick={() => setEditing(null)} style={secondaryBtn}>Cancel</button>
              <button onClick={handleEditSave} style={primaryBtn}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const sectionTitle: React.CSSProperties = {
  margin: "0 0 0.75rem",
  fontSize: "0.8rem",
  fontWeight: 700,
  color: "#9ca3af",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

const card: React.CSSProperties = {
  background: "#fff",
  borderRadius: "1rem",
  padding: "1rem",
  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
};

const statCard: React.CSSProperties = {
  background: "#fff",
  borderRadius: "1rem",
  padding: "1rem 0.5rem",
  textAlign: "center",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "0.2rem",
  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
};

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.3rem",
  fontSize: "0.85rem",
  fontWeight: 600,
  color: "#374151",
};

const inputStyle: React.CSSProperties = {
  padding: "0.5rem 0.75rem",
  borderRadius: "0.5rem",
  border: "1.5px solid #e5e7eb",
  fontSize: "0.9rem",
  outline: "none",
  background: "#f9fafb",
  width: "100%",
  boxSizing: "border-box",
};

const primaryBtn: React.CSSProperties = {
  flex: 1,
  marginTop: "0.75rem",
  padding: "0.65rem 1.5rem",
  borderRadius: "0.75rem",
  border: "none",
  background: "#111827",
  color: "#fff",
  fontWeight: 700,
  fontSize: "0.95rem",
  cursor: "pointer",
  width: "100%",
};

const secondaryBtn: React.CSSProperties = {
  flex: 1,
  marginTop: "0.75rem",
  padding: "0.65rem 1.5rem",
  borderRadius: "0.75rem",
  border: "1.5px solid #e5e7eb",
  background: "#fff",
  color: "#374151",
  fontWeight: 700,
  fontSize: "0.95rem",
  cursor: "pointer",
};

const iconBtn: React.CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: "0.25rem",
  borderRadius: "0.375rem",
  lineHeight: 1,
  display: "flex",
  alignItems: "center",
};
