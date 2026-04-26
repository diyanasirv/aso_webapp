import { Navigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useEffect, useState } from "react";

function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    checkAccess();
  }, []);

  async function checkAccess() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setIsAllowed(false);
      setLoading(false);
      return;
    }

    setIsAllowed(true);
    setLoading(false);
  }

  if (loading) {
    return <p className="text-center mt-5">Loading...</p>;
  }

  if (!isAllowed) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;