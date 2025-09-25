import salesApi from "../salesApi";
import type { Utilidad, UtilidadesPage, DetalleUtilidad } from "@/types/utilidades";

export async function listUtilidades(
  page = 1,
  nocacheToken?: number
): Promise<UtilidadesPage> {
  const { data } = await salesApi.get("/utilidades/", {
    params: { page, _ts: nocacheToken ?? Date.now() }, 
    headers: { "Cache-Control": "no-cache" },
  });
  return data as UtilidadesPage;
}

export async function getUtilidadByVentaId(ventaId: number): Promise<Utilidad> {
  const { data } = await salesApi.get(`/utilidades/venta/${ventaId}`);
  return data as Utilidad;
}

export async function fetchAllUtilidades(
  nocacheToken?: number
): Promise<Utilidad[]> {
  let page = 1;
  const acc: Utilidad[] = [];
  const first = await listUtilidades(page, nocacheToken);
  acc.push(...first.items);
  while (page < first.total_pages) {
    page += 1;
    const p = await listUtilidades(page, nocacheToken);
    acc.push(...p.items);
  }
  return acc;
}

export async function listDetallesUtilidadByVentaId(
  ventaId: number
): Promise<DetalleUtilidad[]> {
  const { data } = await salesApi.get(`/utilidades/venta/${ventaId}/detalles`);
  return data as DetalleUtilidad[];
}