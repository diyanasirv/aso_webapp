import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    unpaidOrders: 0,
    paidOrders: 0,
    pendingOrders: 0,
    runningOrders: 0,
    completedOrders: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    const { count: userCount, error: userError } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "user");

    const { data: orders, error: orderError } = await supabase
      .from("orders")
      .select("status, payment_status");

    if (userError) console.log("User count error:", userError);
    if (orderError) console.log("Order count error:", orderError);

    const allOrders = orders || [];

    setStats({
      totalUsers: userCount || 0,
      totalOrders: allOrders.length,
      unpaidOrders: allOrders.filter((o) => o.payment_status === "unpaid").length,
      paidOrders: allOrders.filter((o) => o.payment_status === "paid").length,
      pendingOrders: allOrders.filter((o) => o.status === "pending").length,
      runningOrders: allOrders.filter((o) => o.status === "in_progress").length,
      completedOrders: allOrders.filter((o) => o.status === "completed").length,
    });
  }

  return (
    <div>
      <h3 className="fw-bold mb-4">Admin Dashboard</h3>

      <div className="row g-3">
        <StatCard title="Total Users" value={stats.totalUsers} />
        <StatCard title="Total Orders" value={stats.totalOrders} />
        <StatCard title="Unpaid Orders" value={stats.unpaidOrders} />
        <StatCard title="Paid Orders" value={stats.paidOrders} />
        <StatCard title="Pending Orders" value={stats.pendingOrders} />
        <StatCard title="Running Orders" value={stats.runningOrders} />
        <StatCard title="Completed Orders" value={stats.completedOrders} />
      </div>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="col-6 col-md-3">
      <div className="card border-0 shadow-sm rounded-4">
        <div className="card-body">
          <p className="text-muted mb-1 small">{title}</p>
          <h3 className="fw-bold mb-0">{value}</h3>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;