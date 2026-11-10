"use client";

import { useCallback, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/auth/client";

export type CurrentUser = {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  role: string | null;
};

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      if (!response.ok) {
        setUser(null);
        return;
      }
      const data = (await response.json()) as CurrentUser;
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  useEffect(() => {
    try {
      const supabase = createSupabaseBrowserClient();
      const { data } = supabase.auth.onAuthStateChange(() => {
        void refresh();
      });
      return () => data.subscription.unsubscribe();
    } catch {
      return;
    }
  }, [refresh]);

  return { user, loading, refresh };
}