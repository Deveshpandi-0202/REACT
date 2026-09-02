import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Save, Loader2, ChevronLeft } from "lucide-react";
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
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .get(`/products/${id}`)
      .then((res) => {
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
      .catch(() => toast.error("Failed to load product"))
      .finally(() => setLoading(false));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

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

  if (loading) return <div className="loading">Loading...</div>;

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
        <label>Product Name *</label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          required
        />
        <label>Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={3}
        />
        <label>Price (₹) *</label>
        <input
          name="price"
          type="number"
          step="0.01"
          min="0"
          value={form.price}
          onChange={handleChange}
          required
        />
        <label>Image URL</label>
        <input
          name="image_url"
          value={form.image_url}
          onChange={handleChange}
        />
        <label>Category *</label>
        <input
          name="category"
          value={form.category}
          onChange={handleChange}
          required
        />
        <label>Stock</label>
        <input
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
