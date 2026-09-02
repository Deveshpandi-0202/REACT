import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users, Package, ShoppingBag, IndianRupee, Plus, AlertTriangle,
  Pencil, Trash2, LayoutDashboard, Loader2, Search, X,
} from "lucide-react";
import api from "../../api/axios";
import { useToast } from "../../context/ToastContext";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.get("/admin/stats"), api.get("/products")])
      .then(([statsRes, prodRes]) => {
        if (cancelled) return;
        setStats({ ...statsRes.data, products: prodRes.data });
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.response?.data?.error || "Failed to load dashboard. Is the backend running?");
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await api.delete(`/products/${id}`);
      setStats((s) => ({ ...s, products: s.products.filter((p) => p.id !== id) }));
      toast.success("Product deleted");
    } catch {
      toast.error("Failed to delete product");
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <Loader2 size={24} className="spin" /> Loading dashboard...
      </div>
    );
  }

  if (error) return <div className="error-msg">{error}</div>;

  const maxCat = Math.max(1, ...(stats.by_category || []).map((c) => c.count));

  const q = query.trim().toLowerCase();
  const filteredProducts = q
    ? stats.products.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        String(p.id).includes(q)
      )
    : stats.products;

  const statCards = [
    { label: "Total Users", value: stats.total_users, icon: <Users size={22} />, cls: "blue" },
    { label: "Total Products", value: stats.total_products, icon: <Package size={22} />, cls: "green" },
    { label: "Total Orders", value: stats.total_orders, icon: <ShoppingBag size={22} />, cls: "purple" },
    { label: "Revenue", value: `₹${(stats.revenue || 0).toFixed(2)}`, icon: <IndianRupee size={22} />, cls: "amber" },
  ];

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1><LayoutDashboard size={22} /> Admin Dashboard</h1>
        <Link to="/admin/add" className="btn btn-primary">
          <Plus size={16} /> Add Product
        </Link>
      </div>

      <motion.div
        className="stats-grid"
        initial="hidden"
        animate="show"
        transition={{ staggerChildren: 0.07 }}
      >
        {statCards.map((card) => (
          <motion.div key={card.label} className={`stat-card-lrg ${card.cls}`} variants={fadeUp}>
            <div className="stat-card-icon">{card.icon}</div>
            <span className="stat-card-value">{card.value}</span>
            <span className="stat-card-label">{card.label}</span>
          </motion.div>
        ))}
      </motion.div>

      <div className="admin-dash-grid">
        <div className="dash-panel">
          <h3 className="dash-panel-title">Products by Category</h3>
          {stats.by_category.length === 0 ? (
            <p className="dash-empty">No product data</p>
          ) : (
            <div className="cat-bars">
              {stats.by_category.map((c) => (
                <div className="cat-bar-row" key={c.category}>
                  <span className="cat-bar-label">{c.category}</span>
                  <div className="cat-bar-track">
                    <motion.div
                      className="cat-bar-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${(c.count / maxCat) * 100}%` }}
                      transition={{ duration: 0.6 }}
                    />
                  </div>
                  <span className="cat-bar-count">{c.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dash-panel">
          <h3 className="dash-panel-title">Low Stock Products</h3>
          {stats.low_stock.length === 0 ? (
            <p className="dash-empty">All products well stocked</p>
          ) : (
            <div className="low-stock-list">
              {stats.low_stock.map((p) => (
                <div className="low-stock-item" key={p.id}>
                  <AlertTriangle size={16} className="warn-icon" />
                  <span className="low-stock-name">{p.name}</span>
                  <span className="low-stock-qty">{p.stock} left</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="admin-dash-single">
        <div className="dash-panel">
          <h3 className="dash-panel-title">Recent Orders</h3>
          {stats.recent_orders.length === 0 ? (
            <p className="dash-empty">No orders yet</p>
          ) : (
            <div className="recent-orders">
              {stats.recent_orders.map((o) => (
                <div className="recent-order-row" key={o.id}>
                  <span className="recent-order-id">#{o.id}</span>
                  <span>
                    {o.created_at ? new Date(o.created_at).toLocaleDateString() : ""}
                  </span>
                  <span className={`order-status ${(o.status || "").toLowerCase()}`}>{o.status}</span>
                  <span className="recent-order-total">₹{o.total_amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="dash-panel">
        <h3 className="dash-panel-title">All Products</h3>
        <div className="admin-search-row">
          <div className="admin-search">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search by name, category or ID…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
            />
            {query && (
              <button className="admin-search-clear" onClick={() => setQuery("")} aria-label="Clear search">
                <X size={15} />
              </button>
            )}
          </div>
          <span className="admin-search-count">
            Showing {filteredProducts.length} of {stats.products.length}
          </span>
        </div>
        <div className="admin-table-wrap">
          {filteredProducts.length === 0 ? (
            <p className="dash-empty">No products match &ldquo;{query}&rdquo;</p>
          ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.name}</td>
                  <td>{p.category}</td>
                  <td>₹{p.price.toFixed(2)}</td>
                  <td>
                    <span className={`stock-flag ${p.stock <= 10 ? "low" : "ok"}`}>{p.stock}</span>
                  </td>
                  <td className="admin-actions">
                    <Link to={`/admin/edit/${p.id}`} className="btn btn-sm btn-primary">
                      <Pencil size={13} /> Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="btn btn-sm btn-danger"
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>
      </div>
    </div>
  );
}
