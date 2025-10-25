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

export async function listSales(
  page = 1,
  params?: Record<string, any>,
  nocacheToken?: number
): Promise<SalePage> {
  const { data } = await salesApi.get("/sales", {
    params: { page, ...params, _ts: nocacheToken ?? Date.now() },
    headers: { "Cache-Control": "no-cache" },
  });
  return data as SalePage;
}

export async function getSaleById(saleId: number, nocacheToken?: number): Promise<Sale> {
  const { data } = await salesApi.get(`/sales/by-id/${saleId}`, {
    params: { _ts: nocacheToken ?? Date.now() },
    headers: { "Cache-Control": "no-cache" },
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
    headers: { "Cache-Control": "no-cache" },
  });
  return data as Sale;
}

export async function deleteSale(saleId: number): Promise<{ message: string }> {
  const { data } = await salesApi.delete(`/sales/${saleId}`, {
    headers: { "Cache-Control": "no-cache" },
  });
  return data as { message: string };
}

export async function listSaleItems(saleId: number, nocacheToken?: number): Promise<SaleItemView[]> {
  const { data } = await salesApi.get(`/sales/${saleId}/items`, {
    params: { _ts: nocacheToken ?? Date.now() },
    headers: { "Cache-Control": "no-cache" },
  });
  return data as SaleItemView[];
}

export async function listSalePayments(saleId: number, nocacheToken?: number): Promise<SalePayment[]> {
  const { data } = await salesApi.get(`/sale-payments/by-sale/${saleId}`, {
    params: { _ts: nocacheToken ?? Date.now() },
    headers: { "Cache-Control": "no-cache" },
  });
  return data as SalePayment[];
}

export async function createSalePayment(payload: SalePaymentCreate): Promise<SalePayment> {
  const { data } = await salesApi.post(`/sale-payments/create`, payload, {
    headers: { "Cache-Control": "no-cache" },
  });
  return data as SalePayment;
}

export async function deleteSalePayment(paymentId: number): Promise<{ message: string }> {
  const { data } = await salesApi.delete(`/sale-payments/${paymentId}`, {
    headers: { "Cache-Control": "no-cache" },
  });
  return data as { message: string };
}
