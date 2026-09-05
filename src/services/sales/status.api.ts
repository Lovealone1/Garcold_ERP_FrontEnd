import salesApi from "../salesApi";
import type { Status } from "@/types/status";


export async function listEstados(
    nocacheToken?: number
): Promise<Status[]> {
    const { data } = await salesApi.get("/statuses", {
        params: { _ts: nocacheToken ?? Date.now() },
        });
    return data as Status[];
}
