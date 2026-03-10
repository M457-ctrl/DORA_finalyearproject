/**
 * Payment Success Page - Example Implementation
 * Location: frontend/src/pages/PaymentSuccess.tsx
 *
 * This page handles the success callback from eSewa payment gateway
 * User is redirected here after successful payment with transaction data
 */

import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layouts";
import { paymentsService } from "@/services/paymentsService";
import { CheckCircle } from "lucide-react";

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState("");
  const [paymentData, setPaymentData] = useState<{
    orderId: string;
    totalPrice: number;
    transactionId: string;
    paymentCode: string;
  } | null>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        setVerifying(true);

        // Extract transaction data from URL query params
        const oid = searchParams.get("oid"); // Order/Product ID
        const amt = searchParams.get("amt"); // Amount
        const refId = searchParams.get("refId"); // eSewa Transaction ID
        const sid = searchParams.get("sid"); // Service ID

        if (!oid || !amt || !refId) {
          setError("Invalid payment data. Missing transaction details.");
          setLoading(false);
          return;
        }

        // Verify payment with backend
        const response = await paymentsService.verifyEsewaPayment({
          oid,
          amt: parseFloat(amt),
          refId,
          sid: sid || "ESEWAPAY",
        });

        if (response.success && response.data) {
          setPaymentData(response.data);
        } else {
          setError(response.message || "Payment verification failed");
        }
      } catch (e: unknown) {
        const errorMsg =
          (e as { response?: { data?: { message?: string } } })?.response?.data
            ?.message || "Failed to verify payment. Please contact support.";
        setError(errorMsg);
      } finally {
        setVerifying(false);
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams]);

  if (loading || verifying) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <p className="text-gray-600">Verifying your payment...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h1 className="text-2xl font-bold text-red-700 mb-3">
              ❌ Payment Verification Failed
            </h1>
            <p className="text-red-600 mb-4">{error}</p>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">What you can do:</p>
              <ul className="text-sm text-gray-600 list-disc list-inside">
                <li>Contact customer support with your transaction details</li>
                <li>Check your eSewa account for transaction confirmation</li>
                <li>Retry payment from your orders page</li>
              </ul>
            </div>
            <button
              onClick={() => navigate("/products")}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Back to Products
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success Card */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-8">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle size={32} className="text-green-600" />
            </div>
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-green-700 text-center mb-2">
            Payment Successful! 🎉
          </h1>
          <p className="text-gray-600 text-center mb-6">
            Your payment has been verified and your order is confirmed.
          </p>

          {/* Payment Details */}
          {paymentData && (
            <div className="bg-white border border-green-100 rounded p-6 mb-6">
              <h2 className="font-semibold text-gray-800 mb-4">
                Payment Details
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Order ID:</span>
                  <span className="font-semibold text-gray-800">
                    {paymentData.orderId}
                  </span>
                </div>

                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Transaction ID:</span>
                  <span className="font-semibold text-gray-800">
                    {paymentData.transactionId}
                  </span>
                </div>

                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Payment Code:</span>
                  <span className="font-semibold text-gray-800">
                    {paymentData.paymentCode}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="text-xl font-bold text-green-600">
                    Rs. {paymentData.totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Information Box */}
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-6">
            <p className="text-sm text-yellow-800">
              <strong>📧 Confirmation Email:</strong> A payment confirmation
              email has been sent to your registered email address. You can use
              the details in this email to track your order.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => navigate("/products/my-orders")}
              className="w-full px-4 py-3 bg-green-600 text-white rounded hover:bg-green-700 font-semibold"
            >
              View My Orders
            </button>

            <button
              onClick={() => navigate("/products")}
              className="w-full px-4 py-3 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 font-semibold"
            >
              Continue Shopping
            </button>
          </div>

          {/* Next Steps */}
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-semibold text-gray-800 mb-3">Next Steps:</h3>
            <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
              <li>Seller will prepare your order for delivery</li>
              <li>You'll receive a shipping notification</li>
              <li>Track your delivery status anytime</li>
              <li>Confirm delivery when order arrives</li>
            </ol>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default PaymentSuccess;
