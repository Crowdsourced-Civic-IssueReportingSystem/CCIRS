import { createContext, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);

const defaultUser = {
  id: "u-001",
  name: "Ananya Sharma",
  email: "ananya.sharma@govmail.in",
  language: "English",
  notifications: true,
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(defaultUser);

  const updateProfile = (updates) => {
    setUser((prev) => ({ ...prev, ...updates }));
  };

  const logout = () => {
    setUser(null);
  };

  const loginMock = () => {
    setUser(defaultUser);
  };

  const value = useMemo(
    () => ({
      user,
      updateProfile,
      logout,
      loginMock,
    }),
    [user]
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
