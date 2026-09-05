import { describe, it, expect } from "vitest";
import {
    clampCalendar,
    currentMonthPeriod,
    daysInMonth,
    periodLabel,
    routeHasPeriod,
    toApiDate,
    todayInBogota,
    toPeriodParams,
    type CalendarPeriod,
    type PeriodSelection,
} from "../period";

const cal = (
    year: number,
    month: number | null = null,
    day: number | null = null
): CalendarPeriod => ({ kind: "calendar", year, month, day });

describe("toPeriodParams", () => {
    // The API answers a request carrying a calendar selector *and* a free range
    // with a 422 -- the two describe the same thing. The union makes sending
    // both unrepresentable; these lock that in.
    it("never emits a calendar selector and a range together", () => {
        const selections: PeriodSelection[] = [
            cal(2026),
            cal(2026, 9),
            cal(2026, 9, 5),
            { kind: "range", from: "2026-01-01", to: "2026-03-31" },
            { kind: "range", from: null, to: null },
            { kind: "all" },
        ];
        // Three selectors now, so the exclusivity is three-way: the API answers
        // any pair with a 422 naming the two that collided.
        for (const sel of selections) {
            const p = toPeriodParams(sel);
            const used = [
                p.year !== undefined || p.month !== undefined || p.day !== undefined,
                p.date_from !== undefined || p.date_to !== undefined,
                p.period !== undefined,
            ].filter(Boolean).length;
            expect(used).toBeLessThanOrEqual(1);
        }
    });

    it("asks for all-history by name", () => {
        expect(toPeriodParams({ kind: "all" })).toEqual({ period: "all" });
    });

    it("sends the calendar units the user actually chose", () => {
        expect(toPeriodParams(cal(2026))).toEqual({ year: 2026 });
        expect(toPeriodParams(cal(2026, 9))).toEqual({ year: 2026, month: 9 });
        expect(toPeriodParams(cal(2026, 9, 5))).toEqual({ year: 2026, month: 9, day: 5 });
    });

    it("omits an empty end of a range rather than sending null", () => {
        expect(toPeriodParams({ kind: "range", from: "2026-01-01", to: null })).toEqual({
            date_from: "2026-01-01",
        });
        expect(toPeriodParams({ kind: "range", from: null, to: null })).toEqual({});
    });

    it("drops a day the month does not have instead of sending a 422", () => {
        // year=2026&month=2&day=30 -> "day 30 does not exist in 2026-02"
        expect(toPeriodParams(cal(2026, 2, 30))).toEqual({ year: 2026, month: 2 });
    });
});

describe("toApiDate", () => {
    // The API reads a bare YYYY-MM-DD as the whole day in Bogota -- start of
    // day for the lower bound, end of day for the upper. An ISO timestamp put
    // the upper bound at midnight and dropped the last day of the range.
    it("reduces an ISO timestamp to its calendar date", () => {
        expect(toApiDate("2026-09-30T05:00:00.000Z")).toBe("2026-09-30");
    });

    it("passes a bare date through", () => {
        expect(toApiDate("2026-09-30")).toBe("2026-09-30");
    });

    it("takes the calendar date the user clicked, not its UTC shift", () => {
        // Local 30 Sep 20:00 must stay the 30th, not become the 1st.
        expect(toApiDate(new Date(2026, 8, 30, 20, 0, 0))).toBe("2026-09-30");
    });

    it("zero-pads single-digit months and days", () => {
        expect(toApiDate(new Date(2026, 0, 5))).toBe("2026-01-05");
    });

    it("is null for nothing and for an invalid date", () => {
        expect(toApiDate(null)).toBeNull();
        expect(toApiDate(undefined)).toBeNull();
        expect(toApiDate("")).toBeNull();
        expect(toApiDate(new Date("nope"))).toBeNull();
    });
});

describe("clampCalendar", () => {
    it("keeps a day that exists", () => {
        expect(clampCalendar(cal(2026, 2, 28))).toEqual(cal(2026, 2, 28));
    });

    it("keeps 29 February in a leap year", () => {
        expect(clampCalendar(cal(2024, 2, 29))).toEqual(cal(2024, 2, 29));
    });

    it("drops 29 February in a common year", () => {
        expect(clampCalendar(cal(2026, 2, 29))).toEqual(cal(2026, 2, null));
    });

    it("drops a day left over from a longer month", () => {
        // Picking 31 March then switching to April must not send day=31.
        expect(clampCalendar(cal(2026, 4, 31))).toEqual(cal(2026, 4, null));
    });

    it("has no day without a month", () => {
        expect(clampCalendar({ kind: "calendar", year: 2026, month: null, day: 5 })).toEqual(
            cal(2026, null, null)
        );
    });
});

describe("daysInMonth", () => {
    it("knows month lengths and leap years", () => {
        expect(daysInMonth(2026, 1)).toBe(31);
        expect(daysInMonth(2026, 2)).toBe(28);
        expect(daysInMonth(2024, 2)).toBe(29);
        expect(daysInMonth(2026, 4)).toBe(30);
        expect(daysInMonth(2026, 12)).toBe(31);
    });
});

describe("todayInBogota", () => {
    // The API resolves every boundary in America/Bogota. A browser reading its
    // own clock would default to the wrong month for the last five hours of the
    // last day of each month.
    it("reports the Colombian date, not the UTC one", () => {
        // 2026-10-01 02:00 UTC is still 2026-09-30 21:00 in Bogota.
        expect(todayInBogota(new Date("2026-10-01T02:00:00.000Z"))).toEqual({
            year: 2026,
            month: 9,
            day: 30,
        });
    });

    it("agrees with UTC in the middle of the day", () => {
        expect(todayInBogota(new Date("2026-09-05T17:00:00.000Z"))).toEqual({
            year: 2026,
            month: 9,
            day: 5,
        });
    });
});

describe("currentMonthPeriod", () => {
    it("is the current month, which is what the API defaults to", () => {
        expect(currentMonthPeriod(new Date("2026-09-05T17:00:00.000Z"))).toEqual(cal(2026, 9, null));
    });

    it("does not roll into next month on the last evening", () => {
        expect(currentMonthPeriod(new Date("2026-09-30T23:30:00.000Z"))).toEqual(cal(2026, 9, null));
    });
});

describe("periodLabel", () => {
    it("names the selected calendar period", () => {
        expect(periodLabel(cal(2026))).toBe("Año 2026");
        expect(periodLabel(cal(2026, 9))).toBe("Septiembre 2026");
        expect(periodLabel(cal(2026, 9, 5))).toBe("5 de septiembre de 2026");
    });

    it("labels a day the month lost as the whole month", () => {
        expect(periodLabel(cal(2026, 2, 30))).toBe("Febrero 2026");
    });

    it("falls back to a neutral label for an empty range", () => {
        expect(periodLabel({ kind: "range", from: null, to: null })).toBe("Rango personalizado");
    });

    it("names all-history, so it can never be silently in effect again", () => {
        expect(periodLabel({ kind: "all" })).toBe("Todo el historial");
    });

    it("renders a bare range in the Colombian calendar, not shifted through UTC", () => {
        // new Date("2026-09-01") is UTC midnight, which is 31 August in Bogota.
        expect(periodLabel({ kind: "range", from: "2026-09-01", to: "2026-09-30" })).toBe(
            "1 sep 2026 – 30 sep 2026"
        );
    });
});

describe("routeHasPeriod", () => {
    it("covers the five screens backed by the period endpoints", () => {
        for (const path of [
            "/comercial/ventas",
            "/comercial/compras",
            "/comercial/utilidades",
            "/finanzas/gastos",
            "/finanzas/transacciones",
        ]) {
            expect(routeHasPeriod(path)).toBe(true);
        }
    });

    it("excludes /inicio, which posts to /dashboard with its own contract", () => {
        expect(routeHasPeriod("/inicio")).toBe(false);
    });

    it("excludes nested routes that do not report on a period", () => {
        expect(routeHasPeriod("/comercial/ventas/crear")).toBe(false);
        expect(routeHasPeriod("/comercial/ventas/facturas/12")).toBe(false);
    });

    it("excludes screens with no period at all", () => {
        expect(routeHasPeriod("/contactos/clientes")).toBe(false);
        expect(routeHasPeriod("/finanzas/bancos")).toBe(false);
    });

    it("tolerates a trailing slash, a query and no path", () => {
        expect(routeHasPeriod("/comercial/ventas/")).toBe(true);
        expect(routeHasPeriod("/comercial/ventas?page=2")).toBe(true);
        expect(routeHasPeriod(null)).toBe(false);
    });
});
