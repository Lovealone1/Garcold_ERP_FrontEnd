import type { RequestMetaDTO } from "@/types/reporte-general";
import { clampCalendar, daysInMonth, type PeriodSelection } from "./period";

/**
 * Translate the selected period into the dashboard's own request shape.
 *
 * /dashboard predates the year/month/day parameters the list endpoints take,
 * and it asks the question differently: a `bucket` naming the kind of span,
 * plus overrides. The service resolves them like this --
 *
 *   bucket "year"   + year          -> 1 Jan .. 31 Dec of that year, by month
 *   bucket "month"  + year, month   -> the whole month, by day
 *   bucket "week"   + date_from/to  -> exactly that range, by day
 *   bucket "all"                    -> first recorded sale .. today
 *
 * so every level of the selector has an exact equivalent. A single day is a
 * one-day range on the "week" bucket, which is the only bucket that honours
 * date_from/date_to; there is no narrower one, and passing the day through
 * `pivot` would give the seven days ending on it instead of the day itself.
 */
export function toDashboardMeta(period: PeriodSelection): RequestMetaDTO {
    if (period.kind === "all") return { bucket: "all" };

    if (period.kind === "range") {
        // Both ends are required: with only one, "week" falls back to the last
        // seven days and would quietly ignore what the user picked.
        if (period.from && period.to) {
            return { bucket: "week", date_from: period.from, date_to: period.to };
        }
        const single = period.from ?? period.to;
        if (single) return { bucket: "week", date_from: single, date_to: single };
        return { bucket: "all" };
    }

    const safe = clampCalendar(period);

    if (safe.month === null) return { bucket: "year", year: safe.year };

    if (safe.day === null) {
        return { bucket: "month", year: safe.year, month: safe.month };
    }

    const day = String(safe.day).padStart(2, "0");
    const month = String(safe.month).padStart(2, "0");
    const iso = `${safe.year}-${month}-${day}`;
    return { bucket: "week", date_from: iso, date_to: iso };
}

/** Days in the selected month, for callers that need the span. */
export { daysInMonth };
