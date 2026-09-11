// components/DateInput.tsx
"use client";
import { useEffect, useId, useState } from "react";
import { useCallback, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { es } from "date-fns/locale";
import { format, parse, isValid, startOfDay } from "date-fns";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import styles from "./DateRangePicker.module.css";
import { CalendarMonthDropdown, CalendarYearDropdown } from "./CalendarDropdown";
import { useMediaQuery } from "@/hooks/ui/useMediaQuery";

/**
 * Emite strings para backend en formato: yyyy-MM-dd'T'HH:mm:ss
 * Muestra y permite escribir en: dd/MM/yyyy
 */
export interface DateInputProps {
    value?: string;                          // "yyyy-MM-dd" o "yyyy-MM-ddTHH:mm:ss"
    onChange: (dateStr: string | undefined) => void;
    disabled?: boolean;
    className?: string;
    placeholder?: string;
}

const UI_FMT = "dd/MM/yyyy";
const BE_FMT = "yyyy-MM-dd'T'HH:mm:ss";
const PANEL_W = 330;
const PANEL_H = 420;
const GAP = 4;
const MARGIN = 8;

function uiText(d?: Date) {
    return d ? format(d, UI_FMT) : "";
}
function fromUiText(s: string): Date | undefined {
    const d = parse(s.trim(), UI_FMT, new Date());
    return isValid(d) ? startOfDay(d) : undefined;
}
function fromBackendString(s?: string): Date | undefined {
    if (!s) return undefined;
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return undefined;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return startOfDay(d);
}
function toBackendString(d?: Date): string | undefined {
    return d ? format(d, BE_FMT) : undefined;
}

export default function DateInput({
    value,
    onChange,
    disabled,
    className,
    placeholder = "dd/mm/aaaa",
}: DateInputProps) {
    const initialDate = fromBackendString(value);
    const [open, setOpen] = useState(false);
    const [temp, setTemp] = useState<Date | undefined>(initialDate);
    const [text, setText] = useState(uiText(initialDate));
    const id = useId();

    const anchorRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);
    const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
    const asSheet = !useMediaQuery("(min-width: 640px)");

    useEffect(() => setMounted(true), []);

    useEffect(() => {
        const d = fromBackendString(value);
        setText(uiText(d));
    }, [value]);
    useEffect(() => { if (open) setTemp(fromBackendString(value)); }, [open, value]);

    const place = useCallback(() => {
        const anchor = anchorRef.current?.getBoundingClientRect();
        if (!anchor) return;

        const viewportWidth = document.documentElement.clientWidth;
        const viewportHeight = document.documentElement.clientHeight;
        const width = Math.min(PANEL_W, Math.max(0, viewportWidth - MARGIN * 2));
        const height = Math.min(PANEL_H, Math.max(0, viewportHeight - MARGIN * 2));

        let left = anchor.right - width;
        left = Math.min(Math.max(MARGIN, left), Math.max(MARGIN, viewportWidth - width - MARGIN));

        let top = anchor.bottom + GAP;
        if (top + height > viewportHeight - MARGIN) {
            top = anchor.top - height - GAP;
            if (top < MARGIN) top = Math.max(MARGIN, viewportHeight - height - MARGIN);
        }

        setPos({ top, left, width });
    }, []);

    useLayoutEffect(() => {
        if (!open || asSheet) return;

        place();
        const viewport = window.visualViewport;
        const resizeObserver = typeof ResizeObserver !== "undefined"
            ? new ResizeObserver(place)
            : undefined;
        if (anchorRef.current) resizeObserver?.observe(anchorRef.current);
        if (panelRef.current) resizeObserver?.observe(panelRef.current);

        window.addEventListener("resize", place);
        window.addEventListener("scroll", place, true);
        viewport?.addEventListener("resize", place);
        viewport?.addEventListener("scroll", place);
        return () => {
            resizeObserver?.disconnect();
            window.removeEventListener("resize", place);
            window.removeEventListener("scroll", place, true);
            viewport?.removeEventListener("resize", place);
            viewport?.removeEventListener("scroll", place);
        };
    }, [open, asSheet, place]);

    useEffect(() => {
        if (!open) return;
        const onDown = (event: PointerEvent) => {
            const target = event.target as Node;
            if (panelRef.current?.contains(target) || anchorRef.current?.contains(target)) return;
            setOpen(false);
            setText(uiText(fromBackendString(value)));
        };
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setOpen(false);
                setText(uiText(fromBackendString(value)));
            }
        };
        document.addEventListener("pointerdown", onDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("pointerdown", onDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [open, value]);

    function commitFromInput() {
        const d = fromUiText(text);
        if (!d) { setText(uiText(fromBackendString(value))); return; }
        onChange(toBackendString(d));
    }

    const now = new Date();
    const fromYear = now.getFullYear() - 2;
    const toYear = now.getFullYear() + 2;

    return (
        <div ref={anchorRef} className={`relative ${className ?? ""}`}>
            <div className="h-full min-h-10 w-full rounded-md border border-tg bg-tg-card pl-3 pr-1 flex items-center focus-within:ring-2 focus-within:ring-[var(--tg-primary)]">
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onBlur={commitFromInput}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur();
                        if (e.key === "Escape") { setText(uiText(fromBackendString(value))); e.currentTarget.blur(); }
                    }}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="flex-1 bg-transparent text-sm text-tg-card outline-none placeholder-[var(--tg-placeholder)] min-w-0"
                    aria-label="Fecha"
                />

                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => setOpen(o => !o)}
                    aria-haspopup="dialog"
                    aria-expanded={open}
                    aria-controls={id}
                    className="tap-target ml-1 inline-grid h-8 w-8 place-items-center rounded hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-50"
                    title="Abrir calendario"
                >
                    <CalendarMonthOutlinedIcon fontSize="small" />
                </button>
            </div>

            {open && mounted && createPortal(
                <>
                {asSheet && <div aria-hidden className="fixed inset-0 z-[59] bg-black/50" />}
                <div
                    id={id}
                    role="dialog"
                    aria-modal={asSheet || undefined}
                    aria-label="Fecha"
                    ref={panelRef}
                    style={asSheet ? undefined : {
                        top: pos?.top ?? -9999,
                        left: pos?.left ?? -9999,
                        width: pos?.width ?? PANEL_W,
                    }}
                    className={asSheet
                        ? "fixed inset-x-0 bottom-0 z-[60] max-h-[85dvh] overflow-y-auto overscroll-contain rounded-t-2xl border-t border-tg bg-[var(--panel-bg,white)] p-3 shadow-2xl pb-[max(0.75rem,env(safe-area-inset-bottom))]"
                        : "fixed z-[60] max-h-[min(85dvh,32rem)] overflow-y-auto overscroll-contain rounded-xl border border-tg bg-[var(--panel-bg,white)] p-3 shadow-xl"}
                >
                    {asSheet && <div aria-hidden className="mx-auto mb-2 h-1 w-10 rounded-full bg-[var(--tg-muted)] opacity-40" />}
                    <DayPicker
                        mode="single"
                        weekStartsOn={1}
                        locale={es}
                        selected={temp}
                        onSelect={(d) => setTemp(d ? startOfDay(d) : undefined)}
                        showOutsideDays
                        pagedNavigation
                        captionLayout="dropdown"
                        components={{ MonthsDropdown: CalendarMonthDropdown, YearsDropdown: CalendarYearDropdown }}
                        startMonth={new Date(fromYear, 0)}
                        endMonth={new Date(toYear, 11)}
                        classNames={{
                            day: styles.day,
                            caption: styles.caption,
                            nav: styles.nav,
                            nav_button: styles.navBtn,
                        }}
                        modifiersClassNames={{
                            today: styles.today,
                            selected: styles.selected,
                        }}
                        className={`p-2 ${styles.themeFix}`}
                    />

                    <div className="mt-3 flex items-center justify-between gap-2">
                        <button
                            type="button"
                            onClick={() => { setTemp(undefined); setText(""); onChange(undefined); }}
                            className="h-9 rounded-md border border-tg bg-transparent px-3 text-sm text-tg-muted hover:bg-black/5 dark:hover:bg-white/5"
                        >
                            Limpiar
                        </button>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => { setOpen(false); setText(uiText(fromBackendString(value))); }}
                                className="h-9 rounded-md border border-tg bg-tg-card px-3 text-sm text-tg-card hover:bg-black/5 dark:hover:bg-white/5"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                disabled={!temp}
                                onClick={() => {
                                    if (!temp) return;
                                    onChange(toBackendString(temp));
                                    setText(uiText(temp));
                                    setOpen(false);
                                }}
                                className="h-9 rounded-md bg-tg-primary px-3 text-sm font-medium text-tg-on-primary shadow-sm disabled:opacity-50"
                            >
                                Aplicar
                            </button>
                        </div>
                    </div>
                </div>
                </>,
                document.body
            )}
        </div>
    );
}
