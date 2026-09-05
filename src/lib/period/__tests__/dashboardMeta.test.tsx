import React from "react";
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { PeriodProvider, usePeriod } from "@/components/providers/PeriodProvider";
import { toDashboardMeta } from "../dashboardMeta";
import { todayInBogota, type PeriodSelection } from "../period";

const cal = (year: number, month: number | null, day: number | null): PeriodSelection => ({
    kind: "calendar",
    year,
    month,
    day,
});

describe("toDashboardMeta", () => {
    // /dashboard predates the year/month/day parameters and asks the question
    // as a `bucket` plus overrides. Every level of the selector has an exact
    // equivalent, so nothing about the selection is lost in translation.
    it("maps a whole year onto the year bucket", () => {
        expect(toDashboardMeta(cal(2026, null, null))).toEqual({
            bucket: "year",
            year: 2026,
        });
    });

    it("maps a month onto the month bucket", () => {
        expect(toDashboardMeta(cal(2026, 9, null))).toEqual({
            bucket: "month",
            year: 2026,
            month: 9,
        });
    });

    // "week" is the only bucket that honours date_from/date_to, so a single day
    // is a one-day range on it. Passing the day as `pivot` instead would give
    // the seven days ending on it, which is a different question.
    it("maps a single day onto a one-day range", () => {
        expect(toDashboardMeta(cal(2026, 9, 5))).toEqual({
            bucket: "week",
            date_from: "2026-09-05",
            date_to: "2026-09-05",
        });
    });

    it("zero-pads the day and month it builds", () => {
        expect(toDashboardMeta(cal(2026, 1, 5))).toEqual({
            bucket: "week",
            date_from: "2026-01-05",
            date_to: "2026-01-05",
        });
    });

    it("drops a day the month does not have rather than building an invalid date", () => {
        expect(toDashboardMeta(cal(2026, 2, 30))).toEqual({
            bucket: "month",
            year: 2026,
            month: 2,
        });
    });

    it("maps all-history onto the all bucket", () => {
        expect(toDashboardMeta({ kind: "all" })).toEqual({ bucket: "all" });
    });

    it("maps a range onto the week bucket, which is the one that honours it", () => {
        expect(
            toDashboardMeta({ kind: "range", from: "2026-01-01", to: "2026-03-31" })
        ).toEqual({ bucket: "week", date_from: "2026-01-01", date_to: "2026-03-31" });
    });

    // With only one end, the week bucket ignores the override and falls back to
    // the last seven days -- quietly showing something nobody asked for.
    it("never sends a half-open range", () => {
        expect(toDashboardMeta({ kind: "range", from: "2026-01-01", to: null })).toEqual({
            bucket: "week",
            date_from: "2026-01-01",
            date_to: "2026-01-01",
        });
        expect(toDashboardMeta({ kind: "range", from: null, to: null })).toEqual({
            bucket: "all",
        });
    });
});

function mount() {
    return renderHook(() => usePeriod(), {
        wrapper: ({ children }: { children: React.ReactNode }) => (
            <PeriodProvider>{children}</PeriodProvider>
        ),
    });
}

describe("PeriodProvider", () => {
    it("starts on the current month", () => {
        const { result } = mount();
        const today = todayInBogota();
        expect(result.current.period).toEqual(cal(today.year, today.month, null));
        expect(result.current.isDefault).toBe(true);
    });

    it("keeps the year when only the month changes", () => {
        const { result } = mount();
        act(() => result.current.setCalendar({ year: 2024 }));
        act(() => result.current.setCalendar({ month: 3 }));
        expect(result.current.period).toEqual(cal(2024, 3, null));
    });

    it("drops a day that the newly selected month does not have", () => {
        const { result } = mount();
        act(() => result.current.setCalendar({ year: 2026, month: 1, day: 31 }));
        act(() => result.current.setCalendar({ month: 2 }));
        expect(result.current.period).toEqual(cal(2026, 2, null));
    });

    it("replaces the calendar selection when all-history is chosen", () => {
        const { result } = mount();
        act(() => result.current.setCalendar({ year: 2025, month: 3 }));
        act(() => result.current.setAll());
        expect(result.current.period).toEqual({ kind: "all" });
        expect(toDashboardMeta(result.current.period)).toEqual({ bucket: "all" });
    });

    it("returns to the current month on reset", () => {
        const { result } = mount();
        act(() => result.current.setAll());
        act(() => result.current.reset());
        const today = todayInBogota();
        expect(result.current.period).toEqual(cal(today.year, today.month, null));
        expect(result.current.isDefault).toBe(true);
    });
});
