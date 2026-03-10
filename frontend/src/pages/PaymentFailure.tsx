/**
 * Payment Failure Page - Example Implementation
 * Location: frontend/src/pages/PaymentFailure.tsx
 *
 * This page handles the failure callback from eSewa payment gateway
 * User is redirected here if payment fails or is cancelled
 */

import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layouts";
import { XCircle } from "lucide-react";

const PaymentFailure: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [retrying, setRetrying] = useState(false);

  // Extract error info from URL params
  const errorCode = searchParams.get("error");
  const errorMessage = searchParams.get("message");

  const handleRetryPayment = async () => {
    try {
      setRetrying(true);
      // Navigate back to checkout to allow user to retry
      // You may want to prefill the order data if stored
      navigate("/products");
    } finally {
      setRetrying(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Failure Card */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-8">
          {/* Failure Icon */}
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle size={32} className="text-red-600" />
            </div>
          </div>

          {/* Failure Message */}
          <h1 className="text-3xl font-bold text-red-700 text-center mb-2">
            Payment Failed ❌
          </h1>
          <p className="text-gray-600 text-center mb-6">
            Unfortunately, your payment could not be processed. Please try again
            or use a different payment method.
          </p>

          {/* Error Details */}
          {(errorCode || errorMessage) && (
            <div className="bg-white border border-red-100 rounded p-6 mb-6">
              <h2 className="font-semibold text-gray-800 mb-4">
                Error Details
              </h2>

              <div className="space-y-3">
                {errorCode && (
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">Error Code:</span>
                    <span className="font-semibold text-gray-800">
                      {errorCode}
                    </span>
                  </div>
                )}

                {errorMessage && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Message:</span>
                    <span className="font-semibold text-gray-800">
                      {errorMessage}
                    </span>
                  </div>
                )}

                {!errorCode && !errorMessage && (
                  <p className="text-sm text-gray-600">
                    Your payment was declined or cancelled. No transaction was
                    processed.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Important Information */}
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-6">
            <p className="text-sm text-yellow-800">
              <strong>💡 Important:</strong> Your order was not created.{" "}
              <strong>No money was deducted</strong> from your account. You can
              safely retry the payment.
            </p>
          </div>

          {/* Possible Reasons */}
          <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-3">
              Possible Reasons:
            </h3>
            <ul className="text-sm text-blue-800 space-y-2">
              <li>• Insufficient balance in your eSewa account</li>
              <li>• Invalid payment information</li>
              <li>• Payment request timed out</li>
              <li>• You cancelled the payment</li>
              <li>• Temporary network issue</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleRetryPayment}
              disabled={retrying}
              className="w-full px-4 py-3 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 font-semibold"
            >
              {retrying ? "Processing..." : "Try Payment Again"}
            </button>

            <button
              onClick={() => navigate("/products")}
              className="w-full px-4 py-3 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 font-semibold"
            >
              Back to Products
            </button>

            <button
              onClick={() => navigate("/help")}
              className="w-full px-4 py-3 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 font-semibold"
            >
              Need Help? Contact Support
            </button>
          </div>

          {/* Troubleshooting Section */}
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-semibold text-gray-800 mb-3">
              Troubleshooting:
            </h3>
            <div className="text-sm text-gray-600 space-y-3">
              <div>
                <p className="font-semibold text-gray-700">
                  💳 Your eSewa account:
                </p>
                <ul className="list-disc list-inside mt-1 text-gray-600">
                  <li>Check if your wallet has sufficient balance</li>
                  <li>Try removing and re-adding your payment method</li>
                  <li>Ensure your account is not restricted or frozen</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-gray-700">
                  🌐 Network issues:
                </p>
                <ul className="list-disc list-inside mt-1 text-gray-600">
                  <li>Ensure you have stable internet connection</li>
                  <li>Try refreshing and retry the payment</li>
                  <li>Clear your browser cache and cookies</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-gray-700">
                  💬 Other payment methods:
                </p>
                <ul className="list-disc list-inside mt-1 text-gray-600">
                  <li>Try paying with a different method</li>
                  <li>Use Cash on Delivery if available</li>
                  <li>
                    Contact our support team for alternative payment options
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Support Information */}
          <div className="mt-6 pt-6 border-t bg-gray-50 rounded p-4">
            <p className="text-sm text-gray-700">
              <strong>📞 Still having issues?</strong> Contact our customer
              support team:
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Email: support@nepagrimarket.com | Phone: +977-1-XXXXXXX
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default PaymentFailure;
