import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Loader2, ChevronLeft } from "lucide-react";
import api from "../../api/axios";
import { useToast } from "../../context/ToastContext";

export default function AddProduct() {
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
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/products", {
        ...form,
        price: parseFloat(form.price),
        stock: parseInt(form.stock) || 0,
      });
      toast.success("Product added successfully");
      navigate("/admin");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to add product");
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      className="admin-form-page"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <button className="back-link" onClick={() => navigate("/admin")}>
        <ChevronLeft size={16} /> Back to Dashboard
      </button>
      <h1>Add Product</h1>
      <form className="admin-form" onSubmit={handleSubmit}>
        <label htmlFor="add-name">Product Name *</label>
        <input
          id="add-name"
          name="name"
          placeholder="e.g. Fresh Apples (1 kg)"
          value={form.name}
          onChange={handleChange}
          required
        />
        <label htmlFor="add-description">Description</label>
        <textarea
          id="add-description"
          name="description"
          placeholder="Short description"
          value={form.description}
          onChange={handleChange}
          rows={3}
        />
        <label htmlFor="add-price">Price (₹) *</label>
        <input
          id="add-price"
          name="price"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={form.price}
          onChange={handleChange}
          required
        />
        <label htmlFor="add-image">Image URL</label>
        <input
          id="add-image"
          name="image_url"
          placeholder="https://..."
          value={form.image_url}
          onChange={handleChange}
        />
        <label htmlFor="add-category">Category *</label>
        <input
          id="add-category"
          name="category"
          placeholder="e.g. Fruits, Dairy"
          value={form.category}
          onChange={handleChange}
          required
        />
        <label htmlFor="add-stock">Stock</label>
        <input
          id="add-stock"
          name="stock"
          type="number"
          min="0"
          placeholder="0"
          value={form.stock}
          onChange={handleChange}
        />
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? <Loader2 size={16} className="spin" /> : <Plus size={16} />}
            Add Product
          </button>
          <button type="button" className="btn" onClick={() => navigate("/admin")}>
            Cancel
          </button>
        </div>
      </form>
    </motion.div>
  );
}
