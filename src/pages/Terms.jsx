
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import Sidebar from "../components/Sidebar";

function Terms() {
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
            <Sidebar profile={profile} active="terms" />

            <main className="aso-main">
                <header className="aso-topbar">
                    <div>
                        <h3>Terms of Use</h3>
                        <p>Read the basic rules before placing orders.</p>
                    </div>
                </header>

                <div className="card border-0 shadow-sm rounded-4">
                    <div className="card-body p-4">
                        <h5 className="fw-bold">Order Terms</h5>
                        <ul>
                            <li>Users must provide correct app, website, or business links.</li>
                            <li>Orders will start only after payment proof is uploaded and verified.</li>
                            <li>Delivery time may vary depending on service type and quantity.</li>
                            <li>Completed orders cannot be cancelled.</li>
                            <li>Admin may reject invalid or unclear payment proof.</li>
                        </ul>

                        <h5 className="fw-bold mt-4">Payment Terms</h5>
                        <ul>
                            <li>Payment status starts as unpaid.</li>
                            <li>After uploading proof, payment status becomes pending.</li>
                            <li>Admin approval changes payment status to paid.</li>
                            <li>Rejected payment proof must be uploaded again.</li>
                        </ul>

                        <h5 className="fw-bold mt-4">Service Terms</h5>
                        <ul>
                            <li>Users can track delivered and remaining quantity from Orders page.</li>
                            <li>Admin may upload reports or screenshots as delivery proof.</li>
                            <li>Service delivery is based on selected package and quantity.</li>
                        </ul>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Terms;