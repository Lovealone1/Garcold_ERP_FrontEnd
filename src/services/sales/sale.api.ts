import salesApi from "../salesApi";
import type {
  Sale,
  SalePage,
  SaleCreate,
  SaleItemInput,
  SaleItemView,
  SalePayment,
  SalePaymentCreate,
} from "@/types/sale";

type SaleFilterOpts = {
  signal?: AbortSignal;
  q?: string;
  status?: string;
  bank?: string;
  date_from?: string;
  date_to?: string;
};

type ListSalesOpts = SaleFilterOpts & { page_size?: number };

function saleFilterParams(opts: SaleFilterOpts): Record<string, string | undefined> {
  const { q, status, bank, date_from, date_to } = opts;
  return {
    ...(q ? { q } : {}),
    ...(status ? { status } : {}),
    ...(bank ? { bank } : {}),
    ...(date_from ? { date_from } : {}),
    ...(date_to ? { date_to } : {}),
  };
}

export async function listSales(
  page = 1,
  opts: ListSalesOpts = {}
): Promise<SalePage> {
  const { signal, page_size } = opts;

  const { data } = await salesApi.get("/sales", {
    params: { page, page_size, ...saleFilterParams(opts) },
    signal,
  });

  return data as SalePage;
}

/** Bank and status names present in sales, for the filter dropdowns. */
export async function listSaleFilterOptions(
  opts: { signal?: AbortSignal } = {}
): Promise<{ banks: string[]; statuses: string[] }> {
  const { data } = await salesApi.get("/sales/filter-options", { signal: opts.signal });
  return data as { banks: string[]; statuses: string[] };
}

/** Totals across the whole filtered set, not just the visible page. */
export async function summarizeSales(
  opts: SaleFilterOpts = {}
): Promise<{ total: number; remaining_balance: number; count: number }> {
  const { data } = await salesApi.get("/sales/summary", {
    params: saleFilterParams(opts),
    signal: opts.signal,
  });
  return data as { total: number; remaining_balance: number; count: number };
}


export async function getSaleById(saleId: number, nocacheToken?: number): Promise<Sale> {
  const { data } = await salesApi.get(`/sales/by-id/${saleId}`, {
    params: { _ts: nocacheToken ?? Date.now() },
    });
  return data as Sale;
}

export async function createSale(
  payload: SaleCreate & { sale_date?: Date | string }
): Promise<Sale> {
  const cart: Array<SaleItemInput> = payload.items.map((i) => ({
    product_id: i.product_id,
    quantity: i.quantity,
    unit_price: i.unit_price,
  }));

  const body: any = {
    customer_id: payload.customer_id,
    bank_id: payload.bank_id,
    status_id: payload.status_id,
    cart,
    ...(payload.sale_date && {
      sale_date:
        payload.sale_date instanceof Date
          ? payload.sale_date.toISOString()
          : payload.sale_date,
    }),
  };

  const { data } = await salesApi.post("/sales/create", body, {
    });
  return data as Sale;
}

export async function deleteSale(saleId: number): Promise<{ message: string }> {
  const { data } = await salesApi.delete(`/sales/${saleId}`, {
    });
  return data as { message: string };
}

export async function listSaleItems(saleId: number, nocacheToken?: number): Promise<SaleItemView[]> {
  const { data } = await salesApi.get(`/sales/${saleId}/items`, {
    params: { _ts: nocacheToken ?? Date.now() },
    });
  return data as SaleItemView[];
}

export async function listSalePayments(saleId: number, nocacheToken?: number): Promise<SalePayment[]> {
  const { data } = await salesApi.get(`/sale-payments/by-sale/${saleId}`, {
    params: { _ts: nocacheToken ?? Date.now() },
    });
  return data as SalePayment[];
}

export async function createSalePayment(payload: SalePaymentCreate): Promise<SalePayment> {
  const { data } = await salesApi.post(`/sale-payments/create`, payload, {
    });
  return data as SalePayment;
}

export async function deleteSalePayment(paymentId: number): Promise<{ message: string }> {
  const { data } = await salesApi.delete(`/sale-payments/${paymentId}`, {
    });
  return data as { message: string };
}
