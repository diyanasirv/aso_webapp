import { useEffect, useState } from "react";
import { supabase, getUserWithRetry } from "../supabaseClient";
import Sidebar from "../components/Sidebar";

function Terms() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProfile();
    }, []);

    async function loadProfile() {
        try {
            const {
                data: { user },
            } = await getUserWithRetry();

            if (!user) return;

            const { data } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

            setProfile(data);
        } catch (error) {
            console.error("Error loading profile:", error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh", backgroundColor: "#f8fafc" }}>
                <p className="fw-semibold text-secondary fs-5">Loading terms...</p>
            </div>
        );
    }

    return (
        <div className="aso-layout" style={{ display: "flex", minHeight: "100vh" }}>
            
            {/* PROBLEM 1 FIX: Locked Sidebar Layout Container */}
            <div style={{ position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 1000 }}>
                <Sidebar profile={profile} active="terms" />
            </div>

            {/* Shift content window to avoid hiding behind fixed sidebar */}
            <main 
                className="aso-main" 
                style={{ 
                    backgroundColor: "#f8fafc", 
                    flexGrow: 1,
                    minHeight: "100vh",
                    padding: "2.5rem 2rem",
                    marginLeft: "260px" // Adjust to match your exact Sidebar component structural width
                }}
            >
                <header className="aso-topbar mb-5">
                    <div>
                        <h3 className="fw-bold tracking-tight text-dark mb-1">Legal Documents</h3>
                        <p className="text-muted fs-6">Review operating policies, user agreements, and system rules below.</p>
                    </div>
                </header>

                <div 
                    className="card border-0 shadow-sm rounded-4"
                    style={{ 
                        background: "#ffffff",
                        border: "1px solid #edf2f7",
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)"
                    }}
                >
                    {/* PROBLEM 2 FIX: Integrated clear content blocks running natively without line-break quirks */}
                    <div className="card-body p-4 p-md-5" style={{ color: "#475569", fontSize: "15px", lineHeight: "1.75" }}>

                        <h4 className="fw-bold text-dark mb-4">Terms & Conditions</h4>

                        <p className="text-muted mb-4" style={{ whiteSpace: "normal" }}>
                            By using AppGroh and placing an order through our platform, you agree
                            to comply with the following terms and conditions. Please read them
                            carefully before purchasing any service.
                        </p>

                        {/* ORDER TERMS */}
                        <h5 className="fw-bold text-dark mt-4 mb-3">1. Order Terms</h5>
                        <ul className="ps-3 mb-4">
                            <li className="mb-2">
                                Customers must provide accurate and complete information, including
                                app links, website URLs, social media accounts, keywords, or any
                                required details related to the selected service.
                            </li>
                            <li className="mb-2">
                                Orders containing incorrect, invalid, inaccessible, or misleading
                                information may be delayed, paused, or cancelled.
                            </li>
                            <li className="mb-2">
                                Order processing begins only after payment verification is completed.
                            </li>
                            <li className="mb-2">
                                Delivery timelines vary depending on service type, package size,
                                platform policies, and workload.
                            </li>
                            <li className="mb-2">
                                Customers are responsible for reviewing order details before
                                submitting an order.
                            </li>
                        </ul>

                        {/* PAYMENT TERMS */}
                        <h5 className="fw-bold text-dark mt-4 mb-3">2. Payment Terms</h5>
                        <ul className="ps-3 mb-4">
                            <li className="mb-2">
                                All payments must be completed using one of the approved payment
                                methods displayed on the platform.
                            </li>
                            <li className="mb-2">
                                Customers must upload valid payment proof after making payment.
                            </li>
                            <li className="mb-2">
                                Payment status will remain <strong>Under Review</strong> until
                                verification is completed by our team.
                            </li>
                            <li className="mb-2">
                                AppGroh reserves the right to reject unclear, edited, duplicate,
                                invalid, or suspicious payment proofs.
                            </li>
                            <li className="mb-2">
                                If a payment is rejected, customers may be required to provide
                                additional proof or resubmit payment details.
                            </li>
                        </ul>

                        {/* REFUND POLICY */}
                        <h5 className="fw-bold text-dark mt-4 mb-3">3. Refund Policy</h5>
                        <ul className="ps-3 mb-4">
                            <li className="mb-2">
                                Refund requests are reviewed individually based on the nature of
                                the issue.
                            </li>
                            <li className="mb-2">
                                Refunds are generally not available for completed services.
                            </li>
                            <li className="mb-2">
                                Once delivery has started, partial or full refunds may not be
                                possible.
                            </li>
                            <li className="mb-2">
                                Orders cancelled before work begins may qualify for a refund after
                                review.
                            </li>
                            <li className="mb-2">
                                Payment processing fees, transfer fees, and third-party charges are
                                non-refundable.
                            </li>
                        </ul>

                        {/* SERVICE TERMS */}
                        <h5 className="fw-bold text-dark mt-4 mb-3">4. Service Delivery</h5>
                        <ul className="ps-3 mb-4">
                            <li className="mb-2">
                                Service performance may vary depending on app quality, competition,
                                platform algorithms, and market conditions.
                            </li>
                            <li className="mb-2">
                                Delivery estimates are approximate and not guaranteed deadlines.
                            </li>
                            <li className="mb-2">
                                Customers can track order status through their dashboard.
                            </li>
                            <li className="mb-2">
                                Delivery reports, screenshots, or progress updates may be provided
                                when applicable.
                            </li>
                            <li className="mb-2">
                                Some services may require customer cooperation during the delivery
                                process.
                            </li>
                        </ul>

                        {/* USER RESPONSIBILITIES */}
                        <h5 className="fw-bold text-dark mt-4 mb-3">5. User Responsibilities</h5>
                        <ul className="ps-3 mb-4">
                            <li className="mb-2">
                                Users must not submit illegal, harmful, fraudulent, copyrighted,
                                or prohibited content.
                            </li>
                            <li className="mb-2">
                                Users are responsible for maintaining the security of their account.
                            </li>
                            <li className="mb-2">
                                Sharing login credentials with unauthorized individuals is strongly
                                discouraged.
                            </li>
                            <li className="mb-2">
                                Any misuse of the platform may result in account suspension or
                                termination.
                            </li>
                        </ul>

                        {/* ACCOUNT TERMS */}
                        <h5 className="fw-bold text-dark mt-4 mb-3">6. Account Policy</h5>
                        <ul className="ps-3 mb-4">
                            <li className="mb-2">
                                One user may maintain only legitimate accounts associated with their
                                business or personal use.
                            </li>
                            <li className="mb-2">
                                Fake registrations, fraudulent activity, or abuse of promotional
                                offers may lead to account removal.
                            </li>
                            <li className="mb-2">
                                We reserve the right to suspend accounts involved in suspicious
                                activities.
                            </li>
                        </ul>

                        {/* PRIVACY */}
                        <h5 className="fw-bold text-dark mt-4 mb-3">7. Privacy & Data Protection</h5>
                        <ul className="ps-3 mb-4">
                            <li className="mb-2">
                                Customer information is used solely for service delivery,
                                communication, and account management purposes.
                            </li>
                            <li className="mb-2">
                                AppGroh does not sell personal customer information to third parties.
                            </li>
                            <li className="mb-2">
                                Reasonable security measures are implemented to protect user data.
                            </li>
                        </ul>

                        {/* LIABILITY */}
                        <h5 className="fw-bold text-dark mt-4 mb-3">8. Limitation of Liability</h5>
                        <ul className="ps-3 mb-4">
                            <li className="mb-2">
                                AppGroh is not responsible for losses resulting from third-party
                                platform changes, algorithm updates, account suspensions, or policy
                                violations outside our control.
                            </li>
                            <li className="mb-2">
                                We do not guarantee specific rankings, revenue, downloads, sales,
                                or business outcomes unless explicitly stated in a service package.
                            </li>
                            <li className="mb-2">
                                Maximum liability shall not exceed the amount paid for the affected
                                service.
                            </li>
                        </ul>

                        {/* MODIFICATIONS */}
                        <h5 className="fw-bold text-dark mt-4 mb-3">9. Changes to Terms</h5>
                        <ul className="ps-3 mb-4">
                            <li className="mb-2">
                                AppGroh reserves the right to update or modify these terms at any
                                time without prior notice.
                            </li>
                            <li className="mb-2">
                                Continued use of the platform after updates constitutes acceptance
                                of the revised terms.
                            </li>
                        </ul>

                        <div className="alert alert-primary mt-4 rounded-4 border-0 p-3" style={{ fontSize: "14.5px" }}>
                            <strong>Agreement Notice:</strong> By creating an account, placing
                            an order, or using any AppGroh service, you acknowledge that you have
                            read, understood, and agreed to these Terms & Conditions.
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}

export default Terms;