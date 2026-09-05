import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Package, LayoutGrid, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const MotionNavLink = motion(NavLink);

export default function BottomNav() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user || (user.role !== "user" && user.role !== "admin")) return null;

  const tabs =
    user.role === "admin"
      ? [
          { to: "/admin", label: "Dashboard", icon: Home, end: true },
          { to: "/admin/orders", label: "Orders", icon: Package },
          { to: "/admin/drivers", label: "Drivers", icon: LayoutGrid },
          { to: "/admin/users", label: "Users", icon: User },
        ]
      : [
          { to: "/", label: "Home", icon: Home, end: true },
          { to: "/orders", label: "Orders", icon: Package },
          { to: "/categories", label: "Categories", icon: LayoutGrid },
          { to: "/profile", label: "Profile", icon: User },
        ];

  return (
    <nav className="bottom-nav" aria-label="Primary">
      {tabs.map((t) => {
        const Icon = t.icon;
        const active = t.end
          ? location.pathname === t.to
          : location.pathname.startsWith(t.to);
        return (
          <MotionNavLink
            key={t.to}
            to={t.to}
            className="bottom-nav-item"
            whileTap={{ scale: 0.94 }}
            aria-current={active ? "page" : undefined}
          >
            <span className="bottom-nav-icon">
              <Icon size={22} strokeWidth={active ? 2.4 : 1.8} />
            </span>
            <span className="bottom-nav-label">{t.label}</span>
            {active && (
              <motion.span
                className="bottom-nav-dot"
                layoutId="bottomnav-dot"
                transition={{ type: "spring", stiffness: 500, damping: 32 }}
              />
            )}
          </MotionNavLink>
        );
      })}
    </nav>
  );
}