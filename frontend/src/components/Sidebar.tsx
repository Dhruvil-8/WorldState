"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    label: "Dashboard",
    href: "/",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    label: "Global Map",
    href: "/map",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polygon points="12 2 2 22 12 18 22 22 12 2" />
      </svg>
    ),
  },
  {
    label: "Events",
    href: "/events",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    label: "Entities",
    href: "/entities",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
  {
    label: "Risks",
    href: "/risks",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  {
    label: "Intelligence",
    href: "/intelligence",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  {
    label: "Relationships",
    href: "/relationships",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="19" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="9" y1="19" x2="15" y2="19" />
        <line x1="16.5" y1="7.5" x2="7.5" y2="16.5" />
        <line x1="18" y1="8" x2="18" y2="16" />
      </svg>
    ),
  },
  {
    label: "Market Impact",
    href: "/markets",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"></line>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      id="sidebar"
      style={{
        width: "var(--ws-sidebar-width)",
        minHeight: "100vh",
        background: "var(--ws-bg-secondary)",
        borderRight: "1px solid var(--ws-border)",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "24px 20px",
          borderBottom: "1px solid var(--ws-border)",
        }}
      >
        <Link href="/" style={{ textDecoration: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                fontWeight: 800,
                color: "#fff",
              }}
            >
              W
            </div>
            <div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--ws-text-primary)",
                  letterSpacing: "-0.02em",
                }}
              >
                WorldState
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--ws-text-muted)",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                Intelligence Platform
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav style={{ padding: "16px 12px", flex: 1 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--ws-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            padding: "0 8px 12px",
          }}
        >
          Overview
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              id={`nav-${item.label.toLowerCase()}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 12px",
                borderRadius: 10,
                textDecoration: "none",
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                color: isActive
                  ? "var(--ws-text-primary)"
                  : "var(--ws-text-secondary)",
                background: isActive ? "var(--ws-accent-glow)" : "transparent",
                border: isActive
                  ? "1px solid rgba(59, 130, 246, 0.2)"
                  : "1px solid transparent",
                marginBottom: 4,
                transition: "all 0.2s ease",
              }}
            >
              <span style={{ opacity: isActive ? 1 : 0.6 }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Status footer */}
      <div
        style={{
          padding: "16px 20px",
          borderTop: "1px solid var(--ws-border)",
          fontSize: 12,
          color: "var(--ws-text-muted)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 6,
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#22c55e",
              animation: "ws-pulse-glow 2s infinite",
            }}
          />
          System Active
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
          v0.1.0 · MVP
        </div>
      </div>
    </aside>
  );
}
