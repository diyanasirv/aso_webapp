import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase, getUserWithRetry } from "../supabaseClient";
import Sidebar from "../components/Sidebar";

import {
  FiPlusCircle,
  FiPackage,
  FiEye,
  FiMessageCircle,
  FiUpload,
} from "react-icons/fi";
import OrderChat from "../components/OrderChat";

function Orders() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [chatOrder, setChatOrder] = useState(null);
  const [newMessages, setNewMessages] = useState({});
  const [paymentFile, setPaymentFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [userId, setUserId] = useState(null);
  const currentUserIdRef = useRef(null);

  useEffect(() => {
    currentUserIdRef.current = userId;
  }, [userId]);

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
    }
  }, [orders, searchParams]);

  useEffect(() => {
    let orderChannel;
    let chatChannel;

    async function setupOrders() {
      const {
        data: { user },
      } = await getUserWithRetry();

      if (!user) {
        navigate("/login");
        return;
      }

      setUserId(user.id);
      await loadOrders(user.id);

      const { data: orders } = await supabase
        .from("orders")
        .select("id")
        .eq("user_id", user.id);

      const orderIds = (orders || []).map((order) => order.id).filter(Boolean);

      orderChannel = supabase.channel(`orders-user-realtime-${Date.now()}`);
      orderChannel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `user_id=eq.${user.id}`,
        },
        () => loadOrders(user.id)
      );
      await orderChannel.subscribe();

      if (orderIds.length > 0) {
        chatChannel = supabase.channel(`order-chat-notify-${Date.now()}`);
        chatChannel.on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "order_chats",
            filter: `order_id=in.(${orderIds.join(",")})`,
          },
          (payload) => {
            if (payload.new.sender_id === currentUserIdRef.current) return;
            setNewMessages((prev) => ({
              ...prev,
              [payload.new.order_id]: true,
            }));
          }
        );
        await chatChannel.subscribe();
      }
    }

    setupOrders();

    return () => {
      if (orderChannel) {
        supabase.removeChannel(orderChannel);
      }
      if (chatChannel) {
        supabase.removeChannel(chatChannel);
      }
    };
  }, [navigate]);

  async function loadOrders(userIdParam) {
    const userIdToUse = userIdParam || userId;

    const idToFetch = userIdToUse;
    if (!idToFetch) {
      return;
    }

    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        services(name),
        packages(name)
      `)
      .eq("user_id", idToFetch)
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    setOrders(data || []);
    setLoading(false);
  }

  function statusBadge(status) {
    if (status === "completed") return "bg-success";
    if (status === "in_progress") return "bg-primary";
    if (status === "partially_completed") return "bg-info";
    if (status === "pending") return "bg-secondary";
    if (status === "payment_pending") return "bg-secondary";
    if (status === "cancelled") return "bg-danger";
    return "bg-secondary";
  }

  function paymentBadge(status) {
    if (status === "confirmed") return "bg-success";
    if (status === "pending") return "bg-warning text-dark";
    if (status === "rejected") return "bg-danger";
    if (status === "under_review") return "bg-secondary";
    return "bg-secondary";
  }

  function shouldShowCompletePayment(order) {
    return order.status === "payment_pending" || order.payment_status === "pending";
  }



  async function handlePaymentUpload() {
    if (!paymentFile || !selectedOrder) {
      alert("Please choose payment screenshot");
      return;
    }

    setUploading(true);

    const fileExt = paymentFile.name.split(".").pop();
    const filePath = `payment-${selectedOrder.id}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("payments")
      .upload(filePath, paymentFile);

    if (uploadError) {
      alert(uploadError.message);
      setUploading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("payments")
      .getPublicUrl(filePath);

    const { error: paymentError } = await supabase.from("payments").insert({
      user_id: selectedOrder.user_id,
      order_id: selectedOrder.id,
      order_number: selectedOrder.order_number,
      email: selectedOrder.email,
      amount: selectedOrder.price,
      payment_status: "under_review",
      payment_screenshot: publicUrlData.publicUrl,
    });

    if (paymentError) {
      alert(paymentError.message);
      setUploading(false);
      return;
    }

    const { error: orderError } = await supabase
      .from("orders")
      .update({
        payment_status: "under_review",
        status: "pending",
      })
      .eq("id", selectedOrder.id);

    setUploading(false);

    if (orderError) {
      alert(orderError.message);
      return;
    }

    alert("Payment proof uploaded successfully");
    setSelectedOrder(null);
    setPaymentFile(null);
    loadOrders(userId);
  }

  if (loading) {
    return <p className="text-center mt-5">Loading orders...</p>;
  }

  return (
    <div className="aso-layout">
      <Sidebar />

      <main className="aso-main">
        <header className="aso-topbar">
          <div>
            <h3>List of Orders</h3>
            <p>Track quantity, delivery progress, status and payment.</p>
          </div>

          <button
            className="btn btn-primary"
            onClick={() => navigate("/add-order")}
          >
            <FiPlusCircle className="me-2" />
            Add New Order
          </button>
        </header>

        {orders.length === 0 ? (
          <div className="aso-section text-center">
            <FiPackage size={48} className="text-primary mb-3" />
            <h5>No orders found</h5>
            <p className="text-muted">
              Create your first order to start tracking progress.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => navigate("/add-order")}
            >
              Add New Order
            </button>
          </div>
        ) : (
          <div className="aso-section">
            <div className="table-responsive">
              <table className="table align-middle order-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>App Name</th>
                    <th>Package</th>
                    <th>Payment Status</th>
                    <th>Order Status</th>
                    <th>More Details</th>
                  </tr>
                </thead>

                <tbody>
                  {orders.map((order) => (
                    <tr key={order.order_number}>
                      <td>
                        <strong>#{order.order_number}</strong>
                        <br />
                        <small className="text-muted">
                          {new Date(order.created_at).toLocaleDateString()}
                        </small>
                      </td>

                      <td>
                        <strong>{order.app_name}</strong>
                        <br />
                        <a
                          href={order.app_link}
                          target="_blank"
                          rel="noreferrer"
                          className="small text-decoration-none"
                        >
                          Open link
                        </a>
                      </td>

                      <td>
                        <strong>{order.packages?.name || "-"}</strong>
                        <br />
                        <small className="text-muted">
                          {order.services?.name || "-"}
                        </small>
                      </td>

                      <td>
                        {shouldShowCompletePayment(order) ? (
                          <div className="d-flex flex-column gap-2">
                            <span className={`badge ${paymentBadge(order.payment_status)}`}>
                              {order.payment_status}
                            </span>
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => navigate(`/payment/${order.id}`)}
                            >
                              Complete Payment
                            </button>
                          </div>
                        ) : (
                          <span className={`badge ${paymentBadge(order.payment_status)}`}>
                            {order.payment_status}
                          </span>
                        )}
                      </td>

                      <td>
                        <span className={`badge ${statusBadge(order.status)}`}>
                          {order.status === "payment_pending" ? "pending" : order.status}
                        </span>
                      </td>

                      <td>
                        <button
                          className="btn btn-sm btn-outline-success d-flex align-items-center gap-2"
                          onClick={() => {
                            setChatOrder(order);
                            localStorage.setItem(`chat_opened_order_${order.id}`, new Date().toISOString());
                            try {
                              const objRaw = sessionStorage.getItem("chat_alerted_session_orders");
                              const obj = objRaw ? JSON.parse(objRaw) : {};
                              obj[order.id] = Date.now();
                              sessionStorage.setItem("chat_alerted_session_orders", JSON.stringify(obj));
                            } catch (e) {
                              // ignore
                            }
                            setNewMessages((prev) => ({
                              ...prev,
                              [order.id]: false,
                            }));
                          }}
                        >
                          <FiMessageCircle className="me-1" />
                          <span>Open Chat</span>
                          {newMessages[order.id] && (
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {chatOrder && (
          <OrderChat
            orderId={chatOrder.id}
            orderNumber={chatOrder.order_number}
            onClose={() => setChatOrder(null)}
          />
        )}
      </main>
    </div>
  );
}

export default Orders;