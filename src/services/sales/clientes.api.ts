import salesApi from "../salesApi";
import type { Cliente, ClientesPage, ClienteCreate, ClienteUpdate, ClienteLite } from "@/types/clientes";

export async function listClientes(
  page = 1,
  params?: { q?: string },
  nocacheToken?: number
): Promise<ClientesPage> {
  const { data } = await salesApi.get("/clientes/", {
    params: { page, ...params, _ts: nocacheToken ?? Date.now() }, // ← cache-buster
    headers: { "Cache-Control": "no-cache" },                      // ← anti caché
  });
  return data as ClientesPage;
}

export async function fetchAllClientes(
  params?: { q?: string },
  nocacheToken?: number
): Promise<Cliente[]> {
  let page = 1;
  const acc: Cliente[] = [];
  const first = await listClientes(page, params, nocacheToken);
  acc.push(...first.items);
  while (page < first.total_pages) {
    page += 1;
    const p = await listClientes(page, params, nocacheToken);
    acc.push(...p.items);
  }
  return acc;
}

export async function getClienteById(clienteId: number): Promise<Cliente> {
  const { data } = await salesApi.get(`/clientes/${clienteId}`);
  return data as Cliente;
}

export async function createCliente(data: ClienteCreate): Promise<Cliente> {
  const { data: res } = await salesApi.post("/clientes/crear", data);
  return res;
}

export async function updateCliente(id: number, payload: ClienteUpdate): Promise<Cliente> {
  const { data } = await salesApi.put(`/clientes/actualizar/${id}`, payload);
  return data as Cliente;
}

export async function deleteCliente(id: number): Promise<Cliente> {
  const { data } = await salesApi.delete(`/clientes/eliminar/${id}`);
  return data as Cliente;
}

export async function listClientesAll(nocacheToken?: number): Promise<ClienteLite[]> {
  const { data } = await salesApi.get("/clientes/all", {
    params: { _ts: nocacheToken ?? Date.now() },
    headers: { "Cache-Control": "no-cache" },
  });
  return data as ClienteLite[];
}