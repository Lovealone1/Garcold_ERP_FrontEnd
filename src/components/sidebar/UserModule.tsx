"use client";

import Link from "next/link";
import { useState } from "react";
import { MaterialIcon } from "@/components/ui/material-icon";
import ThemeToggle from "./ThemeToggle";

const ACCENT = (pct = 14) =>
    `color-mix(in srgb, var(--tg-primary) ${pct}%, transparent)`;

export default function UserModule({
    expanded,
    isDark,
    onToggle,
    configHref = "/settings/perfil",
    supportHref = "/soporte",
    accentPct = 14, // ← controla la intensidad del hover
}: {
    expanded: boolean;
    isDark: boolean;
    onToggle: () => void;
    configHref?: string;
    supportHref?: string;
    accentPct?: number;
}) {
    // Mini helper para aplicar bg en hover sin tocar el estado base
    function HoverLink({
        href,
        children,
        className = "",
    }: {
        href: string;
        children: React.ReactNode;
        className?: string;
    }) {
        const [hovered, setHovered] = useState(false);
        return (
            <Link
                href={href}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                className={`rounded-md transition ${className}`}
                style={hovered ? { background: ACCENT(accentPct) } : undefined}
            >
                {children}
            </Link>
        );
    }

    function HoverIconButton({
        href,
        label,
        children,
        className = "",
    }: {
        href: string;
        label: string;
        children: React.ReactNode;
        className?: string;
    }) {
        const [hovered, setHovered] = useState(false);
        return (
            <Link
                href={href}
                aria-label={label}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                className={`h-10 w-10 inline-flex items-center justify-center rounded-md transition ${className}`}
                style={hovered ? { background: ACCENT(accentPct) } : undefined}
            >
                {children}
            </Link>
        );
    }

    return (
        <div className="mt-auto">
            {/* divisor superior */}
            <div className="h-px w-full mb-4" style={{ background: "var(--tg-border)" }} />

            {/* Acciones */}
            {expanded ? (
                <ul className="px-1 space-y-2">
                    <li>
                        <HoverLink href={configHref} className="flex items-center gap-3 px-2 py-2">
                            <MaterialIcon name="settings" size={20} className="text-tg-muted" />
                            <span className="text-sm text-tg-fg">Configuración</span>
                        </HoverLink>
                    </li>
                    <li>
                        <HoverLink href={supportHref} className="flex items-center gap-3 px-2 py-2">
                            <MaterialIcon name="headset_mic" size={20} className="text-tg-muted" />
                            <span className="text-sm text-tg-fg">Soporte</span>
                        </HoverLink>
                    </li>
                </ul>
            ) : (
                <div className="px-2 flex flex-col items-center gap-2">
                    <HoverIconButton href={configHref} label="Configuración">
                        <MaterialIcon name="settings" size={20} className="text-tg-muted" />
                    </HoverIconButton>
                    <HoverIconButton href={supportHref} label="Soporte">
                        <MaterialIcon name="headset_mic" size={20} className="text-tg-muted" />
                    </HoverIconButton>
                </div>
            )}

            {/* Toggle centrado con margen antes de la UserTile */}
            <div className="mt-4 mb-4 px-2 flex items-center justify-center">
                <ThemeToggle expanded={expanded} isDark={isDark} onToggle={onToggle} />
            </div>
        </div>
    );
}
