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
  type ListOpts = {
  signal?: AbortSignal;
  q?: string;
  page_size?: number;
  cities?: string[];
  pending_balance?: "yes" | "no";
};

  const ts = () => Date.now();
  export async function listCustomers(
    page = 1,
    opts: ListOpts = {}
  ): Promise<CustomerPage> {
    const { signal, q, page_size, cities, pending_balance } = opts;
    const params: Record<string, unknown> = {
      page,
      page_size,
      ...(q ? { q } : {}),
      // Repeatable parameter: axios serialises an array as cities=a&cities=b.
      ...(cities?.length ? { cities } : {}),
      ...(pending_balance ? { pending_balance } : {}),
    };

    const { data } = await salesApi.get("/customers/page", {
      params,
      signal,
    });
    return data as CustomerPage;
  }

  export async function getCustomerById(
    customerId: number,
    opts?: Opts
  ): Promise<Customer> {
    const { data } = await salesApi.get(`/customers/by-id/${customerId}`, {
      params: { _ts: opts?.nocacheToken ?? ts() },
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
      { params: { _ts: opts?.nocacheToken ?? ts() }, signal: opts?.signal }
    );
    return data as Customer;
  }

  export async function deleteCustomer(
    id: number,
    opts?: Opts
  ): Promise<{ message: string }> {
    const { data } = await salesApi.delete(`/customers/by-id/${id}`, {
      params: { _ts: opts?.nocacheToken ?? ts() },
      signal: opts?.signal,
    });
    return data as { message: string };
  }

  export async function listCustomersAll(
    opts?: Opts
  ): Promise<CustomerLite[]> {
    const { data } = await salesApi.get("/customers", {
      params: { _ts: opts?.nocacheToken ?? ts() },
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
      { params: { _ts: opts?.nocacheToken ?? ts() }, signal: opts?.signal }
    );
    return res.data as boolean;
  }

/** Cities present in the data, for the filter multi-select. */
export async function listCustomerCities(
  opts: { signal?: AbortSignal } = {}
): Promise<string[]> {
  const { data } = await salesApi.get("/customers/cities", { signal: opts.signal });
  return data as string[];
}
