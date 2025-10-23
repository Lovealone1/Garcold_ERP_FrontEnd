import { supabase } from "./supabase/client";

type Opts = RequestInit & {
    requireAuth?: boolean;  
    retryOn401?: boolean;   
};

export async function authFetch(input: RequestInfo | URL, init: Opts = {}) {
    const { requireAuth = false, retryOn401 = true, ...rest } = init;

    const { data } = await supabase().auth.getSession();
    const token = data.session?.access_token;

    if (requireAuth && !token) throw new Error("No hay sesión");

    const headers = new Headers(rest.headers || {});
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const res = await fetch(input, { ...rest, headers });

    if (retryOn401 && res.status === 401) {
        const { data: r } = await supabase().auth.refreshSession();
        const fresh = r.session?.access_token;
        if (fresh) {
            headers.set("Authorization", `Bearer ${fresh}`);
            return fetch(input, { ...rest, headers });
        }
    }

    return res;
}

export async function authFetchJSON<T = unknown>(
    input: RequestInfo | URL,
    body?: unknown,
    init: Opts = {}
): Promise<T> {
    const headers = new Headers(init.headers || {});
    headers.set("Content-Type", "application/json");
    const res = await authFetch(input, {
        ...init,
        headers,
        method: init.method ?? (body ? "POST" : "GET"),
        body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(await safeText(res));
    return res.json() as Promise<T>;
}

async function safeText(r: Response) {
    try { return await r.text(); } catch { return `${r.status} ${r.statusText}`; }
}
