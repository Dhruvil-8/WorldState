import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "WorldState — Global Intelligence Platform",
  description:
    "Continuously estimates the current state of the world using publicly available information. Real-time global intelligence, risk scoring, and emerging signal detection.",
  keywords: [
    "world state",
    "global intelligence",
    "geopolitical risk",
    "open source intelligence",
    "OSINT",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            background: "var(--ws-bg-primary)",
          }}
        >
          <Sidebar />
          <main
            style={{
              flex: 1,
              marginLeft: "var(--ws-sidebar-width)",
              minHeight: "100vh",
            }}
          >
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
