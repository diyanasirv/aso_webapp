import { useEffect, useState } from "react";
import { supabase, getUserWithRetry } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { FiPackage, FiLink } from "react-icons/fi";

function AddOrder() {
  const navigate = useNavigate();

  const [userId, setUserId] = useState("");
  const [services, setServices] = useState([]);
  const [packages, setPackages] = useState([]);

  const [selectedService, setSelectedService] = useState("");
  const [selectedPackage, setSelectedPackage] = useState("");

  const [appName, setAppName] = useState("");
  const [appLink, setAppLink] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedService) {
      loadPackages(selectedService);
    } else {
      setPackages([]);
      setSelectedPackage("");
    }
  }, [selectedService]);

  async function loadInitialData() {
    const { data: { user }, error: authError } = await getUserWithRetry();

    if (authError || !user) {
      navigate("/login");
      return;
    }

    setUserId(user.id);

    const { data: servicesData, error } = await supabase
      .from("services")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    setServices(servicesData || []);
    setLoading(false);
  }

  async function loadPackages(serviceId) {
    setSelectedPackage("");

    const { data: packagesData, error } = await supabase
      .from("packages")
      .select("*")
      .eq("service_id", serviceId)
      .eq("is_active", true)
      .order("price", { ascending: true });

    if (error) {
      alert(error.message);
      return;
    }

    setPackages(packagesData || []);
  }

  const selectedServiceData = services.find(
    (service) => service.id === selectedService
  );

  const selectedPackageData = packages.find(
    (pkg) => pkg.id === selectedPackage
  );

  const totalPrice = selectedPackageData
    ? Number(selectedPackageData.price)
    : 0;

  async function handleCreateOrder() {
    // 1. Double check auth verification on-the-fly
    const { data: { user } } = await getUserWithRetry();
    if (!user) {
      alert("Your session has expired. Please log in again.");
      navigate("/login");
      return;
    }

    // 2. Strict inputs trim sanitization validation
    if (!appName.trim() || !appLink.trim() || !selectedService || !selectedPackage) {
      alert("Please accurately complete all form spaces before placement.");
      return;
    }

    setSubmitting(true);

    const payload = {
      user_id: user.id,
      email: user.email,
      app_name: appName.trim(),
      app_link: appLink.trim(),
      service_id: selectedService,
      package_id: selectedPackage,
      price: totalPrice,
      status: "payment_pending",
      payment_status: "pending",
    };

    const { data, error } = await supabase
      .from("orders")
      .insert(payload)
      .select("id")
      .single();

    setSubmitting(false);

    if (error) {
      alert(`Placement Failed: ${error.message}`);
      console.error("Order insertion runtime breakdown:", error);
      return;
    }

    if (!data?.id) {
      alert("Order logged successfully, but internal identifier redirection layer timed out.");
      return;
    }

    // Redirect to complete transaction invoice uploads
    navigate(`/payment/${data.id}`);
  }

  if (loading) {
    return <p className="text-center mt-5">Loading services...</p>;
  }

  return (
    <div className="aso-layout">
      <Sidebar />

      <main className="aso-main">
        <header className="aso-topbar">
          <div>
            <h3>Create New Order</h3>
            <p>Select a service, choose package, and proceed to payment.</p>
          </div>
        </header>

        <div className="row g-4">
          <div className="col-lg-8">
            <div className="aso-section mb-4">
              <h5>Order Details</h5>

              <div className="row g-3">
                {/* SERVICE SELECT */}
                <div className="col-12">
                  <label className="form-label">Select Service</label>
                  <select
                    className="form-select"
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                  >
                    <option value="">-- Choose a Service --</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* SERVICE DESCRIPTION */}
                {selectedServiceData && (
                  <div className="col-12">
                    <div className="p-3 bg-light rounded">
                      <h6 className="mb-1">Service Description</h6>
                      <p
                        className="mb-0 text-muted"
                        style={{ whiteSpace: "pre-line" }}
                      >
                        {selectedServiceData.description || "No description available"}
                      </p>
                    </div>
                  </div>
                )}

                {/* APP NAME */}
                <div className="col-md-6">
                  <label className="form-label">App Name</label>
                  <div className="input-icon-box">
                    <FiPackage />
                    <input
                      className="form-control"
                      placeholder="Example: My Fitness App"
                      value={appName}
                      onChange={(e) => setAppName(e.target.value)}
                    />
                  </div>
                </div>

                {/* APP LINK */}
                <div className="col-md-6">
                  <label className="form-label">App Link</label>
                  <div className="input-icon-box">
                    <FiLink />
                    <input
                      className="form-control"
                      placeholder="URL Link"
                      value={appLink}
                      onChange={(e) => setAppLink(e.target.value)}
                    />
                  </div>
                </div>

                {/* PACKAGE */}
                <div className="col-md-6">
                  <label className="form-label">Package</label>
                  <select
                    className="form-select"
                    value={selectedPackage}
                    onChange={(e) => setSelectedPackage(e.target.value)}
                    disabled={!selectedService}
                  >
                    <option value="">
                      {selectedService ? "Select package" : "Choose service first"}
                    </option>
                    {packages.map((pkg) => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name} — ${pkg.price}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* ORDER SUMMARY */}
          <div className="col-lg-4">
            <div className="order-summary-card">
              <h5>Order Summary</h5>

              <div className="summary-row">
                <span>Service</span>
                <strong>{selectedServiceData?.name || "-"}</strong>
              </div>

              <div className="summary-row">
                <span>Package</span>
                <strong>{selectedPackageData?.name || "-"}</strong>
              </div>

              <div className="summary-row">
                <span>Price</span>
                <strong>
                  {selectedPackageData ? `$${selectedPackageData.price}` : "-"}
                </strong>
              </div>

              <hr />

              <div className="summary-total">
                <span>Total</span>
                <strong>${totalPrice}</strong>
              </div>

              <button
                className="btn btn-primary w-100 mt-4"
                onClick={handleCreateOrder}
                disabled={submitting}
              >
                {submitting ? "Creating..." : "Place Order"}
              </button>

              <p className="summary-note">
                After placing the order, you will be redirected to payment page.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AddOrder;