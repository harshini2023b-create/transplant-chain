import { createContext, useContext, useState, useCallback } from "react";

const AuthContext = createContext(null);

// Role definitions with their accounts and colors
export const ROLES = {
  sender: {
    label: "Sender Hospital",
    icon: "🏥",
    description: "Register organs and initiate transplant chain",
    gradient: "#0f766e",
    color: "#0f766e",
  },
  transporter: {
    label: "Transporter",
    icon: "🚑",
    description: "Transport organs between hospitals securely",
    gradient: "#0f766e",
    color: "#0f766e",
  },
  receiver: {
    label: "Receiver Hospital",
    icon: "🏨",
    description: "Receive and verify incoming organs",
    gradient: "#0f766e",
    color: "#0f766e",
  },
  auditor: {
    label: "Auditor",
    icon: "🔍",
    description: "Audit and verify the entire transplant chain",
    gradient: "#0f766e",
    color: "#0f766e",
  },
};

// Demo credentials for each role
const DEMO_CREDENTIALS = {
  sender: { username: "sender@hospital.tn", password: "sender123" },
  transporter: { username: "transporter@chain.tn", password: "transport123" },
  receiver: { username: "receiver@hospital.tn", password: "receiver123" },
  auditor: { username: "auditor@transplant.tn", password: "auditor123" },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = useCallback((role, username, password) => {
    const creds = DEMO_CREDENTIALS[role];
    if (!creds) return { success: false, message: "Invalid role" };
    if (username !== creds.username || password !== creds.password) {
      return { success: false, message: "Invalid credentials" };
    }
    const userData = {
      role,
      username,
      ...ROLES[role],
      loginTime: Date.now(),
    };
    setUser(userData);
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
