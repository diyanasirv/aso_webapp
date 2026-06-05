import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, getUserWithRetry } from "../../supabaseClient";

function AdminDashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    underReviewOrders: 0,
    paidOrders: 0,
    pendingOrders: 0,
    runningOrders: 0,
    completedOrders: 0,
  });
  const [chatNotifications, setChatNotifications] = useState([]);
  const [orderIdsState, setOrderIdsState] = useState([]);
  const [currentAdminId, setCurrentAdminId] = useState(null);

  useEffect(() => {
    loadStats();
    const intervalId = setInterval(loadStats, 60_000);
    return () => clearInterval(intervalId);
  }, []);

  async function loadStats() { 
    try {
      const { data: { user } } = await getUserWithRetry();
      if (user) setCurrentAdminId(user.id);
    } catch (e) {
      console.error('Failed to get admin user id:', e);
    }
    const { data: users, error: userError } = await supabase
      .from("profiles")
      .select("role");

    const { data: orders, error: orderError } = await supabase
      .from("orders")
      .select("id, order_number, status, payment_status");

    if (userError) console.log("User count error:", userError.message);
    if (orderError) console.log("Order count error:", orderError.message);

    const allUsers = users || [];
    const allOrders = orders || [];

    setStats({
      totalUsers: allUsers.filter(
        (u) => u.role?.trim().toLowerCase() === "user"
      ).length,

      totalOrders: allOrders.length,

      underReviewOrders: allOrders.filter((o) => o.payment_status === "under_review").length,

      paidOrders: allOrders.filter((o) => o.payment_status === "paid").length,

      pendingOrders: allOrders.filter(
        (o) => o.status === "pending" || o.status === "payment_pending"
      ).length,

      runningOrders: allOrders.filter((o) =>
        ["in_progress", "partially_completed"].includes(o.status)
      ).length,

      completedOrders: allOrders.filter((o) => o.status === "completed")
        .length,
    });

    const ids = allOrders.map((order) => order.id);
    setOrderIdsState(ids);
    await loadChatNotifications(allOrders.map((order) => ({ id: order.id, order_number: order.order_number })));
  }

  // realtime listener for admin: immediate alerts when users start new chats or send messages
  useEffect(() => {
    if (!orderIdsState || orderIdsState.length === 0) return;

    const channelName = `admin-dashboard-order-chat-notify-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "order_chats",
        },
        (payload) => {
          try {
            const chat = payload.new;
            // ignore if admin themselves sent it
            if (chat.sender_id === currentAdminId) return;
            if (chat.sender_role !== 'user') return; // admin alerts only for user-originated messages

            const openedAt = getChatOpenedAt(chat.order_id);
            const sessionAlerts = (() => {
              try { return JSON.parse(sessionStorage.getItem('chat_alerted_session_orders') || '{}'); } catch(e) { return {}; }
            })();

            if (sessionAlerts[chat.order_id]) return;
            if (openedAt && new Date(openedAt) >= new Date(chat.created_at)) return;

            setChatNotifications((prev) => {
              if (prev.some((c) => c.order_id === chat.order_id)) return prev;
              return [chat, ...prev];
            });
          } catch (e) {
            console.error('Realtime admin dashboard handler error', e);
          }
        }
      )
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [orderIdsState]);

  function getChatOpenedAt(orderId) {
    const stored = localStorage.getItem(`chat_opened_order_${orderId}`);
    return stored ? new Date(stored) : null;
  }

  // Session-scoped alerted orders to avoid repeating alerts in the same browser session
  function getSessionAlertedOrders() {
    try {
      const raw = sessionStorage.getItem("chat_alerted_session_orders");
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function markSessionAlerted(orderId) {
    try {
      const obj = getSessionAlertedOrders();
      obj[orderId] = Date.now();
      sessionStorage.setItem("chat_alerted_session_orders", JSON.stringify(obj));
    } catch (e) {
      // ignore
    }
  }

  async function loadChatNotifications(orderList) {
    if (!orderList.length) {
      setChatNotifications([]);
      return;
    }

    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const cutoff = new Date(Date.now() - 15 * 60 * 1000);

    const { data, error } = await supabase
      .from("order_chats")
      .select("id, order_id, order_number, sender_role, message, created_at")
      .in("order_id", orderList.map((o) => o.id))
      .eq("sender_role", "user")
      .gte("created_at", dayAgo)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Admin dashboard chat notification error:", error);
      return;
    }

    const sessionAlerts = getSessionAlertedOrders();

    // Group messages by order and compute latest + count
    const grouped = {};
    (data || []).forEach((chat) => {
      const id = chat.order_id;
      if (!grouped[id]) grouped[id] = { latest: chat, count: 1 };
      else {
        grouped[id].count += 1;
        if (new Date(chat.created_at) > new Date(grouped[id].latest.created_at)) grouped[id].latest = chat;
      }
    });

    const alerts = Object.keys(grouped)
      .map((orderId) => {
        const entry = grouped[orderId];
        const latest = entry.latest;
        const count = entry.count;
        const createdAt = latest.created_at ? new Date(latest.created_at) : null;
        const openedAt = getChatOpenedAt(latest.order_id);

        // For admin: immediate alert if this is first user message and admin hasn't opened
        if (count === 1 && latest.sender_role === 'user' && !openedAt) return latest;

        // Otherwise alert if latest user message is older than cutoff and not opened since
        if (createdAt && createdAt <= cutoff && (!openedAt || openedAt < createdAt) && latest.sender_role === 'user') return latest;

        return null;
      })
      .filter(Boolean)
      .filter((chat) => !sessionAlerts[chat.order_id]);

    setChatNotifications(alerts);
  }

  return (
    <div>
      <h3 className="fw-bold mb-4">Admin Dashboard</h3>

      <div className="aso-section mb-4">
        <h5>Message Alerts</h5>
        {chatNotifications.length === 0 ? (
          <div className="p-3 border rounded text-muted">No overdue unread chat messages.</div>
        ) : (
          <div className="list-group mb-4">
            {chatNotifications.map((chat) => (
              <button
              key={chat.id}
              type="button"
              className="list-group-item list-group-item-action d-flex justify-content-between align-items-start"
              onClick={() => {
                try {
                  const objRaw = sessionStorage.getItem("chat_alerted_session_orders");
                  const obj = objRaw ? JSON.parse(objRaw) : {};
                  obj[chat.order_id] = Date.now();
                  sessionStorage.setItem("chat_alerted_session_orders", JSON.stringify(obj));
                } catch (e) {
                  // ignore
                }
                navigate(`/admin/orders?chat=${chat.order_id}`);
              }}
            >
              <div>
                <div className="fw-bold">Order #{chat.order_number}</div>
                <div className="small text-muted">
                  New user message not opened after 15+ minutes.
                </div>
              </div>
              <span className="badge bg-danger rounded-pill">New</span>
            </button>
            ))}
          </div>
        )}
      </div>

      <div className="row g-3">
        <StatCard title="Total Users" value={stats.totalUsers} />
        <StatCard title="Total Orders" value={stats.totalOrders} />
        <StatCard title="Under Review Orders" value={stats.underReviewOrders} />
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