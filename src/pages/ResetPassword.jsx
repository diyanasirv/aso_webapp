import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

function ResetPassword() {
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Password updated successfully!");
    navigate("/login");
  };

  return (
    <div className="container mt-5">
      <h2>Create New Password</h2>

      <form onSubmit={handleUpdatePassword}>
        <input
          type="password"
          className="form-control mb-3"
          placeholder="New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button className="btn btn-primary">
          Update Password
        </button>
      </form>
    </div>
  );
}

export default ResetPassword;