import { useState } from "react";
import { supabase } from "../supabaseClient";
import { Link, useNavigate } from "react-router-dom";

function Signup() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [country, setCountry] = useState("");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSignup(e) {
    e.preventDefault();

    if (!agree) {
      alert("Please agree to Terms & Conditions");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          full_name: `${firstName} ${lastName}`,
          country: country,
        },
      },
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Account created successfully! Please login.");
    navigate("/login");
  }

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center px-3 py-4"
      style={{
        background: "linear-gradient(135deg, #f8f9fa, #e9ecef)",
      }}
    >
      <div
        className="card border-0 shadow-lg rounded-4 overflow-hidden w-100"
        style={{ maxWidth: "950px" }}
      >
        <div className="row g-0">
          {/* Left Side */}
          <div className="col-lg-5 d-none d-lg-flex flex-column justify-content-center text-white p-5 bg-primary">
            <h2 className="fw-bold mb-3">Join ASO Growth</h2>
            <p className="mb-4 opacity-75">
              Create your account and start growing your app with powerful ASO
              tools, analytics, and expert-driven insights.
            </p>

            <div className="small">
              <div className="mb-3">✔ App Store Optimization Tools</div>
              <div className="mb-3">✔ Real-time Performance Tracking</div>
              <div className="mb-3">✔ Trusted by Growing App Teams</div>
            </div>
          </div>

          {/* Right Side */}
          <div className="col-lg-7 col-12 bg-white">
            <div className="p-4 p-md-5">
              <div className="text-center text-lg-start mb-4">
                <h3 className="fw-bold mb-1">Create Account</h3>
                <p className="text-muted mb-0 small">
                  Fill in your details to get started
                </p>
              </div>

              <form onSubmit={handleSignup}>
                {/* Name */}
                <div className="row">
                  <div className="col-12 col-md-6 mb-3">
                    <div className="form-floating">
                      <input
                        type="text"
                        className="form-control rounded-3"
                        placeholder="First Name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                      />
                      <label>First Name</label>
                    </div>
                  </div>

                  <div className="col-12 col-md-6 mb-3">
                    <div className="form-floating">
                      <input
                        type="text"
                        className="form-control rounded-3"
                        placeholder="Last Name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                      />
                      <label>Last Name</label>
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div className="form-floating mb-3">
                  <input
                    type="email"
                    className="form-control rounded-3"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <label>Email address</label>
                </div>

                {/* Country */}
                <div className="form-floating mb-3">
                  <select
                    className="form-select rounded-3"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    required
                  >
                    <option value="">Select Country</option>
                    <option value="India">India</option>
                    <option value="UAE">UAE</option>
                    <option value="Qatar">Qatar</option>
                  </select>
                  <label>Country</label>
                </div>

                {/* Password */}
                <div className="form-floating mb-3">
                  <input
                    type="password"
                    className="form-control rounded-3"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <label>Password</label>
                </div>

                {/* Terms */}
                <div className="form-check mb-4">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={agree}
                    onChange={(e) => setAgree(e.target.checked)}
                    id="terms"
                  />
                  <label className="form-check-label small text-muted" htmlFor="terms">
                    I agree to{" "}
                    <Link to="/terms" className="text-decoration-none fw-medium">
                      Terms & Conditions
                    </Link>
                  </label>
                </div>

                {/* Button */}
                <button
                  type="submit"
                  className="btn btn-primary w-100 py-3 rounded-3 fw-semibold"
                  disabled={loading}
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </button>
              </form>

              {/* Footer */}
              <p className="text-center mt-4 mb-0 small text-muted">
                Already have an account?{" "}
                <Link to="/login" className="text-decoration-none fw-semibold">
                  Login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;