import { useState } from "react";
import { supabase } from "../supabaseClient";
import { Link, useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();

    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      setLoading(false);
      alert(error.message);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    setLoading(false);

    if (profileError) {
      console.error("Profile fetch error:", profileError.message);
      alert("Profile not found. Please contact admin.");
      await supabase.auth.signOut();
      navigate("/login");
      return;
    }

    if (profile?.role?.trim().toLowerCase() === "admin") {
      navigate("/admin");
    } else {
      navigate("/dashboard");
    }
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
            <h2 className="fw-bold mb-3">Welcome Back</h2>
            <p className="mb-4 opacity-75">
              Log in to access your ASO dashboard, track app performance, manage
              campaigns, and monitor growth insights.
            </p>

            <div className="small">
              <div className="mb-3">✔ Track App Rankings</div>
              <div className="mb-3">✔ Manage Orders & Campaigns</div>
              <div className="mb-3">✔ Access Powerful Growth Tools</div>
            </div>
          </div>

          {/* Right Side */}
          <div className="col-lg-7 col-12 bg-white">
            <div className="p-4 p-md-5">
              <div className="text-center text-lg-start mb-4">
                <h3 className="fw-bold mb-1">Login</h3>
                <p className="text-muted mb-0 small">
                  Enter your credentials to continue
                </p>
              </div>

              <form onSubmit={handleLogin}>
                {/* Email */}
                <div className="form-floating mb-3">
                  <input
                    type="email"
                    className="form-control rounded-3"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                  <label>Email address</label>
                </div>

                {/* Password */}
                <div className="form-floating mb-3">
                  <input
                    type="password"
                    className="form-control rounded-3"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <label>Password</label>
                </div>

                {/* Extra Links */}
                <div className="d-flex justify-content-between align-items-center mb-4 small">
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" id="remember" />
                    <label className="form-check-label text-muted" htmlFor="remember">
                      Remember me
                    </label>
                  </div>

                  <Link to="/forgot-password" className="text-decoration-none fw-medium">
                    Forgot Password?
                  </Link>
                </div>

                {/* Button */}
                <button
                  type="submit"
                  className="btn btn-primary w-100 py-3 rounded-3 fw-semibold"
                  disabled={loading}
                >
                  {loading ? "Logging in..." : "Login"}
                </button>
              </form>

              {/* Footer */}
              <p className="text-center mt-4 mb-0 small text-muted">
                Don’t have an account?{" "}
                <Link to="/signup" className="text-decoration-none fw-semibold">
                  Signup
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;