import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/signin");
    setMenuOpen(false);
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand" onClick={closeMenu}>
          GrocerApp
        </Link>

        <button
          className="navbar-toggle"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          {menuOpen ? "✕" : "☰"}
        </button>

        <div className={`navbar-links ${menuOpen ? "open" : ""}`}>
          <Link to="/" onClick={closeMenu}>
            Home
          </Link>

          {user && (
            <Link to="/cart" className="cart-link" onClick={closeMenu}>
              Cart
              {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
            </Link>
          )}

          {user?.role === "admin" && (
            <>
              <Link to="/admin" onClick={closeMenu}>
                Products
              </Link>
              <Link to="/admin/users" onClick={closeMenu}>
                Users
              </Link>
            </>
          )}

          {user ? (
            <>
              <span className="navbar-user">Hi, {user.name}</span>
              <button onClick={handleLogout} className="btn btn-sm">
                Logout
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
    </nav>
  );
}
