import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
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
  const location = useLocation();

  const [showSidebar, setShowSidebar] = useState(false);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("full_name, email, role, is_profile_complete")
      .eq("id", user.id)
      .single();

    setProfile(data);
  }

  async function logout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  function closeSidebar() {
    setShowSidebar(false);
  }

  function isActive(path) {
    return location.pathname === path ? "active" : "";
  }

  const displayName =
    profile?.full_name && profile?.is_profile_complete
      ? profile.full_name
      : profile?.email?.slice(0, 4)?.toUpperCase() || "USER";

  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <>
      {!showSidebar && (
        <button
          className="btn btn-light shadow-sm mobile-menu-btn d-md-none"
          onClick={() => setShowSidebar(true)}
        >
          <FiMenu size={22} />
        </button>
      )}

      {showSidebar && (
        <div
          className="sidebar-overlay d-md-none"
          onClick={closeSidebar}
        ></div>
      )}

      <div className={`user-sidebar ${showSidebar ? "show" : ""}`}>
        <div className="d-flex justify-content-between align-items-center mb-4 d-md-none">
          <h5 className="mb-0">Menu</h5>

          <button className="btn btn-sm btn-light" onClick={closeSidebar}>
            <FiX size={22} />
          </button>
        </div>

        <div className="user-box mb-4" onClick={() => navigate("/profile")}>
          <div className="avatar">{avatarLetter}</div>

          <div className="user-info">
            <h6 className="mb-0 text-truncate">{displayName}</h6>
            <small className="text-muted">
              {profile?.is_profile_complete
                ? profile?.role || "user"
                : "Incomplete Profile"}
            </small>
          </div>
        </div>

        <nav className="sidebar-nav">
          <Link
            className={isActive("/dashboard")}
            to="/dashboard"
            onClick={closeSidebar}
          >
            <FiHome /> Dashboard
          </Link>

          <Link
            className={isActive("/add-order")}
            to="/add-order"
            onClick={closeSidebar}
          >
            <FiPlusCircle /> Add Order
          </Link>

          <Link
            className={isActive("/orders")}
            to="/orders"
            onClick={closeSidebar}
          >
            <FiList /> Orders
          </Link>

          <Link
            className={isActive("/pricing")}
            to="/pricing"
            onClick={closeSidebar}
          >
            <FiDollarSign /> Pricing
          </Link>

        

          <Link
            className={isActive("/terms")}
            to="/terms"
            onClick={closeSidebar}
          >
            <FiFileText /> Terms
          </Link>

          <Link
            className={isActive("/contact")}
            to="/contact"
            onClick={closeSidebar}
          >
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