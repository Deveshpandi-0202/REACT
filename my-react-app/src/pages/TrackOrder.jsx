import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion, MotionConfig } from "framer-motion";
import {
  Truck, MapPin, Loader2, ChevronLeft, Navigation, Clock,
  ShoppingBag, CheckCircle2, Package, RefreshCw, Phone,
  ShieldCheck, Bike, PackageCheck, Home, ClipboardList,
} from "lucide-react";
import api from "../api/axios";

const FLOW = ["pending", "confirmed", "preparing", "ready_for_pickup", "assigned", "accepted", "picked_up", "out_for_delivery", "delivered"];

const HUMAN = {
  pending: "Order Placed",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready_for_pickup: "Ready for Pickup",
  assigned: "Driver Assigned",
  accepted: "Driver Accepted",
  picked_up: "Picked Up",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
};

// The 5 delivery-phase steps customers see (maps to the real order state machine).
const CUSTOMER_FLOW = ["assigned", "accepted", "picked_up", "out_for_delivery", "delivered"];
const CUSTOMER_HUMAN = {
  assigned: "Driver Assigned",
  accepted: "Driver Accepted",
  picked_up: "Picked Up",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
};
const CUSTOMER_ICON = {
  assigned: Truck,
  accepted: Truck,
  picked_up: Bike,
  out_for_delivery: MapPin,
  delivered: CheckCircle2,
};
const PRE_ICON = {
  pending: Home,
  confirmed: Package,
  preparing: PackageCheck,
  ready_for_pickup: PackageCheck,
};

const POLL_MS = 5000;
const TERMINAL_STATUSES = ["delivered", "cancelled"];

function formatINR(n) {
  return `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function TrackSkeleton() {
  return (
    <div className="track-skel" role="status" aria-label="Loading tracking details">
      <div className="track-skel-card">
        <div className="skeleton skeleton-line short" />
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-line short" />
      </div>
      <div className="track-skel-card">
        {[0, 1, 2, 3, 4].map((i) => (
          <div className="track-skel-step" key={i}>
            <span className="skeleton track-skel-dot" />
            <div className="skeleton skeleton-line" />
          </div>
        ))}
      </div>
      <div className="track-skel-grid">
        <div className="track-skel-card"><div className="skeleton skeleton-line" /><div className="skeleton skeleton-line short" /></div>
        <div className="track-skel-card"><div className="skeleton skeleton-line" /><div className="skeleton skeleton-line short" /></div>
      </div>
    </div>
  );
}

function buildError(kind, message) {
  return { kind, message };
}

export default function TrackOrder() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [distKm, setDistKm] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const pollRef = useRef(null);
  const inFlightRef = useRef(false);

  const applyOrder = useCallback((o) => {
    setOrder(o);
    setError(null);
    if (o.driver_latitude != null && o.driver_longitude != null) {
      if (o.latitude != null && o.longitude != null) {
        setDistKm(haversine(o.driver_latitude, o.driver_longitude, o.latitude, o.longitude));
      } else {
        setDistKm(null);
      }
    } else {
      setDistKm(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchOrder = async () => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      try {
        const res = await api.get(`/orders/${orderId}`);
        if (cancelled) return;
        applyOrder(res.data);
        if (TERMINAL_STATUSES.includes(res.data.status)) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      } catch (err) {
        if (cancelled) return;
        const status = err.response?.status;
        if (status === 403) {
          setError(buildError("forbidden", "You are not authorized to view this order."));
        } else if (status === 401 || status === 422) {
          setError(buildError("session", "Your session has expired. Please sign in again."));
        } else if (status === 404) {
          setError(buildError("notfound", "This order could not be found."));
        } else {
          setError(buildError("network", "Couldn't load your order. Check your connection and try again."));
        }
        if (status === 401 || status === 403 || status === 404 || status === 422) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      } finally {
        if (!cancelled) setLoading(false);
        inFlightRef.current = false;
      }
    };

    fetchOrder();
    pollRef.current = setInterval(fetchOrder, POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(pollRef.current);
      pollRef.current = null;
      inFlightRef.current = false;
      setRefreshing(false);
    };
  }, [orderId, refreshKey, applyOrder]);

  const manualRefresh = () => {
    setRefreshing(true);
    setRefreshKey((k) => k + 1);
  };

  const retry = () => {
    setLoading(true);
    setError(null);
    setRefreshKey((k) => k + 1);
  };

  if (loading) return <TrackSkeleton />;

  if (error) {
    const { kind, message } = error;
    return (
      <div className="track-page">
        <Link to="/orders" className="back-link"><ChevronLeft size={16} /> Back to Orders</Link>
        <div className="empty track-error-state">
          {kind === "forbidden"
            ? <ShieldCheck size={48} className="empty-icon" />
            : kind === "notfound"
              ? <Package size={48} className="empty-icon" />
              : <RefreshCw size={48} className="empty-icon" />}
          <h2>
            {kind === "forbidden" ? "Not your order"
              : kind === "notfound" ? "Order not found"
                : kind === "session" ? "Session expired"
                  : "Something went wrong"}
          </h2>
          <p>{message}</p>
          {kind === "session" ? (
            <button className="btn btn-primary" onClick={() => navigate("/signin")}>Sign In</button>
          ) : kind === "forbidden" ? (
            <Link to="/orders" className="btn btn-primary"><ChevronLeft size={16} /> My Orders</Link>
          ) : (
            <button className="btn btn-primary" onClick={retry}><RefreshCw size={16} /> Try Again</button>
          )}
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="track-page">
        <Link to="/orders" className="back-link"><ChevronLeft size={16} /> Back to Orders</Link>
        <div className="empty"><Package size={48} className="empty-icon" /><h2>Order not found</h2></div>
      </div>
    );
  }

  const isDelivered = order.status === "delivered";
  const isCancelled = order.status === "cancelled";
  const preDelivery = FLOW.indexOf(order.status) < FLOW.indexOf("assigned");
  const hasDriver = Boolean(order.driver_name);
  const hasCoordinate = order.driver_latitude != null && order.driver_longitude != null;
  const driverIdx = CUSTOMER_FLOW.indexOf(order.status);

  const statusLine = isDelivered
    ? "This order has been delivered."
    : isCancelled
      ? "This order was cancelled."
      : preDelivery
        ? "We're preparing your order and will assign a delivery partner shortly."
        : order.status === "assigned"
          ? "A delivery partner is on the way to collect your order."
          : "Your groceries are on the way.";

  const eta = (() => {
    if (isDelivered) return { label: "Delivered", value: order.delivered_at ? new Date(order.delivered_at).toLocaleString() : "Completed" };
    if (isCancelled) return { label: "Status", value: "Cancelled" };
    if (order.estimated_delivery) {
      const d = new Date(order.estimated_delivery);
      const today = new Date();
      const sameDay = d.toDateString() === today.toDateString();
      return {
        label: "Estimated delivery",
        value: sameDay
          ? d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
          : d.toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" }),
      };
    }
    return { label: "Estimated delivery", value: "Unavailable" };
  })();

  const openInMaps = () => {
    if (hasCoordinate) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${order.driver_latitude},${order.driver_longitude}`,
        "_blank"
      );
    } else if (order.latitude != null && order.longitude != null) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${order.latitude},${order.longitude}`,
        "_blank"
      );
    }
  };

  const renderStepper = () => {
    const steps = preDelivery ? FLOW.slice(0, 4) : CUSTOMER_FLOW;
    const icons = preDelivery ? PRE_ICON : CUSTOMER_ICON;
    const labels = preDelivery ? HUMAN : CUSTOMER_HUMAN;
    const currentIndex = preDelivery ? Math.min(FLOW.indexOf(order.status), steps.length - 1) : Math.max(0, driverIdx);

    return (
      <>
      <div className={`track-stepper ${preDelivery ? "pre-delivery" : ""}`} aria-label="Delivery progress">
        {steps.map((s, i) => {
          const done = i < currentIndex;
          const current = i === currentIndex;
          const Icon = icons[s];
          const label = labels[s];
          return (
            <div key={s} className={`track-step-line ${done ? "done" : ""} ${current ? "current" : ""}`}>
              <span className="track-step-dot" aria-hidden="true">
                {done ? <CheckCircle2 size={16} /> : <Icon size={15} />}
              </span>
              <span className="track-step-label">{label}</span>
            </div>
          );
        })}
      </div>
      <p className="sr-only" aria-live="polite">Current status: {HUMAN[order.status] || order.status}</p>
    </>
    );
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="track-page">
        <Link to="/orders" className="back-link"><ChevronLeft size={16} /> Back to Orders</Link>

        <div className="track-head">
          <div>
            <h1>Track Order <span className="track-order-num">GZ-{String(order.id).padStart(4, "0")}</span></h1>
            <p className="track-sub">{statusLine}</p>
          </div>
          <span className={`order-status ${order.status}`} aria-live="polite">{HUMAN[order.status] || order.status}</span>
        </div>

        {isDelivered ? (
          <motion.div
            className="track-delivered"
            role="status"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, repeatType: "reverse" }}
            >
              <CheckCircle2 size={46} className="success-big" />
            </motion.div>
            <h2>Delivered!</h2>
            <p>Thank you for shopping with GROZO. We hope you enjoy your order.</p>
            <div className="track-delivered-actions">
              <Link to="/orders" className="btn btn-primary"><ClipboardList size={15} /> My Orders</Link>
              <Link to="/" className="btn btn-outline"><ShoppingBag size={15} /> Shop Again</Link>
            </div>
          </motion.div>
        ) : isCancelled ? (
          <div className="track-cancelled" role="status">
            <Package size={42} />
            <h2>Order Cancelled</h2>
            <p>This order was cancelled and will not be delivered.</p>
          </div>
        ) : (
          <div className="track-progress" role="region" aria-label="Order status">
            <div className="track-progress-header">
              <span className="eta-chip track-progress-eta">
                <Clock size={16} />
                <span>Est. by <strong>{eta.value}</strong></span>
              </span>
              <button
                className="track-refresh-btn"
                onClick={manualRefresh}
                disabled={refreshing}
                aria-label="Refresh order status"
                title="Refresh status"
              >
                <Loader2 size={15} className={refreshing ? "spin" : ""} />
              </button>
            </div>
            {renderStepper()}
          </div>
        )}

        <div className="track-layout">
          <div className="track-cards">
            <div className="track-card driver-card">
              <div className="track-card-title"><Truck size={17} /> Delivery Partner</div>
              {hasDriver ? (
                <>
                  <div className="driver-detail-row">
                    <div className="driver-avatar">{order.driver_name.charAt(0).toUpperCase()}</div>
                    <div>
                      <strong>{order.driver_name}</strong>
                      <p className="driver-role-line"><Truck size={13} /> Delivery Partner</p>
                    </div>
                  </div>
                  <div className="driver-status-line">
                    <span className={`driver-availability ${order.driver_availability || "available"}`}>
                      <span className="dp-avail-dot" aria-hidden="true" />
                      {order.driver_availability === "available" ? "Available" : "On a delivery"}
                    </span>
                    {distKm != null && (
                      <span className="driver-dist-chip"><MapPin size={13} /> ~{distKm.toFixed(1)} km away</span>
                    )}
                  </div>
                </>
              ) : isDelivered ? (
                <p className="track-muted">Delivery completed.</p>
              ) : isCancelled ? (
                <p className="track-muted">No delivery partner was assigned.</p>
              ) : (
                <div className="track-finding-partner">
                  <motion.span
                    className="track-finding-pulse"
                    animate={{ scale: [1, 1.12, 1], opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 1.6, repeat: Infinity }}
                    aria-hidden="true"
                  >
                    <Truck size={28} />
                  </motion.span>
                  <strong>Finding your delivery partner…</strong>
                  <p className="track-muted">Finding a delivery partner is in progress — we're matching your order with the nearest available partner. This can take a moment.</p>
                </div>
              )}
            </div>

            {!isDelivered && (
              <div className="track-card">
                <div className="track-card-title"><MapPin size={17} /> Live Location</div>
                {hasCoordinate ? (
                  <div className="track-live-location" role="status">
                    <div className="track-live-row">
                      <span className="live-dot" aria-hidden="true" />
                      <span>Live delivery location available</span>
                    </div>
                    <p className="track-muted">
                      {distKm != null
                        ? `Your delivery partner is about ${distKm.toFixed(1)} km from the delivery address.`
                        : "Your delivery partner's location is now live."}
                    </p>
                    <button className="btn btn-sm btn-primary" onClick={openInMaps} disabled={!hasCoordinate && order.latitude == null}>
                      <Navigation size={14} /> Open in Maps
                    </button>
                  </div>
                ) : (
                  <div className="track-location-placeholder" role="status">
                    <span className="track-location-pin" aria-hidden="true"><MapPin size={22} /></span>
                    <div>
                      <strong>Live location</strong>
                      <p className="track-muted">Live location will appear here once the driver heads out for delivery.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="track-card">
              <div className="track-card-title"><MapPin size={17} /> Delivery Address</div>
              <p className="track-address">
                {order.delivery_address}{order.delivery_city ? `, ${order.delivery_city}` : ""}
                {order.pincode ? `, ${order.pincode}` : ""}
              </p>
              <p className="track-muted"><Phone size={13} /> {order.delivery_phone || "—"}</p>
            </div>

            <div className="track-card">
              <div className="track-card-title"><ShoppingBag size={17} /> Order Summary</div>
              <div className="track-items">
                {(order.items || []).map((oi) => (
                  <div className="checkout-item" key={oi.id}>
                    <div className="checkout-item-info">
                      <span className="checkout-item-name">{oi.product_name}</span>
                      <span className="checkout-item-qty">Qty {oi.quantity}</span>
                    </div>
                    <span className="checkout-item-price">{formatINR(oi.price * oi.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="track-total">
                <span>{order.payment_method === "gpay" ? "Total · GPay" : "Total · Cash on Delivery"}</span>
                <strong>{formatINR(order.total_amount)}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}