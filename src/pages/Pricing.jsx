import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import Sidebar from "../components/Sidebar";

function Pricing() {
    const [profile, setProfile] = useState(null);
    const [services, setServices] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        const {
            data: { user },
        } = await supabase.auth.getUser();

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
            .select(`
id,
name,
packages(name, price, min_quantity, max_quantity)
`)
            .eq("is_active", true)
            .order("created_at", { ascending: true });

        setServices(data || []);
    }

    return (
        <div className="aso-layout">
            <Sidebar profile={profile} active="pricing" />

            <main className="aso-main">
                <header className="aso-topbar">
                    <div>
                        <h3>Pricing</h3>
                        <p>View available services and package prices.</p>
                    </div>
                </header>

                <div className="row g-4">
                    {services.map((service) => (
                        <div className="col-md-6" key={service.id}>
                            <div className="card border-0 shadow-sm rounded-4 h-100">
                                <div className="card-body">
                                    <h5 className="fw-bold mb-3">{service.name}</h5>

                                    <div className="table-responsive">
                                        <table className="table table-sm align-middle">
                                            <thead>
                                                <tr>
                                                    <th>Package</th>
                                                    <th>Price</th>
                                                    <th>Min</th>
                                                    <th>Max</th>
                                                </tr>
                                            </thead>

                                            <tbody>
                                                {service.packages?.map((pkg) => (
                                                    <tr key={pkg.name}>
                                                        <td>{pkg.name}</td>
                                                        <td>${pkg.price}</td>
                                                        <td>{pkg.min_quantity}</td>
                                                        <td>{pkg.max_quantity}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
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