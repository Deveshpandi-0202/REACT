import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { LayoutGrid, Loader2, Plus, X, Pencil, Trash2, Check } from "lucide-react";
import api from "../../api/axios";
import { useToast } from "../../context/ToastContext";

export default function CategoriesManagement() {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const mountedRef = useRef(true);

  const load = () => {
    api
      .get("/admin/categories")
      .then((res) => { if (mountedRef.current) setCats(res.data || []); })
      .catch((err) => { if (mountedRef.current) setError(err.response?.data?.error || "Failed to load categories"); })
      .finally(() => { if (mountedRef.current) setLoading(false); });
  };

  useEffect(() => {
    mountedRef.current = true;
    load();
    return () => { mountedRef.current = false; };
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await api.post("/admin/categories", { name: name.trim() });
      toast.success("Category created");
      setName("");
      setShowAdd(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to create category");
    } finally {
      setSaving(false);
    }
  };

  const handleRename = async (e) => {
    e.preventDefault();
    if (!editName.trim()) return;
    setSaving(true);
    try {
      const res = await api.put(`/admin/categories/${editId}`, { name: editName.trim() });
      toast.success(res.data?.message || "Category updated");
      setEditId(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update category");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat) => {
    if (!window.confirm(`Delete category "${cat.name}"? Products still using it must be moved first.`)) return;
    try {
      await api.delete(`/admin/categories/${cat.id}`);
      toast.success("Category deleted");
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete category");
    }
  };

  if (loading) return <div className="loading"><Loader2 size={24} className="spin" /> Loading categories…</div>;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1><LayoutGrid size={22} /> Category Management</h1>
        <div className="admin-header-actions">
          <button className="btn btn-primary" onClick={() => setShowAdd((v) => !v)}>
            {showAdd ? <X size={16} /> : <Plus size={16} />} {showAdd ? "Cancel" : "Add Category"}
          </button>
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {showAdd && (
        <motion.form className="admin-form driver-add-form" onSubmit={handleCreate} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h3>Add New Category</h3>
          <label htmlFor="add-cat-name" className="sr-only">Category name</label>
          <input id="add-cat-name" placeholder="Category name (e.g. Bakery)" value={name} onChange={(e) => setName(e.target.value)} required />
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <Loader2 size={16} className="spin" /> : <Plus size={16} />} Create Category
          </button>
        </motion.form>
      )}

      <div className="dash-panel">
        <h3 className="dash-panel-title">All Categories</h3>
        {cats.length === 0 ? (
          <p className="dash-empty">No categories yet.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Products</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cats.map((c) => (
                  <tr key={c.id}>
                    <td>{c.id}</td>
                    <td>
                      {editId === c.id ? (
                        <form className="inline-edit-form" onSubmit={handleRename}>
                          <label htmlFor={`inline-rename-${c.id}`} className="sr-only">Rename category</label>
                          <input id={`inline-rename-${c.id}`} value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus />
                          <button type="submit" className="btn btn-sm btn-success" disabled={saving}>
                            {saving ? <Loader2 size={13} className="spin" /> : <Check size={13} />}
                          </button>
                          <button type="button" className="btn btn-sm" onClick={() => setEditId(null)}>
                            <X size={13} />
                          </button>
                        </form>
                      ) : (
                        c.name
                      )}
                    </td>
                    <td><span className={`stock-flag ${c.product_count > 0 ? "ok" : "low"}`}>{c.product_count}</span></td>
                    <td className="admin-actions">
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => { setEditId(c.id); setEditName(c.name); }}
                      >
                        <Pencil size={13} /> Rename
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(c)}>
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