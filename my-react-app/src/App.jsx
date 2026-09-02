import { useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Home from "./pages/Home";
import Orders from "./pages/Orders";
import ProductDetail from "./pages/ProductDetail";
import Signin from "./pages/Signin";
import Signup from "./pages/Signup";
import AddProduct from "./pages/admin/AddProduct";
import Dashboard from "./pages/admin/Dashboard";
import EditProduct from "./pages/admin/EditProduct";
import UserManagement from "./pages/admin/UserManagement";
import Footer from "./components/Footer";
import "./App.css";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  return (
    <BrowserRouter basename={import.meta.env.PROD ? (import.meta.env.VITE_BASE_PATH || "/REACT") : ""}>
      <AuthProvider>
        <CartProvider>
          <ScrollToTop />
          <div className="app-shell">
            <Navbar />
            <main className="container">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/signin" element={<Signin />} />
                <Route path="/signup" element={<Signup />} />
                <Route
                  path="/cart"
                  element={
                    <ProtectedRoute>
                      <Cart />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/checkout"
                  element={
                    <ProtectedRoute>
                      <Checkout />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders"
                  element={
                    <ProtectedRoute>
                      <Orders />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/add"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AddProduct />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/edit/:id"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <EditProduct />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <UserManagement />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Home />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
