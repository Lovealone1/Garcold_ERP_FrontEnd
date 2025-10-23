"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";


export default function UserMenu({
    open,
    onClose,
    anchorEl,
    accentPct = 14,
}: {
    open: boolean;
    onClose: () => void;
    anchorEl: HTMLElement | null; 
    accentPct?: number;
}) {
    const menuRef = useRef<HTMLDivElement>(null);
    const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

    useEffect(() => {
        if (!open) return;
        const onDown = (e: MouseEvent) => {
            if (menuRef.current?.contains(e.target as Node)) return;
            onClose();
        };
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("pointerdown", onDown);
        window.addEventListener("keydown", onKey);
        return () => {
            window.removeEventListener("pointerdown", onDown);
            window.removeEventListener("keydown", onKey);
        };
    }, [open, onClose]);

    const recalc = () => {
        if (!anchorEl || !menuRef.current) return;
        const r = anchorEl.getBoundingClientRect();
        const mw = menuRef.current.offsetWidth || 260;
        const mh = menuRef.current.offsetHeight || 100;
        const pad = 12;

        let left = r.right + pad;
        let top = r.top; 

        left = Math.min(left, window.innerWidth - mw - 8);
        top = Math.min(top, window.innerHeight - mh - 8);

        setPos({ top, left });
    };

    useLayoutEffect(() => {
        if (!open) return;
        recalc();
        const onWin = () => recalc();
        window.addEventListener("resize", onWin);
        window.addEventListener("scroll", onWin, true);
        return () => {
            window.removeEventListener("resize", onWin);
            window.removeEventListener("scroll", onWin, true);
        };
    }, [open, anchorEl]);

    if (!open) return null;

    const menu = (
        <div
            ref={menuRef}
            role="menu"
            className="rounded-xl border p-1 text-sm z-[60] shadow-xl"
            style={{
                position: "fixed",
                top: pos.top,
                left: pos.left,
                borderColor: "var(--tg-border)",
                background: "var(--tg-card-bg)",
                minWidth: 240,
            }}
        >
            <ul className="py-1">
                <li>
                    <Link
                        href="/perfil"
                        role="menuitem"
                        onClick={onClose}
                        className="flex items-center gap-3 px-3 py-2 rounded-md transition"
                        onMouseEnter={(e) => (e.currentTarget.style.background )}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                    >
                        <span className="material-symbols-rounded text-[18px] text-tg-muted">account_circle</span>
                        <span className="text-tg-fg">Mi perfil</span>
                    </Link>
                </li>
                <li>
                    <Link
                        href="/perfil/editar"
                        role="menuitem"
                        onClick={onClose}
                        className="flex items-center gap-3 px-3 py-2 rounded-md transition"
                        onMouseEnter={(e) => (e.currentTarget.style.background)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                    >
                        <span className="material-symbols-rounded text-[18px] text-tg-muted">edit</span>
                        <span className="text-tg-fg">Editar perfil</span>
                    </Link>
                </li>
            </ul>
        </div>
    );

    return createPortal(menu, document.body);
}
