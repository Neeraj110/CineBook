"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { fetchClient } from "@/lib/api/client";

export function AuthInit() {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    async function initAuth() {
      try {
        const data = await fetchClient("/auth/me");
        if (data?.user) {
          setUser(data.user);
        }
      } catch (err) {
        // If 401, they are not logged in.
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, [setUser, setLoading]);

  return null;
}

