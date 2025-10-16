"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { navSections } from "@/lib/navigation";

type IconSet = "rounded" | "outlined" | "sharp";
type NavMeta = { name?: string; iconName?: string; iconSet?: IconSet };
type Crumb = { href: string; label: string; iconName?: string; iconSet?: IconSet };

function prettify(seg: string) {
    return seg.replace(/[-_]/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function buildHrefIndex() {
    const map = new Map<string, NavMeta>();
    for (const s of navSections) {
        for (const it of s.items ?? []) {
            map.set(it.href, {
                name: it.name,
                iconName: it.iconName,
                iconSet: (it as any).iconSet ?? "rounded",
            });
        }
    }
    return map;
}

const hrefIndex = buildHrefIndex();

function iconFor(href?: string, active = false) {
    if (!href) return null;
    const meta = hrefIndex.get(href);
    if (!meta?.iconName) return null;
    const setClass =
        meta.iconSet === "outlined"
            ? "material-symbols-outlined"
            : meta.iconSet === "sharp"
                ? "material-symbols-sharp"
                : "material-symbols-rounded";
    return (
        <span
            aria-hidden
            className={`${setClass} text-[18px] leading-none`}
            style={{ color: active ? "var(--tg-primary)" : "var(--tg-muted)" }}
        >
            {meta.iconName}
        </span>
    );
}

function RootIcon() {
    return (
        <span
            aria-hidden
            className="material-symbols-rounded text-[18px] leading-none"
            style={{ color: "var(--tg-muted)" }}
        >
            home
        </span>
    );
}

export default function Breadcrumbs({
    items,
    className = "",
    rootLabel = "Inicio",
    rootHref = "/inicio",
}: {
    items?: Crumb[];
    className?: string;
    rootLabel?: string;
    rootHref?: string;
}) {
    const pathname = usePathname();

    const autoItems: Crumb[] = useMemo(() => {
        const path = (pathname || "/").split("?")[0].split("#")[0];
        const segs = path.split("/").filter(Boolean);
        return segs.reduce<Crumb[]>((arr, seg, i) => {
            const href = "/" + segs.slice(0, i + 1).join("/");
            const meta = hrefIndex.get(href);
            arr.push({
                href,
                label: meta?.name ?? prettify(seg),
                iconName: meta?.iconName,
                iconSet: meta?.iconSet,
            });
            return arr;
        }, []);
    }, [pathname]);

    const crumbs = items ?? autoItems;

    return (
        <nav aria-label="Breadcrumb" className={`flex items-center gap-21 ${className}`}>
            {/* Root: no es link */}
            <div className="inline-flex items-center gap-1 select-none cursor-default">
                <RootIcon />
                <span
                    className="text-[15px] md:text-[16px]"
                    style={{ color: "var(--tg-muted)" }}
                >
                    {rootLabel}
                </span>
            </div>

            {/* Dinámicos */}
            {crumbs.map((c, i) => {
                const isLast = i === crumbs.length - 1;
                return (
                    <span key={c.href} className="flex items-center gap-1">
                        <span
                            aria-hidden
                            className="material-symbols-rounded text-[18px] leading-none"
                            style={{ color: "var(--tg-muted)" }}
                        >
                            chevron_right
                        </span>

                        {isLast ? (
                            <span
                                className="inline-flex items-center gap-1 font-medium text-[15px] md:text-[16px]"
                                style={{ color: "var(--tg-primary)" }}
                            >
                                {iconFor(c.href, true)}
                                <span className="truncate max-w-[240px]">{c.label}</span>
                            </span>
                        ) : (
                            <Link
                                href={c.href}
                                className="inline-flex items-center gap-1 hover:underline"
                                style={{ color: "var(--tg-muted)" }}
                            >
                                {iconFor(c.href)}
                                <span className="text-[15px] md:text-[16px] truncate max-w-[240px]">
                                    {c.label}
                                </span>
                            </Link>
                        )}
                    </span>
                );
            })}
        </nav>
    );
}
