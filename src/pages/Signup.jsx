import { useState } from "react";
import { supabase } from "../supabaseClient";
import { Link, useNavigate } from "react-router-dom";

function Signup() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);

  async function handleSignup(e) {
    e.preventDefault();

    if (!agree) {
      alert("Please agree to Terms & Conditions");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    // 🔥 Check if user already exists
    if (data?.user?.identities?.length === 0) {
      alert("User already exists. Please login.");
      navigate("/login");
      return;
    }

    alert("Signup successful. Please login.");
    navigate("/login");
  }

  return (
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center bg-light">
      
      <div className="card shadow-lg border-0" style={{ width: "100%", maxWidth: "400px" }}>
        <div className="card-body p-4">

          <h3 className="text-center mb-4 fw-semibold">Sign Up</h3>

          <form onSubmit={handleSignup}>
            
            {/* Email */}
            <div className="form-floating mb-3">
              <input
                type="email"
                className="form-control"
                placeholder="Email"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <label>Email address</label>
            </div>

            {/* Password */}
            <div className="form-floating mb-3">
              <input
                type="password"
                className="form-control"
                placeholder="Password"
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <label>Password</label>
            </div>

            {/* Terms checkbox */}
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

            <button className="btn btn-primary w-100 py-2 mb-3">
              Create Account
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