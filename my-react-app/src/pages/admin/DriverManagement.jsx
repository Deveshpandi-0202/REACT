import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Truck, Loader2, UserCheck, UserX, UserPlus, Plus, X, Trash2 } from "lucide-react";
import api from "../../api/axios";
import { useToast } from "../../context/ToastContext";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

function humanize(s) {
  return (s || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function DriverManagement() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const mountedRef = useRef(true);

  const load = () => {
    api
      .get("/admin/drivers")
      .then((res) => { if (mountedRef.current) setDrivers(res.data || []); })
      .catch((err) => { if (mountedRef.current) setError(err.response?.data?.error || "Failed to load drivers"); })
      .finally(() => { if (mountedRef.current) setLoading(false); });
  };

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => { mountedRef.current = false; };
  }, []);

  const handleToggle = async (driver) => {
    try {
      const res = await api.put(`/admin/users/${driver.id}/toggle`);
      setDrivers((prev) => prev.map((d) => (d.id === driver.id ? { ...d, is_active: res.data.is_active } : d)));
      toast.success(res.data.is_active ? "Driver activated" : "Driver deactivated");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update driver");
    }
  };

  const handleDelete = async (driver) => {
    if (!window.confirm(`Delete driver "${driver.name}"? This cannot be undone.`)) return;
    try {
      const res = await api.delete(`/admin/users/${driver.id}`);
      setDrivers((prev) => prev.filter((d) => d.id !== driver.id));
      toast.success(res.data?.message || "Driver deleted");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete driver");
    }
  };

  const handleAvailability = async (driver, value) => {
    try {
      const res = await api.put(`/admin/drivers/${driver.id}/availability`, { availability: value });
      setDrivers((prev) => prev.map((d) => (d.id === driver.id ? { ...d, availability: res.data.availability } : d)));
      toast.success(`Availability set to ${humanize(value)}`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update availability");
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/admin/drivers", form);
      toast.success("Driver created successfully");
      setShowAdd(false);
      setForm({ name: "", email: "", password: "" });
      setDrivers([]);
      setLoading(true);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to create driver");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading"><Loader2 size={24} className="spin" /> Loading drivers...</div>;
  if (error && drivers.length === 0) return <div className="error-msg">{error}</div>;

  const activeDrivers = drivers.filter((d) => d.is_active).length;

  const stats = [
    { label: "Total Drivers", value: drivers.length, icon: <Truck size={20} />, cls: "blue" },
    { label: "Active", value: activeDrivers, icon: <UserCheck size={20} />, cls: "green" },
    { label: "Inactive", value: drivers.length - activeDrivers, icon: <UserX size={20} />, cls: "red" },
  ];

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1><Truck size={22} /> Driver Management</h1>
        <div className="admin-header-actions">
          <button className="btn btn-primary" onClick={() => setShowAdd((v) => !v)}>
            {showAdd ? <X size={16} /> : <UserPlus size={16} />} {showAdd ? "Cancel" : "Add Driver"}
          </button>
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {showAdd && (
        <motion.form className="admin-form driver-add-form" onSubmit={handleCreate} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h3>Add New Driver</h3>
          <label htmlFor="new-driver-name" className="sr-only">Driver name</label>
          <input id="new-driver-name" placeholder="Driver Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <label htmlFor="new-driver-email" className="sr-only">Driver email</label>
          <input id="new-driver-email" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <label htmlFor="new-driver-password" className="sr-only">Driver password</label>
          <input id="new-driver-password" placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <Loader2 size={16} className="spin" /> : <Plus size={16} />} Create Driver
          </button>
        </motion.form>
      )}

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
        <h3 className="dash-panel-title">All Drivers</h3>
        {drivers.length === 0 ? (
          <p className="dash-empty">No drivers yet. Add your first driver above.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Availability</th>
                  <th>Assigned</th>
                  <th>Delivered</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((d) => (
                  <tr key={d.id}>
                    <td>{d.id}</td>
                    <td>{d.name}</td>
                    <td>{d.email}</td>
                    <td>
                      <span className={`driver-availability ${d.availability || "available"}`}>
                        {humanize(d.availability || "available")}
                      </span>
                    </td>
                    <td>{d.assigned_count}</td>
                    <td>{d.delivered_count}</td>
                    <td>
                      <span className={`status-badge ${d.is_active ? "active" : "inactive"}`}>
                        {d.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="admin-actions">
                      <button
                        onClick={() => handleToggle(d)}
                        className={`btn btn-sm ${d.is_active ? "btn-warning" : "btn-success"}`}
                      >
                        {d.is_active ? "Deactivate" : "Activate"}
                      </button>
                      <select
                        className="driver-avail-select"
                        value={d.availability || "available"}
                        onChange={(e) => handleAvailability(d, e.target.value)}
                        aria-label="Set availability"
                        disabled={!d.is_active}
                      >
                        <option value="available">Available</option>
                        <option value="busy">Busy</option>
                        <option value="inactive">Inactive</option>
                      </select>
                      <button
                        onClick={() => handleDelete(d)}
                        className="btn btn-sm btn-danger"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
