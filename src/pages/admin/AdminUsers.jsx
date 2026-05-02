import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    setUsers(data || []);
    setLoading(false);
  }

  async function updateRole(id, role) {
    const { error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    loadUsers();
  }

  if (loading) {
    return <p className="text-center mt-5">Loading users...</p>;
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h5>Users</h5>
        <button className="btn btn-sm btn-outline-dark" onClick={loadUsers}>
          Refresh
        </button>
      </div>

      <div className="table-responsive">
        <table className="table table-bordered admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
            </tr>
          </thead>

          <tbody>
            {users.length > 0 ? (
              users.map((user, index) => (
                <tr key={user.id}>
                  <td>{index + 1}</td>
                  <td>{user.full_name || "-"}</td>
                  <td>{user.email}</td>
                  <td>
                    <select
                      className="admin-dd"
                      value={user.role || "user"}
                      onChange={(e) => updateRole(user.id, e.target.value)}
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td>
                    {user.created_at
                      ? new Date(user.created_at).toLocaleDateString()
                      : "-"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center text-muted py-4">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminUsers;