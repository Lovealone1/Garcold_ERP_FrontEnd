import salesApi from "../salesApi";
import type { Proveedor, ProveedoresPage, ProveedorCreate, ProveedorUpdate } from "@/types/proveedores";

export async function listProveedores(
    page = 1,
    params?: { q?: string },
    nocacheToken?: number
): Promise<ProveedoresPage> {
    const { data } = await salesApi.get("/proveedores/", {
        params: { page, ...params, _ts: nocacheToken ?? Date.now() }, // ← cache-buster
        headers: { "Cache-Control": "no-cache" },                      // ← anti caché
    });
    return data as ProveedoresPage;
}

export async function fetchAllProveedores(
    params?: { q?: string },
    nocacheToken?: number
): Promise<Proveedor[]> {
    let page = 1;
    const acc: Proveedor[] = [];
    const first = await listProveedores(page, params, nocacheToken);
    acc.push(...first.items);
    while (page < first.total_pages) {
        page += 1;
        const p = await listProveedores(page, params, nocacheToken);
        acc.push(...p.items);
    }
    return acc;
}

export async function getProveedorById(proveedorId: number): Promise<Proveedor> {
    const { data } = await salesApi.get(`/proveedores/${proveedorId}`);
    return data as Proveedor;
}

export async function createProveedor(data: ProveedorCreate): Promise<Proveedor> {
    const { data: res } = await salesApi.post("/proveedores/crear", data);
    return res;
}

export async function updateProveedor(id: number, payload: ProveedorUpdate): Promise<Proveedor> {
    const { data } = await salesApi.put(`/proveedores/actualizar/${id}`, payload);
    return data as Proveedor;
}

export async function deleteProveedor(id: number): Promise<Proveedor> {
    const { data } = await salesApi.delete(`/proveedores/eliminar/${id}`);
    return data as Proveedor;
}
