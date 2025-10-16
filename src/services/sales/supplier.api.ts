import salesApi from "../salesApi";
import type {
  Supplier,
  SupplierPage,
  SupplierCreate,
  SupplierUpdate,
  SupplierLite,
} from "@/types/supplier";

export async function listSuppliers(
  page = 1,
  params?: { q?: string },
  nocacheToken?: number
): Promise<SupplierPage> {
  const { data } = await salesApi.get("/suppliers/page", {
    params: { page, ...params, _ts: nocacheToken ?? Date.now() },
    headers: { "Cache-Control": "no-cache" },
  });
  return data as SupplierPage;
}

export async function fetchAllSuppliers(
  params?: { q?: string },
  nocacheToken?: number
): Promise<Supplier[]> {
  let page = 1;
  const acc: Supplier[] = [];
  const first = await listSuppliers(page, params, nocacheToken);
  acc.push(...first.items);
  while (page < first.total_pages) {
    page += 1;
    const p = await listSuppliers(page, params, nocacheToken);
    acc.push(...p.items);
  }
  return acc;
}

export async function getSupplierById(supplierId: number): Promise<Supplier> {
  const { data } = await salesApi.get(`/suppliers/by-id/${supplierId}`);
  return data as Supplier;
}

export async function createSupplier(payload: SupplierCreate): Promise<Supplier> {
  const { data } = await salesApi.post("/suppliers/create", payload);
  return data as Supplier;
}

export async function updateSupplier(id: number, payload: SupplierUpdate): Promise<Supplier> {
  const { data } = await salesApi.patch(`/suppliers/by-id/${id}`, payload);
  return data as Supplier;
}

export async function deleteSupplier(id: number): Promise<{ message: string }> {
  const { data } = await salesApi.delete(`/suppliers/by-id/${id}`);
  return data as { message: string };
}

export async function listSuppliersAll(nocacheToken?: number): Promise<SupplierLite[]> {
  const { data } = await salesApi.get("/suppliers", {
    params: { _ts: nocacheToken ?? Date.now() },
    headers: { "Cache-Control": "no-cache" },
  });
  const full: Supplier[] = data as Supplier[];
  return full.map((s) => ({ id: s.id, name: s.name }));
}
