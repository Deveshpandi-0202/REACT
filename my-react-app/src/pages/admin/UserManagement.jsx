import { useEffect, useState } from "react";
import api from "../../api/axios";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    setError("");
    try {
      const res = await api.put(`/admin/users/${userId}/toggle`);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? res.data : u))
      );
    } catch (err) {
      setError(err.response?.data?.error || "Failed to toggle user");
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Delete this user? This cannot be undone.")) return;
    setError("");
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete user");
    }
  };

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.is_active).length;
  const inactiveUsers = totalUsers - activeUsers;

  if (loading) return <div className="loading">Loading users...</div>;

  return (
    <div className="admin-page">
      <h1>User Management</h1>

      {error && <div className="error-msg">{error}</div>}

      <div className="user-stats">
        <div className="stat-card">
          <span className="stat-number">{totalUsers}</span>
          <span className="stat-label">Total Users</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{activeUsers}</span>
          <span className="stat-label">Active</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{inactiveUsers}</span>
          <span className="stat-label">Inactive</span>
        </div>
      </div>

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
                  {u.created_at
                    ? new Date(u.created_at).toLocaleDateString()
                    : "-"}
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
                        Delete
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
