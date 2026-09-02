import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Loader2, ChevronDown, Truck, MapPin, Phone } from "lucide-react";
import api from "../api/axios";

function statusClass(status) {
  const s = (status || "").toLowerCase();
  if (s === "delivered") return "delivered";
  if (s === "cancelled") return "cancelled";
  if (s === "shipped" || s === "out_for_delivery" || s === "picked_up") return "shipped";
  return "pending";
}

function humanize(status) {
  return (status || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const DELIVERY_FLOW = ["assigned", "picked_up", "out_for_delivery", "delivered"];

function DeliveryProgress({ status }) {
  const idx = DELIVERY_FLOW.indexOf(status);
  if (status === "pending" || status === "confirmed" || status === "preparing" || status === "ready_for_pickup") {
    const steps = ["pending", "confirmed", "preparing", "ready_for_pickup"];
    const cur = steps.indexOf(status) >= 0 ? steps.indexOf(status) : 0;
    return (
      <div className="delivery-progress">
        {steps.map((s, i) => (
          <div className={`progress-step ${i <= cur ? "done" : ""}`} key={s}>
            <span className="progress-dot">{i < cur ? "✓" : ""}</span>
            <span className="progress-label">{humanize(s) === "Pending" ? "Order Placed" : humanize(s)}</span>
          </div>
        ))}
        <div className="progress-step inactive">
          <span className="progress-dot o"></span>
          <span className="progress-label">Delivery started</span>
        </div>
      </div>
    );
  }

  if (idx < 0) return null;

  return (
    <div className="delivery-progress">
      <div className="progress-step done"><span className="progress-dot">✓</span><span className="progress-label">Assigned</span></div>
      <div className={`progress-step ${idx >= 1 ? "done" : ""}`}><span className="progress-dot">{idx >= 1 ? "✓" : ""}</span><span className="progress-label">Picked Up</span></div>
      <div className={`progress-step ${idx >= 2 ? "done" : ""}`}><span className="progress-dot">{idx >= 2 ? "✓" : ""}</span><span className="progress-label">Out for Delivery</span></div>
      <div className={`progress-step ${idx >= 3 ? "done" : ""}`}><span className="progress-dot">{idx >= 3 ? "✓" : ""}</span><span className="progress-label">Delivered</span></div>
    </div>
  );
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
                    {(order.status !== "pending" && order.status !== "cancelled") && (
                      <DeliveryProgress status={order.status} />
                    )}
                    {(order.delivery_address || order.delivery_phone) && (
                      <div className="customer-delivery-info">
                        {order.delivery_address && (
                          <span><MapPin size={15} /> {order.delivery_address}{order.delivery_city ? `, ${order.delivery_city}` : ""}</span>
                        )}
                        {order.delivery_phone && <span><Phone size={15} /> {order.delivery_phone}</span>}
                        {order.driver_name && <span><Truck size={15} /> Driver: {order.driver_name}</span>}
                      </div>
                    )}
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
