import salesApi from "../salesApi";
import type { Gasto, GastosPage, GastoCreate, GastoCreated } from "@/types/expense";

export async function listGastos(
    page = 1,
    params?: Record<string, any>,
    nocacheToken?: number
): Promise<GastosPage> {
    const { data } = await salesApi.get("/gastos/", {
        params: { page, ...(params ?? {}), _ts: nocacheToken ?? Date.now() },
        headers: { "Cache-Control": "no-cache" },
    });
    return data as GastosPage;
}

export async function fetchAllGastos(
    params?: Record<string, any>,
    nocacheToken?: number
): Promise<Gasto[]> {
    let page = 1;
    const acc: Gasto[] = [];
    const first = await listGastos(page, params, nocacheToken);
    acc.push(...first.items);
    while (page < first.total_pages) {
        page += 1;
        const p = await listGastos(page, params, nocacheToken);
        acc.push(...p.items);
    }
    return acc;
}

export async function createGasto(payload: GastoCreate): Promise<GastoCreated> {
    const { data } = await salesApi.post("/gastos/crear", payload);
    return data as GastoCreated;
}

export async function deleteGasto(id: number): Promise<GastoCreated> {
    const { data } = await salesApi.delete(`/gastos/eliminar/${id}`);
    return data as GastoCreated;
}
