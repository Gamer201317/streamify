import { useState, useCallback } from "react";

// Demo user for testing without Clerk authentication
const DEMO_USER = {
  id: "demo-user-1",
  email: "demo@streamify.app",
  user_metadata: {
    full_name: "Demo User",
    display_name: "Demo",
  },
};

export const useAuth = () => {
  const [isSignedIn, setIsSignedIn] = useState(true);

  const signOut = useCallback(() => {
    setIsSignedIn(false);
    // In demo mode, just reload to show landing page
    window.location.href = "/";
  }, []);

  return {
    user: isSignedIn ? DEMO_USER : null,
    loading: false,
    signOut,
  };
};
