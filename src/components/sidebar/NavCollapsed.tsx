"use client";
import Link from "next/link";
import { MaterialIcon } from "@/components/ui/material-icon";
import type { NavSection } from "@/types/navigation";
import * as React from "react";

export default function SidebarNavCollapsed({
    sections,
    pathname,
}: {
    sections: NavSection[];
    pathname: string | null;
}) {
    const bg = (pct: number) =>
        `color-mix(in srgb, var(--tg-primary) ${pct}%, transparent)`;

    return (
        <nav className="flex-1 overflow-y-auto">
            <ul className="mt-2 flex flex-col items-center gap-6">
                {sections.map((section) => {
                    const href = section.items[0]?.href || "#";
                    const active = pathname?.startsWith(href);

                    return (
                        <li key={section.title}>
                            <Link
                                href={href}
                                aria-label={section.title}
                                className="flex h-10 w-10 items-center justify-center rounded-xl transition"
                                style={{
                                    background: active ? bg(18) : "",
                                    color: active ? "var(--tg-primary)" : "var(--tg-muted)",
                                }}
                                onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
                                    e.currentTarget.style.background = bg(12);
                                    e.currentTarget.style.color = "var(--tg-primary)";
                                }}
                                onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
                                    e.currentTarget.style.background = active ? bg(18) : "";
                                    e.currentTarget.style.color = active
                                        ? "var(--tg-primary)"
                                        : "var(--tg-muted)";
                                }}
                            >
                                {section.iconName ? (
                                    <MaterialIcon
                                        name={section.iconName}
                                        set={section.iconSet}
                                        size={24}
                                        className="text-inherit"
                                    />
                                ) : (
                                    <span
                                        className="text-inherit"
                                        dangerouslySetInnerHTML={{ __html: section.icon as string }}
                                    />
                                )}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
