"use client";
import { useEffect, useState } from "react";

let ver = 0;
const subs = new Set<(v: number) => void>();

export function bumpRtVersion(): void {
    ver += 1;
    subs.forEach(fn => {
        try { fn(ver); } catch { /* noop */ }
    });
}

export function useRtVersion(): number {
    const [v, setV] = useState(ver);

    useEffect(() => {
        const fn = (nv: number) => setV(nv);
        subs.add(fn);
        return () => { subs.delete(fn); };   
    }, []);

    return v;
}
