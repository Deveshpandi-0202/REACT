import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, UserCheck, UserX, Loader2, Trash2 } from "lucide-react";
import api from "../../api/axios";
import { useToast } from "../../context/ToastContext";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;
    api
      .get("/admin/users")
      .then((res) => {
        if (!cancelled) setUsers(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.error || "Failed to load users");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleToggle = async (userId) => {
    try {
      const res = await api.put(`/admin/users/${userId}/toggle`);
      setUsers((prev) => prev.map((u) => (u.id === userId ? res.data : u)));
      toast.success(res.data.is_active ? "User activated" : "User deactivated");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to toggle user");
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Delete this user? This cannot be undone.")) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      toast.success("User deleted");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete user");
    }
  };

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.is_active).length;
  const inactiveUsers = totalUsers - activeUsers;

  if (loading) return <div className="loading"><Loader2 size={24} className="spin" /> Loading users...</div>;

  const stats = [
    { label: "Total Users", value: totalUsers, icon: <Users size={20} />, cls: "blue" },
    { label: "Active", value: activeUsers, icon: <UserCheck size={20} />, cls: "green" },
    { label: "Inactive", value: inactiveUsers, icon: <UserX size={20} />, cls: "red" },
  ];

  return (
    <div className="admin-page">
      <h1><Users size={22} /> User Management</h1>

      {error && <div className="error-msg">{error}</div>}

      <motion.div className="stats-grid" initial="hidden" animate="show">
        {stats.map((s) => (
          <motion.div key={s.label} className={`stat-card-lrg ${s.cls}`} variants={fadeUp}>
            <div className="stat-card-icon">{s.icon}</div>
            <span className="stat-card-value">{s.value}</span>
            <span className="stat-card-label">{s.label}</span>
          </motion.div>
        ))}
      </motion.div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <span className={`role-badge role-${u.role}`}>{u.role}</span>
                </td>
                <td>
                  <span className={`status-badge ${u.is_active ? "active" : "inactive"}`}>
                    {u.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>
                  {u.created_at ? new Date(u.created_at).toLocaleDateString() : "-"}
                </td>
                <td className="admin-actions">
                  {u.role !== "admin" && (
                    <>
                      <button
                        onClick={() => handleToggle(u.id)}
                        className={`btn btn-sm ${u.is_active ? "btn-warning" : "btn-success"}`}
                      >
                        {u.is_active ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="btn btn-sm btn-danger"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
