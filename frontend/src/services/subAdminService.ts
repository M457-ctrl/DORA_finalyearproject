import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const subAdminAPI = axios.create({
  baseURL: `${API_BASE_URL}/subadmin`,
  headers: { "Content-Type": "application/json" },
});

subAdminAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const subAdminService = {
  async listSellers(status: "pending" | "active" | "all" = "all") {
    const res = await subAdminAPI.get(`/sellers`, { params: { status } });
    return res.data;
  },
  async getSeller(id: string) {
    const res = await subAdminAPI.get(`/sellers/${id}`);
    return res.data;
  },
  async approveSeller(id: string) {
    const res = await subAdminAPI.patch(`/sellers/${id}/approve`);
    return res.data;
  },
  async deactivateSeller(id: string) {
    const res = await subAdminAPI.patch(`/sellers/${id}/deactivate`);
    return res.data;
  },
  async removeSeller(id: string) {
    const res = await subAdminAPI.delete(`/sellers/${id}`);
    return res.data;
  },
};
