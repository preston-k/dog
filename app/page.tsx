"use client";

import { useState, useEffect, useRef } from "react";

function DogIcon({ size = "1em", color = "currentColor" }: { size?: string; color?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="13" r="6.5" />
      <path d="M8 7C3 7 3 18 6 18C7.5 18 9 16 8 13" />
      <path d="M16 7C21 7 21 18 18 18C16.5 18 15 16 16 13" />
      <circle cx="9.5" cy="12.5" r="0.8" fill={color} stroke="none" />
      <circle cx="14.5" cy="12.5" r="0.8" fill={color} stroke="none" />
      <ellipse cx="12" cy="15.5" rx="1.5" ry="1" fill={color} stroke="none" />
      <path d="M10 17Q12 19 14 17" />
    </svg>
  );
}

type Activity = "pee" | "poop" | "eat" | "drink";

interface ActivityConfig {
  label: string;
  icon: string;
  color: string;
  bg: string;
}

const ACTIVITIES: Record<Activity, ActivityConfig> = {
  pee: {
    label: "Pee",
    icon: "bi-droplet-fill",
    color: "#d97706",
    bg: "#fffbeb",
  },
  poop: {
    label: "Poop",
    icon: "bi-moon-fill",
    color: "#78350f",
    bg: "#fef3c7",
  },
  eat: {
    label: "Eat",
    icon: "bi-egg-fried",
    color: "#dc2626",
    bg: "#fef2f2",
  },
  drink: {
    label: "Drink",
    icon: "bi-cup-straw",
    color: "#2563eb",
    bg: "#eff6ff",
  },
};

const CONFIRM_DURATION = 5000;

export default function Home() {
  const [active, setActive] = useState<Activity | null>(null);
  const [progress, setProgress] = useState(0);
  const [cancelled, setCancelled] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number>(0);
  const loggedEntryId = useRef<number | null>(null);
  const loggingRef = useRef(false);

  const clearTimers = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const handlePress = (type: Activity) => {
    clearTimers();
    setActive(type);
    setProgress(0);
    setCancelled(false);
    loggedEntryId.current = null;
    loggingRef.current = true;
    startRef.current = Date.now();

    fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activity_type: type }),
    })
      .then((r) => r.json())
      .then((entry) => {
        loggedEntryId.current = entry.id;
        loggingRef.current = false;
      });

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      setProgress(Math.min((elapsed / CONFIRM_DURATION) * 100, 100));
    }, 30);

    timerRef.current = setTimeout(() => {
      clearTimers();
      setActive(null);
      setProgress(0);
    }, CONFIRM_DURATION);
  };

  const handleCancel = async () => {
    clearTimers();
    setCancelled(true);

    if (loggingRef.current) {
      await new Promise<void>((res) => {
        const poll = setInterval(() => {
          if (!loggingRef.current) { clearInterval(poll); res(); }
        }, 50);
      });
    }

    if (loggedEntryId.current) {
      await fetch(`/api/activities/${loggedEntryId.current}`, { method: "DELETE" });
    }

    setTimeout(() => {
      setActive(null);
      setProgress(0);
      setCancelled(false);
    }, 800);
  };

  useEffect(() => () => clearTimers(), []);

  if (active) {
    const cfg = ACTIVITIES[active];
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: cfg.bg,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1.5rem",
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
      >
        <i
          className={`bi ${cfg.icon}`}
          style={{ fontSize: "7rem", color: cfg.color, lineHeight: 1 }}
        />
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "2.6rem",
              fontWeight: 800,
              color: cfg.color,
              letterSpacing: "-0.02em",
            }}
          >
            {cancelled ? "Cancelled!" : `${cfg.label} Logged!`}
          </div>
          {!cancelled && (
            <div style={{ marginTop: "0.35rem", color: cfg.color, opacity: 0.6, fontSize: "1rem", fontWeight: 500 }}>
              {new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
            </div>
          )}
        </div>

        {!cancelled && (
          <>
            <div
              style={{
                width: "220px",
                height: "5px",
                background: "#e5e7eb",
                borderRadius: "999px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progress}%`,
                  background: cfg.color,
                  transition: "width 30ms linear",
                  borderRadius: "999px",
                }}
              />
            </div>

            <button
              onClick={handleCancel}
              style={{
                marginTop: "0.5rem",
                padding: "0.65rem 2.25rem",
                borderRadius: "999px",
                border: `2px solid ${cfg.color}`,
                background: "transparent",
                color: cfg.color,
                fontSize: "1rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#f9fafb",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        gap: "1.5rem",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "0.25rem" }}>
        <DogIcon size="2.75rem" color="#6b7280" />
        <h1
          style={{
            margin: "0.25rem 0 0",
            fontSize: "1.75rem",
            fontWeight: 800,
            color: "#111827",
            letterSpacing: "-0.02em",
          }}
        >
          Dog Tracker
        </h1>
        <p style={{ margin: "0.35rem 0 0", color: "#6b7280", fontSize: "0.95rem" }}>
          Tap to log an activity
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1rem",
          width: "100%",
          maxWidth: "380px",
        }}
      >
        {(Object.entries(ACTIVITIES) as [Activity, ActivityConfig][]).map(
          ([type, cfg]) => (
            <button
              key={type}
              onClick={() => handlePress(type)}
              style={{
                background: "#fff",
                border: `2px solid ${cfg.color}20`,
                borderRadius: "1.25rem",
                padding: "2.25rem 1rem",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.6rem",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                transition: "transform 0.1s ease, box-shadow 0.1s ease",
                WebkitTapHighlightColor: "transparent",
                touchAction: "manipulation",
              }}
              onPointerDown={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.95)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 1px 2px rgba(0,0,0,0.04)";
              }}
              onPointerUp={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)";
              }}
              onPointerLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)";
              }}
            >
              <i
                className={`bi ${cfg.icon}`}
                style={{ fontSize: "3rem", color: cfg.color, lineHeight: 1 }}
              />
              <span
                style={{
                  fontSize: "1.15rem",
                  fontWeight: 700,
                  color: cfg.color,
                }}
              >
                {cfg.label}
              </span>
            </button>
          )
        )}
      </div>

      <a
        href="/admin"
        style={{
          position: "fixed",
          bottom: "1.25rem",
          right: "1.5rem",
          color: "#d1d5db",
          fontSize: "0.72rem",
          textDecoration: "none",
          letterSpacing: "0.05em",
        }}
      >
        admin
      </a>
    </div>
  );
}
