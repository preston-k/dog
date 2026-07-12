"use client";

import { useEffect } from "react";

export default function LoginPage() {
  useEffect(() => {
    window.location.href = "/api/auth/login";
  }, []);

  return (
    <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb", padding: "0 1rem" }}>
      <div style={{ width: "100%", maxWidth: "24rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <img
            src="https://cdn.pkserver.co/uploads/5603cd4e-a2bf-4143-87fa-5ce8b99ad272.png"
            alt="Dog"
            style={{ width: "3rem", height: "3rem", objectFit: "contain", margin: "0 auto 1rem" }}
          />
          <h1 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#111827", margin: 0 }}>Dog</h1>
          <p style={{ fontSize: "0.875rem", color: "#6b7280", marginTop: "0.25rem" }}>Sign in to continue</p>
        </div>
        <div style={{ background: "#fff", borderRadius: "1rem", border: "1px solid #e5e7eb", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <a
            href="/api/auth/login"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
              width: "100%", padding: "0.625rem 1rem",
              background: "#111827", color: "#fff",
              fontSize: "0.875rem", fontWeight: 500,
              borderRadius: "0.5rem", textDecoration: "none",
              transition: "background 0.15s",
            }}
          >
            Continue with SSO
          </a>
        </div>
      </div>
    </div>
  );
}
