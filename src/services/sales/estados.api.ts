import salesApi from "../salesApi";
import type { Estado } from "@/types/estados";


export async function listEstados(
    nocacheToken?: number
): Promise<Estado[]> {
    const { data } = await salesApi.get("/estados/", {
        params: { _ts: nocacheToken ?? Date.now() },
        headers: { "Cache-Control": "no-cache" },
    });
    return data as Estado[];
}
