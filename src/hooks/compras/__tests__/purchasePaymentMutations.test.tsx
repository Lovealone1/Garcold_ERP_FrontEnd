import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeTestQueryClient, makeWrapper } from "@/test/queryWrapper";
import { queryKeys } from "@/lib/query/queryKeys";
import type { PurchasePage } from "@/types/purchase";

const createPurchasePayment = vi.fn();
const deletePurchasePayment = vi.fn();

vi.mock("@/services/sales/purchase.api", () => ({
    createPurchasePayment: (...args: unknown[]) => createPurchasePayment(...args),
    deletePurchasePayment: (...args: unknown[]) => deletePurchasePayment(...args),
}));

import { useCreatePurchasePayment } from "../useCreatePurchasePayment";
import { useDeletePurchasePayment } from "../useDeletePurchasePayment";

const listKey = queryKeys.purchases.list({ page: 1, pageSize: 8, period: "all" });

function seed(client: ReturnType<typeof makeTestQueryClient>, balance = 100): void {
    const page: PurchasePage = {
        items: [{
            id: 9,
            supplier: "Acme",
            bank: "Caja",
            status: "Compra Credito",
            total: 200,
            balance,
            purchase_date: "2026-01-01",
        }],
        page: 1,
        page_size: 8,
        total: 1,
        total_pages: 1,
        has_next: false,
        has_prev: false,
    };
    client.setQueryData(listKey, page);
}

describe("purchase payment mutations", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        createPurchasePayment.mockResolvedValue({ id: 4 });
        deletePurchasePayment.mockResolvedValue({ message: "ok" });
    });

    it("updates Purchase.balance after creating a payment", async () => {
        const client = makeTestQueryClient();
        seed(client, 100);
        const { result } = renderHook(() => useCreatePurchasePayment(), { wrapper: makeWrapper(client) });

        await act(async () => {
            await result.current.create({ purchase_id: 9, bank_id: 1, amount: 25 });
        });

        const updated = client.getQueryData<PurchasePage>(listKey)?.items[0];
        expect(updated?.balance).toBe(75);
        expect(updated).not.toHaveProperty("remaining_balance");
    });

    it("restores Purchase.balance after deleting a payment amount", async () => {
        const client = makeTestQueryClient();
        seed(client, 75);
        const { result } = renderHook(() => useDeletePurchasePayment(), { wrapper: makeWrapper(client) });

        await act(async () => {
            await result.current.remove(4, 9, 25);
        });

        const updated = client.getQueryData<PurchasePage>(listKey)?.items[0];
        expect(updated?.balance).toBe(100);
        expect(updated).not.toHaveProperty("remaining_balance");
    });
});
