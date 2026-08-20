import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    image_url: "",
    category: "",
    stock: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

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
      .catch(() => setError("Failed to load product"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.put(`/products/${id}`, {
        ...form,
        price: parseFloat(form.price),
        stock: parseInt(form.stock) || 0,
      });
      navigate("/admin");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update product");
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="admin-form-page">
      <h1>Edit Product</h1>
      {error && <div className="error-msg">{error}</div>}
      <form className="admin-form" onSubmit={handleSubmit}>
        <input
          name="name"
          placeholder="Product Name"
          value={form.name}
          onChange={handleChange}
          required
        />
        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          rows={3}
        />
        <input
          name="price"
          type="number"
          step="0.01"
          placeholder="Price"
          value={form.price}
          onChange={handleChange}
          required
        />
        <input
          name="image_url"
          placeholder="Image URL"
          value={form.image_url}
          onChange={handleChange}
        />
        <input
          name="category"
          placeholder="Category"
          value={form.category}
          onChange={handleChange}
          required
        />
        <input
          name="stock"
          type="number"
          placeholder="Stock"
          value={form.stock}
          onChange={handleChange}
        />
        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            Update Product
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => navigate("/admin")}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
