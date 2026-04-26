
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import Sidebar from "../components/Sidebar";

function Contact() {
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        loadProfile();
    }, []);

    async function loadProfile() {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

        setProfile(data);
    }

    return (
        <div className="aso-layout">
            <Sidebar profile={profile} active="contact" />

            <main className="aso-main">
                <header className="aso-topbar">
                    <div>
                        <h3>Contact Us</h3>
                        <p>Need help with orders, payment, or reports?</p>
                    </div>
                </header>

                <div className="row g-4">
                    <div className="col-md-6">
                        <div className="card border-0 shadow-sm rounded-4 h-100">
                            <div className="card-body p-4">
                                <h5 className="fw-bold mb-3">Support Details</h5>

                                <p className="mb-2">
                                    <strong>Email:</strong> support@asopanel.com
                                </p>
                                <p className="mb-2">
                                    <strong>WhatsApp:</strong> +91 98765 43210
                                </p>
                                <p className="mb-2">
                                    <strong>Support Time:</strong> 10:00 AM - 6:00 PM
                                </p>

                                <p className="text-muted mt-3">
                                    For faster support, include your Order ID when contacting us.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-6">
                        <div className="card border-0 shadow-sm rounded-4 h-100">
                            <div className="card-body p-4">
                                <h5 className="fw-bold mb-3">Quick Message</h5>

                                <input
                                    className="form-control mb-3"
                                    placeholder="Subject"
                                />

                                <textarea
                                    className="form-control mb-3"
                                    rows="5"
                                    placeholder="Write your message"
                                ></textarea>

                                <button
                                    className="btn btn-primary"
                                    onClick={() => alert("Message feature will be connected later")}
                                >
                                    Send Message
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Contact;