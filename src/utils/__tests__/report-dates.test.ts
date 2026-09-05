import { describe, it, expect } from "vitest";
import { currentReportYear, monthKey, monthCapEs, utilidadMesActual } from "../report-dates";
import type { ProfitSeriesDTO } from "@/types/reporte-general";

describe("currentReportYear", () => {
    // The dashboard shipped with `year: 2025` hardcoded, so on 1 Jan 2026 every
    // KPI quietly reported the previous year while looking current.
    it("tracks the calendar year rather than a fixed constant", () => {
        expect(currentReportYear(new Date("2026-01-01T00:00:00"))).toBe(2026);
        expect(currentReportYear(new Date("2030-12-31T23:59:59"))).toBe(2030);
    });

    it("defaults to today", () => {
        expect(currentReportYear()).toBe(new Date().getFullYear());
    });
});

describe("monthKey", () => {
    it("zero-pads the month", () => {
        expect(monthKey(new Date("2026-03-09T12:00:00"))).toBe("2026-03");
        expect(monthKey(new Date("2026-11-09T12:00:00"))).toBe("2026-11");
    });
});

describe("monthCapEs", () => {
    it("capitalises the Spanish month name", () => {
        expect(monthCapEs(new Date("2026-03-09T12:00:00"))).toBe("Marzo");
    });
});

describe("utilidadMesActual", () => {
    const series = (granularity: string, rows: { date: string; profit: number }[]) =>
        ({ meta: { granularity }, series: rows }) as unknown as ProfitSeriesDTO;

    it("picks the profit for the current month", () => {
        const d = new Date("2026-03-09T12:00:00");
        const s = series("month", [
            { date: "2026-02", profit: 10 },
            { date: "2026-03", profit: 42 },
        ]);
        expect(utilidadMesActual(s, d)).toBe(42);
    });

    it("returns 0 when the month is absent", () => {
        const d = new Date("2026-05-09T12:00:00");
        expect(utilidadMesActual(series("month", [{ date: "2026-03", profit: 42 }]), d)).toBe(0);
    });

    it("returns 0 for a non-month granularity", () => {
        const d = new Date("2026-03-09T12:00:00");
        expect(utilidadMesActual(series("day", [{ date: "2026-03", profit: 42 }]), d)).toBe(0);
    });
});
