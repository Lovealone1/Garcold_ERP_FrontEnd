import salesApi from "../salesApi";
import type {
  Customer,
  CustomerPage,
  CustomerCreate,
  CustomerUpdate,
  CustomerLite,
  CustomerStandalonePaymentIn
} from "@/types/customer";

export async function listCustomers(
  page = 1,
  params?: { q?: string },
  nocacheToken?: number
): Promise<CustomerPage> {
  const { data } = await salesApi.get("/customers/page", {
    params: { page, ...params, _ts: nocacheToken ?? Date.now() },
    headers: { "Cache-Control": "no-cache" },
  });
  return data as CustomerPage;
}

export async function fetchAllCustomers(
  params?: { q?: string },
  nocacheToken?: number
): Promise<Customer[]> {
  let page = 1;
  const acc: Customer[] = [];
  const first = await listCustomers(page, params, nocacheToken);
  acc.push(...first.items);
  while (page < first.total_pages) {
    page += 1;
    const p = await listCustomers(page, params, nocacheToken);
    acc.push(...p.items);
  }
  return acc;
}

export async function getCustomerById(customerId: number): Promise<Customer> {
  const { data } = await salesApi.get(`/customers/by-id/${customerId}`);
  return data as Customer;
}

export async function createCustomer(payload: CustomerCreate): Promise<Customer> {
  const { data } = await salesApi.post("/customers/create", payload);
  return data as Customer;
}

export async function updateCustomer(id: number, payload: CustomerUpdate): Promise<Customer> {
  const { data } = await salesApi.patch(`/customers/by-id/${id}`, payload);
  return data as Customer;
}

export async function updateCustomerBalance(id: number, newBalance: number): Promise<Customer> {
  const { data } = await salesApi.patch(`/customers/by-id/${id}/balance`, {
    new_balance: newBalance,
  });
  return data as Customer;
}

export async function deleteCustomer(id: number): Promise<{ message: string }> {
  const { data } = await salesApi.delete(`/customers/by-id/${id}`);
  return data as { message: string };
}

export async function listCustomersAll(nocacheToken?: number): Promise<CustomerLite[]> {
  const { data } = await salesApi.get("/customers", {
    params: { _ts: nocacheToken ?? Date.now() },
    headers: { "Cache-Control": "no-cache" },
  });
  const full: Customer[] = data as Customer[];
  return full.map((c) => ({ id: c.id, name: c.name }));
}

export async function createCustomerSimplePayment(
  customerId: number,
  payload: CustomerStandalonePaymentIn
): Promise<boolean> {
  const res = await salesApi.post(
    `/customers/by-id/${customerId}/payments/simple`,
    payload
  );
  return res.data as boolean;
}