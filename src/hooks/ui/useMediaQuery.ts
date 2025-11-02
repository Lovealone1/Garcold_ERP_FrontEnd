import { useState, useLayoutEffect } from "react";

export function useMediaQuery(query: string) {
    const [match, setMatch] = useState<boolean>(() =>
        typeof window !== "undefined" ? window.matchMedia(query).matches : false
    );

    useLayoutEffect(() => {
        if (typeof window === "undefined") return;
        const mql = window.matchMedia(query);
        const handler = () => setMatch(mql.matches);
        // compat
        if (mql.addEventListener) mql.addEventListener("change", handler);
        else (mql as any).addListener?.(handler);
        handler(); // sync
        return () => {
            if (mql.removeEventListener) mql.removeEventListener("change", handler);
            else (mql as any).removeListener?.(handler);
        };
    }, [query]);

    return match;
}
