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
                    className="h-9 w-9 inline-flex items-center justify-center rounded-md
                               hover:bg-black/10 dark:hover:bg-white/10
                               focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tg-primary)]"
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
                data-theme-switch
                className={`relative inline-flex items-center shrink-0
                            h-6 w-11 rounded-full
                            transition-colors duration-200
                            focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tg-primary)]
                            ${isDark
                        ? "bg-[var(--tg-primary)]"
                        : "bg-[var(--tg-card-bg)] border border-[var(--tg-border)]"
                    }`}
            >
                <span
                    className={`absolute h-5 w-5 rounded-full bg-[var(--tg-bg)]
                                shadow-sm transition-transform duration-200
                                ${isDark ? "translate-x-[22px]" : "translate-x-[2px]"}`}
                />
            </button>
        </div>
    );
}
