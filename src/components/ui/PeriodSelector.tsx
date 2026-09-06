"use client";

import { useEffect, useRef, useState } from "react";
import { MaterialIcon } from "@/components/ui/material-icon";
import { usePeriod } from "@/components/providers/PeriodProvider";
import { daysInMonth, monthNameEs, todayInBogota } from "@/lib/period/period";

const MONTHS_SHORT = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
];

/** Enough history to be useful without turning the year row into a scroller. */
const YEAR_SPAN_BACK = 5;

function Chip({
    active,
    onClick,
    children,
    title,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
    title?: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            aria-pressed={active}
            className="h-8 rounded-md text-[13px] leading-none transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tg-primary)]"
            style={{
                background: active ? "var(--tg-primary)" : "var(--tg-input-bg)",
                color: active ? "var(--tg-primary-fg)" : "var(--tg-card-fg)",
                border: `1px solid ${active ? "var(--tg-primary)" : "var(--tg-border)"}`,
            }}
        >
            {children}
        </button>
    );
}

export default function PeriodSelector({ className = "" }: { className?: string }) {
    const { period, label, setCalendar, setAll, reset, isDefault } = usePeriod();
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        function onPointerDown(e: MouseEvent) {
            if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
        }
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") setOpen(false);
        }
        document.addEventListener("mousedown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("mousedown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [open]);

    const today = todayInBogota();
    // A custom range selected on the screen owns the period; the calendar grid
    // then has nothing to highlight, so show the year as a starting point.
    const cal = period.kind === "calendar" ? period : null;
    const year = cal?.year ?? today.year;
    const month = cal?.month ?? null;
    const day = cal?.day ?? null;

    const years = Array.from(
        { length: YEAR_SPAN_BACK + 1 },
        (_, i) => today.year - YEAR_SPAN_BACK + i
    );
    const dayCount = month ? daysInMonth(year, month) : 0;

    return (
        <div ref={rootRef} className={`relative ${className}`}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="dialog"
                aria-expanded={open}
                className="h-9 inline-flex items-center gap-1.5 rounded-md px-2.5 text-[13px] whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tg-primary)]"
                style={{
                    background: "var(--tg-input-bg)",
                    border: `1px solid ${isDefault ? "var(--tg-border)" : "var(--tg-primary)"}`,
                    color: "var(--tg-card-fg)",
                }}
            >
                <MaterialIcon name="calendar_month" size={18} fill={0} />
                <span className="font-medium">{label}</span>
                <MaterialIcon name={open ? "expand_less" : "expand_more"} size={18} />
            </button>

            {open && (
                <div
                    role="dialog"
                    aria-label="Seleccionar periodo"
                    // El shell ahora acota su alto al viewport, así que un
                    // panel más largo que la pantalla se recortaría en vez de
                    // hacer crecer el documento. Con el día abierto esto pasa
                    // de 400px, así que se le da scroll propio y un ancho que
                    // no desborde a 360px.
                    className="absolute right-0 mt-1.5 z-50 w-[300px] max-w-[calc(100vw-1.5rem)]
                               max-h-[min(70dvh,32rem)] overflow-y-auto overscroll-contain
                               rounded-lg p-3 shadow-xl"
                    style={{
                        background: "var(--tg-card-bg)",
                        border: "1px solid var(--tg-border)",
                    }}
                >
                    {/* Año */}
                    <div className="flex flex-wrap gap-1.5">
                        {years.map((y) => (
                            <Chip
                                key={y}
                                active={cal !== null && y === year}
                                onClick={() => setCalendar({ year: y })}
                            >
                                <span className="px-2">{y}</span>
                            </Chip>
                        ))}
                    </div>

                    <div className="mt-3 mb-1.5 flex items-center justify-between">
                        <span className="text-[11px] uppercase tracking-wide" style={{ color: "var(--tg-muted)" }}>
                            Mes
                        </span>
                        <button
                            type="button"
                            onClick={() => setCalendar({ month: null, day: null })}
                            className="text-[12px] hover:underline focus:outline-none"
                            style={{ color: month === null && cal ? "var(--tg-primary)" : "var(--tg-muted)" }}
                        >
                            Todo el año
                        </button>
                    </div>

                    <div className="grid grid-cols-6 gap-1.5">
                        {MONTHS_SHORT.map((name, i) => (
                            <Chip
                                key={name}
                                active={month === i + 1}
                                title={monthNameEs(i + 1)}
                                onClick={() => setCalendar({ month: i + 1, day: null })}
                            >
                                {name}
                            </Chip>
                        ))}
                    </div>

                    {month !== null && (
                        <>
                            <div className="mt-3 mb-1.5 flex items-center justify-between">
                                <span className="text-[11px] uppercase tracking-wide" style={{ color: "var(--tg-muted)" }}>
                                    Día
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setCalendar({ day: null })}
                                    className="text-[12px] hover:underline focus:outline-none"
                                    style={{ color: day === null ? "var(--tg-primary)" : "var(--tg-muted)" }}
                                >
                                    Todo el mes
                                </button>
                            </div>

                            {/* Only the days this month actually has, so the API
                                never sees a combination it answers with a 422. */}
                            <div className="grid grid-cols-7 gap-1">
                                {Array.from({ length: dayCount }, (_, i) => i + 1).map((d) => (
                                    <Chip key={d} active={day === d} onClick={() => setCalendar({ day: d })}>
                                        {d}
                                    </Chip>
                                ))}
                            </div>
                        </>
                    )}

                    {/* All-history is the state these screens used to be in by
                        accident. It stays reachable -- Utilidades wants it --
                        but as a named choice the header then displays. */}
                    <div className="mt-3 border-t pt-2.5" style={{ borderColor: "var(--tg-border)" }}>
                        <Chip active={period.kind === "all"} onClick={setAll}>
                            <span className="px-2">Todo el historial</span>
                        </Chip>
                    </div>

                    <div className="mt-2.5 flex justify-between border-t pt-2.5" style={{ borderColor: "var(--tg-border)" }}>
                        <button
                            type="button"
                            onClick={reset}
                            className="text-[12px] hover:underline focus:outline-none"
                            style={{ color: "var(--tg-muted)" }}
                        >
                            Mes actual
                        </button>
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="text-[12px] font-medium hover:underline focus:outline-none"
                            style={{ color: "var(--tg-primary)" }}
                        >
                            Listo
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
