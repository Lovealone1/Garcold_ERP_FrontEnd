import { useState, useEffect, useLayoutEffect } from "react";

// useLayoutEffect avisa por consola cuando se ejecuta en el servidor; en SSR
// no hay layout que medir, así que allí basta con useEffect.
const useIsomorphicLayoutEffect =
    typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function useMediaQuery(query: string) {
    const [match, setMatch] = useState<boolean>(() =>
        typeof window !== "undefined" ? window.matchMedia(query).matches : false
    );

    useIsomorphicLayoutEffect(() => {
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
