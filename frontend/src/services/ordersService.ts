import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const ordersAPI = axios.create({
  baseURL: `${API_BASE_URL}/orders`,
  headers: { "Content-Type": "application/json" },
});

ordersAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface CreateOrderData {
  productId: string;
  quantity: number;
  discountPercent?: number;
  notes?: string;
  paymentMethod?: string;
  paymentCode?: string;
}

export const ordersService = {
  async createOrder(data: CreateOrderData) {
    const res = await ordersAPI.post(`/`, data);
    return res.data;
  },
  async getMySellerOrders() {
    const res = await ordersAPI.get(`/seller/my`);
    return res.data;
  },
  async getMyBuyerOrders() {
    const res = await ordersAPI.get(`/buyer/my`);
    return res.data;
  },
  async updateOrderStatus(orderId: string, status: string) {
    const res = await ordersAPI.put(`/${orderId}/status`, { status });
    return res.data;
  },
};
