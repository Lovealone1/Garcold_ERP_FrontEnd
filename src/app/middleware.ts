import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest) {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req, res });
    const { data: { session } } = await supabase.auth.getSession();

    const { pathname } = req.nextUrl;
    const isAuthPath = pathname.startsWith("/login") || pathname.startsWith("/auth/");

    // si NO hay sesión y no estás en páginas públicas → /login
    if (!session && !isAuthPath) {
        const url = req.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
    }

    // si hay sesión e intentas ir a /login → /dashboard
    if (session && pathname === "/login") {
        const url = req.nextUrl.clone();
        url.pathname = "/inicio";
        return NextResponse.redirect(url);
    }

    return res;
}

export const config = {
    // excluye archivos estáticos y next internals
    matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api)(.*)"],
};
