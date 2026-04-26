import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import {
  FiHome,
  FiPlusCircle,
  FiList,
  FiDollarSign,
  FiUser,
  FiFileText,
  FiPhone,
  FiLogOut,
  FiMenu,
  FiX,
} from "react-icons/fi";

function Sidebar() {
  const navigate = useNavigate();
  const [showSidebar, setShowSidebar] = useState(false);

  async function logout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  function closeSidebar() {
    setShowSidebar(false);
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="btn btn-light shadow-sm mobile-menu-btn d-md-none"
        onClick={() => setShowSidebar(true)}
      >
        <FiMenu size={22} />
      </button>

      {/* Overlay */}
      {showSidebar && (
        <div
          className="sidebar-overlay d-md-none"
          onClick={closeSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <div className={`user-sidebar ${showSidebar ? "show" : ""}`}>
        <div className="d-flex justify-content-between align-items-center mb-4 d-md-none">
          <h5 className="mb-0">Menu</h5>
          <button className="btn btn-sm" onClick={closeSidebar}>
            <FiX size={22} />
          </button>
        </div>

        <div className="user-box mb-4">
          <div className="avatar">U</div>
          <div>
            <h6 className="mb-0">User</h6>
            <small className="text-muted">user</small>
          </div>
        </div>

        <nav className="sidebar-nav">
          <Link to="/dashboard" onClick={closeSidebar}>
            <FiHome /> Dashboard
          </Link>

          <Link to="/add-order" onClick={closeSidebar}>
            <FiPlusCircle /> Add Order
          </Link>

          <Link to="/orders" onClick={closeSidebar}>
            <FiList /> Orders
          </Link>

          <Link to="/pricing" onClick={closeSidebar}>
            <FiDollarSign /> Pricing
          </Link>

          <Link to="/profile" onClick={closeSidebar}>
            <FiUser /> Profile
          </Link>

          <Link to="/terms" onClick={closeSidebar}>
            <FiFileText /> Terms
          </Link>

          <Link to="/contact" onClick={closeSidebar}>
            <FiPhone /> Contact
          </Link>

          <button onClick={logout}>
            <FiLogOut /> Logout
          </button>
        </nav>
      </div>
    </>
  );
}

export default Sidebar;