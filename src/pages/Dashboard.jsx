import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import {
  FiPlusCircle,
  FiList,
  FiUser,
  FiDollarSign,
  FiPackage,
  FiClock,
  FiCheckCircle,
} from "react-icons/fi";

function Dashboard() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeOrders: 0,
    completedOrders: 0,
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      navigate("/login");
      return;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    setProfile(profileData);

    const { data: orders } = await supabase
      .from("orders")
      .select("status")
      .eq("user_id", user.id);

    if (orders) {
      setStats({
        totalOrders: orders.length,
        activeOrders: orders.filter((order) =>
          [
            "pending",
            "payment_pending",
            "in_progress",
            "partially_completed",
          ].includes(order.status)
        ).length,
        completedOrders: orders.filter((order) => order.status === "completed")
          .length,
      });
    }
  }

  return (
    <div className="aso-layout">
      <Sidebar profile={profile} active="dashboard" />

      <main className="aso-main">
        <header className="aso-topbar">
          <div>
            <h3>Dashboard</h3>
            <p>Welcome back, {profile?.full_name || "User"}</p>
          </div>

          <button
            className="btn btn-outline-primary"
            onClick={() => navigate("/profile")}
          >
            <FiUser className="me-2" />
            My Profile
          </button>
        </header>

        {profile && !profile.is_profile_complete && (
          <div className="alert alert-warning shadow-sm">
            Your profile is not complete.{" "}
            <button
              className="btn btn-link p-0"
              onClick={() => navigate("/profile")}
            >
              Complete profile
            </button>
          </div>
        )}

        <div className="row g-4 mb-4">
          <div className="col-md-4">
            <div className="aso-stat-card">
              <FiPackage className="stat-icon blue" />
              <div>
                <p>Total Orders</p>
                <h2>{stats.totalOrders}</h2>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="aso-stat-card">
              <FiClock className="stat-icon orange" />
              <div>
                <p>Active Orders</p>
                <h2>{stats.activeOrders}</h2>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="aso-stat-card">
              <FiCheckCircle className="stat-icon green" />
              <div>
                <p>Completed</p>
                <h2>{stats.completedOrders}</h2>
              </div>
            </div>
          </div>
        </div>

        <div className="aso-section">
          <h5>Quick Actions</h5>

          <div className="row g-3">
            <div className="col-md-3 col-sm-6">
              <button
                className="aso-action"
                onClick={() => navigate("/add-order")}
              >
                <FiPlusCircle />
                <strong>Add Order</strong>
                <small>Create service order</small>
              </button>
            </div>

            <div className="col-md-3 col-sm-6">
              <button
                className="aso-action"
                onClick={() => navigate("/orders")}
              >
                <FiList />
                <strong>Orders</strong>
                <small>Track progress</small>
              </button>
            </div>

            <div className="col-md-3 col-sm-6">
              <button
                className="aso-action"
                onClick={() => navigate("/pricing")}
              >
                <FiDollarSign />
                <strong>Pricing</strong>
                <small>View packages</small>
              </button>
            </div>

            <div className="col-md-3 col-sm-6">
              <button
                className="aso-action"
                onClick={() => navigate("/profile")}
              >
                <FiUser />
                <strong>Profile</strong>
                <small>Edit details</small>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;