import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [previewScreenshot, setPreviewScreenshot] = useState(null);

  useEffect(() => {
    fetchPayments();

    // 🔴 REAL-TIME UPDATES
    const channel = supabase
      .channel("payments-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "payments",
        },
        () => {
          fetchPayments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    setFetchError(null);

    const { data, error } = await supabase
      .from("payments")
      .select(`
        *,
        profiles(full_name,email)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching payments:", error);
      setFetchError(error.message);
      setPayments([]);
    } else {
      setPayments(data || []);
    }

    setLoading(false);
  };

  return (
    <div className="d-flex">
      <div className="container-fluid p-4">

        {/* HEADER */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2>💳 Admin Payments</h2>
            <p className="text-muted mb-0">
              All payment records with proof verification
            </p>
          </div>

          <span className="badge bg-info text-dark">
            Total: {payments.length}
          </span>
        </div>

        {/* LOADING / ERROR */}
        {loading ? (
          <p>Loading payments...</p>
        ) : fetchError ? (
          <div className="alert alert-danger">{fetchError}</div>
        ) : payments.length === 0 ? (
          <div className="alert alert-secondary">
            No payments found
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped table-hover align-middle">

              <thead className="table-dark">
                <tr>
                  <th>Order No</th>
                  <th>User</th>
                  <th>Email</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Proof</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td>{p.order_number}</td>
                    <td>{p.profiles?.full_name || "N/A"}</td>
                    <td>{p.profiles?.email || "N/A"}</td>
                    <td>₹{p.amount}</td>
                    <td>{p.payment_method}</td>

                    {/* STATUS */}
                    <td>
                      <span
                        className={`badge ${
                          p.status === "confirmed"
                            ? "bg-success"
                            : p.status === "pending"
                            ? "bg-warning text-dark"
                            : p.status === "under_review"
                            ? "bg-info text-dark"
                            : p.status === "rejected"
                            ? "bg-danger"
                            : "bg-secondary"
                        }`}
                      >
                        {p.status?.replaceAll("_", " ").toUpperCase()}
                      </span>
                    </td>

                    {/* ✅ FIXED PROOF FIELD */}
                    <td>
                      {p.proof_url ? (
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => setPreviewScreenshot(p.proof_url)}
                        >
                          View Proof
                        </button>
                      ) : (
                        <span className="text-muted">No proof</span>
                      )}
                    </td>

                    <td>
                      {p.created_at
                        ? new Date(p.created_at).toLocaleString()
                        : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* IMAGE PREVIEW MODAL */}
      {previewScreenshot && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-75 d-flex justify-content-center align-items-center"
          style={{ zIndex: 9999 }}
        >
          <div className="bg-white p-3 rounded shadow" style={{ maxWidth: "90vw" }}>
            <div className="d-flex justify-content-between mb-2">
              <h5 className="mb-0">Payment Proof</h5>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setPreviewScreenshot(null)}
              >
                Close
              </button>
            </div>

            <img
              src={previewScreenshot}
              alt="Proof"
              className="img-fluid"
              style={{ maxHeight: "80vh" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPayments;