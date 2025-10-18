import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function supabaseServer() {
    const jar = await cookies(); 
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return jar.getAll();
                },
                setAll(cs) {
                    try {
                        cs.forEach(({ name, value, options }) => jar.set(name, value, options));
                    } catch { /* en RSC puro puede no permitir set */ }
                },
            },
        }
    ) as SupabaseClient;
}
