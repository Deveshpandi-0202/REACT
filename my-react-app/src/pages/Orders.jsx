import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Loader2, ChevronDown } from "lucide-react";
import api from "../api/axios";

function statusClass(status) {
  const s = (status || "").toLowerCase();
  if (s === "delivered") return "delivered";
  if (s === "cancelled") return "cancelled";
  if (s === "shipped") return "shipped";
  return "pending";
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/orders/my")
      .then((res) => {
        if (!cancelled) setOrders(res.data || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.error || "Failed to load orders");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="loading">
        <Loader2 size={24} className="spin" /> Loading orders...
      </div>
    );
  }

  if (error) return <div className="error-msg">{error}</div>;

  if (orders.length === 0) {
    return (
      <div className="empty">
        <Package size={48} className="empty-icon" />
        <h2>No orders yet</h2>
        <p>When you place an order, it will show up here.</p>
        <Link to="/" className="btn btn-primary">Start Shopping</Link>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <h1>My Orders</h1>
      <div className="orders-list">
        <AnimatePresence>
          {orders.map((order) => (
            <motion.div
              key={order.id}
              className="order-card"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <button
                className="order-header"
                onClick={() => setOpenId(openId === order.id ? null : order.id)}
              >
                <div className="order-header-left">
                  <span className={`order-status ${statusClass(order.status)}`}>
                    {order.status}
                  </span>
                  <span className="order-id">Order #{order.id}</span>
                </div>
                <div className="order-header-right">
                  <span className="order-date">
                    {order.created_at ? new Date(order.created_at).toLocaleString() : ""}
                  </span>
                  <span className="order-total">₹{order.total_amount.toFixed(2)}</span>
                  <ChevronDown
                    size={18}
                    className={`order-chevron ${openId === order.id ? "flip" : ""}`}
                  />
                </div>
              </button>
              <AnimatePresence>
                {openId === order.id && (
                  <motion.div
                    className="order-details"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                  >
                    <div className="order-items-list">
                      {order.items.map((oi) => (
                        <div className="order-item-row" key={oi.id}>
                          <span className="order-item-name">{oi.product_name}</span>
                          <span className="order-item-meta">Qty {oi.quantity} × ₹{oi.price.toFixed(2)}</span>
                          <span className="order-item-sub">₹{(oi.price * oi.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
