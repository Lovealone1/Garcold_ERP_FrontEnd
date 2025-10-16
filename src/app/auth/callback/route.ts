import { NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
export async function GET(req: NextRequest) {
    const { searchParams, origin } = new URL(req.url);
    const code = searchParams.get("code");
    const rawNext = searchParams.get("next") ?? "/inicio";

    if (code) {
        const supabase = await supabaseServer();
        await supabase.auth.exchangeCodeForSession(code);
        // Envía a la animación si no te lo pidieron explícito
        const target = rawNext.includes("/bienvenido")
            ? rawNext
            : `/bienvenido?next=${encodeURIComponent(rawNext)}`;
        return Response.redirect(new URL(target, origin));
    }

    const error = searchParams.get("error");
    if (error) return Response.redirect(new URL(`/login?error=${error}`, origin));
    return Response.redirect(new URL(rawNext, origin));
}