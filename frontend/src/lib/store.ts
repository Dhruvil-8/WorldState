// ============================================================
// WorldState — Zustand Store
// ============================================================

import { create } from "zustand";

interface AppState {
  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;

  // Active page tracking
  activePage: string;
  setActivePage: (page: string) => void;

  // Theme
  theme: "dark" | "light";
  toggleTheme: () => void;

  // Connection status
  backendConnected: boolean;
  setBackendConnected: (connected: boolean) => void;

  aiConnected: boolean;
  setAiConnected: (connected: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  activePage: "dashboard",
  setActivePage: (page) => set({ activePage: page }),

  theme: "dark",
  toggleTheme: () =>
    set((s) => ({ theme: s.theme === "dark" ? "light" : "dark" })),

  backendConnected: false,
  setBackendConnected: (connected) => set({ backendConnected: connected }),

  aiConnected: false,
  setAiConnected: (connected) => set({ aiConnected: connected }),
}));
