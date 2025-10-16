"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

export function useSupabaseSession() {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        supabase.auth.getSession().then(({ data }) => {
            if (mounted) {
                setSession(data.session ?? null);
                setLoading(false);
            }
        });

        const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
            setSession(s);
        });

        return () => {
            mounted = false;
            sub.subscription.unsubscribe();
        };
    }, []);

    return { session, user: session?.user ?? null, loading };
}

export function useLogout() {
    const router = useRouter();
    return async () => {
        await supabase.auth.signOut();
        router.replace("/adios?next=/login");
    };
}
