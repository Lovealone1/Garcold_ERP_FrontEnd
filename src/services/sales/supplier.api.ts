import salesApi from "../salesApi";
import type {
  Supplier,
  SupplierPage,
  SupplierCreate,
  SupplierUpdate,
  SupplierLite,
} from "@/types/supplier";

type Q = { q?: string };
type Opts = { nocacheToken?: number; signal?: AbortSignal };
type ListOpts = {
  signal?: AbortSignal;
  q?: string;
  page_size?: number;
  cities?: string[];
};

const ts = () => Date.now();
export async function listSuppliers(
  page = 1,
  opts: ListOpts = {}
): Promise<SupplierPage> {
  const { signal, q, page_size, cities } = opts;
  const params: Record<string, unknown> = {
    page,
    page_size,
    ...(q ? { q } : {}),
    ...(cities?.length ? { cities } : {}),
  };

  const { data } = await salesApi.get("/suppliers/page", {
    params,
    signal,
  });
  return data as SupplierPage;
}

export async function getSupplierById(
  supplierId: number,
  opts?: Opts
): Promise<Supplier> {
  const { data } = await salesApi.get(`/suppliers/by-id/${supplierId}`, {
    params: { _ts: opts?.nocacheToken ?? ts() },
    signal: opts?.signal,
  });
  return data as Supplier;
}

export async function createSupplier(
  payload: SupplierCreate,
  opts?: Opts
): Promise<Supplier> {
  const { data } = await salesApi.post("/suppliers/create", payload, {
    params: { _ts: opts?.nocacheToken ?? ts() },
    signal: opts?.signal,
  });
  return data as Supplier;
}

export async function updateSupplier(
  id: number,
  payload: SupplierUpdate,
  opts?: Opts
): Promise<Supplier> {
  const { data } = await salesApi.patch(`/suppliers/by-id/${id}`, payload, {
    params: { _ts: opts?.nocacheToken ?? ts() },
    signal: opts?.signal,
  });
  return data as Supplier;
}

export async function deleteSupplier(
  id: number,
  opts?: Opts
): Promise<{ message: string }> {
  const { data } = await salesApi.delete(`/suppliers/by-id/${id}`, {
    params: { _ts: opts?.nocacheToken ?? ts() },
    signal: opts?.signal,
  });
  return data as { message: string };
}

export async function listSuppliersAll(
  opts?: Opts
): Promise<SupplierLite[]> {
  const { data } = await salesApi.get("/suppliers", {
    params: { _ts: opts?.nocacheToken ?? ts() },
    signal: opts?.signal,
  });
  const full: Supplier[] = data as Supplier[];
  return full.map((s) => ({ id: s.id, name: s.name }));
}

/** Cities present in the data, for the filter multi-select. */
export async function listSupplierCities(
  opts: { signal?: AbortSignal } = {}
): Promise<string[]> {
  const { data } = await salesApi.get("/suppliers/cities", { signal: opts.signal });
  return data as string[];
}
