import salesApi from "../salesApi";
import type {
  Credito,
  CreditosPage,
  CreditoCreate,
  CreditoUpdateMonto,
} from "@/types/creditos";

export async function listCreditos(
  page = 1,
  nocacheToken?: number
): Promise<CreditosPage> {
  const { data } = await salesApi.get("/creditos/", {
    params: { page, _ts: nocacheToken ?? Date.now() },
    headers: { "Cache-Control": "no-cache" },
  });
  return data as CreditosPage;
}

export async function getCredito(id: number): Promise<Credito> {
  const { data } = await salesApi.get(`/creditos/${id}`);
  return data as Credito;
}

export async function createCredito(payload: CreditoCreate): Promise<Credito> {
  const { data } = await salesApi.post("/creditos/crear", payload);
  return data as Credito;
}

export async function updateCreditoMonto(
  id: number,
  payload: CreditoUpdateMonto
): Promise<Credito> {
  const { data } = await salesApi.put(`/creditos/actualizar/${id}`, payload);
  return data as Credito;
}

export async function deleteCredito(id: number): Promise<{ mensaje: string }> {
  const { data } = await salesApi.delete(`/creditos/eliminar/${id}`);
  return data as { mensaje: string };
}

export async function fetchAllCreditos(
  nocacheToken?: number
): Promise<Credito[]> {
  let page = 1;
  const acc: Credito[] = [];
  const first = await listCreditos(page, nocacheToken);
  acc.push(...first.items);
  while (page < first.total_pages) {
    page += 1;
    const p = await listCreditos(page, nocacheToken);
    acc.push(...p.items);
  }
  return acc;
}
