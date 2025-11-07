import salesApi from "../salesApi";
import type {
  Customer,
  CustomerPage,
  CustomerCreate,
  CustomerUpdate,
  CustomerLite,
  CustomerStandalonePaymentIn,
} from "@/types/customer";

type Q = { q?: string };
type Opts = { nocacheToken?: number; signal?: AbortSignal };
type ListOpts = { signal?: AbortSignal; q?: string; page_size?: number };

const ts = () => Date.now();
const nocache = { "Cache-Control": "no-cache" };

export async function listCustomers(
  page = 1,
  opts: ListOpts = {}
): Promise<CustomerPage> {
  const { signal, q, page_size } = opts;
  const params: Record<string, string | number | undefined> = {
    page,
    page_size,
    ...(q ? { q } : {}),
  };

  const { data } = await salesApi.get("/customers/page", {
    params,
    signal,
  });
  return data as CustomerPage;
}

export async function fetchAllCustomers(
  params?: Q,
  opts?: Opts
): Promise<Customer[]> {
  const first = await listCustomers(1, { q: params?.q });
  const acc = [...first.items];
  for (let p = 2; p <= first.total_pages; p++) {
    const page = await listCustomers(p, { q: params?.q });
    acc.push(...page.items);
  }
  return acc;
}

export async function getCustomerById(
  customerId: number,
  opts?: Opts
): Promise<Customer> {
  const { data } = await salesApi.get(`/customers/by-id/${customerId}`, {
    params: { _ts: opts?.nocacheToken ?? ts() },
    headers: nocache,
    signal: opts?.signal,
  });
  return data as Customer;
}

export async function createCustomer(
  payload: CustomerCreate,
  opts?: Opts
): Promise<Customer> {
  const { data } = await salesApi.post("/customers/create", payload, {
    params: { _ts: opts?.nocacheToken ?? ts() },
    headers: nocache,
    signal: opts?.signal,
  });
  return data as Customer;
}

export async function updateCustomer(
  id: number,
  payload: CustomerUpdate,
  opts?: Opts
): Promise<Customer> {
  const { data } = await salesApi.patch(`/customers/by-id/${id}`, payload, {
    params: { _ts: opts?.nocacheToken ?? ts() },
    headers: nocache,
    signal: opts?.signal,
  });
  return data as Customer;
}

export async function updateCustomerBalance(
  id: number,
  newBalance: number,
  opts?: Opts
): Promise<Customer> {
  const { data } = await salesApi.patch(
    `/customers/by-id/${id}/balance`,
    { new_balance: newBalance },
    { params: { _ts: opts?.nocacheToken ?? ts() }, headers: nocache, signal: opts?.signal }
  );
  return data as Customer;
}

export async function deleteCustomer(
  id: number,
  opts?: Opts
): Promise<{ message: string }> {
  const { data } = await salesApi.delete(`/customers/by-id/${id}`, {
    params: { _ts: opts?.nocacheToken ?? ts() },
    headers: nocache,
    signal: opts?.signal,
  });
  return data as { message: string };
}

export async function listCustomersAll(
  opts?: Opts
): Promise<CustomerLite[]> {
  const { data } = await salesApi.get("/customers", {
    params: { _ts: opts?.nocacheToken ?? ts() },
    headers: nocache,
    signal: opts?.signal,
  });
  const full: Customer[] = data as Customer[];
  return full.map((c) => ({ id: c.id, name: c.name }));
}

export async function createCustomerSimplePayment(
  customerId: number,
  payload: CustomerStandalonePaymentIn,
  opts?: Opts
): Promise<boolean> {
  const res = await salesApi.post(
    `/customers/by-id/${customerId}/payments/simple`,
    payload,
    { params: { _ts: opts?.nocacheToken ?? ts() }, headers: nocache, signal: opts?.signal }
  );
  return res.data as boolean;
}
