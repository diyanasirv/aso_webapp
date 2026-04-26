import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";


function Profile() {
  const navigate = useNavigate();

  const countries = [
    { name: "India", code: "+91" },
    { name: "United States", code: "+1" },
    { name: "United Kingdom", code: "+44" },
    { name: "United Arab Emirates", code: "+971" },
    { name: "Saudi Arabia", code: "+966" },
    { name: "Qatar", code: "+974" },
    { name: "Kuwait", code: "+965" },
  ];

  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [gender, setGender] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login");
        return;
      }

      setUserId(user.id);
      setEmail(user.email);

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        setFullName(data.full_name || "");
        setPhone(data.phone || "");
        setCountryCode(data.country_code || "");
        setCountry(data.country || "");
        setGender(data.gender || "");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleCountryChange(e) {
    const selected = e.target.value;
    setCountry(selected);
    const found = countries.find((c) => c.name === selected);
    setCountryCode(found ? found.code : "");
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!fullName || !phone || !country || !gender) {
      alert("Fill all required fields");
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        phone,
        country_code: countryCode,
        country,
        gender,
        is_profile_complete: true,
      })
      .eq("id", userId);

    setSaving(false);
    if (error) {
      alert(error.message);
      return;
    }
    navigate("/dashboard");
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-light min-vh-100 py-5 d-flex align-items-center">
      <div className="container" style={{ maxWidth: "600px" }}>
        <div className="card shadow border-0 rounded-4">
          <div className="card-body p-4 p-md-5">
            <div className="text-center mb-4">
              <h2 className="fw-bold">Complete Profile</h2>
              <p className="text-muted">
                Complete your details before using the dashboard
              </p>
            </div>

            <form onSubmit={handleSave}>
              <div className="mb-3">
                <label className="form-label fw-semibold">Email Address</label>
                <input
                  className="form-control bg-light"
                  value={email}
                  disabled
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">Full Name *</label>
                <input
                  className="form-control"
                  value={fullName}
                  placeholder="e.g. John Doe"
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">Country *</label>
                <select
                  className="form-select"
                  value={country}
                  onChange={handleCountryChange}
                  required
                >
                  <option value="">Select country</option>
                  {countries.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">Phone Number *</label>
                <div className="input-group">
                  <span className="input-group-text bg-light text-muted" style={{ width: "80px" }}>
                    {countryCode || "—"}
                  </span>
                  <input
                    className="form-control"
                    type="tel"
                    value={phone}
                    placeholder="Enter phone number"
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label fw-semibold">Gender *</label>
                <select
                  className="form-select"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  required
                >
                  <option value="">Select gender</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg w-100 py-3 fw-bold"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Saving...
                  </>
                ) : (
                  "Save Profile"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;