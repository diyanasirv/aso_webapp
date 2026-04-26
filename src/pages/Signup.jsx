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

    const { data, error } = await supabase.auth.signUp({
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
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="card shadow-lg border-0" style={{ width: "100%", maxWidth: "450px" }}>
        <div className="card-body p-4">

          <h3 className="text-center mb-4 fw-semibold">Sign Up</h3>

          <form onSubmit={handleSignup}>

            {/* Name */}
            <div className="row">
              <div className="col-md-6 mb-3">
                <div className="form-floating">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="First Name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                  <label>First Name</label>
                </div>
              </div>

              <div className="col-md-6 mb-3">
                <div className="form-floating">
                  <input
                    type="text"
                    className="form-control"
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
                className="form-control"
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
                className="form-select"
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
                className="form-control"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <label>Password</label>
            </div>

            {/* Terms */}
            <div className="form-check mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                id="terms"
              />
              <label className="form-check-label small" htmlFor="terms">
                I agree to{" "}
                <Link to="/terms" className="text-decoration-none">
                  Terms & Conditions
                </Link>
              </label>
            </div>

            <button
              className="btn btn-primary w-100 py-2 mb-3"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Account"}
            </button>

          </form>

          <p className="text-center mb-0 small">
            Already have an account?{" "}
            <Link to="/login" className="text-decoration-none">
              Login
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}

export default Signup;