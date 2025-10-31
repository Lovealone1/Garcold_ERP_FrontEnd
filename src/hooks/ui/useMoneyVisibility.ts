"use client";
import { useCallback, useEffect, useState } from "react";

const KEY = "tg-hide-balance";

export function useMoneyVisibility() {
    const [hidden, setHidden] = useState<boolean>(() => {
        if (typeof window === "undefined") return false;
        return window.localStorage.getItem(KEY) === "1";
    });
    useEffect(() => {
        if (typeof window !== "undefined") {
            window.localStorage.setItem(KEY, hidden ? "1" : "0");
        }
    }, [hidden]);

    const toggle = useCallback(() => setHidden(h => !h), []);
    return { hidden, toggle };
}
