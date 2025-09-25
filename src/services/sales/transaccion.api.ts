import salesApi from "../salesApi";
import type {
    TransaccionesPage,
    TransaccionResponse,
    TransaccionCreate,
    TransaccionCreated,
} from "@/types/transacciones";

export async function listTransacciones(
    page = 1,
    nocacheToken?: number
): Promise<TransaccionesPage> {
    const { data } = await salesApi.get("/transacciones/", {
        params: { page, _ts: nocacheToken ?? Date.now() },
        headers: { "Cache-Control": "no-cache" },
    });
    return data as TransaccionesPage;
}

export async function fetchAllTransacciones(
    nocacheToken?: number
): Promise<TransaccionResponse[]> {
    let page = 1;
    const acc: TransaccionResponse[] = [];
    const first = await listTransacciones(page, nocacheToken);
    acc.push(...first.items);
    while (page < first.total_pages) {
        page += 1;
        const p = await listTransacciones(page, nocacheToken);
        acc.push(...p.items);
    }
    return acc;
}

export async function createTransaccion(
    payload: TransaccionCreate
): Promise<TransaccionCreated> {
    const { data } = await salesApi.post("/transacciones/crear", null, {
        params: payload,
    });
    return data as TransaccionCreated;
}

export async function deleteTransaccion(
    transaccionId: number
): Promise<{ mensaje: string }> {
    const { data } = await salesApi.delete(
        `/transacciones/eliminar/${transaccionId}`
    );
    return data as { mensaje: string }
};