import salesApi from "../salesApi";
import type { Status } from "@/types/status";


export async function listEstados(
    nocacheToken?: number
): Promise<Status[]> {
    const { data } = await salesApi.get("/statuses/", {
        params: { _ts: nocacheToken ?? Date.now() },
        headers: { "Cache-Control": "no-cache" },
    });
    return data as Status[];
}
