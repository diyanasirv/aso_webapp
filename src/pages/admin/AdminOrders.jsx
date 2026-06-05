import { useEffect, useRef, useState } from "react";
import { supabase, getUserWithRetry } from "../../supabaseClient";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FiExternalLink, FiMessageCircle, FiRefreshCw } from "react-icons/fi";
import OrderChat from "../../components/OrderChat";

function AdminOrders() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [todayDelivery, setTodayDelivery] = useState("");
  const [newMessages, setNewMessages] = useState({});
  const [currentAdminId, setCurrentAdminId] = useState(null);
  const currentAdminIdRef = useRef(null);

  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [chatOrder, setChatOrder] = useState(null);
  
  // 1️⃣ Ref to track active open chat order to prevent stale closures in the subscription
  const chatOrderRef = useRef(null);

  useEffect(() => {
    currentAdminIdRef.current = currentAdminId;
  }, [currentAdminId]);

  // Sync the ref whenever the active chatOrder state changes
  useEffect(() => {
    chatOrderRef.current = chatOrder;
  }, [chatOrder]);

  useEffect(() => {
    const chatId = searchParams.get("chat");
    if (!chatId || orders.length === 0) return;

    const orderToOpen = orders.find((order) => String(order.id) === chatId);
    if (orderToOpen) {
      setChatOrder(orderToOpen);
      localStorage.setItem(`chat_opened_order_${orderToOpen.id}`, new Date().toISOString());
      try {
        const objRaw = sessionStorage.getItem("chat_alerted_session_orders");
        const obj = objRaw ? JSON.parse(objRaw) : {};
        obj[orderToOpen.id] = Date.now();
        sessionStorage.setItem("chat_alerted_session_orders", JSON.stringify(obj));
      } catch (e) {
        // ignore
      }
      setNewMessages((prev) => ({
        ...prev,
        [orderToOpen.id]: false,
      }));
      // remove only the `chat` query param from the URL so the auto-open runs once
      try {
        const params = new URLSearchParams(window.location.search || "");
        params.delete("chat");
        const newSearch = params.toString();
        const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : "");
        window.history.replaceState({}, "", newUrl);
      } catch (e) {
        // ignore
      }
    }
  }, [orders, searchParams]);

  useEffect(() => {
    checkAdmin();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("admin-order-chat-notify")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "order_chats",
        },
        (payload) => {
          // 2️⃣ Ignore if message was sent by the admin themselves
          if (payload.new.sender_id === currentAdminIdRef.current) return;
          
          // Ignore if the admin currently has this exact order's chat modal open
          if (chatOrderRef.current && chatOrderRef.current.id === payload.new.order_id) return;

          setNewMessages((prev) => ({
            ...prev,
            [payload.new.order_id]: true,
          }));
        }
      )
      .subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

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
      alert("Admin only");
      navigate("/dashboard");
      return;
    }

    setCurrentAdminId(user.id);
    loadOrders();
  }

  async function loadOrders() {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        profiles(full_name,email),
        services(name),
        packages(name)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    setOrders(data || []);
    setLoading(false);
  }

  async function updatePayment(order, value) {
    let newOrderStatus = order.status;

    if (value === "confirmed") {
      newOrderStatus = "in_progress";
    }

    if (value === "rejected") {
      newOrderStatus = "pending";
    }

    const { error: orderError } = await supabase
      .from("orders")
      .update({
        payment_status: value,
        status: newOrderStatus,
      })
      .eq("id", order.id);

    if (orderError) {
      alert(orderError.message);
      return;
    }

    const newStatus =
      value === "confirmed" ? "confirmed" : value === "rejected" ? "rejected" : "under_review";

    const { data: updatedById, error: errById } = await supabase
      .from("payments")
      .update({ status: newStatus })
      .eq("order_id", order.id)
      .select("id, order_id, order_number, status");

    if (errById) {
      console.error("Payment sync error (by order_id):", errById);
    }

    if (!updatedById || updatedById.length === 0) {
      const { data: updatedByNumber, error: errByNumber } = await supabase
        .from("payments")
        .update({ status: newStatus })
        .eq("order_number", order.order_number)
        .select("id, order_id, order_number, status");

      if (errByNumber) {
        console.error("Payment sync error (by order_number):", errByNumber);
      }
    }

    try {
      const { data: { user } } = await getUserWithRetry();
      const adminId = user?.id || null;

      const paymentMsg =
        value === 'confirmed'
          ? `Great news! Payment confirmed for Order #${order.order_number}. We've moved your order to in progress and will continue sharing updates here.`
          : value === 'rejected'
          ? `Payment proof for Order #${order.order_number} was rejected. Please ask the customer to re-submit, and we'll review it again right away.`
          : `Payment status updated to ${value} for Order #${order.order_number}. Further details and order updates will appear in this chat.`;

      await supabase.from('order_chats').insert({
        order_id: order.id,
        order_number: order.order_number,
        sender_id: adminId,
        sender_role: 'system',
        message: paymentMsg,
      });

      if (value === 'confirmed') {
        const statusMsg =
          `Order #${order.order_number} is now in progress. Further order details and updates are shared here freely, so feel free to ask anytime.`;
        await supabase.from('order_chats').insert({
          order_id: order.id,
          order_number: order.order_number,
          sender_id: adminId,
          sender_role: 'system',
          message: statusMsg,
        });
      }
    } catch (e) {
      console.error('Chat insert failed:', e);
    }

    loadOrders();
  }

  async function updateStatus(id, value) {
    const { data: orderData, error: fetchErr } = await supabase
      .from('orders')
      .select('order_number')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from("orders")
      .update({ status: value })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    try {
      const orderNum = orderData?.order_number || id;
      const { data: { user } } = await getUserWithRetry();
      const adminId = user?.id || null;

      let msg = `Order #${orderNum} status updated to ${value}.`;
      if (value === 'in_progress') msg = `Order #${orderNum} is now in progress. Further details and updates will continue to appear in this chat.`;
      if (value === 'partially_completed') msg = `Order #${orderNum} is partially completed. We're still working on the remaining pieces and will keep you posted here.`;
      if (value === 'completed') msg = `Order #${orderNum} has been completed. Thank you! If you'd like a final summary or next steps, just say so in this chat.`;
      if (value === 'cancelled') msg = `Order #${orderNum} has been cancelled. If you'd like a follow-up or explanation, we're happy to continue the conversation here.`;

      await supabase.from('order_chats').insert({
        order_id: id,
        order_number: orderNum,
        sender_id: adminId,
        sender_role: 'system',
        message: msg,
      });
    } catch (e) {
      console.error('Chat insert failed:', e);
    }

    loadOrders();
  }

  async function saveNote() {
    if (!noteText.trim() || !selectedOrder) return;

    const { error } = await supabase
      .from("orders")
      .update({ admin_remark: noteText.trim() })
      .eq("id", selectedOrder.id);

    if (error) {
      alert("Failed to save remark");
      return;
    }

    setShowNoteModal(false);
    setNoteText("");
    setSelectedOrder(null);
    loadOrders();
  }

  if (loading) return <p className="text-center mt-5">Loading...</p>;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h5>Admin Orders</h5>

        <button className="btn btn-sm btn-outline-dark" onClick={loadOrders}>
          <FiRefreshCw />
        </button>
      </div>

      <div className="table-responsive">
        <table className="table table-bordered admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Order</th>
              <th>User</th>
              <th>App</th>
              <th>Package</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Details</th>
              <th>Note</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((o, i) => (
              <tr key={o.id}>
                <td>{i + 1}</td>

                <td>{String(o.order_number || "-").slice(0, 6)}</td>

                <td>{o.profiles?.full_name || "-"}</td>

                <td className="text-center">
                  <a href={o.app_link} target="_blank" rel="noreferrer">
                    <FiExternalLink />
                  </a>
                </td>

                <td>
                  <div>{o.packages?.name || "-"}</div>
                  <small className="text-muted">{o.services?.name || "-"}</small>
                </td>

                <td>
                  <select
                    value={o.payment_status}
                    disabled={o.payment_status === "confirmed"}
                    onChange={(e) => updatePayment(o, e.target.value)}
                    className="admin-dd"
                  >
                    <option value="under_review">under review</option>
                    <option value="pending">pending</option>
                    <option value="confirmed">confirmed</option>
                    <option value="rejected">rejected</option>
                  </select>
                  {(o.payment_status === "pending" || o.status === "payment_pending") && (
                    <div className="text-muted" style={{ fontSize: "12px", marginTop: "6px" }}>
                      payment not completed
                    </div>
                  )}
                </td>

                <td>
                  <select
                    value={o.status}
                    disabled={
                      o.status === "completed" || o.status === "cancelled"
                    }
                    onChange={(e) => updateStatus(o.id, e.target.value)}
                    className="admin-dd"
                  >
                    <option value="pending">pending</option>
                    <option value="in_progress">in_progress</option>
                    <option value="partially_completed">
                      partially_completed
                    </option>
                    <option value="completed">completed</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                </td>

                {/* DETAILS CHAT TRIGGER */}
                <td>
                  <button
                    className="btn btn-sm btn-outline-primary d-flex align-items-center gap-2"
                    onClick={() => {
                      setChatOrder(o);
                      localStorage.setItem(`chat_opened_order_${o.id}`, new Date().toISOString());
                      try {
                        const objRaw = sessionStorage.getItem("chat_alerted_session_orders");
                        const obj = objRaw ? JSON.parse(objRaw) : {};
                        obj[o.id] = Date.now();
                        sessionStorage.setItem("chat_alerted_session_orders", JSON.stringify(obj));
                      } catch (e) {
                        // ignore
                      }
                      // 3️⃣ Instantly clear unread state dictionary value on selection click
                      setNewMessages((prev) => ({
                        ...prev,
                        [o.id]: false,
                      }));
                    }}
                  >
                    <FiMessageCircle className="me-1" />
                    <span>Chat</span>
                    {newMessages[o.id] && (
                      <span
                        className="ms-2 d-inline-flex align-items-center justify-content-center rounded-pill bg-danger text-white px-2"
                        style={{ height: 22, fontSize: 12, gap: 4 }}
                        title="New message"
                      >
                        <FiMessageCircle size={12} className="text-white" />
                        New
                      </span>
                    )}
                  </button>
                </td>

                <td>
                  <button
                    className="btn btn-sm btn-outline-dark"
                    onClick={() => {
                      setSelectedOrder(o);
                      setNoteText(o.admin_remark || "");
                      setShowNoteModal(true);
                    }}
                  >
                    Remark
                  </button>

                  {o.admin_remark && (
                    <div
                      className="mt-1 text-muted"
                      style={{ fontSize: "12px" }}
                    >
                      {o.admin_remark}
                    </div>
                  )}
                </td>
              </tr>
            ))}

            {orders.length === 0 && (
              <tr>
                <td colSpan="9" className="text-center text-muted py-4">
                  No orders found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* REMARK MODAL */}
      {showNoteModal && (
        <div className="modal show d-block">
          <div className="modal-dialog modal-sm modal-dialog-centered">
            <div className="modal-content p-3">
              <h6 className="text-center">Add Remark</h6>

              <textarea
                className="form-control mb-3"
                rows="3"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              />

              <div className="d-flex justify-content-between">
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => setShowNoteModal(false)}
                >
                  Cancel
                </button>

                <button className="btn btn-sm btn-dark" onClick={saveNote}>
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CHAT WINDOW COMPONENT */}
      {chatOrder && (
        <OrderChat
          orderId={chatOrder.id}
          orderNumber={chatOrder.order_number}
          participantName={chatOrder.profiles?.full_name || chatOrder.email || "Customer"}
          onClose={() => setChatOrder(null)}
        />
      )}
    </div>
  );
}

export default AdminOrders;