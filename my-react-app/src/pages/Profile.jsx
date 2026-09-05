import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Mail, Phone, Package, MapPin, CreditCard, LogOut,
  ChevronRight, Loader2, Sun, Moon, LifeBuoy, BadgeCheck,
} from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useTheme } from "../context/ThemeContext";

const ROLE_LABELS = {
  user: "GROZO Customer",
  admin: "Store Admin",
  driver: "Delivery Partner",
};

export default function Profile() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [orderCount, setOrderCount] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/orders/my")
      .then((res) => { if (!cancelled) setOrderCount((res.data || []).length); })
      .catch(() => { if (!cancelled) setOrderCount(0); });
    return () => { cancelled = true; };
  }, []);

  const handleLogout = () => {
    setLoggingOut(true);
    setTimeout(() => {
      logout();
      toast.info("Logged out");
      navigate("/signin");
    }, 250);
  };

  const roleLabel = ROLE_LABELS[user?.role] || "Member";

  return (
    <div className="profile-page">
      <motion.div
        className="profile-hero"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="profile-avatar">
          {user?.name?.charAt(0).toUpperCase() || "U"}
        </div>
        <div className="profile-hero-info">
          <h2>{user?.name}</h2>
          <span className="profile-role-badge">
            <BadgeCheck size={13} /> {roleLabel}
          </span>
          <p className="profile-email"><Mail size={14} /> {user?.email}</p>
          <p className="profile-phone"><Phone size={14} /> {user?.phone || "Not provided"}</p>
        </div>
      </motion.div>

      <motion.div
        className="profile-menu"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        <Link to="/orders" className="profile-menu-item">
          <span className="profile-menu-icon"><Package size={19} /></span>
          <span className="profile-menu-label">My Orders</span>
          {orderCount !== null && orderCount > 0 && (
            <span className="profile-menu-badge">{orderCount}</span>
          )}
          <ChevronRight size={17} className="profile-menu-arrow" />
        </Link>

        <button
          type="button"
          className="profile-menu-item"
          onClick={() => toast.info("Addresses are entered at checkout of each order.")}
        >
          <span className="profile-menu-icon"><MapPin size={19} /></span>
          <span className="profile-menu-label">Saved Addresses</span>
          <ChevronRight size={17} className="profile-menu-arrow" />
        </button>

        <button
          type="button"
          className="profile-menu-item"
          onClick={() => toast.info("You chose Cash on Delivery or GPay (QR) at checkout.")}
        >
          <span className="profile-menu-icon"><CreditCard size={19} /></span>
          <span className="profile-menu-label">Payment Methods</span>
          <ChevronRight size={17} className="profile-menu-arrow" />
        </button>

        <div className="profile-menu-item profile-theme-row">
          <span className="profile-menu-icon">{theme === "light" ? <Sun size={19} /> : <Moon size={19} />}</span>
          <span className="profile-menu-label">Appearance</span>
          <div className="profile-seg" role="radiogroup" aria-label="Appearance">
            <button
              type="button"
              className={theme === "light" ? "active" : ""}
              aria-pressed={theme === "light"}
              onClick={() => setTheme("light")}
            >
              <Sun size={14} /> Light
            </button>
            <button
              type="button"
              className={theme === "dark" ? "active" : ""}
              aria-pressed={theme === "dark"}
              onClick={() => setTheme("dark")}
            >
              <Moon size={14} /> Dark
            </button>
          </div>
        </div>

        <a href="mailto:support@grozo.in?subject=GROZO%20Support%20Request" className="profile-menu-item">
          <span className="profile-menu-icon"><LifeBuoy size={19} /></span>
          <span className="profile-menu-label">
            Help &amp; Support
            <span className="profile-menu-sub">support@grozo.in · Bengaluru · Open 24/7</span>
          </span>
          <ChevronRight size={17} className="profile-menu-arrow" />
        </a>
      </motion.div>

      <motion.button
        type="button"
        className="profile-logout"
        onClick={handleLogout}
        disabled={loggingOut}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16 }}
      >
        {loggingOut ? <Loader2 size={18} className="spin" /> : <LogOut size={18} />}
        Log Out
      </motion.button>
    </div>
  );
}