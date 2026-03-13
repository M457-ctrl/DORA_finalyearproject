/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { authService } from "../services/authService";
import type { User } from "../services/authService";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSubAdmin: boolean;
  isBuyer: boolean;
  isSeller: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    // Load user from localStorage on mount
    return authService.getCurrentUser();
  });
  const [loading] = useState(false);

  const login = async (email: string, password: string) => {
    const response = await authService.login({ email, password });
    setUser(response.data.user);
    return response.data.user;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: authService.isAuthenticated() && !!user,
    isAdmin: user?.role === "admin",
    isSubAdmin: user?.role === "subadmin",
    isBuyer: user?.role === "buyer",
    isSeller: user?.role === "seller",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
