import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Truck, Package, ShoppingBag, CheckCircle2, Loader2,
  ChevronDown, MapPin, Phone, PackageCheck,
  Bike, Clock,
} from "lucide-react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

function humanize(status) {
  return (status || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function DriverDashboard() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState(null);
  const [updating, setUpdating] = useState(false);

  const loadOrders = () => {
    api
      .get("/driver/orders")
      .then((res) => setOrders(res.data || []))
      .catch((err) => setError(err.response?.data?.error || "Failed to load deliveries"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    api
      .get("/driver/orders")
      .then((res) => {
        if (!cancelled) setOrders(res.data || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.error || "Failed to load deliveries");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const nextActions = {
    assigned: { label: "Picked Up", to: "picked_up", icon: <PackageCheck size={16} />, cls: "btn-primary" },
    picked_up: { label: "Out for Delivery", to: "out_for_delivery", icon: <Bike size={16} />, cls: "btn-primary" },
    out_for_delivery: { label: "Mark as Delivered", to: "delivered", icon: <CheckCircle2 size={16} />, cls: "btn-success" },
  };

  const updateStatus = async (order, to) => {
    setUpdating(true);
    try {
      const res = await api.put(`/driver/orders/${order.id}/status`, { status: to });
      setOrders((prev) => prev.map((o) => (o.id === res.data.id ? res.data : o)));
      const labels = {
        picked_up: "Order picked up",
        out_for_delivery: "Order is out for delivery",
        delivered: "Order marked as delivered",
      };
      toast.success(labels[to] || "Order updated");
      if (to === "delivered") loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.error || "Unable to update order");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <Loader2 size={24} className="spin" /> Loading deliveries...
      </div>
    );
  }

  if (error && orders.length === 0) return <div className="error-msg">{error}</div>;

  const picked = orders.filter((o) => o.status === "picked_up" || o.status === "out_for_delivery").length;
  const delivered = orders.filter((o) => o.status === "delivered").length;

  const stats = [
    { label: "Available Orders", value: orders.filter((o) => o.status === "assigned").length, icon: <ShoppingBag size={20} />, cls: "blue" },
    { label: "Picked Up", value: picked, icon: <Package size={20} />, cls: "purple" },
    { label: "Out for Delivery", value: orders.filter((o) => o.status === "out_for_delivery").length, icon: <Bike size={20} />, cls: "amber" },
    { label: "Delivered", value: delivered, icon: <CheckCircle2 size={20} />, cls: "green" },
  ];

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1><Truck size={22} /> Driver Dashboard</h1>
        <div className="admin-header-actions driver-avail">
          <span className={`driver-availability ${user?.availability || "available"}`}>
            <Clock size={14} /> {humanize(user?.availability || "available")}
          </span>
          <button className="btn btn-sm" onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      <p className="driver-welcome">Welcome back, <strong>{user?.name}</strong>. Here are your assigned deliveries.</p>

      <motion.div className="stats-grid" initial="hidden" animate="show">
        {stats.map((s) => (
          <motion.div key={s.label} className={`stat-card-lrg ${s.cls}`} variants={fadeUp}>
            <div className="stat-card-icon">{s.icon}</div>
            <span className="stat-card-value">{s.value}</span>
            <span className="stat-card-label">{s.label}</span>
          </motion.div>
        ))}
      </motion.div>

      <div className="dash-panel">
        <h3 className="dash-panel-title">My Deliveries</h3>
        {orders.length === 0 ? (
          <div className="empty">
            <Package size={48} className="empty-icon" />
            <h2>No assigned deliveries</h2>
            <p>You will see orders here once the admin assigns them to you.</p>
          </div>
        ) : (
          <div className="orders-list driver-orders-list">
            <AnimatePresence>
              {orders.map((order) => {
                const action = nextActions[order.status];
                const itemsCount = (order.items || []).reduce((s, i) => s + i.quantity, 0);
                return (
                  <motion.div key={order.id} className="order-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                    <button
                      className="order-header"
                      onClick={() => setOpenId(openId === order.id ? null : order.id)}
                    >
                      <div className="order-header-left">
                        <span className={`order-status ${order.status}`}>{humanize(order.status)}</span>
                        <span className="order-id">Order #{order.id}</span>
                      </div>
                      <div className="order-header-right">
                        <span className="order-total">₹{order.total_amount.toFixed(2)}</span>
                        <ChevronDown size={18} className={`order-chevron ${openId === order.id ? "flip" : ""}`} />
                      </div>
                    </button>
                    <AnimatePresence>
                      {openId === order.id && (
                        <motion.div className="order-details" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                          <div className="driver-order-meta">
                            <div className="driver-item"><span className="driver-meta-label">Customer</span> <span>{order.customer_name || "Customer"}</span></div>
                            <div className="driver-item"><span className="driver-meta-label">Items</span> <span>{itemsCount} items</span></div>
                            <div className="driver-item"><span className="driver-meta-label">Total</span> <span className="driver-total">₹{order.total_amount.toFixed(2)}</span></div>
                            <div className="driver-item"><span className="driver-meta-label">Status</span> <span className={`order-status ${order.status}`}>{humanize(order.status)}</span></div>
                            {order.delivery_address && (
                              <div className="driver-item"><span className="driver-meta-label"><MapPin size={14} /></span> <span>{order.delivery_address}{order.delivery_city ? `, ${order.delivery_city}` : ""}</span></div>
                            )}
                            {order.delivery_phone && (
                              <div className="driver-item"><span className="driver-meta-label"><Phone size={14} /></span> <span>{order.delivery_phone}</span></div>
                            )}
                          </div>

                          <div className="order-items-list">
                            {order.items.map((oi) => (
                              <div className="order-item-row" key={oi.id}>
                                <span className="order-item-name">{oi.product_name}</span>
                                <span className="order-item-meta">Qty {oi.quantity} × ₹{oi.price.toFixed(2)}</span>
                                <span className="order-item-sub">₹{(oi.price * oi.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>

                          {action && (
                            <div className="driver-actions">
                              <button
                                className={`btn ${action.cls}`}
                                disabled={updating}
                                onClick={() => updateStatus(order, action.to)}
                              >
                                {updating ? <Loader2 size={16} className="spin" /> : action.icon}
                                {action.label}
                              </button>
                            </div>
                          )}
                          {order.status === "delivered" && (
                            <div className="driver-delivered-note">
                              <CheckCircle2 size={16} /> Delivered successfully
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
