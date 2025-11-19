import salesApi from "../salesApi";
import type {
    ProductDTO,
    ProductPageDTO,
    ProductCreate,
    ProductUpdate,
    SaleProductsDTO
} from "@/types/product";

import { TopProductQty } from "@/types/product";

type Q = { q?: string }; 
type Opts = { nocacheToken?: number; signal?: AbortSignal };
type ListOpts = { signal?: AbortSignal; q?: string; page_size?: number };

const ts = () => Date.now();
const nocache = { "Cache-Control": "no-cache" };

export async function listProducts(
    page = 1,
    opts: ListOpts = {}
): Promise<ProductPageDTO> {
    const { signal, q, page_size } = opts;
    const params: Record<string, string | number | undefined> = {
        page,
        page_size,
        ...(q ? { q } : {}),
    };

    const { data } = await salesApi.get("/products/page", {
        params,
        signal,
        withCredentials: false,
    });

    return data as ProductPageDTO;
}

export async function listAllProducts(opts?: Opts): Promise<ProductDTO[]> {
    const { data } = await salesApi.get("/products", {
        params: { _ts: opts?.nocacheToken ?? ts() },
        headers: nocache,
        signal: opts?.signal,
    });
    return data as ProductDTO[];
}

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

export async function getProductByBarcode(
  barcode: string,
  opts?: Opts
): Promise<ProductDTO | null> {
  try {
    const { data } = await salesApi.get(
      `/products/by-barcode/${encodeURIComponent(barcode)}`,
      {
        params: { _ts: opts?.nocacheToken ?? ts() },
        headers: nocache,
        signal: opts?.signal,
      }
    );
    return data as ProductDTO;
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return null;
    }
    throw error;
  }
}