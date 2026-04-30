import { create } from "zustand";

type UiState = {
  chatOpen: boolean;
  setChatOpen: (v: boolean) => void;
  toggleChat: () => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
};

export const useUiStore = create<UiState>((set) => ({
  chatOpen: false,
  setChatOpen: (v) => set({ chatOpen: v }),
  toggleChat: () => set((s) => ({ chatOpen: !s.chatOpen })),
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}));
