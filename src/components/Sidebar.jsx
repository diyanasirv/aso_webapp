import { useNavigate } from "react-router-dom";
import {
  FiHome,
  FiPlusCircle,
  FiList,
  FiUser,
  FiLogOut,
  FiDollarSign,
  FiFileText,
  FiPhone,
  FiPackage,
} from "react-icons/fi";
import { supabase } from "../supabaseClient";

function Sidebar({ profile, active }) {
  const navigate = useNavigate();

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  return (
    <aside className="aso-sidebar">
      <div className="aso-logo" onClick={() => navigate("/dashboard")}>
        <FiPackage />
        <span>ASO Panel</span>
      </div>

      <div className="aso-user" >
        <div className="aso-avatar">
          {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
        </div>
        <div>
          <strong>{profile?.full_name || "User"}</strong>
          <small>{profile?.role || "user"}</small>
        </div>
      </div>

      <nav className="aso-menu">
        <button className={active==="dashboard"?"active":""} onClick={()=>navigate("/dashboard")}>
          <FiHome /> Dashboard
        </button>

        <button className={active==="add-order"?"active":""} onClick={()=>navigate("/add-order")}>
          <FiPlusCircle /> Add Order
        </button>

        <button className={active==="orders"?"active":""} onClick={()=>navigate("/orders")}>
          <FiList /> Orders
        </button>

        <button onClick={()=>navigate("/pricing")}>
          <FiDollarSign /> Pricing
        </button>

        <button className={active==="profile"?"active":""} onClick={()=>navigate("/profile")}>
          <FiUser /> Profile
        </button>

        <button onClick={()=>navigate("/terms")}>
          <FiFileText /> Terms
        </button>

        <button onClick={()=>navigate("/contact")}>
          <FiPhone /> Contact
        </button>

        <button onClick={handleLogout}>
          <FiLogOut /> Logout
        </button>
      </nav>
    </aside>
  );
}

export default Sidebar;