import salesApi from "../salesApi";
import type { Venta, VentasPage, VentaCreate, DetalleVentaView, PagoVenta, PagoVentaCreate } from "@/types/ventas";

export async function listVentas(
  page = 1,
  params?: Record<string, any>,
  nocacheToken?: number
): Promise<VentasPage> {
  const { data } = await salesApi.get("/ventas/", {
    params: { page, ...params, _ts: nocacheToken ?? Date.now() },
    headers: { "Cache-Control": "no-cache" },
  });
  return data as VentasPage;
}

export async function getVentaById(ventaId: number, nocacheToken?: number): Promise<Venta> {
  const { data } = await salesApi.get(`/ventas/${ventaId}`, {
    params: { _ts: nocacheToken ?? Date.now() },
    headers: { "Cache-Control": "no-cache" },
  });
  return data as Venta;
}

export async function createVenta(payload: VentaCreate): Promise<Venta> {
  const { data } = await salesApi.post("/ventas/crear", payload);
  return data as Venta;
}

export async function deleteVenta(ventaId: number): Promise<{ mensaje: string }> {
  const { data } = await salesApi.delete(`/ventas/eliminar/${ventaId}`);
  return data as { mensaje: string };
}

export async function listDetallesVenta(
  ventaId: number,
  nocacheToken?: number
): Promise<DetalleVentaView[]> {
  const { data } = await salesApi.get(`/ventas/${ventaId}/detalles`, {
    params: { _ts: nocacheToken ?? Date.now() },
    headers: { "Cache-Control": "no-cache" },
  });
  return data as DetalleVentaView[];
}

export async function listPagosVenta(ventaId: number, nocacheToken?: number) {
  const { data } = await salesApi.get(`/pagos/ventas/${ventaId}`, {
    params: { _ts: nocacheToken ?? Date.now() },
    headers: { "Cache-Control": "no-cache" },
  });
  return data;
}

export async function createPagoVenta(ventaId: number, payload: { banco_id: number; monto: number; }) {
  const { data } = await salesApi.post(`/pagos/ventas/${ventaId}`, payload, {
    headers: { "Cache-Control": "no-cache" },
  });
  return data;
}

export async function deletePagoVenta(pagoId: number) {
  const { data } = await salesApi.delete(`/pagos/ventas/${pagoId}`, {
    headers: { "Cache-Control": "no-cache" },
  });
  return data;
}