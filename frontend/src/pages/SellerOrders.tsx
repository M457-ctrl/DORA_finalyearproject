import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ordersService } from "../services/ordersService";

type SellerOrder = {
  id: string;
  productId: string;
  productName: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  quantity: number;
  unitPrice: string;
  discountPercent: number;
  totalPrice: string;
  status: string;
  notes?: string;
  createdAt: string;
};

const SellerOrders: React.FC = () => {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<SellerOrder | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    loadMyOrders();
  }, []);

  const loadMyOrders = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await ordersService.getMySellerOrders();
      setOrders(res.data || []);
    } catch (err) {
      setError(
        "Failed to load orders" +
          (err instanceof Error ? `: ${err.message}` : ""),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrderDetails = (order: SellerOrder) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const handleUpdateOrderStatus = async (newStatus: string) => {
    if (!selectedOrder) return;

    try {
      setLoading(true);
      setError("");
      await ordersService.updateOrderStatus(selectedOrder.id, newStatus);
      setSuccess(`Order status updated to ${newStatus}`);

      await loadMyOrders();

      setSelectedOrder((prev) =>
        prev ? { ...prev, status: newStatus } : null,
      );

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(
        "Failed to update order status" +
          (err instanceof Error ? `: ${err.message}` : ""),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Orders
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Seller: {user?.firstName} {user?.lastName}
                </p>
              </div>
              <div className="flex gap-3">
                <Link
                  to="/seller/dashboard"
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Dashboard
                </Link>
                <Link
                  to="/seller/products"
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Products
                </Link>
                <button
                  onClick={logout}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-white shadow sm:rounded-lg p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h4 className="text-lg font-medium text-gray-900">Orders List</h4>
              <button
                onClick={loadMyOrders}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Refresh
              </button>
            </div>

            {success && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-800">{success}</p>
              </div>
            )}

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {loading ? (
              <p className="text-center py-8 text-gray-500">Loading...</p>
            ) : orders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-2">No orders yet.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Qty
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orders
                        .slice(
                          (currentPage - 1) * itemsPerPage,
                          currentPage * itemsPerPage,
                        )
                        .map((o) => (
                          <tr key={o.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {o.id}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {o.productName || "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {o.quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ₹{o.totalPrice}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  o.status === "delivered"
                                    ? "bg-green-100 text-green-800"
                                    : o.status === "shipped"
                                      ? "bg-blue-100 text-blue-800"
                                      : o.status === "processing"
                                        ? "bg-purple-100 text-purple-800"
                                        : o.status === "verified"
                                          ? "bg-indigo-100 text-indigo-800"
                                          : o.status === "cancelled"
                                            ? "bg-red-100 text-red-800"
                                            : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {o.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(o.createdAt).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => handleViewOrderDetails(o)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  <div className="mt-4 text-right text-sm">
                    <span className="font-medium">Revenue: </span>₹
                    {orders
                      .reduce((sum, o) => sum + Number(o.totalPrice || 0), 0)
                      .toFixed(2)}
                  </div>
                </div>
                {orders.length > itemsPerPage && (
                  <div className="flex items-center justify-between mt-4 px-4">
                    <div className="text-sm text-gray-700">
                      Showing{" "}
                      <span className="font-medium">
                        {(currentPage - 1) * itemsPerPage + 1}
                      </span>{" "}
                      to{" "}
                      <span className="font-medium">
                        {Math.min(currentPage * itemsPerPage, orders.length)}
                      </span>{" "}
                      of <span className="font-medium">{orders.length}</span>{" "}
                      orders
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(1, prev - 1))
                        }
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <span className="px-3 py-1 text-sm text-gray-700">
                        Page {currentPage} of{" "}
                        {Math.ceil(orders.length / itemsPerPage)}
                      </span>
                      <button
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(
                              Math.ceil(orders.length / itemsPerPage),
                              prev + 1,
                            ),
                          )
                        }
                        disabled={
                          currentPage ===
                          Math.ceil(orders.length / itemsPerPage)
                        }
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {showOrderDetails && selectedOrder && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-md bg-white">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Order Details
                  </h3>
                  <button
                    onClick={() => {
                      setShowOrderDetails(false);
                      setSelectedOrder(null);
                    }}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <span className="text-2xl">&times;</span>
                  </button>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-800 text-sm">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-green-800 text-sm">{success}</p>
                  </div>
                )}

                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">
                      Order Information
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Order ID</p>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedOrder.id}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Date</p>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(selectedOrder.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Product</p>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedOrder.productName}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Quantity</p>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedOrder.quantity}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">
                      Buyer Information
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Name</p>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedOrder.buyerName || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedOrder.buyerEmail || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">
                      Pricing Details
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Unit Price</span>
                        <span className="font-medium text-gray-900">
                          ₹{selectedOrder.unitPrice}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Discount</span>
                        <span className="font-medium text-gray-900">
                          {selectedOrder.discountPercent}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm pt-2 border-t">
                        <span className="text-gray-700 font-medium">
                          Total Amount
                        </span>
                        <span className="font-bold text-gray-900 text-lg">
                          ₹{selectedOrder.totalPrice}
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedOrder.notes && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                      <p className="text-sm text-gray-700">
                        {selectedOrder.notes}
                      </p>
                    </div>
                  )}

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">
                      Update Order Status
                    </h4>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm text-gray-500">
                        Current Status:
                      </span>
                      <span
                        className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${
                          selectedOrder.status === "delivered"
                            ? "bg-green-100 text-green-800"
                            : selectedOrder.status === "shipped"
                              ? "bg-blue-100 text-blue-800"
                              : selectedOrder.status === "processing"
                                ? "bg-purple-100 text-purple-800"
                                : selectedOrder.status === "verified"
                                  ? "bg-indigo-100 text-indigo-800"
                                  : selectedOrder.status === "cancelled"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {selectedOrder.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "pending",
                        "verified",
                        "processing",
                        "shipped",
                        "delivered",
                      ].map((status) => (
                        <button
                          key={status}
                          onClick={() => handleUpdateOrderStatus(status)}
                          disabled={loading || selectedOrder.status === status}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            selectedOrder.status === status
                              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                              : "bg-blue-600 text-white hover:bg-blue-700"
                          }`}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => {
                      setShowOrderDetails(false);
                      setSelectedOrder(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerOrders;
