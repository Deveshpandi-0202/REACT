import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  ChevronDown,
  Truck,
  MapPin,
  Search,
  X,
  Bike,
  User,
} from "lucide-react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { io } from "socket.io-client";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

function humanize(status) {
  const s = (status || "").replace(/_/g, " ");
  let result = "";
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (i === 0 || s[i - 1] === " ") {
      result += c.toUpperCase();
    } else {
      result += c;
    }
  }
  return result;
}

const ALL_STATUSES = [
  "pending", "confirmed", "preparing", "ready_for_pickup",
  "assigned", "picked_up", "out_for_delivery", "delivered", "cancelled",
];

function LiveTrackingMap({ order }) {
  const { user } = useAuth();
  const [driverPos, setDriverPos] = useState(null);
  const socketRef = useRef(null);
  const listenerRef = useRef(null);

  useEffect(() => {
    const canTrack =
      order.status !== "delivered" &&
      order.status !== "cancelled" &&
      order.driver_name;

    if (canTrack) {
      if (socketRef.current?.connected && socketRef.current.orderId === order.id) {
        return;
      }

      if (socketRef.current) {
try {
          socketRef.current.disconnect();
        } catch {
          /* empty */
        }
        socketRef.current = null;
      }
      if (listenerRef.current) {
        socketRef.current?.off("driver_location_update");
        listenerRef.current = null;
      }

      const token = user?.token || localStorage.getItem("token");
      if (!token) {
        return;
      }

      socketRef.current = io(
        import.meta.env.VITE_API_URL || "http://localhost:5000/api",
        {
          auth: { token },
        }
      );

      socketRef.current.emit("join_tracking_room", { orderId: order.id });

      socketRef.current.on("driver_location_update", (data) => {
        setDriverPos({
          latitude: data.latitude,
          longitude: data.longitude,
        });
      });

      listenerRef.current = () => {
        if (socketRef.current) {
          socketRef.current.emit(
            "leave_tracking_room",
            { orderId: order.id }
          );
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      };

      return () => {
        if (listenerRef.current) {
          listenerRef.current();
          listenerRef.current = null;
        }
      };
    }
  }, [order.id, user?.token, order.status, order.driver_name]);

  useEffect(() => {
    return () => {
      if (listenerRef.current) {
        listenerRef.current();
      }
    };
  }, []);

  if (!order.driver_name) {
    return null;
  }

  const statusLabels = {
    assigned: "Driver Assigned",
    accepted: "Driver Accepted",
    picked_up: "Picked Up",
    out_for_delivery: "Out for Delivery",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };

  const humanStatus = statusLabels[order.status] || order.status;

  if (driverPos === null) {
    return (
      <div className="live-tracking-state">
        <span className="live-dot" aria-hidden="true" />
        <span>Waiting for driver's live location…</span>
      </div>
    );
  }

  if (!order.delivery_address && !order.latitude && !order.longitude) {
    return null;
  }

  return (
    <MapContainer
      center={driverPos ? [driverPos.latitude, driverPos.longitude] : [order.driver_latitude || 0, order.driver_longitude || 0]}
      zoom={15}
      className="admin-live-tracking-map"
      style={{ height: "400px", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {order.driver_latitude != null && order.driver_longitude != null && order.latitude != null && order.longitude != null && (
        <Polyline
          positions={[
            [order.driver_latitude, order.driver_longitude],
            [order.latitude, order.longitude],
          ]}
          color="#6366f1"
          weight={5}
          opacity={0.8}
        />
      )}

      {driverPos ? (
        <Marker
          position={[driverPos.latitude, driverPos.longitude]}
          icon={Bike}
          className="admin-driver-marker"
        >
          <Popup>
            <div>
              <strong>{order.driver_name}</strong><br />
              Lat: {driverPos.latitude.toFixed(4)}, Lng: {driverPos.longitude.toFixed(4)}
            </div>
          </Popup>
        </Marker>
      ) : null}

      {order.latitude != null && order.longitude != null ? (
        <Marker
          position={[order.latitude, order.longitude]}
          icon={User}
          className="admin-customer-marker"
        >
          <Popup>
            <div>
              <strong>Delivery Location</strong><br />
              {order.delivery_address}{order.delivery_city ? `, ${order.delivery_city}` : ""}
            </div>
          </Popup>
        </Marker>
      ) : null}

      <div className="admin-tracking-info">
        <div className="info-row">
          <span className="info-label">Order</span>
          <span>{`#${order.id}`}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Driver</span>
          <span>{order.driver_name}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Status</span>
          <span>{humanStatus}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Driver GPS</span>
          <span>
            {driverPos.latitude.toFixed(4)}, {driverPos.longitude.toFixed(4)}
          </span>
        </div>
        {order.latitude != null && order.longitude != null ? (
          <div className="info-row">
            <span className="info-label">Delivery Location</span>
            <span>
              {order.latitude.toFixed(4)}, {order.longitude.toFixed(4)}
            </span>
          </div>
        ) : null}
      </div>
    </MapContainer>
  );
}

export default function OrdersManagement() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState(null);
  const [trackingOrderId, setTrackingOrderId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([api.get("/admin/orders")])
      .then(([oRes]) => {
        setOrders(oRes.data || []);
      })
      .catch((err) => setError(err.response?.data?.error || "Failed to load orders"))
      .finally(() => {
      });
  }, []);

  useEffect(() => {
    return () => {
    };
  }, []);

  const q = search.trim().toLowerCase();
  const filteredOrders = orders.filter((o) => {
    const matchesStatus = !statusFilter || o.status === statusFilter;
    const matchesQuery =
      !q ||
      String(o.id) === q ||
      (o.customer_name || "").toLowerCase().includes(q) ||
      (o.driver_name || "").toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });

  return (
    <div className="admin-page">
      <h1><ShoppingBag size={22} /> Order Management</h1>

      {error && <div className="error-msg">{error}</div>}

      <div className="dash-panel">
        <h3 className="dash-panel-title">All Orders</h3>
        <div className="admin-search-row">
          <div className="admin-search">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search by order ID, customer or driver…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
              aria-label="Search orders"
            />
            {search && (
              <button className="admin-search-clear" onClick={() => setSearch("")} aria-label="Clear search">
                <X size={15} />
              </button>
            )}
          </div>
          <div className="admin-cat-filter">
            <select
              className="order-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="">All Statuses</option>
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>{humanize(s)}</option>
              ))}
            </select>
            <ChevronDown size={15} className="admin-cat-chevron" />
          </div>
          <span className="admin-search-count">
            Showing {filteredOrders.length} of {orders.length}
          </span>
        </div>
        {filteredOrders.length === 0 ? (
          <p className="dash-empty">
            {orders.length === 0 ? "No orders yet" : "No orders match your filters"}
          </p>
        ) : (
          <div className="orders-list admin-orders-list">
            <AnimatePresence>
              {filteredOrders.map((order) => {
                return (
                  <motion.div key={order.id} className="order-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                    <button className="order-header" onClick={() => setOpenId(openId === order.id ? null : order.id)}>
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
                            <div className="driver-item"><span className="driver-meta-label">Customer</span> <span>{order.customer_name || `#${order.user_id}`}</span></div>
                            <div className="driver-item"><span className="driver-meta-label">Items</span> <span>{(order.items || []).reduce((s, i) => s + i.quantity, 0)} items</span></div>
                            <div className="driver-item"><span className="driver-meta-label">Total</span> <span className="driver-total">₹{order.total_amount.toFixed(2)}</span></div>
                            <div className="driver-item"><span className="driver-meta-label">Payment</span> <span>{order.payment_method === "gpay" ? "GPay (QR)" : "Cash on Delivery"}</span></div>
                            {order.estimated_delivery && (
                              <div className="driver-item"><span className="driver-meta-label">Est. Delivery</span> <span>{order.estimated_delivery}</span></div>
                            )}
                            {order.delivery_address && (
                              <div className="driver-item"><span className="driver-meta-label"><MapPin size={14} /></span> <span>{order.delivery_address}{order.delivery_city ? `, ${order.delivery_city}` : ""}</span></div>
                            )}
                            {order.driver_name && (
                              <div className="driver-item">
                                <span className="driver-meta-label"><Truck size={14} /></span>
                                <span>
                                  {order.driver_name}
                                  {order.status === "assigned" && (
                                    <span className="auto-assigned-badge">Auto-assigned</span>
                                  )}
                                </span>
                              </div>
                            )}
                            {order.driver_latitude != null && order.driver_longitude != null && (
                              <div className="driver-item">
                                <span className="driver-meta-label"><Bike size={14} /></span>
                                <span>
                                  {order.driver_latitude.toFixed(4)}, {order.driver_longitude.toFixed(4)}
                                </span>
                              </div>
                            )}
                            {order.driver_name && order.status !== "delivered" && order.status !== "cancelled" && (
                              <div className="driver-item">
                                <span className="driver-meta-label"><Bike size={14} /> LiveTracking</span>
                                <span
                                  onClick={() => setTrackingOrderId(order.id)}
                                  style={{ cursor: "pointer", fontWeight: "500" }}
                                >
                                  Live
                                </span>
                              </div>
                            )}
                          </div>

                          {trackingOrderId === order.id && <LiveTrackingMap order={order} />}
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