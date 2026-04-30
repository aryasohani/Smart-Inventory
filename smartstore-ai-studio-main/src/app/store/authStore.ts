import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Role } from "../services/types";
import { authApi } from "../services/api";

type AuthState = {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role?: Role) => Promise<void>;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        // Call real FastAPI backend
        const tokens = await authApi.login(email, password);

        // Fetch the actual user profile
        // Temporarily store token so the interceptor can use it
        const tempState = { state: { token: tokens.access_token } };
        localStorage.setItem("smartstore-auth", JSON.stringify(tempState));

        const profile = await authApi.me();

        const user: User = {
          id: profile.id,
          name: profile.full_name,
          email: profile.email,
          role: profile.role as Role,
        };

        set({
          user,
          token: tokens.access_token,
          refreshToken: tokens.refresh_token,
          isAuthenticated: true,
        });
      },

      logout: () => {
        authApi.logout().catch(() => {});
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
      },
    }),
    {
      name: "smartstore-auth",
      // Only persist these fields
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);