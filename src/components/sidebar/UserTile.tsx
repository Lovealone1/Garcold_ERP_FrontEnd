// components/sidebar/UserTile.tsx
"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase/client";
import { useLogout } from "@/app/auth/useSupabaseAuth";

type Props = { collapsed?: boolean; className?: string; tintPercent?: number };

const ACCENT = (pct = 14) =>
    `color-mix(in srgb, var(--tg-primary) ${pct}%, transparent)`;

/* ---------- Popover ---------- */
function MenuPopover({
    open, anchorEl, onClose,
}: { open: boolean; anchorEl: HTMLElement | null; onClose: () => void }) {
    const ref = useRef<HTMLDivElement>(null);
    const [pos, setPos] = useState({ top: 0, left: 0 });

    const recalc = () => {
        if (!anchorEl || !ref.current) return;
        const r = anchorEl.getBoundingClientRect();
        const mw = ref.current.offsetWidth || 260;
        const mh = ref.current.offsetHeight || 120;
        const pad = 12;
        const left = Math.min(r.right + pad, window.innerWidth - mw - 8);
        const top = Math.min(r.top, window.innerHeight - mh - 8);
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

    useEffect(() => {
        if (!open) return;
        const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) onClose(); };
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("pointerdown", onDown);
        window.addEventListener("keydown", onKey);
        return () => {
            window.removeEventListener("pointerdown", onDown);
            window.removeEventListener("keydown", onKey);
        };
    }, [open, onClose]);

    if (!open) return null;

    return createPortal(
        <div
            ref={ref}
            role="menu"
            className="rounded-xl border p-1 text-sm z-[60] shadow-xl"
            style={{
                position: "fixed",
                top: pos.top,
                left: pos.left,
                minWidth: 240,
                borderColor: "var(--tg-border)",
                background: "var(--tg-card-bg)",
            }}
            onMouseLeave={onClose}
        >
            <ul className="py-1">
                <li>
                    <Link
                        href="/perfil"
                        role="menuitem"
                        className="flex items-center gap-3 px-3 py-2 rounded-md transition"
                        onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT(14))}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                        onClick={onClose}
                    >
                        <span className="material-symbols-rounded text-[18px] text-tg-muted">account_circle</span>
                        <span className="text-tg-fg">Mi perfil</span>
                    </Link>
                </li>
                <li>
                    <Link
                        href="/perfil/editar"
                        role="menuitem"
                        className="flex items-center gap-3 px-3 py-2 rounded-md transition"
                        onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT(14))}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                        onClick={onClose}
                    >
                        <span className="material-symbols-rounded text-[18px] text-tg-muted">edit</span>
                        <span className="text-tg-fg">Editar perfil</span>
                    </Link>
                </li>
            </ul>
        </div>,
        document.body
    );
}

/* ------------------------------- UserTile ------------------------------- */
export default function UserTile({ collapsed, className = "", tintPercent = 2 }: Props) {
    const logout = useLogout();

    const [loading, setLoading] = useState(true);
    const [name, setName] = useState<string>("Usuario");
    const [email, setEmail] = useState<string | null>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    const [menuOpen, setMenuOpen] = useState(false);
    const anchorRef = useRef<HTMLDivElement>(null);
    const [logoutHover, setLogoutHover] = useState(false);

    // flag para animar la card cuando pasamos de colapsado → expandido
    const [justExpanded, setJustExpanded] = useState(false);
    useEffect(() => {
        if (!collapsed) {
            setJustExpanded(true);
            const t = setTimeout(() => setJustExpanded(false), 180);
            return () => clearTimeout(t);
        }
    }, [collapsed]);

    useEffect(() => { if (collapsed) setMenuOpen(false); }, [collapsed]);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                const { data } = await supabase.auth.getUser();
                const u = data.user;
                if (!mounted) return;
                if (u) {
                    const md = u.user_metadata ?? {};
                    setName(md.full_name || md.name || u.email?.split("@")[0] || "Usuario");
                    setEmail(u.email ?? null);
                    setAvatarUrl(md.avatar_url ?? null);
                } else {
                    setName("Usuario"); setEmail(null); setAvatarUrl(null);
                }
            } finally { if (mounted) setLoading(false); }
        };
        load();
        const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
            const u = session?.user;
            const md = u?.user_metadata ?? {};
            setName(u ? md.full_name || md.name || u.email?.split("@")[0] || "Usuario" : "Usuario");
            setEmail(u?.email ?? null);
            setAvatarUrl(u ? md.avatar_url ?? null : null);
        });
        return () => { mounted = false; sub?.subscription?.unsubscribe(); };
    }, []);

    const initial = (name || email || "U").slice(0, 1).toUpperCase();

    const Avatar = avatarUrl ? (
        <img
            src={avatarUrl}
            alt="avatar"
            className="h-10 w-10 rounded-full object-cover"
            style={{ boxShadow: "0 0 0 2px var(--tg-primary)" }}
        />
    ) : (
        <span className="grid place-items-center h-10 w-10 rounded-full bg-[var(--tg-primary)] text-[var(--tg-primary-fg)] text-sm">
            {initial}
        </span>
    );

    const cardStyle = {
        background: `color-mix(in srgb, var(--tg-primary) ${tintPercent}%, var(--tg-card-bg))`,
        borderColor: `color-mix(in srgb, var(--tg-primary) 40%, var(--tg-border))`,
    } as const;

    /* ---------- Colapsado: SOLO avatar, sin card visible ---------- */
    if (collapsed) {
        return (
            <div ref={anchorRef} className={`relative flex items-center justify-center ${className}`}>
                <button
                    type="button"
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen((v) => !v)}
                    className="rounded-full"
                    title="Abrir menú de usuario"
                >
                    {Avatar}
                </button>

                <MenuPopover open={menuOpen} onClose={() => setMenuOpen(false)} anchorEl={anchorRef.current} />
            </div>
        );
    }

    /* ---------- Expandido: CARD rectangular con animación suave ---------- */
    return (
        <div ref={anchorRef} className={className}>
            <div
                className={`rounded-xl border p-3 cursor-pointer transition-[opacity,transform] duration-200 ease-out ${justExpanded ? "opacity-0 translate-x-2" : "opacity-100 translate-x-0"
                    }`}
                style={cardStyle}
                onClick={() => setMenuOpen((v) => !v)}
                aria-busy={loading}
            >
                <div className="flex items-center gap-3">
                    {Avatar}

                    <div className="min-w-0">
                        <div className="text-sm font-semibold text-tg-fg truncate">
                            {loading ? "Cargando…" : name}
                        </div>
                        <div className="text-xs text-tg-muted truncate">
                            {loading ? " " : email ?? "—"}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); logout(); }}
                        onMouseEnter={() => setLogoutHover(true)}
                        onMouseLeave={() => setLogoutHover(false)}
                        title="Cerrar sesión"
                        aria-label="Cerrar sesión"
                        className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-md focus:outline-none focus:ring-2"
                        style={{
                            color: "var(--tg-fg)",
                            background: logoutHover ? "var(--tg-primary)" : "transparent",
                            boxShadow: logoutHover ? "0 0 0 1px var(--tg-primary)" : undefined,
                        }}
                    >
                        <span className="material-symbols-rounded text-[18px] leading-none">logout</span>
                    </button>
                </div>
            </div>

            <MenuPopover open={menuOpen} onClose={() => setMenuOpen(false)} anchorEl={anchorRef.current} />
        </div>
    );
}
