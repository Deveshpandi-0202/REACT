import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Package, ChevronDown, Truck, MapPin, Phone, Banknote, CreditCard, RefreshCw } from "lucide-react";
import api from "../api/axios";
import { useToast } from "../context/ToastContext";

const STATUS_LABELS = {
  pending: "Order Placed",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready_for_pickup: "Ready for Pickup",
  assigned: "Driver Assigned",
  accepted: "Accepted",
  picked_up: "Picked Up",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const PAYMENT_LABELS = {
  cod: "Cash on Delivery",
  gpay: "GPay (QR)",
};

function statusColor(status) {
  const s = (status || "").toLowerCase();
  if (s === "delivered") return "delivered";
  if (s === "cancelled") return "cancelled";
  if (s === "out_for_delivery" || s === "picked_up") return "shipped";
  return "pending";
}

function humanizePayment(method) {
  return PAYMENT_LABELS[method] || paymentLabelFallback(method);
}

function paymentLabelFallback(method) {
  return (method || "cod").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
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
            <span className="progress-label">{STATUS_LABELS[s] || humanize(s)}</span>
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

function humanize(status) {
  return (status || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function OrderSkeleton() {
  return (
    <div className="skeleton-card order-skel">
      <div className="order-skel-top">
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-line short" />
      </div>
      <div className="skeleton skeleton-line" />
      <div className="skeleton skeleton-line short" />
    </div>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState(null);
  const toast = useToast();
  const mountedRef = useRef(true);

  const fetchOrders = () => {
    api
      .get("/orders/my")
      .then((res) => {
        if (!mountedRef.current) return;
        setOrders(res.data || []);
        setLoading(false);
      })
      .catch(() => {
        if (!mountedRef.current) return;
        setLoading(false);
        setError("Couldn't load your orders.");
        toast.error("Couldn't load your orders. Please try again.");
      });
  };

  const load = () => {
    setLoading(true);
    setError("");
    fetchOrders();
  };

  useEffect(() => {
    mountedRef.current = true;
    fetchOrders();
    return () => { mountedRef.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="orders-page">
        <h1>My Orders</h1>
        <div className="orders-list">
          <OrderSkeleton />
          <OrderSkeleton />
          <OrderSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="orders-page">
        <h1>My Orders</h1>
        <div className="empty order-error-state">
          <Package size={48} className="empty-icon" />
          <h2>Couldn't load your orders.</h2>
          <p>Check your connection and try again.</p>
          <button className="btn btn-primary" onClick={load}>
            <RefreshCw size={16} /> Try Again
          </button>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="orders-page">
        <h1>My Orders</h1>
        <div className="empty">
          <Package size={48} className="empty-icon" />
          <h2>No orders yet</h2>
          <p>Your fresh grocery orders will appear here.</p>
          <Link to="/" className="btn btn-primary">
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <h1>My Orders</h1>
      <div className="orders-list">
        <AnimatePresence>
          {orders.map((order) => {
            const itemsCount = (order.items || []).reduce((s, i) => s + i.quantity, 0);
            const statusLabel = STATUS_LABELS[order.status] || humanize(order.status);
            const paymentLabel = humanizePayment(order.payment_method);
            return (
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
                    <span className={`order-status ${statusColor(order.status)}`}>
                      {statusLabel}
                    </span>
                    <span className="order-id">#{`GZ-${String(order.id).padStart(4, "0")}`}</span>
                  </div>
                  <div className="order-header-right">
                    <div className="order-header-meta">
                      <span className="order-items-chip">{itemsCount} item{itemsCount > 1 ? "s" : ""}</span>
                      <span className="order-pay-chip">
                        {order.payment_method === "gpay" ? <CreditCard size={12} /> : <Banknote size={12} />}
                        {paymentLabel}
                      </span>
                    </div>
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
                      {(order.status !== "pending" && order.status !== "cancelled" && order.status !== "delivered") && (
                        <DeliveryProgress status={order.status} />
                      )}
                      {(order.delivery_address || order.delivery_phone) && (
                        <div className="customer-delivery-info">
                          {order.delivery_address && (
                            <span><MapPin size={15} /> {order.delivery_address}{order.delivery_city ? `, ${order.delivery_city}` : ""}</span>
                          )}
                          {order.delivery_phone && <span><Phone size={15} /> {order.delivery_phone}</span>}
                          {order.driver_name ? (
                            <span className="order-driver-chip"><Truck size={15} /> {order.driver_name}</span>
                          ) : (
                            ["pending", "confirmed", "preparing", "ready_for_pickup"].includes(order.status) && (
                              <span className="order-finding-partner">
                                <Truck size={15} /> Finding a delivery partner…
                              </span>
                            )
                          )}
                        </div>
                      )}
                      <Link
                        to={`/track/${order.id}`}
                        className="btn btn-primary btn-sm track-order-btn"
                      >
                        <Truck size={14} /> Track Order
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}