import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import MockAdapter from "axios-mock-adapter";
import type { AxiosRequestConfig } from "axios";
import type { Sale } from "@/types/sale";
import { makeTestQueryClient, makeWrapper } from "@/test/queryWrapper";

vi.mock("@/lib/supabase/client", () => ({
    supabase: () => ({ auth: { getSession: async () => ({ data: { session: null } }) } }),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/components/providers/NotificationsProvider", () => ({
    useNotifications: () => ({ success: vi.fn(), error: vi.fn() }),
}));
vi.mock("@/features/ventas/ViewDetalleVentas", () => ({ default: () => null }));
vi.mock("@/features/ventas/PagoVentaModal", () => ({ default: () => null }));
vi.mock("@/features/factura/FacturaPreviewModal", () => ({ default: () => null }));
vi.mock("@/components/ui/DateRangePicker/DateRangePicker", () => ({
    default: ({ onChange }: { onChange: (range: { from: Date; to: Date }) => void }) => (
        <button onClick={() => onChange({ from: new Date(2026, 8, 1), to: new Date(2026, 8, 30) })}>
            Seleccionar septiembre
        </button>
    ),
}));

import api from "@/services/api";
import VentasPage from "@/app/(app)/comercial/ventas/page";

const olderCredit: Sale = {
    id: 21, customer: "Cliente crédito anterior", bank: "Caja", status: "Venta Credito",
    total: 900, remaining_balance: 600, created_at: "2026-02-15T12:00:00Z",
};
const currentSale: Sale = {
    id: 22, customer: "Cliente contado actual", bank: "Caja", status: "Venta Contado",
    total: 200, remaining_balance: 0, created_at: "2026-09-04T12:00:00Z",
};

// Reproduce the API contract: omitting period defaults to the current month.
function filtered(config: AxiosRequestConfig) {
    const params = config.params ?? {};
    return (params.period === "all" ? [currentSale, olderCredit] : [currentSale])
        .filter(sale => !params.status || sale.status === params.status);
}

describe("sales UI consumption", () => {
    let mock: MockAdapter;
    beforeEach(() => {
        mock = new MockAdapter(api);
        mock.onGet("/api/v1/sales/filter-options").reply(200, {
            banks: ["Caja"], statuses: ["Venta Contado", "Venta Credito", "Compra Credito"],
        });
        mock.onGet("/api/v1/sales").reply(config => {
            const items = filtered(config);
            return [200, { items, page: 1, page_size: 8, total: items.length, total_pages: 1 }];
        });
        mock.onGet("/api/v1/sales/summary").reply(config => {
            const items = filtered(config);
            return [200, {
                total: items.reduce((sum, sale) => sum + sale.total, 0),
                remaining_balance: items.reduce((sum, sale) => sum + sale.remaining_balance, 0),
                count: items.length,
            }];
        });
    });
    afterEach(() => mock.restore());

    function mount() {
        render(<VentasPage />, { wrapper: makeWrapper(makeTestQueryClient()) });
    }

    it("includes older active credits when the UI has no date filter", async () => {
        mount();
        expect(await screen.findAllByText(olderCredit.customer)).toHaveLength(2);
        for (const path of ["/api/v1/sales", "/api/v1/sales/summary"]) {
            expect(mock.history.get.find(r => r.url === path)?.params.period).toBe("all");
        }
    });

    it("uses sales status options and shows older credit sales with matching totals", async () => {
        mount();
        await screen.findAllByText(olderCredit.customer);
        const select = screen.getAllByRole("combobox", { name: "Estado de venta" })[0];
        fireEvent.mouseDown(select);
        const listbox = await screen.findByRole("listbox");
        expect(within(listbox).queryByRole("option", { name: "Compra Credito" })).not.toBeInTheDocument();
        fireEvent.click(within(listbox).getByRole("option", { name: olderCredit.status }));
        await waitFor(() => expect(screen.queryAllByText(currentSale.customer)).toHaveLength(0));
        expect(screen.getAllByText(olderCredit.customer)).toHaveLength(2);
        await waitFor(() => expect(screen.getByTitle("Total ventas filtradas")).toHaveTextContent("900"));
        for (const path of ["/api/v1/sales", "/api/v1/sales/summary"]) {
            expect(mock.history.get.findLast(r => r.url === path)?.params).toMatchObject({
                period: "all", status: "Venta Credito",
            });
        }
        expect(mock.history.get.every(r => !r.url?.includes("/status"))).toBe(true);
    });

    it("honors selected dates and restores older credits after clearing filters", async () => {
        mount();
        await screen.findAllByText(olderCredit.customer);
        fireEvent.click(screen.getAllByText("Seleccionar septiembre")[0]);
        await waitFor(() => expect(screen.queryAllByText(olderCredit.customer)).toHaveLength(0));
        for (const path of ["/api/v1/sales", "/api/v1/sales/summary"]) {
            const params = mock.history.get.findLast(r => r.url === path)?.params;
            expect(params).toMatchObject({ date_from: "2026-09-01", date_to: "2026-09-30" });
            expect(params.period).toBeUndefined();
        }
        fireEvent.click(screen.getByText("Limpiar filtros"));
        expect(await screen.findAllByText(olderCredit.customer)).toHaveLength(2);
    });

    it("shows a load failure instead of claiming there are no sales", async () => {
        mock.onGet("/api/v1/sales").reply(500);
        mount();
        expect(await screen.findByRole("alert")).toHaveTextContent("No se pudieron cargar las ventas");
        expect(screen.queryByText("Sin registros")).not.toBeInTheDocument();
    });
});
