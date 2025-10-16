import salesApi from "../salesApi";
import type {
    CategoriaGastosDTO,
    CategoriaGastosResponseDTO,
} from "@/types/categoria-gastos";

export async function listCategoriasGastos(
    nocacheToken?: number
): Promise<CategoriaGastosResponseDTO[]> {
    const { data } = await salesApi.get("/categoria-gastos/", {
        params: { _ts: nocacheToken ?? Date.now() },
        headers: { "Cache-Control": "no-cache" },
    });
    return data as CategoriaGastosResponseDTO[];
}

export async function createCategoriaGastos(
    payload: CategoriaGastosDTO
): Promise<CategoriaGastosResponseDTO> {
    const { data } = await salesApi.post("/categoria-gastos/crear", payload);
    return data as CategoriaGastosResponseDTO;
}

export async function deleteCategoriaGastos(
    id: number
): Promise<{ mensaje: string }> {
    const { data } = await salesApi.delete(`/categoria-gastos/eliminar/${id}`);
    return data as { mensaje: string };
}