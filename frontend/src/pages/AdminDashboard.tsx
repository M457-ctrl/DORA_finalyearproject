import React, { useEffect, useState, useMemo } from "react";
import {
  AdminLayout,
  DashboardSidebar,
  type NavigationItem,
} from "@/components/layouts";
import {
  adminService,
  type SellerInput,
  type SubAdminInput,
  type SubAdmin,
} from "@/services/adminService";
import { LayoutDashboard, Users, UserPlus, UserCog, Clock } from "lucide-react";

type Seller = {
  id: string;
  email: string;
  role: string;
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

const AdminDashboard: React.FC = () => {
  const [pending, setPending] = useState<Seller[]>([]);
  const [active, setActive] = useState<Seller[]>([]);
  const [subAdmins, setSubAdmins] = useState<SubAdmin[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [view, setView] = useState<
    "dashboard" | "pending" | "active" | "addSeller" | "addSubAdmin"
  >("dashboard");
  const [addForm, setAddForm] = useState<SellerInput>({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    companyName: "",
    vendorName: "",
    isActive: true,
  });
  const [subAdminForm, setSubAdminForm] = useState<SubAdminInput>({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
  });

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const [p, a, sa] = await Promise.all([
        adminService.listSellers("pending"),
        adminService.listSellers("active"),
        adminService.listSubAdmins(),
      ]);
      setPending(p.data || []);
      setActive(a.data || []);
      setSubAdmins(sa.data || []);
    } catch (e: unknown) {
      setError(
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to load data",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const navigationItems = useMemo<NavigationItem[]>(
    () => [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
      },
      {
        id: "pending",
        label: "Pending Sellers",
        icon: Clock,
        badge:
          pending.length > 0
            ? { value: pending.length, color: "red" as const }
            : undefined,
      },
      {
        id: "active",
        label: "Active Sellers",
        icon: Users,
        badge: { value: active.length, color: "gray" as const },
      },
      {
        id: "addSeller",
        label: "Add Seller",
        icon: UserPlus,
      },
      {
        id: "addSubAdmin",
        label: "Add SubAdmin",
        icon: UserCog,
      },
    ],
    [pending.length, active.length],
  );

  const approve = async (id: string) => {
    await adminService.approveSeller(id);
    setSuccess("Seller approved");
    await load();
  };

  const deactivate = async (id: string) => {
    await adminService.deactivateSeller(id);
    setSuccess("Seller deactivated");
    await load();
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this seller? This will delete their products too."))
      return;
    await adminService.removeSeller(id);
    setSuccess("Seller removed");
    await load();
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const required = [
      "email",
      "password",
      "firstName",
      "lastName",
      "phone",
      "companyName",
    ] as const;
    for (const k of required) {
      if (!addForm[k]) {
        setError(`Missing field: ${k}`);
        return;
      }
    }
    await adminService.createSeller(addForm);
    setSuccess("Seller created");
    setAddForm({
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      phone: "",
      companyName: "",
      vendorName: "",
      isActive: true,
    });
    await load();
  };

  const createSubAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!subAdminForm.email || !subAdminForm.password) {
      setError("Email and password are required");
      return;
    }
    try {
      await adminService.createSubAdmin(subAdminForm);
      setSuccess("Sub-admin created successfully");
      setSubAdminForm({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        phone: "",
      });
      await load();
    } catch (e: unknown) {
      setError(
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to create sub-admin",
      );
    }
  };

  const deleteSubAdmin = async (id: string) => {
    if (!confirm("Remove this sub-admin?")) return;
    try {
      await adminService.deleteSubAdmin(id);
      setSuccess("Sub-admin removed");
      await load();
    } catch {
      setError("Failed to remove sub-admin");
    }
  };

  return (
    <AdminLayout>
      <div className="flex min-h-screen bg-gray-50">
        <DashboardSidebar
          title="Admin Panel"
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
              {view === "pending" && "Pending Seller Requests"}
              {view === "active" && "Active Sellers"}
              {view === "addSeller" && "Add New Seller"}
              {view === "addSubAdmin" && "Sub-Admin Management"}
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
              <>
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500 uppercase">
                          Pending Sellers
                        </p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                          {pending.length}
                        </p>
                      </div>
                      <div className="p-3 bg-yellow-100 rounded-full">
                        <Clock className="w-8 h-8 text-yellow-600" />
                      </div>
                    </div>
                  </div>

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
                          Sub-Admins
                        </p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                          {subAdmins.length}
                        </p>
                      </div>
                      <div className="p-3 bg-blue-100 rounded-full">
                        <UserCog className="w-8 h-8 text-blue-600" />
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
                          ₹
                          {active
                            .reduce((sum, s) => sum + (s.totalRevenue || 0), 0)
                            .toFixed(2)}
                        </p>
                      </div>
                      <div className="p-3 bg-purple-100 rounded-full">
                        <LayoutDashboard className="w-8 h-8 text-purple-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Pending Sellers */}
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Recent Pending Requests
                      </h3>
                      {pending.length > 0 && (
                        <button
                          onClick={() => setView("pending")}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          View All →
                        </button>
                      )}
                    </div>
                    <div className="space-y-3">
                      {pending.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">
                          No pending requests
                        </p>
                      ) : (
                        pending.slice(0, 5).map((seller) => (
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
                            <button
                              onClick={() => approve(seller.id)}
                              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                            >
                              Approve
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Top Active Sellers */}
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Top Active Sellers
                      </h3>
                      {active.length > 0 && (
                        <button
                          onClick={() => setView("active")}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          View All →
                        </button>
                      )}
                    </div>
                    <div className="space-y-3">
                      {active.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">
                          No active sellers
                        </p>
                      ) : (
                        active
                          .sort(
                            (a, b) =>
                              (b.totalRevenue || 0) - (a.totalRevenue || 0),
                          )
                          .slice(0, 5)
                          .map((seller) => (
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
                              <div className="text-right">
                                <p className="text-sm font-medium text-gray-900">
                                  ₹{seller.totalRevenue?.toFixed(2) || "0.00"}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {seller.ordersCount || 0} orders
                                </p>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Pending Sellers View */}
            {view === "pending" && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    {pending.length}{" "}
                    {pending.length === 1 ? "request" : "requests"} pending
                  </p>
                  <button
                    onClick={load}
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    Refresh
                  </button>
                </div>
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : pending.length === 0 ? (
                  <p className="text-gray-500 text-center py-12">
                    No pending requests
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Seller
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Company
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Phone
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Registered
                          </th>
                          <th className="px-6 py-3"></th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {pending.map((s) => (
                          <tr key={s.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium text-gray-900">
                                {s.firstName} {s.lastName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {s.email}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {s.companyName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {s.phone}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(s.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                              <button
                                onClick={() => approve(s.id)}
                                className="px-4 py-2 bg-green-600 text-white rounded mr-2 hover:bg-green-700"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => remove(s.id)}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                              >
                                Reject
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Active Sellers View */}
            {view === "active" && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4 bg-gray-50 border-b">
                  <p className="text-sm text-gray-600">
                    {active.length} active{" "}
                    {active.length === 1 ? "seller" : "sellers"}
                  </p>
                </div>
                {active.length === 0 ? (
                  <p className="text-gray-500 text-center py-12">
                    No active sellers
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Seller
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
                          <th className="px-6 py-3"></th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {active.map((s) => (
                          <tr key={s.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium text-gray-900">
                                {s.firstName} {s.lastName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {s.email}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {s.companyName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {s.phone}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {s.ordersCount ?? 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap font-medium">
                              ₹
                              {typeof s.totalRevenue === "number"
                                ? s.totalRevenue.toFixed(2)
                                : "0.00"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                              <button
                                onClick={() => deactivate(s.id)}
                                className="px-4 py-2 bg-yellow-600 text-white rounded mr-2 hover:bg-yellow-700"
                              >
                                Deactivate
                              </button>
                              <button
                                onClick={() => remove(s.id)}
                                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Add Seller View */}
            {view === "addSeller" && (
              <div className="max-w-2xl">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold mb-6">
                    Create New Seller Account
                  </h2>
                  <form className="space-y-4" onSubmit={create}>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="seller@example.com"
                        value={addForm.email}
                        onChange={(e) =>
                          setAddForm({ ...addForm, email: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password *
                      </label>
                      <input
                        type="password"
                        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Min. 6 characters"
                        value={addForm.password}
                        onChange={(e) =>
                          setAddForm({ ...addForm, password: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          First Name *
                        </label>
                        <input
                          type="text"
                          className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Ram"
                          value={addForm.firstName}
                          onChange={(e) =>
                            setAddForm({
                              ...addForm,
                              firstName: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Sharma"
                          value={addForm.lastName}
                          onChange={(e) =>
                            setAddForm({
                              ...addForm,
                              lastName: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone *
                      </label>
                      <input
                        type="tel"
                        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="+977 9801234567"
                        value={addForm.phone}
                        onChange={(e) =>
                          setAddForm({ ...addForm, phone: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Name *
                      </label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="ABC Company Ltd."
                        value={addForm.companyName}
                        onChange={(e) =>
                          setAddForm({
                            ...addForm,
                            companyName: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Vendor Name (Optional)
                      </label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Display name for vendor"
                        value={addForm.vendorName}
                        onChange={(e) =>
                          setAddForm({
                            ...addForm,
                            vendorName: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={!!addForm.isActive}
                        onChange={(e) =>
                          setAddForm({
                            ...addForm,
                            isActive: e.target.checked,
                          })
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="isActive"
                        className="ml-2 block text-sm text-gray-700"
                      >
                        Activate account immediately
                      </label>
                    </div>
                    <button
                      type="submit"
                      className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Create Seller Account
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Add SubAdmin View */}
            {view === "addSubAdmin" && (
              <div className="space-y-6">
                <div className="max-w-2xl">
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-6">
                      Create New Sub-Admin
                    </h2>
                    <form onSubmit={createSubAdmin} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email *
                        </label>
                        <input
                          type="email"
                          placeholder="subadmin@example.com"
                          value={subAdminForm.email}
                          onChange={(e) =>
                            setSubAdminForm((prev) => ({
                              ...prev,
                              email: e.target.value,
                            }))
                          }
                          className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Password *
                        </label>
                        <input
                          type="password"
                          placeholder="Min. 6 characters"
                          value={subAdminForm.password}
                          onChange={(e) =>
                            setSubAdminForm((prev) => ({
                              ...prev,
                              password: e.target.value,
                            }))
                          }
                          className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            First Name
                          </label>
                          <input
                            type="text"
                            placeholder="Optional"
                            value={subAdminForm.firstName}
                            onChange={(e) =>
                              setSubAdminForm((prev) => ({
                                ...prev,
                                firstName: e.target.value,
                              }))
                            }
                            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Last Name
                          </label>
                          <input
                            type="text"
                            placeholder="Optional"
                            value={subAdminForm.lastName}
                            onChange={(e) =>
                              setSubAdminForm((prev) => ({
                                ...prev,
                                lastName: e.target.value,
                              }))
                            }
                            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone
                        </label>
                        <input
                          type="tel"
                          placeholder="Optional"
                          value={subAdminForm.phone}
                          onChange={(e) =>
                            setSubAdminForm((prev) => ({
                              ...prev,
                              phone: e.target.value,
                            }))
                          }
                          className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        Create Sub-Admin Account
                      </button>
                    </form>
                  </div>
                </div>

                {/* Existing Sub-Admins */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-4 bg-gray-50 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Existing Sub-Admins
                    </h3>
                  </div>
                  {subAdmins.length === 0 ? (
                    <p className="text-gray-500 text-center py-12">
                      No sub-admins yet
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
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
                              Phone
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Created
                            </th>
                            <th className="px-6 py-3"></th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {subAdmins.map((sa) => (
                            <tr key={sa.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                {sa.firstName} {sa.lastName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {sa.email}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {sa.phone || "-"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(sa.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                <button
                                  onClick={() => deleteSubAdmin(sa.id)}
                                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
