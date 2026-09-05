import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

const listCustomers = vi.fn();
const listCustomerCities = vi.fn();
vi.mock("@/services/sales/customer.api", () => ({
    listCustomers: (...a: unknown[]) => listCustomers(...a),
    listCustomerCities: (...a: unknown[]) => listCustomerCities(...a),
}));

const listSuppliers = vi.fn();
const listSupplierCities = vi.fn();
vi.mock("@/services/sales/supplier.api", () => ({
    listSuppliers: (...a: unknown[]) => listSuppliers(...a),
    listSupplierCities: (...a: unknown[]) => listSupplierCities(...a),
}));

const listProducts = vi.fn();
vi.mock("@/services/sales/product.api", () => ({
    listProducts: (...a: unknown[]) => listProducts(...a),
}));

const listProfits = vi.fn();
const summarizeProfits = vi.fn();
vi.mock("@/services/sales/profit.api", () => ({
    listProfits: (...a: unknown[]) => listProfits(...a),
    summarizeProfits: (...a: unknown[]) => summarizeProfits(...a),
}));

import { useCustomers } from "@/hooks/clientes/useCustomers";
import { useSuppliers } from "@/hooks/proveedores/useSuppliers";
import { useProductos } from "@/hooks/productos/useProductos";
import { useProfits } from "@/hooks/utilidades/useProfits";
import { invalidateMovement } from "@/lib/query/invalidateMovement";
import { makeTestQueryClient, makeWrapper } from "@/test/queryWrapper";
import { todayInBogota } from "@/lib/period/period";

function pageOf(items: unknown[], overrides = {}) {
    return {
        items,
        page: 1,
        page_size: 8,
        total: 40,
        total_pages: 5,
        has_next: true,
        has_prev: false,
        ...overrides,
    };
}

/** Every rewritten hook must fetch exactly one page and then stop. */
async function assertSinglePage(fetcher: ReturnType<typeof vi.fn>, ready: () => boolean) {
    await waitFor(() => expect(ready()).toBe(true));
    await new Promise((r) => setTimeout(r, 400)); // longer than the old pump tick
    expect(fetcher).toHaveBeenCalledTimes(1);
}

describe("useCustomers", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        listCustomers.mockResolvedValue(pageOf([{ id: 1, name: "Perez", city: "Cali" }]));
        listCustomerCities.mockResolvedValue(["Bogota", "Cali"]);
    });

    function mount(client = makeTestQueryClient()) {
        const r = renderHook(() => useCustomers(8), { wrapper: makeWrapper(client) });
        return { ...r, client };
    }

    it("fetches exactly one page", async () => {
        const { result } = mount();
        await assertSinglePage(listCustomers, () => !result.current.loading);
    });

    it("sends the search term, cities and pending balance", async () => {
        const { result } = mount();
        await waitFor(() => expect(result.current.loading).toBe(false));

        act(() =>
            result.current.setFilters({
                q: "  perez ",
                cities: ["Cali", "Bogota"],
                pendingBalance: "yes",
            })
        );
        await waitFor(() => expect(listCustomers).toHaveBeenCalledTimes(2));

        const args = listCustomers.mock.calls[1][1] as Record<string, unknown>;
        expect(args.q).toBe("perez");
        expect(args.cities).toEqual(["Cali", "Bogota"]);
        expect(args.pending_balance).toBe("yes");
    });

    it("treats pendingBalance 'all' as no filter", async () => {
        const { result } = mount();
        await waitFor(() => expect(result.current.loading).toBe(false));

        act(() => result.current.setFilters({ pendingBalance: "all" }));
        await new Promise((r) => setTimeout(r, 50));

        const args = listCustomers.mock.calls.at(-1)![1] as Record<string, unknown>;
        expect(args.pending_balance).toBeUndefined();
    });

    // The multi-select used to be built from whatever rows had been downloaded.
    it("gets city options from the API", async () => {
        const { result } = mount();
        await waitFor(() => expect(result.current.options.cities).toEqual(["Bogota", "Cali"]));
    });

    it("returns to page 1 when a filter changes", async () => {
        const { result } = mount();
        await waitFor(() => expect(result.current.loading).toBe(false));

        act(() => result.current.setPage(3));
        await waitFor(() => expect(result.current.page).toBe(3));

        act(() => result.current.setFilters({ cities: ["Cali"] }));
        await waitFor(() => expect(result.current.page).toBe(1));
    });

    it("refetches when a movement invalidates customers", async () => {
        const { result, client } = mount();
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
            await invalidateMovement(client, { kind: "sale" });
        });

        await waitFor(() => expect(listCustomers).toHaveBeenCalledTimes(2));
    });
});

describe("useSuppliers", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        listSuppliers.mockResolvedValue(pageOf([{ id: 1, name: "Acme", city: "Cali" }]));
        listSupplierCities.mockResolvedValue(["Cali"]);
    });

    function mount(client = makeTestQueryClient()) {
        const r = renderHook(() => useSuppliers(8), { wrapper: makeWrapper(client) });
        return { ...r, client };
    }

    it("fetches exactly one page", async () => {
        const { result } = mount();
        await assertSinglePage(listSuppliers, () => !result.current.loading);
    });

    it("sends the search term and cities", async () => {
        const { result } = mount();
        await waitFor(() => expect(result.current.loading).toBe(false));

        act(() => result.current.setFilters({ q: "acme", cities: ["Cali"] }));
        await waitFor(() => expect(listSuppliers).toHaveBeenCalledTimes(2));

        const args = listSuppliers.mock.calls[1][1] as Record<string, unknown>;
        expect(args.q).toBe("acme");
        expect(args.cities).toEqual(["Cali"]);
    });

    it("gets city options from the API", async () => {
        const { result } = mount();
        await waitFor(() => expect(result.current.options.cities).toEqual(["Cali"]));
    });
});

describe("useProductos", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        listProducts.mockResolvedValue(pageOf([{ id: 1, reference: "TOR-1" }]));
    });

    function mount(client = makeTestQueryClient()) {
        const r = renderHook(() => useProductos(1, 10), { wrapper: makeWrapper(client) });
        return { ...r, client };
    }

    it("fetches exactly one page", async () => {
        const { result } = mount();
        await assertSinglePage(listProducts, () => !result.current.loading);
    });

    it("sends the search term and the active/inactive filter", async () => {
        const { result } = mount();
        await waitFor(() => expect(result.current.loading).toBe(false));

        act(() => result.current.setFilters({ q: " tor ", estado: "activos" }));
        await waitFor(() => expect(listProducts).toHaveBeenCalledTimes(2));

        const args = listProducts.mock.calls[1][1] as Record<string, unknown>;
        expect(args.q).toBe("tor");
        expect(args.estado).toBe("activos");
    });

    it("omits an unknown estado", async () => {
        const { result } = mount();
        await waitFor(() => expect(result.current.loading).toBe(false));

        act(() => result.current.setFilters({ estado: "todos" }));
        await new Promise((r) => setTimeout(r, 50));

        const args = listProducts.mock.calls.at(-1)![1] as Record<string, unknown>;
        expect(args.estado).toBeUndefined();
    });

    it("refetches when a movement invalidates products", async () => {
        const { result, client } = mount();
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
            await invalidateMovement(client, { kind: "purchase" });
        });

        await waitFor(() => expect(listProducts).toHaveBeenCalledTimes(2));
    });
});

describe("useProfits", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        listProfits.mockResolvedValue(
            pageOf([{ id: 1, sale_id: 10, profit: 5, customer: "Perez" }])
        );
        summarizeProfits.mockResolvedValue({ total: 999, count: 40 });
    });

    function mount(client = makeTestQueryClient()) {
        const r = renderHook(() => useProfits(1, 16), { wrapper: makeWrapper(client) });
        return { ...r, client };
    }

    it("fetches exactly one page", async () => {
        const { result } = mount();
        await assertSinglePage(listProfits, () => !result.current.loading);
    });

    // The screen used to fetch one sale per row just to show this.
    it("reads the customer name straight off the row", async () => {
        const { result } = mount();
        await waitFor(() => expect(result.current.items).toHaveLength(1));
        expect(result.current.items[0].customer).toBe("Perez");
    });

    // Widening a range to cover whole days used to happen here, as ISO
    // timestamps. The API now reads a bare date as the whole day in Bogota, so
    // the hook's job is only to always send a period.
    it("always sends a period, defaulting to the current month", async () => {
        const { result } = mount();
        await waitFor(() => expect(result.current.loading).toBe(false));

        const args = listProfits.mock.calls[0][1] as Record<string, unknown>;
        const today = todayInBogota();
        expect(args.year).toBe(today.year);
        expect(args.month).toBe(today.month);
        expect(args.date_from).toBeUndefined();
        expect(args.date_to).toBeUndefined();
    });

    it("gets the filtered total from the API", async () => {
        const { result } = mount();
        await waitFor(() => expect(result.current.totalFiltrado).toBe(999));
    });

    it("refetches when a movement invalidates profits", async () => {
        const { result, client } = mount();
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
            await invalidateMovement(client, { kind: "sale" });
        });

        await waitFor(() => expect(listProfits).toHaveBeenCalledTimes(2));
    });
});
