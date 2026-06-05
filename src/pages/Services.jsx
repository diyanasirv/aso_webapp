import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, getUserWithRetry } from "../supabaseClient";
import Sidebar from "../components/Sidebar";

function Pricing() {
    const [profile, setProfile] = useState(null);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true); // Added missing loading state variable
    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const {
                data: { user },
            } = await getUserWithRetry();

            if (user) {
                const { data: profileData } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", user.id)
                    .single();

                setProfile(profileData);
            }

            const { data } = await supabase
                .from("services")
                .select("id, name, description")
                .eq("is_active", true)
                .order("created_at", { ascending: true });

            setServices(data || []);
        } catch (error) {
            console.error("Error loading pricing data:", error);
        } finally {
            setLoading(false); // Turn off loading screen when data loading finishes
        }
    }

    if (loading) {
            return <p className="text-center mt-5">Loading services...</p>;

    }

    return (
        <div className="aso-layout" style={{ display: "flex", minHeight: "100vh" }}>

            {/* PROBLEM 1 FIX: Locked Sidebar Layout Container */}
            <div style={{ position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 1000 }}>
                <Sidebar profile={profile} active="pricing" />
            </div>

            {/* Shift content window to the right so it doesn't hide behind fixed sidebar */}
            <main
                className="aso-main"
                style={{
                    backgroundColor: "#f8fafc",
                    flexGrow: 1,
                    minHeight: "100vh",
                    padding: "2.5rem 2rem",
                    marginLeft: "260px" // Adjust this value to match your actual exact Sidebar width
                }}
            >
                <header className="aso-topbar mb-5">
                    <div>
                        <h3 className="fw-bold tracking-tight text-dark mb-1">Select a Service</h3>
                        <p className="text-muted fs-6">Choose an ideal plan below to unlock your features and get started instantly.</p>
                    </div>
                </header>

                <div className="row g-4 justify-content-center">
                    {services.map((service) => (
                        <div className="col-12" key={service.id}>
                            <div
                                className="card border-0 shadow-sm rounded-4"
                                style={{
                                    background: "#ffffff",
                                    border: "1px solid #edf2f7",
                                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)"
                                }}
                            >
                                <div className="card-body p-4 p-md-5">
                                    {/* Service Title */}
                                    <div className="mb-3">
                                        <h4 className="fw-bold text-dark mb-0 d-flex align-items-center">
                                            <span className="me-2" style={{ color: "#4f46e5" }}>✦</span>
                                            {service.name}
                                        </h4>
                                    </div>

                                    {/* PROBLEM 2 FIX: Running text structure instead of split line-by-line blocks */}
                                    {service.description && (
                                        <div
                                            className="text-secondary mb-4"
                                            style={{
                                                whiteSpace: "normal", // Renders as regular paragraph prose
                                                fontSize: "15px",
                                                lineHeight: "1.75",
                                                color: "#475569"
                                            }}
                                        >
                                            {service.description}
                                        </div>
                                    )}

                                    {/* Small clean Action Button */}
                                    <div className="d-flex justify-content-start border-top pt-4">
                                        <button
                                            className="btn fw-bold text-white rounded-3 shadow-sm"
                                            style={{
                                                backgroundColor: "#4f46e5",
                                                border: "none",
                                                letterSpacing: "0.5px",
                                                padding: "10px 28px",
                                                fontSize: "14.5px",
                                                minWidth: "160px",
                                                transition: "background-color 0.2s ease-in-out"
                                            }}
                                            onMouseOver={(e) => e.target.style.backgroundColor = "#4338ca"}
                                            onMouseOut={(e) => e.target.style.backgroundColor = "#4f46e5"}
                                            onClick={() =>
                                                navigate("/add-order", {
                                                    state: { service }
                                                })
                                            }
                                        >
                                            Get Started
                                        </button>
                                    </div>

                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}

export default Pricing;