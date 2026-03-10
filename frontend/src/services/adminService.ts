import axios from "axios";
import type { User } from "./authService";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const adminAPI = axios.create({
  baseURL: `${API_BASE_URL}/admin`,
  headers: { "Content-Type": "application/json" },
});

adminAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface SellerInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  companyName: string;
  vendorName?: string;
  isActive?: boolean;
}

export interface SubAdminInput {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface SubAdmin {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
}

export const adminService = {
  async listSellers(status: "pending" | "active" | "all" = "all") {
    const res = await adminAPI.get(`/sellers`, { params: { status } });
    return res.data;
  },
  async getSeller(id: string) {
    const res = await adminAPI.get(`/sellers/${id}`);
    return res.data;
  },
  async approveSeller(id: string) {
    const res = await adminAPI.patch(`/sellers/${id}/approve`);
    return res.data;
  },
  async deactivateSeller(id: string) {
    const res = await adminAPI.patch(`/sellers/${id}/deactivate`);
    return res.data;
  },
  async removeSeller(id: string) {
    const res = await adminAPI.delete(`/sellers/${id}`);
    return res.data;
  },
  async createSeller(data: SellerInput) {
    const res = await adminAPI.post(`/sellers`, data);
    return res.data;
  },
  async createSubAdmin(data: SubAdminInput) {
    const res = await adminAPI.post(`/subadmins`, data);
    return res.data;
  },
  async listSubAdmins() {
    const res = await adminAPI.get(`/subadmins`);
    return res.data;
  },
  async deleteSubAdmin(id: string) {
    const res = await adminAPI.delete(`/subadmins/${id}`);
    return res.data;
  },
};
