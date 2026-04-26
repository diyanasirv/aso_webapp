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

    if (error) {
      alert("Profile not found");
      navigate("/dashboard");
      return;
    }

    if (profile?.role?.trim().toLowerCase() !== "admin") {
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

  async function updatePayment(id, value) {
    let newStatus = null;

    if (value === "paid") newStatus = "in_progress";
    if (value === "rejected") newStatus = "pending";

    const updateData = {
      payment_status: value,
    };

    if (newStatus) {
      updateData.status = newStatus;
    }

    const { error } = await supabase
      .from("orders")
      .update(updateData)
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

  async function addToday(order, val) {
    if (order.status === "completed" || order.status === "cancelled") {
      alert("This order cannot be updated");
      return;
    }

    const today = Number(val);

    if (!today || today <= 0) {
      alert("Enter valid delivery count");
      return;
    }

    const currentDelivered = Number(order.delivered_quantity || 0);
    const total = currentDelivered + today;

    if (total > order.quantity) {
      alert("Delivery count exceeds total quantity");
      return;
    }

    const remaining = order.quantity - total;

    let status = order.status;

    if (total === order.quantity) {
      status = "completed";
    } else if (total > 0) {
      status = "partially_completed";
    }

    const { error } = await supabase
      .from("orders")
      .update({
        delivered_quantity: total,
        remaining_quantity: remaining,
        status,
      })
      .eq("id", order.id);

    if (error) {
      alert("Failed to update delivery");
      return;
    }

    setSelectedOrder(null);
    setTodayDelivery("");
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
              <th>Pkg</th>
              <th>Qty</th>
              <th>Update</th>
              <th>Done</th>
              <th>Left</th>
              <th>Pay</th>
              <th>Status</th>
              <th>Note</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((o, i) => (
              <tr key={o.id}>
                <td>{i + 1}</td>
                <td>{o.id.slice(0, 6)}</td>
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

                <td>{o.quantity}</td>

                <td>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    disabled={o.status === "completed" || o.status === "cancelled"}
                    onClick={() => {
                      setSelectedOrder(o);
                      setTodayDelivery("");
                    }}
                  >
                    Update
                  </button>
                </td>

                <td>{o.delivered_quantity || 0}</td>
                <td>{o.remaining_quantity ?? o.quantity}</td>

                <td>
                  <select
                    value={o.payment_status}
                    disabled={o.payment_status === "paid"}
                    onChange={(e) => updatePayment(o.id, e.target.value)}
                    className="admin-dd"
                  >
                    <option value="unpaid">unpaid</option>
                    <option value="pending">pending</option>
                    <option value="paid">paid</option>
                    <option value="rejected">rejected</option>
                  </select>
                </td>

                <td>
                  <select
                    value={o.status}
                    disabled={o.status === "completed" || o.status === "cancelled"}
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

                <td style={{ minWidth: "140px" }}>
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
                      style={{
                        fontSize: "12px",
                        lineHeight: "1.2",
                        maxWidth: "130px",
                        wordBreak: "break-word",
                      }}
                    >
                      {o.admin_remark}
                    </div>
                  )}
                </td>
              </tr>
            ))}

            {orders.length === 0 && (
              <tr>
                <td colSpan="12" className="text-center text-muted py-4">
                  No orders found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedOrder && !showNoteModal && (
        <div className="modal show d-block delivery-modal" tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content">
              <div className="modal-body text-center">
                <h6 className="mb-3">Today Delivery</h6>

                <input
                  type="number"
                  className="form-control form-control-sm mb-3"
                  value={todayDelivery}
                  onChange={(e) => setTodayDelivery(e.target.value)}
                  placeholder="Enter count"
                  autoFocus
                />

                <div className="d-flex justify-content-center gap-2">
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => {
                      setSelectedOrder(null);
                      setTodayDelivery("");
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => addToday(selectedOrder, todayDelivery)}
                  >
                    Update
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showNoteModal && (
        <div className="modal show d-block delivery-modal">
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content">
              <div className="modal-body text-center">
                <h6 className="mb-3">Add Remark</h6>

                <textarea
                  className="form-control form-control-sm mb-3"
                  rows="3"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Enter remark"
                />

                <div className="d-flex justify-content-center gap-2">
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => {
                      setShowNoteModal(false);
                      setNoteText("");
                      setSelectedOrder(null);
                    }}
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
        </div>
      )}
    </div>
  );
}

export default AdminOrders;