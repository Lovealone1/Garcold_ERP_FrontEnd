import React from "react";
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { PeriodProvider, usePeriod } from "@/components/providers/PeriodProvider";
import { usePeriodRange } from "../usePeriodRange";
import { todayInBogota } from "../period";

function mount() {
    return renderHook(
        () => ({ range: usePeriodRange(), period: usePeriod() }),
        {
            wrapper: ({ children }: { children: React.ReactNode }) => (
                <PeriodProvider>{children}</PeriodProvider>
            ),
        }
    );
}

describe("usePeriodRange", () => {
    it("starts empty, because the default period is a calendar month", () => {
        const { result } = mount();
        expect(result.current.range.range).toBeUndefined();
        expect(result.current.period.period.kind).toBe("calendar");
    });

    // The picker used to send .toISOString(), whose upper bound is midnight --
    // the API then dropped the last day of the range entirely.
    it("sends bare dates, not timestamps", () => {
        const { result } = mount();

        act(() =>
            result.current.range.setRange({
                from: new Date(2026, 8, 1),
                to: new Date(2026, 8, 30),
            })
        );

        expect(result.current.period.params).toEqual({
            date_from: "2026-09-01",
            date_to: "2026-09-30",
        });
    });

    it("keeps the day the user clicked, whatever the browser's timezone", () => {
        const { result } = mount();

        // Local 30 Sep 20:00 is 1 Oct in UTC; the range must stay in September.
        act(() =>
            result.current.range.setRange({
                from: new Date(2026, 8, 30, 20, 0, 0),
                to: new Date(2026, 8, 30, 23, 30, 0),
            })
        );

        expect(result.current.period.params.date_from).toBe("2026-09-30");
        expect(result.current.period.params.date_to).toBe("2026-09-30");
    });

    it("treats a single clicked day as a one-day range", () => {
        const { result } = mount();

        act(() => result.current.range.setRange({ from: new Date(2026, 8, 5), to: undefined }));

        expect(result.current.period.params).toEqual({
            date_from: "2026-09-05",
            date_to: "2026-09-05",
        });
    });

    it("round-trips a stored range back into the picker", () => {
        const { result } = mount();

        act(() =>
            result.current.range.setRange({
                from: new Date(2026, 0, 15),
                to: new Date(2026, 1, 20),
            })
        );

        const back = result.current.range.range;
        expect(back?.from?.getFullYear()).toBe(2026);
        expect(back?.from?.getMonth()).toBe(0);
        expect(back?.from?.getDate()).toBe(15);
        expect(back?.to?.getMonth()).toBe(1);
        expect(back?.to?.getDate()).toBe(20);
    });

    describe("mutual exclusivity", () => {
        // The API answers a request carrying two selectors with a 422. One
        // piece of state means the pair is unrepresentable rather than guarded.
        it("clears the calendar selection when a range is picked", () => {
            const { result } = mount();

            act(() => result.current.period.setCalendar({ year: 2025, month: 3 }));
            expect(result.current.period.params).toEqual({ year: 2025, month: 3 });

            act(() =>
                result.current.range.setRange({
                    from: new Date(2026, 8, 1),
                    to: new Date(2026, 8, 30),
                })
            );

            expect(result.current.period.params.year).toBeUndefined();
            expect(result.current.period.params.month).toBeUndefined();
        });

        it("clears the range when the header picks a month", () => {
            const { result } = mount();

            act(() =>
                result.current.range.setRange({
                    from: new Date(2026, 8, 1),
                    to: new Date(2026, 8, 30),
                })
            );
            act(() => result.current.period.setCalendar({ year: 2026, month: 3 }));

            expect(result.current.range.range).toBeUndefined();
            expect(result.current.period.params).toEqual({ year: 2026, month: 3 });
        });

        it("clears both when all-history is chosen", () => {
            const { result } = mount();

            act(() =>
                result.current.range.setRange({
                    from: new Date(2026, 8, 1),
                    to: new Date(2026, 8, 30),
                })
            );
            act(() => result.current.period.setAll());

            expect(result.current.range.range).toBeUndefined();
            expect(result.current.period.params).toEqual({ period: "all" });
        });
    });

    it("falls back to the current month when the range is cleared", () => {
        const { result } = mount();

        act(() =>
            result.current.range.setRange({ from: new Date(2026, 8, 1), to: new Date(2026, 8, 30) })
        );
        act(() => result.current.range.setRange(undefined));

        const today = todayInBogota();
        expect(result.current.period.params).toEqual({
            year: today.year,
            month: today.month,
        });
    });
});
