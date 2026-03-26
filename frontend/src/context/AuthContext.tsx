import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { fetchCurrentUser, logoutUser } from "../services/api";
import {
  clearAuthToken,
  clearStoredUser,
  getStoredUser,
  setAuthToken,
  setStoredUser,
} from "../services/auth";
import type { AuthUser } from "../types/api";
import { auth } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile as fbUpdateProfile,
} from "firebase/auth";
import { API_BASE_URL } from "../services/api";

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


  // Helper to sync user profile and get role from backend
  const syncUserProfile = async (idToken: string): Promise<AuthUser> => {
    const res = await fetch(`${API_BASE_URL}/auth/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
    });
    if (!res.ok) {
      throw new Error("Failed to sync user profile");
    }
    const data = await res.json();
    return data.user;
  };

  const login = async ({ email, password }: { email: string; password: string }): Promise<AuthUser> => {
    setAuthBusy(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await cred.user.getIdToken();
      setAuthToken(idToken);
      // Sync user profile and get role
      const nextUser = await syncUserProfile(idToken);
      setStoredUser(nextUser);
      setUser(nextUser);
      return nextUser;
    } finally {
      setAuthBusy(false);
    }
  };

  const register = async ({ name, email, password }: { name: string; email: string; password: string }): Promise<AuthUser> => {
    setAuthBusy(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (name) {
        await fbUpdateProfile(cred.user, { displayName: name });
      }
      const idToken = await cred.user.getIdToken();
      setAuthToken(idToken);
      // Sync user profile and get role
      const nextUser = await syncUserProfile(idToken);
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
        await signOut(auth);
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
