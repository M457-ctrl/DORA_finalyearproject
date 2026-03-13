import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { MainLayout } from "@/components/layouts";
import { getProductById, type Product } from "@/services/productsService";
import { ordersService } from "@/services/ordersService";
import { paymentsService } from "@/services/paymentsService";
import { CreditCard, Banknote } from "lucide-react";

type PaymentMethod = "cod" | "khalti";

const Checkout: React.FC = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [processingKhalti, setProcessingKhalti] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!productId) return;
      try {
        setLoading(true);
        const res = await getProductById(productId);
        if (res?.success) setProduct(res.data);
        else setError(res?.message || "Failed to load product");
      } catch (e: unknown) {
        const errorMsg =
          (e as { response?: { data?: { message?: string } } })?.response?.data
            ?.message || "Failed to load product";
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [productId]);

  const unitPrice = product
    ? Number(product.currentPrice || product.minPriceExpected)
    : 0;
  const discountPercent = product?.discountPercent || 0;
  const gross = +(unitPrice * quantity).toFixed(2);
  const total = +(gross * (1 - discountPercent / 100)).toFixed(2);

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) return;

    try {
      setLoading(true);
      setError("");

      // Create order with COD
      if (paymentMethod === "cod") {
        const res = await ordersService.createOrder({
          productId,
          quantity,
          discountPercent,
          notes: notes || undefined,
          paymentMethod: "cod",
          paymentCode: `COD-${Date.now()}`,
        });

        if (res?.success) {
          alert(
            `Order placed successfully!\nPayment Method: Cash on Delivery\nTotal: Rs. ${res.data.totalPrice}\nPayment Code: ${res.data.paymentCode}`,
          );
          navigate("/products");
        } else {
          setError(res?.message || "Failed to place order");
        }
      } else {
        // Khalti payment flow
        await initiateKhaltiPayment();
      }
    } catch (e: unknown) {
      const errorMsg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to place order";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const initiateKhaltiPayment = async () => {
    try {
      setProcessingKhalti(true);

      if (!productId) {
        setError("Invalid product selected for payment");
        return;
      }

      // Step 1: Initiate Khalti payment and get redirect URL
      const paymentResponse = await paymentsService.initiateKhaltiPayment(
        productId,
        quantity,
        discountPercent,
        notes,
      );

      if (!paymentResponse?.success) {
        setError(
          paymentResponse?.message || "Failed to initiate Khalti payment",
        );
        return;
      }

      const { khaltiData } = paymentResponse.data;

      if (!khaltiData?.paymentUrl) {
        setError("Khalti payment URL not found");
        return;
      }

      // Step 2: Redirect user to Khalti hosted checkout page
      window.location.href = khaltiData.paymentUrl;
    } catch (e: unknown) {
      const errorMsg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to initiate Khalti payment";
      setError(errorMsg);
    } finally {
      setProcessingKhalti(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Checkout</h1>
          <Link to="/products" className="text-blue-600 hover:text-blue-700">
            Back to Products
          </Link>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
            {error}
          </div>
        )}

        {loading && <p className="text-gray-600">Loading...</p>}

        {product && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Summary */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold mb-3">Product Summary</h2>
              <div className="flex gap-3 mb-3">
                <img
                  src={product.imageUrl || "https://via.placeholder.com/160"}
                  alt={product.cropName}
                  className="w-32 h-32 object-cover rounded"
                />
                <div>
                  <div className="font-bold text-gray-800">
                    {product.cropName}
                  </div>
                  <div className="text-sm text-gray-600">
                    {product.category}
                  </div>
                  <div className="text-sm text-gray-600">
                    Available: {product.quantity} {product.unit}
                  </div>
                  <div className="text-sm text-gray-600">
                    Location: {product.location}
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-700">{product.description}</p>
            </div>

            {/* Checkout Form */}
            <form
              onSubmit={placeOrder}
              className="bg-white rounded-lg shadow p-4 space-y-3"
            >
              <h2 className="text-lg font-semibold">Order Details</h2>
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Unit Price (Rs.)
                </label>
                <input
                  type="number"
                  value={unitPrice}
                  readOnly
                  className="w-full border rounded px-3 py-2 bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  value={quantity}
                  min={1}
                  max={product.quantity}
                  onChange={(e) =>
                    setQuantity(
                      Math.max(
                        1,
                        Math.min(
                          product.quantity,
                          parseInt(e.target.value || "1", 10),
                        ),
                      ),
                    )
                  }
                  className="w-full border rounded px-3 py-2"
                />
                <p className="text-xs text-gray-500">
                  Max available: {product.quantity} {product.unit}
                </p>
              </div>
              {discountPercent > 0 && (
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Discount
                  </label>
                  <input
                    type="text"
                    value={`${discountPercent}% OFF`}
                    readOnly
                    className="w-full border rounded px-3 py-2 bg-gray-50 text-green-600 font-semibold"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Delivery instructions, etc."
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              {/* Payment Method Selection */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-3">Payment Method</h3>
                <div className="space-y-3">
                  {/* Cash on Delivery Option */}
                  <label
                    className="flex items-start gap-3 p-3 border rounded cursor-pointer hover:bg-blue-50"
                    style={{
                      borderColor:
                        paymentMethod === "cod" ? "#3b82f6" : "#d1d5db",
                      backgroundColor:
                        paymentMethod === "cod" ? "#eff6ff" : "transparent",
                    }}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === "cod"}
                      onChange={(e) =>
                        setPaymentMethod(e.target.value as PaymentMethod)
                      }
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 font-semibold text-gray-800">
                        <Banknote size={20} className="text-green-600" />
                        Cash on Delivery (COD)
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Pay when your order arrives. No upfront payment needed.
                      </p>
                      {paymentMethod === "cod" && (
                        <div className="mt-2 text-xs bg-green-50 border border-green-200 rounded p-2 text-green-700">
                          ✓ Payment Code will be generated after order
                          confirmation
                        </div>
                      )}
                    </div>
                  </label>

                  {/* Khalti Payment Option */}
                  <label
                    className="flex items-start gap-3 p-3 border rounded cursor-pointer hover:bg-green-50"
                    style={{
                      borderColor:
                        paymentMethod === "khalti" ? "#10b981" : "#d1d5db",
                      backgroundColor:
                        paymentMethod === "khalti" ? "#f0fdf4" : "transparent",
                    }}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="khalti"
                      checked={paymentMethod === "khalti"}
                      onChange={(e) =>
                        setPaymentMethod(e.target.value as PaymentMethod)
                      }
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 font-semibold text-gray-800">
                        <CreditCard size={20} className="text-teal-600" />
                        Khalti Payment Gateway
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Pay securely using Khalti wallet, cards, or mobile
                        banking.
                      </p>
                      {paymentMethod === "khalti" && (
                        <div className="mt-2 text-xs bg-teal-50 border border-teal-200 rounded p-2 text-teal-700">
                          ✓ You'll be redirected to Khalti for secure payment
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              {/* Price breakdown */}
              <div className="border-t pt-3">
                <div className="flex justify-between text-sm">
                  <span>Gross</span>
                  <span>Rs. {gross.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Discount</span>
                  <span>{discountPercent}%</span>
                </div>
                <div className="flex justify-between text-lg font-bold mt-1">
                  <span>Total</span>
                  <span>Rs. {total.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || processingKhalti}
                className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 font-semibold"
              >
                {paymentMethod === "cod"
                  ? loading
                    ? "Placing Order..."
                    : "Place Order - Pay on Delivery"
                  : processingKhalti
                    ? "Redirecting to Khalti..."
                    : `Pay Rs. ${total.toFixed(2)} via Khalti`}
              </button>

              {paymentMethod === "khalti" && (
                <p className="text-xs text-gray-500 text-center">
                  You will be securely redirected to Khalti after clicking the
                  button above
                </p>
              )}
            </form>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Checkout;
