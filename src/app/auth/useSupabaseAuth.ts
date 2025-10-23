"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

export function useSupabaseSession() {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let alive = true;

        supabase().auth.getSession().then(({ data }) => {
            if (!alive) return;
            setSession(data.session ?? null);
            setLoading(false);
        });

        const { data: { subscription } } = supabase().auth.onAuthStateChange((_e, s) => {
            if (!alive) return;
            setSession(s);
            setLoading(false);
        });

        return () => {
            alive = false;
            subscription?.unsubscribe();
        };
    }, []);

    const user: User | null = session?.user ?? null;
    return { session, user, loading };
}

export function useLogout() {
    const router = useRouter();
    return async () => {
        await supabase().auth.signOut();
        router.replace("/adios?next=/login");
    };
}
