"use client";
import { MaterialIcon } from "@/components/ui/material-icon";

export default function ThemeToggle({
    expanded,
    isDark,
    onToggle,
}: {
    expanded: boolean;
    isDark: boolean;
    onToggle: () => void;
}) {
    if (!expanded) {
        return (
            <div className="flex items-center justify-center">
                <button
                    type="button"
                    onClick={onToggle}
                    aria-pressed={isDark}
                    className="h-10 w-10 inline-flex items-center justify-center rounded-md hover:bg-black/10 dark:hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tg-primary)]"
                >
                    <MaterialIcon
                        name={isDark ? "dark_mode" : "light_mode"}
                        size={20}
                        className="text-tg-muted"
                    />
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between w-full gap-2 px-1 overflow-hidden">
            <div className="flex items-center gap-3 min-w-0">
                <MaterialIcon
                    name={isDark ? "dark_mode" : "light_mode"}
                    size={20}
                    className="text-tg-muted shrink-0"
                />
                <span className="text-sm text-tg-fg whitespace-nowrap shrink-0 leading-none">
                    {isDark ? "Modo oscuro" : "Modo claro"}
                </span>
            </div>

            <button
                type="button"
                role="switch"
                aria-checked={isDark}
                onClick={onToggle}
                className="relative inline-flex h-7 w-12 items-center rounded-full px-1 border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tg-primary)] shrink-0"
                style={{
                    borderColor: "var(--tg-border)",
                    background: isDark
                        ? "color-mix(in srgb, var(--tg-primary) 45%, var(--tg-card-bg))"
                        : "color-mix(in srgb, var(--tg-border) 70%, transparent)",
                }}
            >
                <span
                    className={`h-5 w-5 rounded-full bg-[var(--tg-card-bg)] shadow-md transition-transform duration-200 ease-out ${isDark ? "translate-x-5" : "translate-x-0"}`}
                    style={{
                        boxShadow:
                            "0 0 0 1px color-mix(in srgb, var(--tg-primary) 40%, transparent), 0 1px 2px rgba(0,0,0,.25)",
                    }}
                />
            </button>
        </div>
    );
}
