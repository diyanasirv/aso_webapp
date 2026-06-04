import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { useNavigate } from "react-router-dom";
import { FiExternalLink, FiRefreshCw } from "react-icons/fi";

function AdminOrders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [todayDelivery, setTodayDelivery] = useState("");

  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState("");

  useEffect(() => {
    checkAdmin();
  }, []);


  async function checkAdmin() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

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

  // 🔥 STATUS UPDATE (SYNC ORDERS + PAYMENTS)
  async function updatePayment(order, value) {
    let newOrderStatus = order.status;

    if (value === "confirmed") {
      newOrderStatus = "in_progress";
    }

    if (value === "rejected") {
      newOrderStatus = "pending";
    }

    // 1️⃣ UPDATE ORDERS TABLE
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

    // 2️⃣ UPDATE PAYMENTS TABLE (SYNC FIX)
    const newStatus =
      value === "confirmed" ? "confirmed" : value === "rejected" ? "rejected" : "under_review";

    // try update by order_id first
    const { data: updatedById, error: errById } = await supabase
      .from("payments")
      .update({ status: newStatus })
      .eq("order_id", order.id)
      .select("id, order_id, order_number, status");

    if (errById) {
      console.error("Payment sync error (by order_id):", errById);
    }

    // if no rows updated, try fallback by order_number
    if (!updatedById || updatedById.length === 0) {
      const { data: updatedByNumber, error: errByNumber } = await supabase
        .from("payments")
        .update({ status: newStatus })
        .eq("order_number", order.order_number)
        .select("id, order_id, order_number, status");

      if (errByNumber) {
        console.error("Payment sync error (by order_number):", errByNumber);
      } else if (!updatedByNumber || updatedByNumber.length === 0) {
        console.warn("No payments matched order_id or order_number for order:", order.id, order.order_number);
      } else {
        console.log("Payments updated by order_number:", updatedByNumber);
      }
    } else {
      console.log("Payments updated by order_id:", updatedById);
    }

    loadOrders();
  }

  async function updateStatus(id, value) {
    const { error } = await supabase
      .from("orders")
      .update({ status: value })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
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

                {/* 🔥 PAYMENT STATUS (SYNCED) */}
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
                </td>

                {/* ORDER STATUS */}
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

                {/* NOTE */}
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
                <td colSpan="8" className="text-center text-muted py-4">
                  No orders found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
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
    </div>
  );
}

export default AdminOrders;