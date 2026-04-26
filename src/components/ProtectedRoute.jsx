import { Navigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useEffect, useState } from "react";

function ProtectedRoute({ children, requireProfile = false }) {
  const [loading, setLoading] = useState(true);
  const [redirect, setRedirect] = useState(null);

  useEffect(() => {
    checkAccess();
  }, []);

  async function checkAccess() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setRedirect("/login");
      setLoading(false);
      return;
    }

    if (requireProfile) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_profile_complete")
        .eq("id", user.id)
        .single();

      if (!profile?.is_profile_complete) {
        setRedirect("/profile");
        setLoading(false);
        return;
      }
    }

    setLoading(false);
  }

  if (loading) {
    return <p className="text-center mt-5">Loading...</p>;
  }

  if (redirect) {
    return <Navigate to={redirect} />;
  }

  return children;
}

export default ProtectedRoute;