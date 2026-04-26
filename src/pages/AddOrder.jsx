import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { FiPackage, FiLink, FiHash } from "react-icons/fi";

function AddOrder() {
  const navigate = useNavigate();

  const [userId, setUserId] = useState("");
  const [services, setServices] = useState([]);
  const [packages, setPackages] = useState([]);

  const [selectedService, setSelectedService] = useState("");
  const [selectedPackage, setSelectedPackage] = useState("");

  const [appName, setAppName] = useState("");
  const [appLink, setAppLink] = useState("");
  const [quantity, setQuantity] = useState("1");

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
    }
  }, [selectedService]);

  async function loadInitialData() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
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
    }

    setPackages(packagesData || []);
  }

  const selectedServiceData = services.find(
    (service) => service.id === selectedService
  );

  const selectedPackageData = packages.find(
    (pkg) => pkg.id === selectedPackage
  );

  const totalPrice =
    selectedPackageData && quantity
      ? Number(selectedPackageData.price) * Number(quantity)
      : 0;

  async function handleCreateOrder() {
    if (!appName || !appLink || !selectedService || !selectedPackage || !quantity) {
      alert("Please complete all order details");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from("orders").insert({
      user_id: userId,
      app_name: appName,
      app_link: appLink,
      service_id: selectedService,
      package_id: selectedPackage,
      quantity: Number(quantity),
      delivered_quantity: 0,
      remaining_quantity: Number(quantity),
      price: totalPrice,
      status: "pending",
      payment_status: "unpaid",
    });

    setSubmitting(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Order created successfully");
    navigate("/orders");
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
            <p>Select a service, choose package, and review before placing order.</p>
          </div>
        </header>

        <div className="row g-4">
          <div className="col-lg-8">
            <div className="aso-section mb-4">
              <h5>Order Details</h5>

              <div className="row g-3">
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

                <div className="col-md-6">
                  <label className="form-label">App / Business Name</label>
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

                <div className="col-md-6">
                  <label className="form-label">App / Business Link</label>
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

                <div className="col-md-6">
                  <label className="form-label">Quantity</label>
                  <div className="input-icon-box">
                    <FiHash />
                    <select
                      className="form-select"
                      style={{ paddingLeft: "40px" }}
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    >
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5">5</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

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
                <span>Unit Price</span>
                <strong>
                  {selectedPackageData ? `$${selectedPackageData.price}` : "-"}
                </strong>
              </div>

              <div className="summary-row">
                <span>Quantity</span>
                <strong>{quantity}</strong>
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
                After placing the order, you can upload payment proof and track progress.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AddOrder;