import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const decodeJwtPayload = (token: string): { exp?: number } | null => {
  try {
    const payload = token.split(".")[1];
    if (!payload) {
      return null;
    }

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(normalized);
    return JSON.parse(decoded) as { exp?: number };
  } catch {
    return null;
  }
};

const isTokenExpired = (token: string): boolean => {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) {
    return true;
  }

  return payload.exp * 1000 <= Date.now();
};

export interface RegisterData {
  email: string;
  password: string;
  role: "buyer" | "seller";
  firstName: string;
  lastName: string;
  phone: string;
  companyName?: string;
  vendorName?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  role: "admin" | "subadmin" | "buyer" | "seller";
  firstName?: string;
  lastName?: string;
  phone?: string;
  companyName?: string;
  vendorName?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export const authService = {
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await axios.post<AuthResponse>(
      `${API_URL}/auth/register`,
      data,
    );
    if (response.data.data.token) {
      localStorage.setItem("token", response.data.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  async login(data: LoginData): Promise<AuthResponse> {
    const response = await axios.post<AuthResponse>(
      `${API_URL}/auth/login`,
      data,
    );
    if (response.data.data.token) {
      localStorage.setItem("token", response.data.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  async getProfile(): Promise<User> {
    const token = localStorage.getItem("token");
    const response = await axios.get<{
      success: boolean;
      data: { user: User };
    }>(`${API_URL}/auth/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.data.user;
  },

  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  getCurrentUser(): User | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        this.logout();
        return null;
      }
    }
    return null;
  },

  getToken(): string | null {
    const token = localStorage.getItem("token");
    if (!token) {
      return null;
    }

    if (isTokenExpired(token)) {
      this.logout();
      return null;
    }

    return token;
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};
