import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";

import {
  FiPlusCircle,
  FiPackage,
  FiEye,
  FiUpload,
} from "react-icons/fi";

function Orders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentFile, setPaymentFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      navigate("/login");
      return;
    }

    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        services(name),
        packages(name)
      `)
      .eq("user_id", user.id)
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
    if (status === "payment_pending") return "bg-warning text-dark";
    if (status === "pending") return "bg-secondary";
    if (status === "cancelled") return "bg-danger";
    return "bg-secondary";
  }

  function paymentBadge(status) {
    if (status === "paid") return "bg-success";
    if (status === "pending") return "bg-warning text-dark";
    if (status === "rejected") return "bg-danger";
    if (status === "unpaid") return "bg-secondary";
    return "bg-secondary";
  }

  function progressPercent(order) {
    if (!order.quantity) return 0;
    return Math.round(((order.delivered_quantity || 0) / order.quantity) * 100);
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
      amount: selectedOrder.price,
      payment_status: "pending",
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
        payment_status: "pending",
        status: "payment_pending",
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
    loadOrders();
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
                    <th>Quantity</th>
                    <th>Delivered / Remaining</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Details</th>
                  </tr>
                </thead>

                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <strong>#{order.id.slice(0, 8)}</strong>
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

                      <td>{order.quantity}</td>

                      <td>
                        <div className="d-flex justify-content-between">
                          <small>{order.delivered_quantity || 0} delivered</small>
                          <small>
                            {order.remaining_quantity ?? order.quantity} left
                          </small>
                        </div>

                        <div className="progress mt-1" style={{ height: "7px" }}>
                          <div
                            className="progress-bar"
                            style={{ width: `${progressPercent(order)}%` }}
                          ></div>
                        </div>
                      </td>

                      <td>
                        <span className={`badge ${statusBadge(order.status)}`}>
                          {order.status}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`badge ${paymentBadge(
                            order.payment_status
                          )}`}
                        >
                          {order.payment_status}
                        </span>
                      </td>

                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <FiEye />
                        </button>

                        {order.payment_status !== "paid" && (
                          <button
                            className="btn btn-sm btn-outline-success"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <FiUpload />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedOrder && (
          <div className="custom-modal">
            <div className="modal-box order-modal">
              <h5 className="fw-bold mb-3">Order Details</h5>

              <div className="detail-row">
                <span>Order ID</span>
                <strong>#{selectedOrder.id.slice(0, 8)}</strong>
              </div>

              <div className="detail-row">
                <span>App Name</span>
                <strong>{selectedOrder.app_name}</strong>
              </div>

              <div className="detail-row">
                <span>Service</span>
                <strong>{selectedOrder.services?.name || "-"}</strong>
              </div>

              <div className="detail-row">
                <span>Package</span>
                <strong>{selectedOrder.packages?.name || "-"}</strong>
              </div>

              <div className="detail-row">
                <span>Quantity</span>
                <strong>{selectedOrder.quantity}</strong>
              </div>

              <div className="detail-row">
                <span>Delivered</span>
                <strong>{selectedOrder.delivered_quantity || 0}</strong>
              </div>

              <div className="detail-row">
                <span>Remaining</span>
                <strong>
                  {selectedOrder.remaining_quantity ?? selectedOrder.quantity}
                </strong>
              </div>

              <div className="detail-row">
                <span>Total Price</span>
                <strong>${selectedOrder.price}</strong>
              </div>

              <div className="detail-row">
                <span>Status</span>
                <span className={`badge ${statusBadge(selectedOrder.status)}`}>
                  {selectedOrder.status}
                </span>
              </div>

              <div className="detail-row">
                <span>Payment</span>
                <span
                  className={`badge ${paymentBadge(
                    selectedOrder.payment_status
                  )}`}
                >
                  {selectedOrder.payment_status}
                </span>
              </div>

              <div className="mt-3">
                <small className="text-muted">
                  Reports and admin notes will appear here after admin uploads
                  delivery proof.
                </small>
              </div>

              {selectedOrder.payment_status !== "paid" && (
                <div className="mt-4">
                  <label className="form-label">Upload payment proof</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="form-control"
                    onChange={(e) => setPaymentFile(e.target.files[0])}
                  />

                  <button
                    className="btn btn-primary w-100 mt-3"
                    onClick={handlePaymentUpload}
                    disabled={uploading}
                  >
                    {uploading ? "Uploading..." : "Upload Payment Proof"}
                  </button>
                </div>
              )}

              <button
                className="btn btn-light border w-100 mt-3"
                onClick={() => {
                  setSelectedOrder(null);
                  setPaymentFile(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Orders;