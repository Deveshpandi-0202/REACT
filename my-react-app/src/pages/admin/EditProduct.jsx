import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Save, Loader2, ChevronLeft, RefreshCw } from "lucide-react";
import api from "../../api/axios";
import { useToast } from "../../context/ToastContext";

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    image_url: "",
    category: "",
    stock: "",
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get(`/products/${id}`)
      .then((res) => {
        if (cancelled) return;
        const p = res.data;
        setForm({
          name: p.name,
          description: p.description,
          price: String(p.price),
          image_url: p.image_url,
          category: p.category,
          stock: String(p.stock),
        });
      })
      .catch(() => {
        if (!cancelled) setLoadError("Couldn't load this product. It may have been removed or the connection was interrupted.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id, retryKey]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.put(`/products/${id}`, {
        ...form,
        price: parseFloat(form.price),
        stock: parseInt(form.stock) || 0,
      });
      toast.success("Product updated successfully");
      navigate("/admin");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update product");
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading"><Loader2 size={24} className="spin" /> Loading product…</div>;

  if (loadError) {
    return (
      <motion.div
        className="admin-form-page"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button className="back-link" onClick={() => navigate("/admin")}>
          <ChevronLeft size={16} /> Back to Dashboard
        </button>
        <h1>Edit Product</h1>
        <div className="empty">
          <Loader2 size={40} className="empty-icon" />
          <h2>Couldn't load this product.</h2>
          <p>{loadError}</p>
          <div className="empty-actions">
            <button
              className="btn btn-primary"
              onClick={() => {
                setLoadError("");
                setLoading(true);
                setRetryKey((k) => k + 1);
              }}
            >
              <RefreshCw size={15} /> Try Again
            </button>
            <button className="btn btn-outline" onClick={() => navigate("/admin")}>
              Dashboard
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="admin-form-page"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <button className="back-link" onClick={() => navigate("/admin")}>
        <ChevronLeft size={16} /> Back to Dashboard
      </button>
      <h1>Edit Product</h1>
      <form className="admin-form" onSubmit={handleSubmit}>
        <label htmlFor="edit-name">Product Name *</label>
        <input
          id="edit-name"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
        />
        <label htmlFor="edit-description">Description</label>
        <textarea
          id="edit-description"
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={3}
        />
        <label htmlFor="edit-price">Price (₹) *</label>
        <input
          id="edit-price"
          name="price"
          type="number"
          step="0.01"
          min="0"
          value={form.price}
          onChange={handleChange}
          required
        />
        <label htmlFor="edit-image">Image URL</label>
        <input
          id="edit-image"
          name="image_url"
          value={form.image_url}
          onChange={handleChange}
        />
        <label htmlFor="edit-category">Category *</label>
        <input
          id="edit-category"
          name="category"
          value={form.category}
          onChange={handleChange}
          required
        />
        <label htmlFor="edit-stock">Stock</label>
        <input
          id="edit-stock"
          name="stock"
          type="number"
          min="0"
          value={form.stock}
          onChange={handleChange}
        />
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
            Update Product
          </button>
          <button type="button" className="btn" onClick={() => navigate("/admin")}>
            Cancel
          </button>
        </div>
      </form>
    </motion.div>
  );
}
