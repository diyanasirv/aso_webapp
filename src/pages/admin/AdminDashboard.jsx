import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    runningOrders: 0,
    completedOrders: 0,
    totalUsers: 0,
    paidOrders: 0,
    unpaidOrders: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    const { data: orders } = await supabase.from("orders").select("*");
    const { data: users } = await supabase.from("profiles").select("*");

    const allOrders = orders || [];

    setStats({
      totalOrders: allOrders.length,
      pendingOrders: allOrders.filter((o) => o.status === "pending").length,
      runningOrders: allOrders.filter((o) => o.status === "in_progress").length,
      completedOrders: allOrders.filter((o) => o.status === "completed").length,
      totalUsers: users?.length || 0,
      paidOrders: allOrders.filter((o) => o.payment_status === "paid").length,
      unpaidOrders: allOrders.filter((o) => o.payment_status !== "paid").length,
    });
  }

  return (
    <div>
      <h3 className="fw-bold mb-4">Admin Dashboard</h3>

      <div className="row g-3">
        <StatCard title="Total Orders" value={stats.totalOrders} />
        <StatCard title="Pending Orders" value={stats.pendingOrders} />
        <StatCard title="Running Orders" value={stats.runningOrders} />
        <StatCard title="Completed Orders" value={stats.completedOrders} />
        <StatCard title="Total Users" value={stats.totalUsers} />
        <StatCard title="Paid Orders" value={stats.paidOrders} />
        <StatCard title="Unpaid Orders" value={stats.unpaidOrders} />
      </div>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="col-md-3">
      <div className="card border-0 shadow-sm">
        <div className="card-body">
          <p className="text-muted mb-1">{title}</p>
          <h3 className="fw-bold mb-0">{value}</h3>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;