import { useUser, useClerk } from "@clerk/react";

export const useAuth = () => {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  return {
    user: isLoaded && user ? {
      id: user.id,
      email: user.primaryEmailAddress?.emailAddress ?? "",
      user_metadata: {
        full_name: user.fullName ?? user.username ?? "",
        display_name: user.username ?? user.firstName ?? "",
      },
    } : null,
    loading: !isLoaded,
    signOut: () => signOut(),
  };
};
