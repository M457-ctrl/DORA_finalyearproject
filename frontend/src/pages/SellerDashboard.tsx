import React, { useState, useEffect, useMemo } from "react";
// import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import type { Product } from "../services/productsService";
import {
  createProduct,
  updateProduct,
  getCategories,
} from "../services/productsService";
import { ordersService } from "@/services/ordersService";
import { DashboardSidebar, type NavigationItem } from "@/components/layouts";
import {
  LayoutDashboard,
  Package,
  PackagePlus,
  ShoppingCart,
  Settings,
} from "lucide-react";

const SellerDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  // const navigate = useNavigate();
  const [categories, setCategories] = useState<string[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string>("");
  const [view, setView] = useState<
    "dashboard" | "addProduct" | "myProducts" | "orders" | "settings"
  >("dashboard");
  const [selectedOrder, setSelectedOrder] = useState<{
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
  } | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  const [formData, setFormData] = useState({
    cropName: "",
    description: "",
    category: "",
    quantity: "",
    unit: "kg",
    minPriceExpected: "",
    maxPriceExpected: "",
    currentPrice: "",
    discountPercent: "",
    imageUrl: "",
    harvestDate: "",
    expiryDate: "",
    location: "",
    isSeasonal: false,
    isAvailable: true,
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const navigationItems = useMemo<NavigationItem[]>(
    () => [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
      },
      {
        id: "addProduct",
        label: "Add Product",
        icon: PackagePlus,
      },
      {
        id: "myProducts",
        label: "My Products",
        icon: Package,
      },
      {
        id: "orders",
        label: "Orders",
        icon: ShoppingCart,
      },
      {
        id: "settings",
        label: "Settings",
        icon: Settings,
      },
    ],
    [],
  );

  const loadCategories = async () => {
    try {
      const cats = await getCategories();
      console.log("Loaded categories:", cats);
      setCategories(Array.isArray(cats) ? cats : []);
    } catch {
      console.error("Failed to load categories:");
      // Set default categories as fallback
      setCategories([
        "Vegetables",
        "Fruits",
        "Grains",
        "Pulses",
        "Spices",
        "Dairy",
        "Organic",
        "Seeds",
        "Fertilizers",
        "Equipment",
        "Other",
      ]);
    }
  };

  const loadMyOrders = async () => {
    try {
      setLoading(true);
      setError("");
      await ordersService.getMySellerOrders();
      // setOrders(res.data || []);
    } catch (err) {
      setError(
        "Failed to load orders" +
          (err instanceof Error ? `: ${err.message}` : ""),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (newStatus: string) => {
    if (!selectedOrder) return;

    try {
      setLoading(true);
      setError("");
      await ordersService.updateOrderStatus(selectedOrder.id, newStatus);
      setSuccess(`Order status updated to ${newStatus}`);

      // Reload orders
      await loadMyOrders();

      // Update selected order
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

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const resetForm = () => {
    setFormData({
      cropName: "",
      description: "",
      category: "",
      quantity: "",
      unit: "kg",
      minPriceExpected: "",
      maxPriceExpected: "",
      currentPrice: "",
      discountPercent: "",
      imageUrl: "",
      harvestDate: "",
      expiryDate: "",
      location: "",
      isSeasonal: false,
      isAvailable: true,
    });
    setEditingProduct(null);
    setError("");
    setSuccess("");
    setImagePreview("");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB");
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file");
        return;
      }

      // Read file as base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        setFormData((prev) => ({
          ...prev,
          imageUrl: base64String,
        }));
        setError("");
      };
      reader.onerror = () => {
        setError("Failed to read image file");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const productData = {
        cropName: formData.cropName,
        description: formData.description,
        category: formData.category,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        minPriceExpected: parseFloat(formData.minPriceExpected),
        maxPriceExpected: parseFloat(formData.maxPriceExpected),
        currentPrice: formData.currentPrice
          ? parseFloat(formData.currentPrice)
          : undefined,
        discountPercent: formData.discountPercent
          ? parseInt(formData.discountPercent, 10)
          : undefined,
        imageUrl: formData.imageUrl || undefined,
        harvestDate: formData.harvestDate || undefined,
        expiryDate: formData.expiryDate || undefined,
        location: formData.location,
        isSeasonal: formData.isSeasonal,
        isAvailable: formData.isAvailable,
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
        setSuccess("Product updated successfully!");
      } else {
        await createProduct(productData);
        setSuccess("Product created successfully!");
      }

      setTimeout(() => {
        resetForm();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar
        title="Seller Panel"
        subtitle={`${user?.firstName} ${user?.lastName}`}
        navigationItems={navigationItems}
        currentView={view}
        onViewChange={(newView) => setView(newView as typeof view)}
        colorScheme="green"
        showLogout={true}
        onLogout={logout}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            {view === "dashboard" && "Dashboard"}
            {view === "addProduct" && "Add New Product"}
            {view === "myProducts" && "My Products"}
            {view === "orders" && "Orders"}
            {view === "settings" && "Settings"}
          </h1>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800">{success}</p>
            </div>
          )}

          {/* Dashboard View */}
          {view === "dashboard" && (
            <div>
              {/* Analytics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 uppercase">
                        Total Products
                      </p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <Package className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 uppercase">
                        Active Products
                      </p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <PackagePlus className="w-8 h-8 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 uppercase">
                        Total Orders
                      </p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
                    </div>
                    <div className="p-3 bg-yellow-100 rounded-full">
                      <ShoppingCart className="w-8 h-8 text-yellow-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 uppercase">
                        Total Revenue
                      </p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        ₹0
                      </p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-full">
                      <LayoutDashboard className="w-8 h-8 text-purple-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Quick Actions
                  </h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => setView("addProduct")}
                      className="w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors flex items-center"
                    >
                      <PackagePlus className="w-5 h-5 text-green-600 mr-3" />
                      <span className="text-green-700 font-medium">
                        Add New Product
                      </span>
                    </button>
                    <button
                      onClick={() => setView("myProducts")}
                      className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center"
                    >
                      <Package className="w-5 h-5 text-blue-600 mr-3" />
                      <span className="text-blue-700 font-medium">
                        View My Products
                      </span>
                    </button>
                    <button
                      onClick={() => setView("orders")}
                      className="w-full text-left px-4 py-3 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors flex items-center"
                    >
                      <ShoppingCart className="w-5 h-5 text-yellow-600 mr-3" />
                      <span className="text-yellow-700 font-medium">
                        View Orders
                      </span>
                    </button>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Seller Information
                  </h3>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm text-gray-500">Company Name</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {user?.companyName || "N/A"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Vendor Name</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {user?.vendorName || "N/A"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Email</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {user?.email}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Phone</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {user?.phone}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Status</dt>
                      <dd className="text-sm font-medium">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user?.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {user?.isActive ? "Active" : "Inactive"}
                        </span>
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          )}

          {/* Add Product View */}
          {view === "addProduct" && (
            <div className="bg-white shadow sm:rounded-lg p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Crop Name *
                    </label>
                    <input
                      type="text"
                      name="cropName"
                      value={formData.cropName}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Category *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isSeasonal"
                      name="isSeasonal"
                      checked={formData.isSeasonal}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isSeasonal: e.target.checked,
                        })
                      }
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="isSeasonal"
                      className="ml-2 block text-sm text-gray-700"
                    >
                      Mark as Seasonal Fruit
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Unit *
                    </label>
                    <select
                      name="unit"
                      value={formData.unit}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="kg">kg</option>
                      <option value="quintal">quintal</option>
                      <option value="ton">ton</option>
                      <option value="piece">piece</option>
                      <option value="dozen">dozen</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Min Price Expected (₹) *
                    </label>
                    <input
                      type="number"
                      name="minPriceExpected"
                      value={formData.minPriceExpected}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Max Price Expected (₹) *
                    </label>
                    <input
                      type="number"
                      name="maxPriceExpected"
                      value={formData.maxPriceExpected}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Current Price (₹)
                    </label>
                    <input
                      type="number"
                      name="currentPrice"
                      value={formData.currentPrice}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Discount (%)
                    </label>
                    <input
                      type="number"
                      name="discountPercent"
                      value={formData.discountPercent}
                      onChange={handleInputChange}
                      min="0"
                      max="90"
                      step="1"
                      placeholder="0-90%"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Optional: Discount percentage (0-90%)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Location *
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Product Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Max file size: 5MB. Supported formats: JPG, PNG, GIF, WebP
                    </p>

                    {imagePreview && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Preview:
                        </p>
                        <img
                          src={imagePreview}
                          alt="Product preview"
                          className="h-32 w-32 object-cover rounded-lg border border-gray-300"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Market Date
                    </label>
                    <input
                      type="date"
                      name="harvestDate"
                      value={formData.harvestDate}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      name="expiryDate"
                      value={formData.expiryDate}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="isAvailable"
                      checked={formData.isAvailable}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Available for sale
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Clear Form
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    {loading
                      ? "Saving..."
                      : editingProduct
                        ? "Update Product"
                        : "Create Product"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* My Products View */}
          {view === "myProducts" && (
            <div className="bg-white shadow sm:rounded-lg p-6">
              <p className="text-gray-600">
                Product listing will be displayed here.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                This section will show all your products with options to edit
                and delete.
              </p>
            </div>
          )}

          {/* Orders View */}
          {view === "orders" && (
            <div className="bg-white shadow sm:rounded-lg p-6">
              <p className="text-gray-600">
                Your orders will be displayed here.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                This section will show all orders for your products.
              </p>
            </div>
          )}

          {/* Settings View */}
          {view === "settings" && (
            <div className="bg-white shadow sm:rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Account Settings
              </h3>
              <dl className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <dt className="text-sm font-medium text-gray-500">
                    Full Name
                  </dt>
                  <dd className="col-span-2 text-sm text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </dd>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <dt className="text-sm font-medium text-gray-500">
                    Company Name
                  </dt>
                  <dd className="col-span-2 text-sm text-gray-900">
                    {user?.companyName || "N/A"}
                  </dd>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <dt className="text-sm font-medium text-gray-500">
                    Vendor Name
                  </dt>
                  <dd className="col-span-2 text-sm text-gray-900">
                    {user?.vendorName || "N/A"}
                  </dd>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="col-span-2 text-sm text-gray-900">
                    {user?.email}
                  </dd>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="col-span-2 text-sm text-gray-900">
                    {user?.phone}
                  </dd>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <dt className="text-sm font-medium text-gray-500">Role</dt>
                  <dd className="col-span-2 text-sm">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {user?.role.toUpperCase()}
                    </span>
                  </dd>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <dt className="text-sm font-medium text-gray-500">
                    Account Status
                  </dt>
                  <dd className="col-span-2 text-sm">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user?.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {user?.isActive ? "Active" : "Inactive"}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          )}

          {/* Order Details Modal */}
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
                  {/* Order Information */}
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

                  {/* Buyer Information */}
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

                  {/* Pricing Details */}
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

                  {/* Notes */}
                  {selectedOrder.notes && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                      <p className="text-sm text-gray-700">
                        {selectedOrder.notes}
                      </p>
                    </div>
                  )}

                  {/* Order Status Management */}
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
      </main>
    </div>
  );
};

export default SellerDashboard;
