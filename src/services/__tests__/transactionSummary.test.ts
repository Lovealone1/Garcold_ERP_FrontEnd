import { describe, expect, it } from "vitest";
import type { TransactionSummary } from "@/types/transaction";

describe("TransactionSummary contract", () => {
    it("keeps period metadata separate from numeric totals", () => {
        const summary: TransactionSummary = {
            amounts: { Ingreso: 500, Retiro: 200 },
            period: {
                date_from: "2026-01-01T05:00:00.000Z",
                date_to: "2026-01-31T04:59:59.999Z",
                resolved_from: "range",
            },
        };

        expect(summary.amounts).toEqual({ Ingreso: 500, Retiro: 200 });
        expect(summary.period?.resolved_from).toBe("range");
    });
});
