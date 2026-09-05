import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ShoppingBasket,
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
  Home,
  LayoutDashboard,
  Truck,
  ClipboardList,
  Users,
  LayoutGrid,
  Package,
  User,
  Search,
  SearchX,
  ShoppingCart,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";

function NavLinkItem({ to, onClick, icon: Icon, label, end }) {
  return (
    <NavLink to={to} end={end} onClick={onClick} className={({ isActive }) => (isActive ? "active" : "")}>
      <Icon size={16} /> {label}
    </NavLink>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");

  const handleLogout = () => {
    logout();
    toast.info("Logged out");
    navigate("/signin");
    setMenuOpen(false);
  };

  const closeMenu = () => setMenuOpen(false);

  const submitSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    setMenuOpen(false);
    navigate(q ? `/?q=${encodeURIComponent(q)}` : "/");
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to={user ? "/" : "/signin"} className="navbar-brand" onClick={closeMenu}>
          <ShoppingBasket size={24} />
          <span>GROZO</span>
        </Link>

        <button
          className="navbar-toggle"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div className={`navbar-links ${menuOpen ? "open" : ""}`}>
          {user?.role === "user" && (
            <>
              <NavLinkItem to="/" end onClick={closeMenu} icon={Home} label="Home" />
              <NavLinkItem to="/categories" onClick={closeMenu} icon={LayoutGrid} label="Categories" />
              <NavLinkItem to="/orders" onClick={closeMenu} icon={ClipboardList} label="Orders" />
              <NavLinkItem to="/profile" onClick={closeMenu} icon={User} label="Profile" />
            </>
          )}

          {user?.role === "admin" && (
            <>
              <NavLinkItem to="/admin" end onClick={closeMenu} icon={LayoutDashboard} label="Dashboard" />
              <NavLinkItem to="/admin/products" onClick={closeMenu} icon={Package} label="Products" />
              <NavLinkItem to="/admin/orders" onClick={closeMenu} icon={ClipboardList} label="Orders" />
              <NavLinkItem to="/admin/categories" onClick={closeMenu} icon={LayoutGrid} label="Categories" />
              <NavLinkItem to="/admin/users" onClick={closeMenu} icon={Users} label="Users" />
              <NavLinkItem to="/admin/drivers" onClick={closeMenu} icon={Truck} label="Drivers" />
            </>
          )}

          {user?.role === "driver" && (
            <NavLinkItem to="/driver" onClick={closeMenu} icon={Truck} label="Deliveries" />
          )}

          {user?.role === "user" && (
            <form className="navbar-search" role="search" onSubmit={submitSearch}>
              <Search size={16} className="navbar-search-icon" />
              <input
                type="search"
                className="navbar-search-input"
                placeholder="Search GROZO…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search products"
              />
              {query && (
                <button
                  type="button"
                  className="navbar-search-clear"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                >
                  <SearchX size={14} />
                </button>
              )}
            </form>
          )}

          <div className="navbar-right">
            {user?.role === "user" && (
              <Link
                to="/cart"
                className="cart-link navbar-cart-icon"
                onClick={closeMenu}
                aria-label={`Cart${totalItems > 0 ? `, ${totalItems} items` : ""}`}
              >
                <ShoppingCart size={18} />
                {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
              </Link>
            )}

            <button
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            {user ? (
              <>
                {user.role === "user" && (
                  <span className="navbar-user">Hi, {user.name.split(" ")[0]}</span>
                )}
                <button onClick={handleLogout} className="btn btn-sm">
                  <LogOut size={14} /> Logout
                </button>
              </>
            ) : null}
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