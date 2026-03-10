import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export interface PaymentHashResponse {
  success: boolean;
  message: string;
  data: {
    hash: string;
    esewaData: {
      amount: number;
      serviceCost: number;
      deliveryCharge: number;
      totalAmount: number;
      productCode: string;
      merchantCode: string;
      successUrl: string;
      failureUrl: string;
      url: string; // eSewa payment gateway URL
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

/**
 * Payment Service - Handles eSewa payment gateway integration
 *
 * eSewa Payment Flow:
 * 1. Frontend calls generateEsewaHash() to get payment hash
 * 2. Backend generates hash using HMAC-SHA256
 * 3. Frontend redirects user to eSewa gateway with encrypted payload
 * 4. User completes payment on eSewa
 * 5. eSewa redirects to success/failure URL
 * 6. Frontend calls verifyPayment() to confirm transaction
 * 7. Backend updates order with payment details
 */
export const paymentsService = {
  /**
   * Generate eSewa payment hash
   * Called before redirecting user to eSewa gateway
   */
  async generateEsewaHash(
    productId: string,
    quantity: number,
    discountPercent: number,
    notes?: string,
  ): Promise<PaymentHashResponse> {
    const response = await axios.post<PaymentHashResponse>(
      `${API_URL}/payments/esewa/hash`,
      {
        productId,
        quantity,
        discountPercent,
        notes,
      },
    );
    return response.data;
  },

  /**
   * Verify eSewa payment
   * Called after user returns from eSewa gateway
   */
  async verifyEsewaPayment(transactionData: {
    oid: string; // Order ID from eSewa
    amt: number; // Amount paid
    refId: string; // Reference ID from eSewa
    sid: string; // Service ID (typically "ESEWAPAY")
  }): Promise<PaymentVerificationResponse> {
    const response = await axios.post<PaymentVerificationResponse>(
      `${API_URL}/payments/esewa/verify`,
      transactionData,
    );
    return response.data;
  },

  /**
   * Get payment status for an order
   */
  async getPaymentStatus(orderId: string): Promise<{
    success: boolean;
    data?: {
      paymentMethod: string;
      paymentCode: string;
      status: string;
      transactionId?: string;
      createdAt: string;
    };
  }> {
    const response = await axios.get(`${API_URL}/payments/status/${orderId}`);
    return response.data;
  },
};
