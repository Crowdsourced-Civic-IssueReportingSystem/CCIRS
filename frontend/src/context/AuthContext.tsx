import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { fetchCurrentUser, loginUser, logoutUser, registerUser } from "../services/api";
import {
  clearAuthToken,
  clearStoredUser,
  getStoredUser,
  setAuthToken,
  setStoredUser,
} from "../services/auth";
import type { AuthUser } from "../types/api";

interface AuthContextValue {
  user: AuthUser | null;
  updateProfile: (updates: Partial<AuthUser>) => void;
  login: (payload: { email: string; password: string }) => Promise<AuthUser>;
  register: (payload: { name: string; email: string; password: string }) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<AuthUser | null>;
  authBusy: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [authBusy, setAuthBusy] = useState(false);

  const updateProfile = (updates: Partial<AuthUser>) => {
    setUser((prev) => {
      const next = { ...(prev || {}), ...updates };
      setStoredUser(next);
      return next;
    });
  };

  const login = async ({ email, password }: { email: string; password: string }): Promise<AuthUser> => {
    setAuthBusy(true);
    try {
      const response = await loginUser({ email, password });
      const token = response?.tokens?.accessToken;
      const nextUser = response?.user ?? null;

      if (!token || !nextUser) {
        throw new Error("Invalid login response");
      }

      setAuthToken(token);
      setStoredUser(nextUser);
      setUser(nextUser);
      return nextUser;
    } finally {
      setAuthBusy(false);
    }
  };

  const register = async ({
    name,
    email,
    password,
  }: {
    name: string;
    email: string;
    password: string;
  }): Promise<AuthUser> => {
    setAuthBusy(true);
    try {
      const response = await registerUser({ name, email, password });
      const token = response?.tokens?.accessToken;
      const nextUser = response?.user ?? null;

      if (!token || !nextUser) {
        throw new Error("Invalid register response");
      }

      setAuthToken(token);
      setStoredUser(nextUser);
      setUser(nextUser);
      return nextUser;
    } finally {
      setAuthBusy(false);
    }
  };

  const refreshUser = async (): Promise<AuthUser | null> => {
    try {
      const nextUser = await fetchCurrentUser();
      if (nextUser) {
        setStoredUser(nextUser);
        setUser(nextUser);
      }
      return nextUser;
    } catch {
      return null;
    }
  };

  const logout = async () => {
    setAuthBusy(true);
    try {
      try {
        await logoutUser();
      } catch {
        // Ignore API logout errors; local token cleanup is authoritative for this UI.
      }
      clearAuthToken();
      clearStoredUser();
      setUser(null);
    } finally {
      setAuthBusy(false);
    }
  };

  const value = useMemo(
    () => ({
      user,
      updateProfile,
      login,
      register,
      logout,
      refreshUser,
      authBusy,
    }),
    [authBusy, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
