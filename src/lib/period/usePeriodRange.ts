"use client";

import { useCallback, useMemo } from "react";
import type { DateRange } from "react-day-picker";
import { usePeriod } from "@/components/providers/PeriodProvider";
import { fromApiDate, toApiDate } from "./period";

/**
 * Binds a screen's DateRangePicker to the shared period.
 *
 * The picker and the header selector describe the same thing, and the API
 * rejects a request carrying both with a 422. Rather than keeping two states
 * in sync, the picker reads and writes the one selection: choosing a range
 * replaces the calendar selection, and choosing in the header empties the
 * picker.
 */
export function usePeriodRange(): {
    range: DateRange | undefined;
    setRange: (next?: DateRange) => void;
} {
    const { period, setRange: selectRange } = usePeriod();

    const range = useMemo<DateRange | undefined>(() => {
        if (period.kind !== "range") return undefined;
        const from = fromApiDate(period.from);
        if (!from) return undefined;
        return { from, to: fromApiDate(period.to) };
    }, [period]);

    const setRange = useCallback(
        (next?: DateRange) => {
            const from = toApiDate(next?.from ?? null);
            // A single clicked day is a one-day range, not an open-ended one.
            const to = toApiDate(next?.to ?? next?.from ?? null);
            selectRange(from, to);
        },
        [selectRange]
    );

    return { range, setRange };
}
