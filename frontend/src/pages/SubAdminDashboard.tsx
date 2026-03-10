import React, { useEffect, useState, useMemo } from "react";
import {
  AdminLayout,
  DashboardSidebar,
  type NavigationItem,
} from "@/components/layouts";
import { subAdminService } from "@/services/subAdminService";
import { getAllProducts } from "@/services/productsService";
import { BarChart3, Users, Package, LayoutDashboard } from "lucide-react";

type Seller = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  companyName?: string;
  vendorName?: string;
  isActive: boolean;
  createdAt: string;
  ordersCount?: number;
  totalRevenue?: number;
};

const SubAdminDashboard: React.FC = () => {
  const [active, setActive] = useState<Seller[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState<"dashboard" | "active" | "products">(
    "dashboard",
  );

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const a = await subAdminService.listSellers("active");
      setActive(a.data || []);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load sellers");
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await getAllProducts();
      setProducts(Array.isArray(res) ? res : res.data || []);
    } catch (e: any) {
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    loadProducts();
  }, []);

  const totalProducts = products.length;
  const availableProducts = products.filter((p) => p.isAvailable).length;
  const totalQuantity = products.reduce((sum, p) => sum + (p.quantity || 0), 0);

  const navigationItems = useMemo<NavigationItem[]>(
    () => [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
      },
      {
        id: "active",
        label: "Active Sellers",
        icon: Users,
        badge: { value: active.length, color: "gray" as const },
      },
      {
        id: "products",
        label: "All Products",
        icon: Package,
        badge: { value: totalProducts, color: "gray" as const },
      },
    ],
    [active.length, totalProducts],
  );

  return (
    <AdminLayout>
      <div className="flex min-h-screen bg-gray-50">
        <DashboardSidebar
          title="Sub-Admin Panel"
          navigationItems={navigationItems}
          currentView={view}
          onViewChange={(newView) => setView(newView as typeof view)}
          colorScheme="blue"
        />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="px-8 py-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              {view === "dashboard" && "Dashboard"}
              {view === "active" && "Active Sellers"}
              {view === "products" && "All Products"}
            </h1>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {/* Dashboard View */}
            {view === "dashboard" && (
              <>
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500 uppercase">
                          Active Sellers
                        </p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                          {active.length}
                        </p>
                      </div>
                      <div className="p-3 bg-green-100 rounded-full">
                        <Users className="w-8 h-8 text-green-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500 uppercase">
                          Total Products
                        </p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                          {totalProducts}
                        </p>
                      </div>
                      <div className="p-3 bg-blue-100 rounded-full">
                        <Package className="w-8 h-8 text-blue-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500 uppercase">
                          Active Products
                        </p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                          {availableProducts}
                        </p>
                      </div>
                      <div className="p-3 bg-purple-100 rounded-full">
                        <BarChart3 className="w-8 h-8 text-purple-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500 uppercase">
                          Available Stock
                        </p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                          {totalQuantity}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">units</p>
                      </div>
                      <div className="p-3 bg-orange-100 rounded-full">
                        <Package className="w-8 h-8 text-orange-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Sellers */}
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Recent Active Sellers
                    </h3>
                    <div className="space-y-3">
                      {active.slice(0, 5).map((seller) => (
                        <div
                          key={seller.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-gray-900">
                              {seller.firstName} {seller.lastName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {seller.companyName}
                            </p>
                          </div>
                          <span className="text-sm text-gray-600">
                            {seller.ordersCount || 0} orders
                          </span>
                        </div>
                      ))}
                      {active.length === 0 && (
                        <p className="text-gray-500 text-center py-4">
                          No active sellers
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Recent Products */}
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Recent Products
                    </h3>
                    <div className="space-y-3">
                      {products.slice(0, 5).map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-gray-900">
                              {product.cropName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {product.category}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {product.quantity} {product.unit}
                            </p>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                product.isAvailable
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {product.isAvailable ? "Available" : "Out"}
                            </span>
                          </div>
                        </div>
                      ))}
                      {products.length === 0 && (
                        <p className="text-gray-500 text-center py-4">
                          No products
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Active Sellers Table */}
            {view === "active" && !loading && (
              <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Orders
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Revenue
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {active.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-8 text-center text-gray-500"
                        >
                          No active sellers found
                        </td>
                      </tr>
                    ) : (
                      active.map((s) => (
                        <tr
                          key={s.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {s.firstName} {s.lastName}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {s.email}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {s.companyName}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {s.phone}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {s.ordersCount || 0}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              ₹{s.totalRevenue?.toFixed(2) || "0.00"}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Products Table */}
            {view === "products" && !loading && (
              <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-8 text-center text-gray-500"
                        >
                          No products found
                        </td>
                      </tr>
                    ) : (
                      products.map((p) => (
                        <tr
                          key={p.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {p.cropName}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              {p.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {p.quantity} {p.unit}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              ₹{p.currentPrice || p.minPriceExpected}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                p.isAvailable
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {p.isAvailable ? "Available" : "Out of Stock"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {p.location || "N/A"}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {loading && (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
        </main>
      </div>
    </AdminLayout>
  );
};

export default SubAdminDashboard;
