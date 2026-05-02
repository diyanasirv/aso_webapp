// src/pages/Payment.jsx
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";

function Payment() {
  const navigate = useNavigate();
  const { orderId } = useParams();

  const [order, setOrder] = useState(null);
  const [methods, setMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(null);

  const [transactionId, setTransactionId] = useState("");
  const [proofFile, setProofFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const USD_TO_INR = 95;

  function getCurrency(type) {
    if (type === "upi") return "INR ₹";
    if (type === "binance") return "USDT";
    if (type === "qr") return "USD $";
    return "$";
  }

  function convertAmount(amount, type) {
    if (type === "upi") return amount * USD_TO_INR;
    if (type === "binance") return amount;
    if (type === "qr") return amount;
    return amount;
  }

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      navigate("/login");
      return;
    }

    const { data: orderData, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single();

    if (error || !orderData) {
      alert("Order not found");
      navigate("/orders");
      return;
    }

    setOrder(orderData);

    const staticMethods = [
      {
        id: 1,
        method_name: "Google Pay / PhonePe",
        type: "upi",
        upi_id: "diyanasir01-3@okaxis",
        qr_code_url: "/IMG_8496.png",
      },
      {
        id: 2,
        method_name: "Binance Pay",
        type: "binance",
        binance_id: "801283897",
      },
      {
        id: 3,
        method_name: "PayPal",
        type: "qr",
        qr_code_url: "/qr-code.png",
      },
    ];

    setMethods(staticMethods);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!selectedMethod) {
      alert("Select payment method");
      return;
    }

    if (!transactionId) {
      alert("Transaction ID is required");
      return;
    }

    if (!proofFile) {
      alert("Upload payment proof");
      return;
    }

    setUploading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const fileExt = proofFile.name.split(".").pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `payment-proofs/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("payments")
      .upload(filePath, proofFile);

    if (uploadError) {
      alert("Proof upload failed");
      setUploading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("payments")
      .getPublicUrl(filePath);

    const { error: paymentError } = await supabase.from("payments").insert({
      order_id: order.id,
      user_id: user.id,
      payment_method: selectedMethod.method_name,
      payment_type: selectedMethod.type,
       amount: order.price,
      transaction_id: transactionId,
      proof_url: publicUrlData.publicUrl,
      status: "pending",
    });

    if (paymentError) {
      alert(paymentError.message);
      setUploading(false);
      return;
    }

    await supabase
      .from("orders")
      .update({
        payment_status: "pending",
        status: "payment_pending",
      })
      .eq("id", order.id);

    setUploading(false);
    setShowPopup(true);
  }

  return (
    <div className="aso-layout">
      <Sidebar />

      <main className="aso-main">
        <div className="aso-topbar">
          <h3>Payment</h3>
          <p>Complete your order securely</p>
        </div>

        <div className="aso-section">

          {/* ORDER SUMMARY */}
          {order && (
            <div className="mb-4">
              <h5>Order Summary</h5>

              <p>
                <strong>Order ID:</strong> #{order.order_number}
              </p>

              <p>
                <strong>Quantity:</strong> {order.quantity}
              </p>

              <p>
                <strong>Total:</strong>{" "}
                {selectedMethod
                  ? `${getCurrency(selectedMethod.type)} ${convertAmount(
                    order.price,
                    selectedMethod.type
                  )}`
                  : `$ ${order.price}`}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* PAYMENT METHODS */}
            <div className="mb-4">
              <label className="form-label fw-semibold">
                Select Payment Method
              </label>

              <div className="row g-3">
                {methods.map((method) => (
                  <div className="col-md-4" key={method.id}>
                    <div
                      className={`border rounded-4 p-3 text-center h-100 ${selectedMethod?.id === method.id
                          ? "border-primary shadow-sm"
                          : ""
                        }`}
                      style={{ cursor: "pointer" }}
                      onClick={() => setSelectedMethod(method)}
                    >
                      <h6>{method.method_name}</h6>
                      <small className="text-muted text-uppercase">
                        {method.type}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* INSTRUCTION */}
            {selectedMethod && order && (
              <div className="alert alert-info mt-3 rounded-4">
                <h5>
                  Pay {getCurrency(selectedMethod.type)}{" "}
                  <b>{convertAmount(order.price, selectedMethod.type)}</b>
                </h5>
                <p className="mb-0">
                  Complete payment and upload screenshot below.
                </p>
              </div>
            )}

            {/* PAYMENT DETAILS */}
            {selectedMethod && (
              <div className="border rounded-4 p-4 mb-4 bg-light">
                <h5>{selectedMethod.method_name}</h5>

                {selectedMethod.type === "upi" && (
                  <>
                    <div className="p-3 border bg-white rounded fw-bold mb-3">
                      {selectedMethod.upi_id}
                    </div>
                    <img
                      src={selectedMethod.qr_code_url}
                      alt="UPI QR"
                      className="img-fluid rounded border bg-white p-2"
                      style={{ width: "260px", height: "260px" }}
                    />
                  </>
                )}

                {selectedMethod.type === "binance" && (
                  <div className="p-3 border bg-white rounded fw-bold">
                    {selectedMethod.binance_id}
                  </div>
                )}

                {selectedMethod.type === "qr" && (
                  <img
                    src={selectedMethod.qr_code_url}
                    alt="QR"
                    className="img-fluid rounded border bg-white p-2"
                    style={{ width: "260px", height: "260px" }}
                  />
                )}
              </div>
            )}

            {/* TXN ID */}
            <div className="mb-3">
              <label className="form-label fw-semibold">
                Transaction ID *
              </label>
              <input
                type="text"
                className="form-control"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                required
              />
            </div>

            {/* PROOF */}
            <div className="mb-4">
              <label className="form-label fw-semibold">
                Upload Payment Proof
              </label>
              <input
                type="file"
                className="form-control"
                accept="image/*"
                onChange={(e) => setProofFile(e.target.files?.[0])}
              />
            </div>

            <button className="btn btn-primary" disabled={uploading}>
              {uploading ? "Submitting..." : "Submit Payment"}
            </button>
          </form>
        </div>
      </main>

      {/* POPUP */}
      {showPopup && (
        <div className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex justify-content-center align-items-center">
          <div className="bg-white p-4 rounded-4 text-center shadow">
            <h4>Payment Submitted 🎉</h4>
            <p>After verification, your order will be processed.check your payment status from orders page.</p>
            <button
              className="btn btn-primary w-100"
              onClick={() => navigate("/orders")}
            >
              Go to Orders
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Payment;