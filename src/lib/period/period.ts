/**
 * The period a screen is reporting on.
 *
 * The API resolves a period from either `year`/`month`/`day` or
 * `date_from`/`date_to`, and rejects a request carrying both with a 422:
 * the two describe the same range, so letting one silently win is how a
 * screen ends up showing a period nobody asked for.
 *
 * That exclusivity is a union here rather than a pair of nullable fields,
 * so `toPeriodParams` cannot emit both even by mistake.
 */

/** Whole year, a month of it, or a single day. */
export type CalendarPeriod = {
    kind: "calendar";
    year: number;
    /** null = the whole year. */
    month: number | null;
    /** null = the whole month. Meaningless without `month`. */
    day: number | null;
};

/**
 * An arbitrary span from the date range picker.
 *
 * Both ends are bare `YYYY-MM-DD` dates, never timestamps. The API reads a
 * bare date as the whole day in Bogota -- start of day for the lower bound,
 * *end* of day for the upper. Sending `.toISOString()` instead put the upper
 * bound at midnight and silently dropped the last day of the range: a sale at
 * 20:00 on the 30th fell outside the month it belongs to.
 */
export type RangePeriod = {
    kind: "range";
    from: string | null;
    to: string | null;
};

/** Every record ever written. Has to be asked for by name. */
export type AllPeriod = { kind: "all" };

export type PeriodSelection = CalendarPeriod | RangePeriod | AllPeriod;

/**
 * Query parameters for the list and summary endpoints.
 *
 * The API takes three mutually exclusive selectors and answers a request
 * carrying two of them with a 422 naming the pair that collided.
 */
export type PeriodParams = {
    year?: number;
    month?: number;
    day?: number;
    date_from?: string;
    date_to?: string;
    period?: "all";
};

/** How the API says it resolved the period it actually used. */
export type ResolvedFrom = "default" | "calendar" | "range" | "all";

/**
 * The range the API resolved, echoed back on list envelopes and summaries.
 *
 * Null on /customers/page, /suppliers/page and /products/page: they share the
 * generic page envelope and resolve no period. With `period=all` both
 * timestamps are null, so read the mode off `resolved_from`, not off them.
 */
export type PeriodEcho = {
    date_from: string | null;
    date_to: string | null;
    resolved_from: ResolvedFrom;
};

/**
 * The business runs on Colombian time and the API resolves every calendar
 * boundary in it. The browser does not: a user in UTC opening the app at
 * 20:00 Bogota is already on the next calendar day, and would default to the
 * wrong month for the first hours of every month. Ask for the date in the
 * zone the server will use.
 */
export const BOGOTA_TZ = "America/Bogota";

const MONTHS_ES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export function monthNameEs(month: number): string {
    return MONTHS_ES[Math.min(12, Math.max(1, month)) - 1];
}

/** Today's calendar date in Bogota, regardless of where the browser is. */
export function todayInBogota(now: Date = new Date()): {
    year: number;
    month: number;
    day: number;
} {
    // en-CA formats as YYYY-MM-DD, which parses without locale guesswork.
    const iso = new Intl.DateTimeFormat("en-CA", {
        timeZone: BOGOTA_TZ,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(now);
    const [year, month, day] = iso.split("-").map(Number);
    return { year, month, day };
}

/** The API's own default when it receives no parameters: the current month. */
export function currentMonthPeriod(now: Date = new Date()): CalendarPeriod {
    const { year, month } = todayInBogota(now);
    return { kind: "calendar", year, month, day: null };
}

export function daysInMonth(year: number, month: number): number {
    // Day 0 of the next month is the last day of this one.
    return new Date(year, month, 0).getDate();
}

/**
 * Drop a day that does not exist in the selected month.
 *
 * Moving from 31 March to February would otherwise send `day=31`, which the
 * API answers with a 422 rather than a best guess. Falling back to the whole
 * month keeps the screen showing something sensible.
 */
export function clampCalendar(period: CalendarPeriod): CalendarPeriod {
    if (period.month === null) return { ...period, day: null };
    if (period.day === null) return period;
    const max = daysInMonth(period.year, period.month);
    return period.day > max ? { ...period, day: null } : period;
}

/**
 * The period half of a service's options, with the undefined keys dropped.
 *
 * The service modules take flat option bags that also carry `signal`, `q` and
 * the per-screen filters. This lifts out only what describes the period, so a
 * caller cannot accidentally forward an AbortSignal as a query parameter.
 */
export function pickPeriodParams(opts: PeriodParams): PeriodParams {
    const { year, month, day, date_from, date_to, period } = opts;
    return {
        ...(year !== undefined ? { year } : {}),
        ...(month !== undefined ? { month } : {}),
        ...(day !== undefined ? { day } : {}),
        ...(date_from ? { date_from } : {}),
        ...(date_to ? { date_to } : {}),
        ...(period ? { period } : {}),
    };
}

/** A bare `YYYY-MM-DD` in Bogota, which is what the range endpoints want. */
export function toApiDate(value: Date | string | null | undefined): string | null {
    if (!value) return null;
    if (typeof value === "string") {
        // Already a bare date; anything longer is an ISO string to be reduced.
        const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
        return match ? match[1] : null;
    }
    if (Number.isNaN(value.getTime())) return null;
    // The picker produces a local Date for a day the user clicked; take the
    // calendar date they see rather than shifting it through UTC.
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

/** The inverse of `toApiDate`, for putting a stored range back in the picker. */
export function fromApiDate(value: string | null | undefined): Date | undefined {
    if (!value) return undefined;
    const m = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return undefined;
    // Build from parts: `new Date("2026-09-01")` is UTC midnight, which is the
    // previous day for anyone west of Greenwich.
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/** The exclusivity the API enforces, made unrepresentable. */
export function toPeriodParams(period: PeriodSelection): PeriodParams {
    if (period.kind === "all") return { period: "all" };
    if (period.kind === "range") {
        return {
            ...(period.from ? { date_from: period.from } : {}),
            ...(period.to ? { date_to: period.to } : {}),
        };
    }
    const safe = clampCalendar(period);
    return {
        year: safe.year,
        ...(safe.month !== null ? { month: safe.month } : {}),
        ...(safe.day !== null ? { day: safe.day } : {}),
    };
}

function shortDate(value: string): string {
    // `new Date("2026-09-01")` is UTC midnight, which renders as 31 August in
    // Bogota. Read the parts and format them directly instead.
    const m = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return value;
    const [, y, mo, d] = m;
    return `${Number(d)} ${monthNameEs(Number(mo)).slice(0, 3).toLowerCase()} ${y}`;
}

/** What the header shows, so the user can read the period off the screen. */
export function periodLabel(period: PeriodSelection): string {
    if (period.kind === "all") return "Todo el historial";
    if (period.kind === "range") {
        if (period.from && period.to) return `${shortDate(period.from)} – ${shortDate(period.to)}`;
        if (period.from) return `Desde ${shortDate(period.from)}`;
        if (period.to) return `Hasta ${shortDate(period.to)}`;
        return "Rango personalizado";
    }
    const safe = clampCalendar(period);
    if (safe.month === null) return `Año ${safe.year}`;
    if (safe.day === null) return `${monthNameEs(safe.month)} ${safe.year}`;
    return `${safe.day} de ${monthNameEs(safe.month).toLowerCase()} de ${safe.year}`;
}

/** Routes whose screens report on a period. Exact matches, not prefixes. */
export const PERIOD_ROUTES: readonly string[] = [
    "/comercial/ventas",
    "/comercial/compras",
    "/comercial/utilidades",
    "/finanzas/gastos",
    "/finanzas/transacciones",
];

/**
 * `/inicio` is deliberately absent: it posts to /dashboard, which has its own
 * bucket/pivot contract and does not go through the shared period dependency.
 * Nested routes are absent too -- /comercial/ventas/crear creates a sale, it
 * does not report on one.
 */
export function routeHasPeriod(pathname: string | null | undefined): boolean {
    if (!pathname) return false;
    const path = pathname.split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";
    return PERIOD_ROUTES.includes(path);
}
