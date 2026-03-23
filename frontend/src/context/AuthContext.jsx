import { createContext, useContext, useMemo, useState } from "react";
import { fetchCurrentUser, loginUser, logoutUser, registerUser } from "../services/api";
import {
  clearAuthToken,
  clearStoredUser,
  getStoredUser,
  setAuthToken,
  setStoredUser,
} from "../services/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [authBusy, setAuthBusy] = useState(false);

  const updateProfile = (updates) => {
    setUser((prev) => {
      const next = { ...(prev || {}), ...updates };
      setStoredUser(next);
      return next;
    });
  };

  const login = async ({ email, password }) => {
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

  const register = async ({ name, email, password }) => {
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

  const refreshUser = async () => {
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

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
