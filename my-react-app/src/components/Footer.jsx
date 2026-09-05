import { Link } from "react-router-dom";
import { ShoppingBasket, Mail, MapPin, Clock } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Footer() {
  const { user } = useAuth();
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <div className="footer-logo">
            <ShoppingBasket size={22} />
            <span>GROZO</span>
          </div>
          <p className="footer-tagline">
            Groceries delivered to your door in minutes. Fresh, fast and reliable.
          </p>
        </div>

        <div className="footer-col">
          <h4>Shop</h4>
          <Link to="/">All Products</Link>
          <Link to="/cart">Cart</Link>
          <Link to="/orders">My Orders</Link>
        </div>

        <div className="footer-col">
          <h4>Account</h4>
          <Link to="/signin">Sign In</Link>
          <Link to="/signup">Sign Up</Link>
          {user?.role === "admin" && <Link to="/admin">Admin Panel</Link>}
        </div>

        <div className="footer-col">
          <h4>Contact</h4>
          <p className="footer-line"><Mail size={15} /> support@grozo.in</p>
          <p className="footer-line"><MapPin size={15} /> Bengaluru, India</p>
          <p className="footer-line"><Clock size={15} /> Open 24/7</p>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} GROZO. All rights reserved.</span>
      </div>
    </footer>
  );
}
