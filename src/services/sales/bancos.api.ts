import salesApi from "../salesApi";
import type { Banco, BancoCreate } from "@/types/bancos";

/** Lista todos los bancos (sin paginación). */
export async function listBancos(nocacheToken?: number): Promise<Banco[]> {
    const { data } = await salesApi.get("/bancos/", {
        params: { _ts: nocacheToken ?? Date.now() },            // ← cache-buster
        headers: { "Cache-Control": "no-cache" },               // ← anti caché
    });
    return data as Banco[];
}

/** Crea un banco. */
export async function createBanco(payload: BancoCreate): Promise<Banco> {
    const { data } = await salesApi.post("/bancos/crear", payload);
    return data as Banco;
}

/** Actualiza solo el saldo del banco. */
export async function updateSaldoBanco(id: number, nuevo_saldo: number): Promise<Banco> {
    const { data } = await salesApi.patch(`/bancos/saldo/${id}`, { nuevo_saldo });
    return data as Banco;
}

/** Elimina un banco. Backend responde { mensaje }. */
export async function deleteBanco(id: number): Promise<{ mensaje: string }> {
    const { data } = await salesApi.delete(`/bancos/eliminar/${id}`);
    return data as { mensaje: string };
}
