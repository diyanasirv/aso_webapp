import { Link, Outlet, useNavigate } from "react-router-dom";
import { supabase, getUserWithRetry } from "../../supabaseClient";
import {
  FiHome,
  FiList,
  FiUsers,
  FiCreditCard,
  FiLogOut,
} from "react-icons/fi";
import { useEffect } from "react";
import { useState } from "react";

function AdminLayout() {
  const navigate = useNavigate();

  const [checking, setChecking] = useState(true);

  useEffect(() => {
      async function checkAdmin() {
      const {
        data: { user },
      } = await getUserWithRetry();

      if (!user) {
        navigate("/login");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error || profile?.role?.toLowerCase() !== "admin") {
        // silently redirect non-admin users back to dashboard
        navigate("/dashboard");
        return;
      }

      setChecking(false);
    }

    checkAdmin();
  }, [navigate]);

  async function logout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  return (
    checking ? (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    ) : (
    <div className="d-flex min-vh-100">

      {/* Sidebar */}
      <div
        className="bg-dark text-white d-flex flex-column align-items-center py-3 admin-sidebar"
      >
        <h5 className="mb-4">A</h5>

        <div className="d-flex flex-column align-items-center gap-4 flex-grow-1">

          <Link to="/admin" className="text-white">
            <FiHome size={20} />
          </Link>

          <Link to="/admin/orders" className="text-white">
            <FiList size={20} />
          </Link>

          <Link to="/admin/users" className="text-white">
            <FiUsers size={20} />
          </Link>

          <Link to="/admin/payments" className="text-white">
            <FiCreditCard size={20} />
          </Link>

        </div>

        {/* Logout */}
        <button
          className="btn btn-sm btn-outline-light mt-auto"
          onClick={logout}
        >
          <FiLogOut size={18} />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-grow-1 bg-light p-4 admin-content">
        <Outlet />
      </div>

    </div>
    )
  );
}

export default AdminLayout;