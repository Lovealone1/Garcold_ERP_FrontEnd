import salesApi from "../salesApi";
import type {
    Compra,
    ComprasPage,
    CompraCreate,
    DetalleCompraView,
    PagoCompra,
    PagoCompraCreate,
} from "@/types/compras";

export async function listCompras(
    page = 1,
    params?: Record<string, any>,
    nocacheToken?: number
): Promise<ComprasPage> {
    const { data } = await salesApi.get("/compras/", {
        params: { page, ...params, _ts: nocacheToken ?? Date.now() },
        headers: { "Cache-Control": "no-cache" },
    });
    return data as ComprasPage;
}

export async function getCompraById(compraId: number, nocacheToken?: number): Promise<Compra> {
    const { data } = await salesApi.get(`/compras/${compraId}`, {
        params: { _ts: nocacheToken ?? Date.now() },
        headers: { "Cache-Control": "no-cache" },
    });
    return data as Compra;
}

export async function createCompra(payload: CompraCreate): Promise<Compra> {
    const { data } = await salesApi.post("/compras/crear", payload);
    return data as Compra;
}

export async function deleteCompra(compraId: number): Promise<{ mensaje: string }> {
    const { data } = await salesApi.delete(`/compras/eliminar/${compraId}`);
    return data as { mensaje: string };
}

export async function listDetallesCompra(
    compraId: number,
    nocacheToken?: number
): Promise<DetalleCompraView[]> {
    const { data } = await salesApi.get(`/compras/${compraId}/detalles`, {
        params: { _ts: nocacheToken ?? Date.now() },
        headers: { "Cache-Control": "no-cache" },
    });
    return data as DetalleCompraView[];
}

export async function listPagosCompra(compraId: number, nocacheToken?: number): Promise<PagoCompra[]> {
    const { data } = await salesApi.get(`/pagos/compras/${compraId}`, {
        params: { _ts: nocacheToken ?? Date.now() },
        headers: { "Cache-Control": "no-cache" },
    });
    return data as PagoCompra[];
}

export async function createPagoCompra(
    compraId: number,
    payload: PagoCompraCreate
): Promise<PagoCompra> {
    const { data } = await salesApi.post(`/pagos/compras/${compraId}`, payload, {
        headers: { "Cache-Control": "no-cache" },
    });
    return data as PagoCompra;
}

export async function deletePagoCompra(pagoId: number) {
    const { data } = await salesApi.delete(`/pagos/compras/${pagoId}`, {
        headers: { "Cache-Control": "no-cache" },
    });
    return data;
}