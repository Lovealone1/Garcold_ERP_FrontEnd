// services/sales/productos.api.ts
import salesApi from "../salesApi";
import type {
    Producto,
    ProductosPage,
    ProductoCreate,
    ProductoUpdate,
} from "@/types/productos";

export async function listProductos(
    page = 1,
    params?: { q?: string },
    nocacheToken?: number
): Promise<ProductosPage> {
    const { data } = await salesApi.get("/productos/", {
        params: { page, ...params, _ts: nocacheToken ?? Date.now() },
        headers: { "Cache-Control": "no-cache" },
    });
    return data as ProductosPage;
}

export async function listProductosAll(
    nocacheToken?: number
): Promise<Producto[]> {
    const { data } = await salesApi.get("/productos/all", {
        params: { _ts: nocacheToken ?? Date.now() },
        headers: { "Cache-Control": "no-cache" },
    });
    return data as Producto[];
}

export async function fetchAllProductos(
    params?: { q?: string },
    nocacheToken?: number
): Promise<Producto[]> {
    let page = 1;
    const acc: Producto[] = [];
    const first = await listProductos(page, params, nocacheToken);
    acc.push(...first.items);
    while (page < first.total_pages) {
        page += 1;
        const p = await listProductos(page, params, nocacheToken);
        acc.push(...p.items);
    }
    return acc;
}

export async function getProductoById(productoId: number): Promise<Producto> {
    const { data } = await salesApi.get(`/productos/${productoId}`);
    return data as Producto;
}

export async function createProducto(payload: ProductoCreate): Promise<Producto> {
    const { data } = await salesApi.post("/productos/crear", payload);
    return data as Producto;
}

export async function updateProducto(id: number, payload: ProductoUpdate): Promise<Producto> {
    const { data } = await salesApi.put(`/productos/actualizar/${id}`, payload);
    return data as Producto;
}

export async function deleteProducto(id: number): Promise<{ mensaje: string }> {
    const { data } = await salesApi.delete(`/productos/eliminar/${id}`);
    return data as { mensaje: string };
}

/* Extras según router */
export async function toggleProductoActivo(id: number): Promise<Producto> {
    const { data } = await salesApi.patch(`/productos/cambiar-estado/${id}`);
    return data as Producto;
}

export async function aumentarStock(id: number, cantidad: number): Promise<Producto> {
    const { data } = await salesApi.patch(`/productos/${id}/aumentar-stock`, { cantidad });
    return data as Producto;
}

export async function disminuirStock(id: number, cantidad: number): Promise<Producto> {
    const { data } = await salesApi.patch(`/productos/${id}/disminuir-stock`, { cantidad });
    return data as Producto;
}
