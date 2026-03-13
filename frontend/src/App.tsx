import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Login, Register, ProtectedRoute } from "./components/auth";
import SellerDashboard from "./pages/SellerDashboard";
import SellerProducts from "./pages/SellerProducts";
import SellerOrders from "./pages/SellerOrders";
import Products from "./pages/Products";
import Unauthorized from "./pages/Unauthorized";
import AdminDashboard from "./pages/AdminDashboard";
import SubAdminDashboard from "./pages/SubAdminDashboard";
import Home from "./pages/Home";
import Checkout from "./pages/Checkout";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailure from "./pages/PaymentFailure";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/failure" element={<PaymentFailure />} />
        <Route
          path="/checkout/:productId"
          element={
            <ProtectedRoute allowedRoles={["buyer"]}>
              <Checkout />
            </ProtectedRoute>
          }
        />
        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/admin/login" element={<Login mode="admin" />} />
        <Route path="/register" element={<Register />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Protected routes - Only sellers and admins have dashboards */}
        <Route
          path="/seller/dashboard"
          element={
            <ProtectedRoute allowedRoles={["seller"]}>
              <SellerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/products"
          element={
            <ProtectedRoute allowedRoles={["seller"]}>
              <SellerProducts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/orders"
          element={
            <ProtectedRoute allowedRoles={["seller"]}>
              <SellerOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/subadmin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["subadmin"]}>
              <SubAdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
