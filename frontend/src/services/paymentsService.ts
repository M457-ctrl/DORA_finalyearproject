import axios from "axios";
import { authService } from "./authService";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const paymentsAPI = axios.create({
  baseURL: `${API_URL}/payments`,
  headers: { "Content-Type": "application/json" },
});

paymentsAPI.interceptors.request.use((config) => {
  const token = authService.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface PaymentHashResponse {
  success: boolean;
  message: string;
  data: {
    khaltiData: {
      pidx: string;
      paymentUrl: string;
      expiresAt?: string;
      expiresIn?: number;
      totalAmount: number;
      amount: number;
      returnUrl: string;
    };
  };
}

export interface PaymentVerificationResponse {
  success: boolean;
  message: string;
  data?: {
    orderId: string;
    totalPrice: number;
    paymentCode: string;
    transactionId: string;
  };
}

export const paymentsService = {
  async initiateKhaltiPayment(
    productId: string,
    quantity: number,
    discountPercent: number,
    notes?: string,
  ): Promise<PaymentHashResponse> {
    const response = await paymentsAPI.post<PaymentHashResponse>(
      "/khalti/initiate",
      {
        productId,
        quantity,
        discountPercent,
        notes,
      },
    );
    return response.data;
  },

  async verifyKhaltiPayment(
    pidx: string,
  ): Promise<PaymentVerificationResponse> {
    const response = await paymentsAPI.post<PaymentVerificationResponse>(
      "/khalti/verify",
      { pidx },
    );
    return response.data;
  },

  async getPaymentStatus(orderId: string): Promise<{
    success: boolean;
    data?: {
      paymentMethod: string;
      paymentCode: string;
      paymentStatus: string;
      transactionId?: string;
      createdAt: string;
    };
  }> {
    const response = await paymentsAPI.get(`/status/${orderId}`);
    return response.data;
  },
};
