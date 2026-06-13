"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    label: "Dashboard",
    href: "/",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    label: "Global Map",
    href: "/map",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polygon points="12 2 2 22 12 18 22 22 12 2" />
      </svg>
    ),
  },
  {
    label: "Events",
    href: "/events",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    label: "Entities",
    href: "/entities",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  {
    label: "Relationships",
    href: "/relationships",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"></line>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
      </svg>
    ),
  },
  {
    label: "Deep Analysis",
    href: "/analysis",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
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
      {/* Brand Header */}
      <div
        style={{
          padding: "20px 18px",
          borderBottom: "1px solid var(--ws-border)",
        }}
      >
        <Link href="/" style={{ textDecoration: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: 30,
                height: 30,
                border: "1px solid var(--ws-text-primary)",
                background: "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: 900,
                color: "var(--ws-text-primary)",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              WS
            </div>
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: "var(--ws-text-primary)",
                  letterSpacing: "0.05em",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                WORLDSTATE
              </div>
              <div
                style={{
                  fontSize: 9,
                  color: "var(--ws-text-muted)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                INTEL SYSTEM // OTS
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation Registry */}
      <nav style={{ padding: "16px 12px", flex: 1 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "var(--ws-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            padding: "0 8px 10px",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          // REGISTRY_DIRECTORIES
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              id={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 12px",
                textDecoration: "none",
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                color: isActive
                  ? "var(--ws-text-primary)"
                  : "var(--ws-text-secondary)",
                background: isActive ? "var(--ws-accent-glow)" : "transparent",
                border: isActive
                  ? "1px solid var(--ws-border-hover)"
                  : "1px solid transparent",
                marginBottom: 3,
                transition: "all 0.15s ease",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              <span style={{ opacity: isActive ? 1 : 0.5 }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Terminal Connection Status */}
      <div
        style={{
          padding: "16px 18px",
          borderTop: "1px solid var(--ws-border)",
          fontSize: 11,
          color: "var(--ws-text-muted)",
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 4,
          }}
        >
          <div
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "#10b981",
              boxShadow: "0 0 6px rgba(16, 185, 129, 0.4)",
            }}
          />
          OTS_FEED_ONLINE
        </div>
        <div style={{ fontSize: 10, opacity: 0.6 }}>
          SECURE_CONN_ACTIVE
        </div>
      </div>
    </aside>
  );
}
