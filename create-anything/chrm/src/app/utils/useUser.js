// src/app/utils/useUser.js
import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";

const useUser = () => {
  const { data: session, status } = useSession();
  const id = session?.user?.id;

  const [user, setUser] = useState(session?.user ?? null);

  const fetchUser = useCallback(async () => {
    return session?.user;
  }, [session]);

  const refetchUser = useCallback(() => {
    if (process.env.NEXT_PUBLIC_CREATE_ENV === "PRODUCTION") {
      if (id) {
        fetchUser().then(setUser);
      } else {
        setUser(null);
      }
    }
  }, [fetchUser, id]);

  useEffect(() => {
    refetchUser();
  }, [refetchUser]);

  if (process.env.NEXT_PUBLIC_CREATE_ENV !== "PRODUCTION") {
    return { 
      user, 
      data: session?.user || null, 
      loading: status === "loading", 
      refetch: refetchUser 
    };
  }
  
  return { 
    user, 
    data: user, 
    loading: status === "loading" || (status === "authenticated" && !user), 
    refetch: refetchUser 
  };
};

export { useUser };
export default useUser;