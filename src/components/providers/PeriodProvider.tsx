"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
    clampCalendar,
    currentMonthPeriod,
    periodLabel,
    toPeriodParams,
    type CalendarPeriod,
    type PeriodParams,
    type PeriodSelection,
} from "@/lib/period/period";

/**
 * The selected period, shared by the header selector and the screens.
 *
 * It lives above the screens because the selector sits in the app header,
 * which wraps all of them. Carrying it across a navigation is deliberate:
 * moving from Ventas to Gastos keeps the month you were looking at, rather
 * than silently resetting the question you were asking.
 */
export type PeriodState = {
    period: PeriodSelection;
    /** Query parameters for the API. Never carries both halves of the contract. */
    params: PeriodParams;
    label: string;
    /** True while the selection still is the API's own default. */
    isDefault: boolean;
    /**
     * Select a calendar period. Replaces any custom range: the two are
     * mutually exclusive, and sending both is a 422.
     */
    setCalendar: (next: Partial<Omit<CalendarPeriod, "kind">>) => void;
    /** Select an arbitrary range. Replaces any calendar selection. */
    setRange: (from: string | null, to: string | null) => void;
    /**
     * Every record ever written. Replaces the other two.
     *
     * This is the state the screens used to be in by accident, when they sent
     * no dates at all and the API summed the whole table. It stays reachable
     * because Utilidades genuinely wants it -- but now the user asks for it by
     * name and the header says so.
     */
    setAll: () => void;
    /** Back to the current month. */
    reset: () => void;
};

const PeriodContext = createContext<PeriodState | null>(null);

export function PeriodProvider({ children }: { children: React.ReactNode }) {
    // Matches what the API returns for a request with no period parameters,
    // so the first render agrees with the server instead of flashing a
    // different range.
    const [period, setPeriod] = useState<PeriodSelection>(() => currentMonthPeriod());

    const setCalendar = useCallback(
        (next: Partial<Omit<CalendarPeriod, "kind">>) => {
            setPeriod((current) => {
                const base: CalendarPeriod =
                    current.kind === "calendar" ? current : currentMonthPeriod();
                return clampCalendar({ ...base, ...next, kind: "calendar" });
            });
        },
        []
    );

    const setRange = useCallback((from: string | null, to: string | null) => {
        if (!from && !to) {
            setPeriod(currentMonthPeriod());
            return;
        }
        setPeriod({ kind: "range", from, to });
    }, []);

    const setAll = useCallback(() => setPeriod({ kind: "all" }), []);

    const reset = useCallback(() => setPeriod(currentMonthPeriod()), []);

    const value = useMemo<PeriodState>(() => {
        const fallback = currentMonthPeriod();
        return {
            period,
            params: toPeriodParams(period),
            label: periodLabel(period),
            isDefault:
                period.kind === "calendar" &&
                period.year === fallback.year &&
                period.month === fallback.month &&
                period.day === null,
            setCalendar,
            setRange,
            setAll,
            reset,
        };
    }, [period, setCalendar, setRange, setAll, reset]);

    return <PeriodContext.Provider value={value}>{children}</PeriodContext.Provider>;
}

export function usePeriod(): PeriodState {
    const ctx = useContext(PeriodContext);
    if (!ctx) throw new Error("PeriodProvider missing");
    return ctx;
}
