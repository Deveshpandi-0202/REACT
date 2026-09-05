import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Truck, ShoppingBag, CheckCircle2, Loader2, ChevronDown, MapPin,
  Phone, PackageCheck, Bike, Clock, Navigation, LogIn, CheckCheck,
  Power, PowerOff, Package, RefreshCw, CalendarClock, Hash, Inbox,
} from "lucide-react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { formatINR } from "../../utils/pricing";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

function humanize(status) {
  return (status || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

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

const DRIVER_TIMELINE = ["assigned", "accepted", "picked_up", "out_for_delivery", "delivered"];

const ACTIONS = {
  assigned: { label: "Accept Order", to: "accepted", icon: <LogIn size={17} />, cls: "btn-primary" },
  accepted: { label: "Picked Up", to: "picked_up", icon: <PackageCheck size={17} />, cls: "btn-primary" },
  picked_up: { label: "Out for Delivery", to: "out_for_delivery", icon: <Bike size={17} />, cls: "btn-primary" },
  out_for_delivery: { label: "Mark as Delivered", to: "delivered", icon: <CheckCircle2 size={17} />, cls: "btn-success" },
};

const TOAST_LABELS = {
  accepted: "Order accepted",
  picked_up: "Order picked up",
  out_for_delivery: "Order is out for delivery",
  delivered: "Order marked as delivered",
};

function deliveryId(id) {
  return `GZ-${String(id).padStart(4, "0")}`;
}

function DeliveryFlow({ status }) {
  const idx = DRIVER_TIMELINE.indexOf(status);
  if (idx < 0) return null;
  return (
    <ol className="driver-timeline" aria-label="Delivery progress">
      {DRIVER_TIMELINE.map((step, i) => (
        <li
          key={step}
          className={`driver-timeline-step ${i < idx ? "done" : ""} ${i === idx ? "current" : ""}`}
          aria-current={i === idx ? "step" : undefined}
        >
          <span className="driver-timeline-dot" aria-hidden="true">
            {i < idx ? <CheckCheck size={12} /> : i === idx ? <span className="driver-timeline-pulse" /> : null}
          </span>
          <span className="driver-timeline-label">{STATUS_LABELS[step]}</span>
        </li>
      ))}
    </ol>
  );
}

function DriverSkeleton() {
  return (
    <div className="dp-skel" aria-hidden="true">
      <div className="dp-skel-hero skeleton-card">
        <div className="skeleton-line" />
        <div className="skeleton-line short" />
      </div>
      <div className="dp-skel-grid">
        {[0, 1, 2, 3].map((i) => (
          <div className="skeleton-card dp-skel-tile" key={i}>
            <div className="skeleton-line" />
            <div className="skeleton-line short" />
          </div>
        ))}
      </div>
      <div className="skeleton-card dp-skel-block">
        <div className="skeleton-line" />
        <div className="skeleton-line" />
        <div className="skeleton-line short" />
      </div>
      <div className="skeleton-card dp-skel-block">
        <div className="skeleton-line" />
        <div className="skeleton-line" />
        <div className="skeleton-line short" />
      </div>
    </div>
  );
}

export default function DriverDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const updatingRef = useRef(false);
  const [refresh, setRefresh] = useState(false);
  const [availability, setAvailability] = useState(user?.availability ?? "available");
  const [availabilityBusy, setAvailabilityBusy] = useState(false);
  const [locState, setLocState] = useState("idle");
  const locWatchRef = useRef(null);
  const historyRef = useRef(null);
  const idleRef = useRef(null);

  const loadOrders = (opts = {}) => {
    const { silent = false } = opts;
    return api
      .get("/driver/orders")
      .then((res) => {
        if (!silent) setError("");
        setOrders(res.data || []);
      })
      .catch((err) => {
        if (!silent) {
          setError([401, 422].includes(err.response?.status) ? "session" : "network");
        }
      })
      .finally(() => {
        if (!silent) setLoading(false);
        setRefresh(false);
      });
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const retry = () => {
    setLoading(true);
    setError("");
    loadOrders();
  };

  const handleRefresh = () => {
    setRefresh(true);
    loadOrders({ silent: true });
  };

  const activeOrder = orders.find((o) =>
    ["assigned", "accepted", "picked_up", "out_for_delivery"].includes(o.status)
  );
  const hasActive = Boolean(activeOrder);
  const inTransit = orders.filter((o) => ["picked_up", "out_for_delivery"].includes(o.status)).length;
  const todayKey = new Date().toDateString();
  const deliveredToday = orders.filter(
    (o) => o.status === "delivered" && o.delivered_at && new Date(o.delivered_at).toDateString() === todayKey
  ).length;

  const updateStatus = async (order, action) => {
    if (updatingId != null || updatingRef.current) return;
    updatingRef.current = true;
    setUpdatingId(order.id);
    try {
      const res = action.endpoint === "accept"
        ? await api.put(`/driver/orders/${order.id}/accept`)
        : await api.put(`/driver/orders/${order.id}/status`, { status: action.to });
      const updated = res.data;
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      toast.success(TOAST_LABELS[action.to] || "Order updated");
      setAvailability(action.to === "delivered" ? "available" : "busy");
      loadOrders({ silent: true });
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error("Your session expired. Please sign in again.");
      } else {
        toast.error(err.response?.data?.error || "Unable to update order");
      }
      loadOrders({ silent: true });
    } finally {
      updatingRef.current = false;
      setUpdatingId(null);
    }
  };

  const changeAvailability = async (value) => {
    if (availabilityBusy) return;
    setAvailabilityBusy(true);
    try {
      const res = await api.put("/driver/availability", { availability: value });
      setAvailability(res.data?.availability ?? value);
      toast.success(value === "available" ? "You're now available for deliveries" : "You're now unavailable");
      loadOrders({ silent: true });
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update availability");
    } finally {
      setAvailabilityBusy(false);
    }
  };

  const pushLocation = (lat, lng) => {
    api.put("/driver/location", { latitude: lat, longitude: lng }).catch(() => {});
  };

  const startSharing = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }
    setLocState("requesting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        pushLocation(pos.coords.latitude, pos.coords.longitude);
        toast.success("Location sharing started");
        setLocState("on");
      },
      () => {
        toast.error("Location permission denied");
        setLocState("idle");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
    locWatchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        pushLocation(pos.coords.latitude, pos.coords.longitude);
        setLocState("on");
      },
      () => {
        toast.error("Location tracking stopped");
        setLocState("idle");
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
  };

  const stopSharing = () => {
    if (locWatchRef.current != null) {
      navigator.geolocation.clearWatch(locWatchRef.current);
      locWatchRef.current = null;
    }
    setLocState("idle");
  };

  useEffect(() => {
    return () => {
      if (locWatchRef.current != null) {
        navigator.geolocation.clearWatch(locWatchRef.current);
        locWatchRef.current = null;
      }
    };
  }, []);

  const navigateToAddress = (order) => {
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${order.delivery_address}, ${order.delivery_city}`
      )}`,
      "_blank"
    );
  };

  const scrollToHistory = () => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    historyRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  if (loading) {
    return (
      <div className="driver-page">
        <DriverSkeleton />
      </div>
    );
  }

  if (error && orders.length === 0) {
    const isSession = error === "session";
    return (
      <div className="driver-page">
        <div className="dp-hero">
          <div className="dp-hero-brand">
            <span className="dp-hero-logo"><Truck size={20} /></span>
            <div>
              <p className="dp-hero-eyebrow">GROZO Delivery Partner</p>
              <h1 className="dp-hero-title">{user?.name || "Driver"}</h1>
            </div>
          </div>
        </div>
        <div className="dp-error-state" role="alert">
          <Package size={44} className="empty-icon" />
          <h2>{isSession ? "Your session has expired" : "Couldn't load your deliveries."}</h2>
          <p>{isSession ? "Please sign in again to continue." : "Check your connection and try again."}</p>
          {isSession ? (
            <button className="btn btn-primary" onClick={() => { window.location.href = "/signin"; }}>
              <LogIn size={16} /> Sign In
            </button>
          ) : (
            <button className="btn btn-primary" onClick={retry}>
              <RefreshCw size={16} /> Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  const isAvailable = availability === "available";

  return (
    <div className="driver-page">
      <motion.header className="dp-hero" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="dp-hero-brand">
          <span className="dp-hero-logo"><Truck size={20} /></span>
          <div>
            <p className="dp-hero-eyebrow">GROZO Delivery Partner</p>
            <h1 className="dp-hero-title">{user?.name || "Driver"}</h1>
          </div>
          <span className="dp-role-badge">Delivery Partner</span>
        </div>
        <div className="dp-hero-meta">
          <span className={`dp-avail-pill ${isAvailable ? "up" : "down"}`}>
            <span className="dp-avail-dot" aria-hidden="true" />
            {isAvailable ? "Available" : "Unavailable"}
          </span>
          <button
            className={`dp-loc-btn ${locState === "on" ? "on" : ""}`}
            onClick={locState === "on" ? stopSharing : startSharing}
            aria-pressed={locState === "on"}
            aria-label={locState === "on" ? "Stop sharing location" : "Share your location"}
            title={locState === "on" ? "Stop sharing location" : "Share your location"}
          >
            {locState === "on" ? <CheckCircle2 size={16} /> : <Navigation size={16} />}
          </button>
        </div>
      </motion.header>

      {locState === "on" && (
        <div className="loc-sharing-banner dp-loc-banner" role="status">
          <span className="live-dot" /> Your customers can now see your live location.
        </div>
      )}

      <motion.section
        className="dp-avail-card"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        aria-label="Availability"
      >
        <div className="dp-avail-info">
          <span className={`dp-avail-status ${isAvailable ? "up" : "down"}`}>
            <span className="dp-avail-dot" aria-hidden="true" />
            {hasActive
              ? "On an active delivery"
              : isAvailable
                ? "You're available"
                : "You're currently unavailable"}
          </span>
          <p className="dp-avail-sub">
            {hasActive
              ? "Finish your current delivery to change availability."
              : isAvailable
                ? "You'll be assigned new orders automatically."
                : "Turn availability on when you're ready for deliveries."}
          </p>
        </div>
        <button
          role="switch"
          aria-checked={isAvailable}
          disabled={hasActive || availabilityBusy}
          className={`avail-switch ${isAvailable ? "on" : "off"} ${hasActive ? "locked" : ""}`}
          onClick={() => changeAvailability(isAvailable ? "offline" : "available")}
          aria-label={isAvailable ? "Set availability to unavailable" : "Set availability to available"}
        >
          <span className="avail-switch-track">
            {availabilityBusy
              ? <Loader2 size={15} className="spin" />
              : isAvailable ? <Power size={15} /> : <PowerOff size={15} />}
          </span>
          <span className="avail-switch-label">{isAvailable ? "Available" : "Unavailable"}</span>
        </button>
        {hasActive && (
          <p className="avail-lock-note dp-lock-note" role="note">
            Availability is locked while a delivery is in progress.
          </p>
        )}
      </motion.section>

      <motion.div className="dp-metrics" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.06 } } }}>
        {[
          {
            label: "Active Delivery",
            value: hasActive ? 1 : 0,
            icon: <ShoppingBag size={18} />,
            tone: "blue",
            hint: hasActive ? activeOrder.id : "--",
          },
          {
            label: "In Transit",
            value: inTransit,
            icon: <Bike size={18} />,
            tone: "purple",
          },
          {
            label: "Delivered Today",
            value: deliveredToday,
            icon: <CheckCircle2 size={18} />,
            tone: "green",
          },
          {
            label: "Status",
            value: isAvailable ? "Available" : "Unavailable",
            icon: <Clock size={18} />,
            tone: isAvailable ? "green" : "amber",
          },
        ].map((m) => (
          <motion.div key={m.label} className={`dp-metric ${m.tone}`} variants={fadeUp}>
            <div className="dp-metric-top">
              <span className="dp-metric-icon">{m.icon}</span>
              <span className="dp-metric-label">{m.label}</span>
            </div>
            <motion.span
              key={String(m.value)}
              className="dp-metric-value"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              {m.value}
            </motion.span>
            {m.hint && <span className="dp-metric-hint">{m.hint}</span>}
          </motion.div>
        ))}
      </motion.div>

      {hasActive ? (
        <motion.section
          className="dash-panel active-delivery-panel dp-active"
          aria-label="Active delivery"
          layout
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="dash-panel-title-row">
            <h2 className="dash-panel-title"><PackageCheck size={18} /> Active Delivery</h2>
            <span className={`order-status ${activeOrder.status}`}>
              {STATUS_LABELS[activeOrder.status] || humanize(activeOrder.status)}
            </span>
          </div>

          <div className="dp-active-card" aria-live="polite">
            <div className="dp-active-head">
              <span className="order-id active-order-id">
                <Hash size={13} /> {deliveryId(activeOrder.id)}
              </span>
              <span className="dp-active-total">{formatINR(activeOrder.total_amount)}</span>
            </div>

            <div className="dp-active-address">
              <span className="dp-addr-icon">
                <MapPin size={17} />
              </span>
              <div className="dp-addr-info">
                <strong>
                  {activeOrder.delivery_address}
                  {activeOrder.delivery_city ? `, ${activeOrder.delivery_city}` : ""}
                </strong>
                {activeOrder.delivery_phone && (
                  <a className="dp-call-link" href={`tel:${activeOrder.delivery_phone}`}>
                    <Phone size={13} /> {activeOrder.delivery_phone}
                  </a>
                )}
              </div>
            </div>

            <DeliveryFlow status={activeOrder.status} />

            <div className="dp-active-meta">
              <span>
                <ShoppingBag size={14} />
                {(activeOrder.items || []).reduce((s, i) => s + i.quantity, 0)} item
                {(activeOrder.items || []).reduce((s, i) => s + i.quantity, 0) > 1 ? "s" : ""}
              </span>
              <span>
                <CalendarClock size={14} />
                Assigned {activeOrder.created_at
                  ? new Date(activeOrder.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  : "recently"}
              </span>
            </div>

            <div className="active-order-items">
              {(activeOrder.items || []).map((oi) => (
                <div className="order-item-row" key={oi.id}>
                  <span className="order-item-name">{oi.product_name}</span>
                  <span className="order-item-meta">Qty {oi.quantity} × {formatINR(oi.price)}</span>
                  <span className="order-item-sub">{formatINR(oi.price * oi.quantity)}</span>
                </div>
              ))}
            </div>

            {ACTIONS[activeOrder.status] && (
              <div className="driver-actions dp-actions">
                <button
                  className={`btn ${ACTIONS[activeOrder.status].cls} dp-action-btn`}
                  disabled={updatingId != null}
                  onClick={() => updateStatus(activeOrder, ACTIONS[activeOrder.status])}
                >
                  {updatingId === activeOrder.id
                    ? <Loader2 size={18} className="spin" />
                    : ACTIONS[activeOrder.status].icon}
                  {updatingId === activeOrder.id ? "Updating…" : ACTIONS[activeOrder.status].label}
                </button>
                {["accepted", "picked_up", "out_for_delivery"].includes(activeOrder.status) && (
                  <button className="btn btn-outline dp-nav-btn" onClick={() => navigateToAddress(activeOrder)} disabled={updatingId != null}>
                    <Navigation size={16} /> Navigate
                  </button>
                )}
              </div>
            )}
            {activeOrder.status === "delivered" && (
              <div className="driver-delivered-note">
                <CheckCheck size={16} /> Delivered successfully
              </div>
            )}
          </div>
        </motion.section>
      ) : (
        <motion.section
          className={`dp-idle ${isAvailable ? "dp-waiting" : "dp-offline"}`}
          ref={idleRef}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="dp-idle-rings" aria-hidden="true"><span /></span>
          <div className="empty driver-empty">
            {isAvailable ? <Inbox size={44} className="empty-icon" /> : <PowerOff size={44} className="empty-icon" />}
            <h2>No active deliveries</h2>
            <p>
              {isAvailable
                ? "You're available — new delivery assignments will appear here automatically."
                : "You're currently unavailable. Turn availability on to receive deliveries."}
            </p>
          </div>
          {orders.length > 0 && (
            <button className="btn btn-outline dp-history-cta" onClick={scrollToHistory}>
              <ChevronDown size={16} /> View Delivery History
            </button>
          )}
        </motion.section>
      )}

      <motion.section
        className="dash-panel dp-history"
        ref={historyRef}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
      >
        <div className="dash-panel-title-row">
          <h2 className="dash-panel-title"><Package size={18} /> Delivery History</h2>
          <div className="dp-history-actions">
            {orders.length > 0 && <span className="order-count-chip">{orders.length} deliveries</span>}
            <button
              className="dp-refresh-btn"
              onClick={handleRefresh}
              disabled={refresh}
              aria-label="Refresh deliveries"
              title="Refresh deliveries"
            >
              {refresh ? <Loader2 size={15} className="spin" /> : <RefreshCw size={15} />}
            </button>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="empty">
            <Package size={48} className="empty-icon" />
            <h2>No deliveries yet</h2>
            <p>Orders assigned to you will show up here.</p>
          </div>
        ) : (
          <div className="orders-list driver-orders-list">
            <AnimatePresence>
              {orders.map((order) => {
                const action = ACTIONS[order.status];
                const itemsCount = (order.items || []).reduce((s, i) => s + i.quantity, 0);
                const isActive = activeOrder?.id === order.id;
                const stamp = order.delivered_at || order.created_at || null;
                return (
                  <motion.div key={order.id} className="order-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} layout>
                    <button
                      className="order-header"
                      onClick={() => setOpenId(openId === order.id ? null : order.id)}
                      aria-expanded={openId === order.id}
                    >
                      <div className="order-header-left">
                        <span className={`order-status ${order.status}`}>{STATUS_LABELS[order.status] || humanize(order.status)}</span>
                        <span className="order-id">{deliveryId(order.id)}</span>
                      </div>
                      <div className="order-header-right">
                        {isActive && <span className="order-chip-live">In progress</span>}
                        <span className="order-total">{formatINR(order.total_amount)}</span>
                        <ChevronDown size={18} className={`order-chevron ${openId === order.id ? "flip" : ""}`} />
                      </div>
                    </button>
                    <AnimatePresence>
                      {openId === order.id && (
                        <motion.div className="order-details" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                          <div className="driver-order-meta">
                            {stamp && (
                              <div className="driver-item">
                                <span className="driver-meta-label"><CalendarClock size={14} /></span>
                                <span>{new Date(stamp).toLocaleString()}</span>
                              </div>
                            )}
                            <div className="driver-item"><span className="driver-meta-label">Customer</span> <span>{order.customer_name || "Customer"}</span></div>
                            <div className="driver-item"><span className="driver-meta-label">Items</span> <span>{itemsCount} item{itemsCount > 1 ? "s" : ""}</span></div>
                            <div className="driver-item"><span className="driver-meta-label">Total</span> <span className="driver-total">{formatINR(order.total_amount)}</span></div>
                            <div className="driver-item"><span className="driver-meta-label">Payment</span> <span>{order.payment_method === "gpay" ? "GPay (QR)" : "Cash on Delivery"}</span></div>
                            {order.delivery_address && (
                              <div className="driver-item"><span className="driver-meta-label"><MapPin size={14} /></span> <span>{order.delivery_address}{order.delivery_city ? `, ${order.delivery_city}` : ""}</span></div>
                            )}
                            {order.delivery_phone && (
                              <div className="driver-item"><span className="driver-meta-label"><Phone size={14} /></span> <span>{order.delivery_phone}</span></div>
                            )}
                          </div>
                          <div className="order-items-list">
                            {(order.items || []).map((oi) => (
                              <div className="order-item-row" key={oi.id}>
                                <span className="order-item-name">{oi.product_name}</span>
                                <span className="order-item-meta">Qty {oi.quantity} × {formatINR(oi.price)}</span>
                                <span className="order-item-sub">{formatINR(oi.price * oi.quantity)}</span>
                              </div>
                            ))}
                          </div>
                          {action && !isActive && (
                            <div className="driver-actions">
                              <button
                                className={`btn ${action.cls}`}
                                disabled={updatingId != null}
                                onClick={() => updateStatus(order, action)}
                              >
                                {updatingId === order.id ? <Loader2 size={17} className="spin" /> : action.icon}
                                {updatingId === order.id ? "Updating…" : action.label}
                              </button>
                            </div>
                          )}
                          {order.status === "delivered" && (
                            <div className="driver-delivered-note">
                              <CheckCheck size={16} /> Delivered successfully
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
      </motion.section>
    </div>
  );
}