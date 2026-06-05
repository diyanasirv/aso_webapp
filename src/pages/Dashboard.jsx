import { useEffect, useState } from "react";
import { supabase, getUserWithRetry } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import {
  FiPlusCircle,
  FiList,
  FiDollarSign,
  FiPackage,
  FiClock,
  FiCheckCircle,
  FiMessageCircle,
} from "react-icons/fi";

function Dashboard() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeOrders: 0,
    completedOrders: 0,
  });
  const [chatNotifications, setChatNotifications] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [orderIdsState, setOrderIdsState] = useState([]);

  useEffect(() => {
    loadDashboard();
    const intervalId = setInterval(loadDashboard, 60_000);
    return () => clearInterval(intervalId);
  }, []);

  async function loadDashboard() {
    const {
      data: { user },
    } = await getUserWithRetry();

    if (!user) {
      navigate("/login");
      return;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    setFullName(profileData?.full_name || user.email?.slice(0, 4)?.toUpperCase() || "User");

    const { data: orders } = await supabase
      .from("orders")
      .select("id, order_number, status")
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

      const ids = orders.map((order) => order.id);
      setOrderIdsState(ids);
      setCurrentUserId(user.id);
      await loadChatNotifications(ids);
    }
  }

  // realtime listener for immediate alerts when new chat messages arrive
  useEffect(() => {
    if (!orderIdsState || orderIdsState.length === 0) return;

    const channelName = `dashboard-order-chat-notify-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "order_chats",
          filter: `order_id=in.(${orderIdsState.join(',')})`,
        },
        (payload) => {
          try {
            const chat = payload.new;
            // don't alert the sender themselves
            if (chat.sender_id === currentUserId) return;

            const openedAt = getChatOpenedAt(chat.order_id);
            const sessionAlerts = (() => {
              try { return JSON.parse(sessionStorage.getItem('chat_alerted_session_orders') || '{}'); } catch(e) { return {}; }
            })();

            if (sessionAlerts[chat.order_id]) return; // already alerted this session
            if (openedAt && new Date(openedAt) >= new Date(chat.created_at)) return; // already opened

            setChatNotifications((prev) => {
              if (prev.some((c) => c.order_id === chat.order_id)) return prev;
              return [chat, ...prev];
            });
          } catch (e) {
            console.error('Realtime dashboard handler error', e);
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

  async function loadChatNotifications(orderIds) {
    if (!orderIds.length) {
      setChatNotifications([]);
      return;
    }

    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    // alert after 15 minutes of unread activity on user dashboard
    const cutoff = new Date(Date.now() - 15 * 60 * 1000);

    const { data, error } = await supabase
      .from("order_chats")
      .select("id, order_id, order_number, sender_id, sender_role, message, created_at")
      .in("order_id", orderIds)
      .gte("created_at", dayAgo)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Dashboard chat notifications error:", error);
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

        // skip if latest was sent by current user (no need to alert them about their own message)
        if (latest.sender_id && currentUserId && latest.sender_id === currentUserId) return null;

        // Immediate alert if this is the first chat message for the order and user hasn't opened
        if (count === 1 && !openedAt) return latest;

        // Otherwise alert if latest message is older than cutoff and not opened since
        if (createdAt && createdAt <= cutoff && (!openedAt || openedAt < createdAt)) return latest;

        return null;
      })
      .filter(Boolean)
      .filter((chat) => !sessionAlerts[chat.order_id]);

    setChatNotifications(alerts);
  }

  return (
    <div className="aso-layout">
      <Sidebar />

      <main className="aso-main">
        <header className="aso-topbar">
          <div>
            <h3>Dashboard</h3>
            <p>Welcome back, {fullName}</p>
          </div>
        </header>

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
                    navigate(`/orders?chat=${chat.order_id}`);
                  }}
                >
                  <div>
                    <div className="fw-bold">Order #{chat.order_number}</div>
                    <div className="small text-muted">
                      New message not opened after 15+ minutes.
                    </div>
                  </div>
                  <span className="badge bg-danger rounded-pill">New</span>
                </button>
              ))}
            </div>
          )}

          <h5>Quick Actions</h5>

          <div className="row g-3">
            <div className="col-md-4 col-sm-6">
              <button
                className="aso-action"
                onClick={() => navigate("/add-order")}
              >
                <FiPlusCircle />
                <strong>Add Order</strong>
                <small>Create service order</small>
              </button>
            </div>

            <div className="col-md-4 col-sm-6">
              <button
                className="aso-action"
                onClick={() => navigate("/orders")}
              >
                <FiList />
                <strong>Orders</strong>
                <small>Track progress</small>
              </button>
            </div>

            <div className="col-md-4 col-sm-6">
              <button
                className="aso-action"
                onClick={() => navigate("/services")}
              >
                <FiDollarSign />
                <strong>Services</strong>
                <small>View available services</small>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;