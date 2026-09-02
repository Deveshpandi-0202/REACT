import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBasket,
  ShoppingCart,
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
  Home,
  Package,
  Users,
  LayoutDashboard,
  Truck,
  ClipboardList,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.info("Logged out");
    navigate("/signin");
    setMenuOpen(false);
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand" onClick={closeMenu}>
          <ShoppingBasket size={24} />
          <span>GrocerApp</span>
        </Link>

        <button
          className="navbar-toggle"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div className={`navbar-links ${menuOpen ? "open" : ""}`}>
          <Link to="/" onClick={closeMenu}>
            <Home size={16} /> Home
          </Link>

          {user && user.role === "user" && (
            <>
              <Link to="/cart" className="cart-link" onClick={closeMenu}>
                <ShoppingCart size={16} /> Cart
                {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
              </Link>
              <Link to="/orders" onClick={closeMenu}>
                <Package size={16} /> Orders
              </Link>
            </>
          )}

          {user?.role === "admin" && (
            <>
              <Link to="/admin" onClick={closeMenu}>
                <LayoutDashboard size={16} /> Dashboard
              </Link>
              <Link to="/admin/orders" onClick={closeMenu}>
                <ClipboardList size={16} /> Orders
              </Link>
              <Link to="/admin/users" onClick={closeMenu}>
                <Users size={16} /> Users
              </Link>
              <Link to="/admin/drivers" onClick={closeMenu}>
                <Truck size={16} /> Drivers
              </Link>
            </>
          )}

          {user?.role === "driver" && (
            <Link to="/driver" onClick={closeMenu}>
              <Truck size={16} /> Deliveries
            </Link>
          )}

          <div className="navbar-right">
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {user ? (
              <>
                <span className="navbar-user">Hi, {user.name}</span>
                <button onClick={handleLogout} className="btn btn-sm">
                  <LogOut size={14} /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/signin" className="btn btn-sm" onClick={closeMenu}>
                  Sign In
                </Link>
                <Link to="/signup" className="btn btn-sm btn-outline" onClick={closeMenu}>
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="navbar-divider-line"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            exit={{ scaleX: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>
    </nav>
  );
}
