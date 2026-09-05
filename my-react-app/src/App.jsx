import { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import SplashScreen from "./components/SplashScreen";
import BottomNav from "./components/BottomNav";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import Footer from "./components/Footer";
import "./App.css";

const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Home = lazy(() => import("./pages/Home"));
const Categories = lazy(() => import("./pages/Categories"));
const Orders = lazy(() => import("./pages/Orders"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Profile = lazy(() => import("./pages/Profile"));
const Signin = lazy(() => import("./pages/Signin"));
const Signup = lazy(() => import("./pages/Signup"));
const TrackOrder = lazy(() => import("./pages/TrackOrder"));
const AddProduct = lazy(() => import("./pages/admin/AddProduct"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const EditProduct = lazy(() => import("./pages/admin/EditProduct"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement"));
const DriverManagement = lazy(() => import("./pages/admin/DriverManagement"));
const OrdersManagement = lazy(() => import("./pages/admin/OrdersManagement"));
const CategoriesManagement = lazy(() => import("./pages/admin/CategoriesManagement"));
const DriverDashboard = lazy(() => import("./pages/driver/DriverDashboard"));

function PageFallback() {
  return (
    <div className="page-loading" role="status" aria-label="Loading">
      <Loader2 size={22} className="spin" />
      <span>Loading…</span>
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function RoleHome() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/signin" replace />;
  if (user.role === "admin") return <Navigate to="/admin" replace />;
  if (user.role === "driver") return <Navigate to="/driver" replace />;
  return <Home />;
}

function RoutedApp() {
  const { pathname } = useLocation();
  const [splashDone, setSplashDone] = useState(() => {
    try {
      return sessionStorage.getItem("grocerapp_splash") === "1";
    } catch {
      return false;
    }
  });

  const finishSplash = () => {
    try {
      sessionStorage.setItem("grocerapp_splash", "1");
    } catch {
      /* ignore */
    }
    setSplashDone(true);
  };

  const isAuthRoute = pathname === "/signin" || pathname === "/signup";

  return (
    <>
      <AnimatePresence>
        {!splashDone && <SplashScreen key="splash" onDone={finishSplash} />}
      </AnimatePresence>

      <ScrollToTop />
      <div className="app-shell">
        {!isAuthRoute && <Navbar />}
        <main className="container">
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<RoleHome />} />
              <Route path="/signin" element={<Signin />} />
              <Route path="/signup" element={<Signup />} />

              <Route
                path="/categories"
                element={
                  <ProtectedRoute requiredRole="user">
                    <Categories />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/product/:id"
                element={
                  <ProtectedRoute requiredRole="user">
                    <ProductDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cart"
                element={
                  <ProtectedRoute requiredRole="user">
                    <Cart />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/checkout"
                element={
                  <ProtectedRoute requiredRole="user">
                    <Checkout />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders"
                element={
                  <ProtectedRoute requiredRole="user">
                    <Orders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/track/:orderId"
                element={
                  <ProtectedRoute requiredRole="user">
                    <TrackOrder />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute requiredRole="user">
                    <Profile />
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
                path="/admin/products"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <Dashboard focusProducts />
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
              <Route
                path="/admin/drivers"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <DriverManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/orders"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <OrdersManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/categories"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <CategoriesManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/driver"
                element={
                  <ProtectedRoute requiredRole="driver">
                    <DriverDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<RoleHome />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
      {!isAuthRoute && <BottomNav />}
    </>
  );
}

function App() {
  return (
    <BrowserRouter basename={import.meta.env.PROD ? (import.meta.env.VITE_BASE_PATH || "/REACT") : ""}>
      <AuthProvider>
        <CartProvider>
          <RoutedApp />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;