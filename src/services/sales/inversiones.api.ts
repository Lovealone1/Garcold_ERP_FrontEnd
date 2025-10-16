import salesApi from "../salesApi";
import type {
  Inversion,
  InversionesPage,
  InversionCreate,
  InversionUpdateSaldo,
} from "@/types/inversiones";

export async function listInversiones(
  page = 1,
  nocacheToken?: number
): Promise<InversionesPage> {
  const { data } = await salesApi.get("/inversiones/", {
    params: { page, _ts: nocacheToken ?? Date.now() },
    headers: { "Cache-Control": "no-cache" },
  });
  return data as InversionesPage;
}

export async function getInversion(id: number): Promise<Inversion> {
  const { data } = await salesApi.get(`/inversiones/${id}`);
  return data as Inversion;
}

export async function createInversion(
  payload: InversionCreate
): Promise<Inversion> {
  const { data } = await salesApi.post("/inversiones/crear", payload);
  return data as Inversion;
}

export async function updateInversionSaldo(
  id: number,
  payload: InversionUpdateSaldo
): Promise<Inversion> {
  const { data } = await salesApi.put(`/inversiones/actualizar/${id}`, payload);
  return data as Inversion;
}

export async function deleteInversion(
  id: number
): Promise<{ mensaje: string }> {
  const { data } = await salesApi.delete(`/inversiones/eliminar/${id}`);
  return data as { mensaje: string };
}

export async function fetchAllInversiones(
  nocacheToken?: number
): Promise<Inversion[]> {
  let page = 1;
  const acc: Inversion[] = [];
  const first = await listInversiones(page, nocacheToken);
  acc.push(...first.items);
  while (page < first.total_pages) {
    page += 1;
    const p = await listInversiones(page, nocacheToken);
    acc.push(...p.items);
  }
  return acc;
}
