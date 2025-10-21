"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavSection } from "@/types/navigation";
import { SettingsSections } from "./buildSettingsNav";
import { defaultSettingsRegistry } from "./registry.default";
import { MaterialIcon } from "@/components/ui/material-icon";

export function SettingsNav({
    sections,
    permissions = [],
}: {
    sections?: NavSection[];       
    permissions?: string[];         
}) {
    const pathname = usePathname();

    const computed: NavSection[] = useMemo(
        () => sections ?? SettingsSections(defaultSettingsRegistry, permissions),
        [sections, permissions]
    );

    return (
        <aside className="w-72">
            {computed.map((sec) => (
                <div key={sec.title} className="mb-4 rounded-xl border border-tg bg-tg-card text-tg-card">
                    <div className="px-3 py-2 text-xs font-semibold text-tg-muted uppercase tracking-wide">
                        {sec.title}
                    </div>
                    <nav className="px-2 py-1">
                        {sec.items.map((it) => {
                            const active = pathname?.startsWith(it.href);
                            return (
                                <Link
                                    key={it.href}
                                    href={it.href}
                                    className={[
                                        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                                        active
                                            ? "bg-[color-mix(in_srgb,var(--tg-primary)_18%,transparent)] text-tg-primary"
                                            : "hover:bg-[color-mix(in_srgb,var(--tg-muted)_10%,transparent)]",
                                    ].join(" ")}
                                >
                                    {it.iconName ? (
                                        <MaterialIcon name={it.iconName} set={it.iconSet ?? "rounded"} className="text-base" />
                                    ) : null}
                                    <span className="truncate">{it.name}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            ))}
        </aside>
    );
}
