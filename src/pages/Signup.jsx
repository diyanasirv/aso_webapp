import { useState } from "react";
import { supabase } from "../supabaseClient";
import { Link, useNavigate } from "react-router-dom";

function Signup() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSignup(e) {
    e.preventDefault();

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
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
                id="email"
                placeholder="name@example.com"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <label htmlFor="email">Email address</label>
            </div>

            {/* Password */}
            <div className="form-floating mb-4">
              <input
                type="password"
                className="form-control"
                id="password"
                placeholder="Password"
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <label htmlFor="password">Password</label>
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