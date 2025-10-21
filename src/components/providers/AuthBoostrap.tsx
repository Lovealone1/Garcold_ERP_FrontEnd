"use client";
import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { syncSelf } from "@/services/auth.api";

export default function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const started = useRef(false);
  const done = useRef(false);
  const inflight = useRef<Promise<any> | null>(null);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const run = async () => {
      if (done.current || inflight.current) return;
      const { data: { session } } = await supabase().auth.getSession();
      const s = session;
      if (!s?.access_token) return; 
      const md = s.user?.user_metadata || {};
      const p = syncSelf({
        email: s.user?.email ?? undefined,
        display_name: md.full_name || md.name || undefined,
        avatar_url: md.avatar_url || undefined,
      }).finally(() => { inflight.current = null; });
      inflight.current = p;
      const res = await p;
      if (res) done.current = true;
    };

    run();

    const { data: { subscription } } = supabase().auth.onAuthStateChange(() => {
      run();
    });

    return () => subscription.unsubscribe();
  }, []);

  return <>{children}</>;
}
