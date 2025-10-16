"use client";
import Link from "next/link";
import { MaterialIcon } from "@/components/ui/material-icon";
import type { NavSection } from "@/types/navigation";

type Section = NavSection & { group?: string };

export default function NavExpanded({
    sections, pathname, accentPct = 10, activePct = 16,
}: {
    sections: Section[];
    pathname: string | null;
    accentPct?: number;
    activePct?: number;
}) {
    const bg = (pct: number) =>
        `color-mix(in srgb, var(--tg-primary) ${pct}%, transparent)`;

    return (
        <>
            <nav className="flex-1 min-h-0 min-w-0 px-2">
                <div data-silent-scroll className="h-full overflow-y-auto overflow-x-hidden">
                    {sections.map((section) => (
                        <div key={section.title} className="mb-6">
                            {/* Header estilo INSIGHTS / ENGAGEMENTS */}
                            <div className="px-4 py-2 text-[11px] font-extralight tracking-widest uppercase text-tg-muted select-none">
                                {section.title}
                            </div>

                            {/* Items visibles con más espacio vertical */}
                            <ul className="space-y-[6px]">
                                {section.items.map((item) => {
                                    const active = pathname?.startsWith(item.href);
                                    return (
                                        <li key={item.name}>
                                            <Link
                                                href={item.href}
                                                className="grid grid-cols-[26px,1fr] items-center gap-3 w-full min-w-0 px-4 py-[10px] rounded-lg text-[14px] transition"
                                                style={
                                                    active
                                                        ? { background: bg(activePct), color: "var(--tg-fg)" }
                                                        : undefined
                                                }
                                                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = bg(accentPct); }}
                                                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = ""; }}
                                            >
                                                <span className={`w-6 h-6 grid place-items-center ${active ? "text-tg-primary" : "text-tg-primary"}`}>
                                                    {item.iconName
                                                        ? <MaterialIcon name={item.iconName} set={item.iconSet} size={20} />
                                                        : <span dangerouslySetInnerHTML={{ __html: item.icon as string }} />}
                                                </span>
                                                <span className="font-medium truncate">{item.name}</span>
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </div>
            </nav>

            {/* Scroll invisible */}
            <style jsx global>{`
                [data-silent-scroll] {
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                }
                [data-silent-scroll]::-webkit-scrollbar {
                    width: 0;
                    height: 0;
                    display: none;
                }
            `}</style>
        </>
    );
}
