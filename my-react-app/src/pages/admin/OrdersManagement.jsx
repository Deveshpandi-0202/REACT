import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Loader2, ChevronDown, Truck, MapPin, Search, X } from "lucide-react";
import api from "../../api/axios";
import { useToast } from "../../context/ToastContext";

function humanize(status) {
  return (status || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const ASSIGNABLE = ["pending", "confirmed", "preparing", "ready_for_pickup"];

const ALL_STATUSES = [
  "pending", "confirmed", "preparing", "ready_for_pickup",
  "assigned", "picked_up", "out_for_delivery", "delivered", "cancelled",
];

export default function OrdersManagement() {
  const [orders, setOrders] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState({});
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const toast = useToast();

  useEffect(() => {
    Promise.all([api.get("/admin/orders"), api.get("/admin/drivers")])
      .then(([oRes, dRes]) => {
        setOrders(oRes.data || []);
        setDrivers(dRes.data || []);
      })
      .catch((err) => setError(err.response?.data?.error || "Failed to load orders"))
      .finally(() => setLoading(false));
  }, []);

  const assign = async (orderId) => {
    const driverId = selectedDriver[orderId];
    if (!driverId) {
      toast.error("Select a driver first");
      return;
    }
    try {
      const res = await api.put(`/admin/orders/${orderId}/assign-driver`, { driver_id: driverId });
      setOrders((prev) => prev.map((o) => (o.id === res.data.id ? res.data : o)));
      toast.success("Driver assigned successfully");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to assign driver");
    }
  };

  const updateStatus = async (order, e) => {
    const newStatus = e.target.value;
    if (!newStatus || newStatus === order.status) return;
    try {
      const res = await api.put(`/admin/orders/${order.id}/status`, { status: newStatus });
      setOrders((prev) => prev.map((o) => (o.id === res.data.id ? res.data : o)));
      toast.success(`Order #${order.id} marked ${humanize(newStatus)}`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update order status");
    }
  };

  if (loading) return <div className="loading"><Loader2 size={24} className="spin" /> Loading orders...</div>;
  if (error && orders.length === 0) return <div className="error-msg">{error}</div>;

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
                const canAssign = ASSIGNABLE.includes(order.status) && !order.driver_name;
                const itemsCount = (order.items || []).reduce((s, i) => s + i.quantity, 0);
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
                            <div className="driver-item"><span className="driver-meta-label">Items</span> <span>{itemsCount} items</span></div>
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

                          {canAssign && (
                            <div className="assign-driver-row">
                              <label className="assign-label" htmlFor={`assign-driver-${order.id}`}>Assign Driver:</label>
                              <select
                                id={`assign-driver-${order.id}`}
                                className="assign-select"
                                value={selectedDriver[order.id] || ""}
                                onChange={(e) => setSelectedDriver((p) => ({ ...p, [order.id]: e.target.value }))}
                              >
                                <option value="">Select Driver</option>
                                {drivers.filter((d) => d.is_active && d.availability !== "inactive").map((d) => (
                                  <option key={d.id} value={d.id}>
                                    {d.name} ({humanize(d.availability)})
                                  </option>
                                ))}
                              </select>
                              <button className="btn btn-primary btn-sm" onClick={() => assign(order.id)}>
                                <Truck size={14} /> Assign
                              </button>
                            </div>
                          )}
                          <div className="assign-driver-row admin-status-row">
                            <label className="assign-label">Update Status:</label>
                            <select
                              className="assign-select"
                              value={order.status || "pending"}
                              onChange={(e) => updateStatus(order, e)}
                              aria-label="Update order status"
                            >
                              {ALL_STATUSES.map((s) => (
                                <option key={s} value={s}>{humanize(s)}</option>
                              ))}
                            </select>
                          </div>
                          {order.status === "delivered" && (
                            <div className="driver-delivered-note">Delivered successfully</div>
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
