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
type ListOpts = { signal?: AbortSignal; q?: string; page_size?: number };

const ts = () => Date.now();
const nocache = { "Cache-Control": "no-cache" };

export async function listSuppliers(
  page = 1,
  opts: ListOpts = {}
): Promise<SupplierPage> {
  const { signal, q, page_size } = opts;
  const params: Record<string, string | number | undefined> = {
    page,
    page_size,
    ...(q ? { q } : {}),
  };

  const { data } = await salesApi.get("/suppliers/page", {
    params,
    signal,
  });
  return data as SupplierPage;
}

export async function fetchAllSuppliers(
  params?: Q,
  opts?: Opts
): Promise<Supplier[]> {
  const first = await listSuppliers(1, { q: params?.q });
  const acc = [...first.items];
  for (let p = 2; p <= first.total_pages; p++) {
    const page = await listSuppliers(p, { q: params?.q });
    acc.push(...page.items);
  }
  return acc;
}

export async function getSupplierById(
  supplierId: number,
  opts?: Opts
): Promise<Supplier> {
  const { data } = await salesApi.get(`/suppliers/by-id/${supplierId}`, {
    params: { _ts: opts?.nocacheToken ?? ts() },
    headers: nocache,
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
    headers: nocache,
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
    headers: nocache,
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
    headers: nocache,
    signal: opts?.signal,
  });
  return data as { message: string };
}

export async function listSuppliersAll(
  opts?: Opts
): Promise<SupplierLite[]> {
  const { data } = await salesApi.get("/suppliers", {
    params: { _ts: opts?.nocacheToken ?? ts() },
    headers: nocache,
    signal: opts?.signal,
  });
  const full: Supplier[] = data as Supplier[];
  return full.map((s) => ({ id: s.id, name: s.name }));
}
