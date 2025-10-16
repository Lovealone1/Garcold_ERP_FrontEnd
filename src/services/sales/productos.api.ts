// services/sales/products.api.ts
import salesApi from "../salesApi";
import type {
    ProductDTO,
    ProductPageDTO,
    ProductCreate,
    ProductUpdate,
    SaleProductsDTO,
} from "@/types/productos";

type Q = { q?: string }; // el back no filtra por q; útil si luego lo agregas
type Opts = { nocacheToken?: number; signal?: AbortSignal };

const ts = () => Date.now();
const nocache = { "Cache-Control": "no-cache" };

/** GET /products/page?page=1 */
export async function listProductsPage(page = 1, opts?: Opts): Promise<ProductPageDTO> {
    const { data } = await salesApi.get("/products/page", {
        params: { page },            // solo page
        signal: opts?.signal,
    });
    return data as ProductPageDTO;
}

/** GET /products  → lista completa */
export async function listAllProducts(opts?: Opts): Promise<ProductDTO[]> {
    const { data } = await salesApi.get("/products", {
        params: { _ts: opts?.nocacheToken ?? ts() },
        headers: nocache,
        signal: opts?.signal,
    });
    return data as ProductDTO[];
}

/** Pager helper que acumula todas las páginas de /products/page */
export async function fetchAllProducts(
    params?: Q,
    opts?: Opts
): Promise<ProductDTO[]> {
    const first = await listProductsPage(1);
    const acc = [...first.items];
    for (let p = 2; p <= first.total_pages; p++) {
        const page = await listProductsPage(p);
        acc.push(...page.items);
    }
    return acc;
}

/** GET /products/by-id/{id} */
export async function getProductById(
    id: number,
    opts?: Opts
): Promise<ProductDTO> {
    const { data } = await salesApi.get(`/products/by-id/${id}`, {
        params: { _ts: opts?.nocacheToken ?? ts() },
        headers: nocache,
        signal: opts?.signal,
    });
    return data as ProductDTO;
}

/** POST /products/create */
export async function createProduct(
    payload: ProductCreate,
    opts?: Opts
): Promise<ProductDTO> {
    const { data } = await salesApi.post("/products/create", payload, {
        params: { _ts: opts?.nocacheToken ?? ts() },
        headers: nocache,
        signal: opts?.signal,
    });
    return data as ProductDTO;
}

/** PATCH /products/by-id/{id} */
export async function updateProduct(
    id: number,
    payload: ProductUpdate,
    opts?: Opts
): Promise<ProductDTO> {
    const { data } = await salesApi.patch(`/products/by-id/${id}`, payload, {
        params: { _ts: opts?.nocacheToken ?? ts() },
        headers: nocache,
        signal: opts?.signal,
    });
    return data as ProductDTO;
}

/** DELETE /products/by-id/{id} */
export async function deleteProduct(
    id: number,
    opts?: Opts
): Promise<{ message: string }> {
    const { data } = await salesApi.delete(`/products/by-id/${id}`, {
        params: { _ts: opts?.nocacheToken ?? ts() },
        headers: nocache,
        signal: opts?.signal,
    });
    return data as { message: string };
}

/** PATCH /products/by-id/{id}/increase  body: { amount } */
export async function increaseQuantity(
    id: number,
    amount: number,
    opts?: Opts
): Promise<ProductDTO> {
    const { data } = await salesApi.patch(
        `/products/by-id/${id}/increase`,
        { amount },
        { headers: nocache, signal: opts?.signal }
    );
    return data as ProductDTO;
}

/** PATCH /products/by-id/{id}/decrease  body: { amount } */
export async function decreaseQuantity(
    id: number,
    amount: number,
    opts?: Opts
): Promise<ProductDTO> {
    const { data } = await salesApi.patch(
        `/products/by-id/${id}/decrease`,
        { amount },
        { headers: nocache, signal: opts?.signal }
    );
    return data as ProductDTO;
}

/** PATCH /products/by-id/{id}/toggle-active */
export async function toggleProductActive(
    id: number,
    opts?: Opts
): Promise<ProductDTO> {
    const { data } = await salesApi.patch(
        `/products/by-id/${id}/toggle-active`,
        {},
        { headers: nocache, signal: opts?.signal }
    );
    return data as ProductDTO;
}

/** GET /products/top?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD&limit=10 */
export type TopProductQty = {
    product_id: number;
    product: string;
    total_quantity: number;
};
export async function topProductsByQuantity(
    args: { date_from: string; date_to: string; limit?: number },
    opts?: Opts
): Promise<TopProductQty[]> {
    const { data } = await salesApi.get("/products/top", {
        params: { ...args, _ts: opts?.nocacheToken ?? ts() },
        headers: nocache,
        signal: opts?.signal,
    });
    return data as TopProductQty[];
}

/** POST /products/sold-in-range */
export async function soldProductsInRange(
    payload: { date_from: string | Date; date_to: string | Date; product_ids: number[] },
    opts?: Opts
): Promise<SaleProductsDTO[]> {
    const body = {
        date_from:
            typeof payload.date_from === "string"
                ? payload.date_from
                : payload.date_from.toISOString().slice(0, 10),
        date_to:
            typeof payload.date_to === "string"
                ? payload.date_to
                : payload.date_to.toISOString().slice(0, 10),
        product_ids: payload.product_ids,
    };
    const { data } = await salesApi.post("/products/sold-in-range", body, {
        params: { _ts: opts?.nocacheToken ?? ts() },
        headers: nocache,
        signal: opts?.signal,
    });
    return data as SaleProductsDTO[];
}
