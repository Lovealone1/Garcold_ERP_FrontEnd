import salesApi from "../salesApi";
import { pickPeriodParams, type PeriodParams } from "@/lib/period/period";
import type {
  Purchase,
  PurchasePage,
  PurchaseCreate,
  PurchaseDetailItem,
  PurchasePayment,
  PurchasePaymentCreate,
} from "@/types/purchase";

type PurchaseFilterOpts = PeriodParams & {
  signal?: AbortSignal;
  q?: string;
  supplier?: string;
  status?: string;
  bank?: string;
};

type ListPurchasesOpts = PurchaseFilterOpts & { page_size?: number };

function purchaseFilterParams(
  opts: PurchaseFilterOpts
): Record<string, string | number | undefined> {
  const { q, supplier, status, bank } = opts;
  return {
    ...(q ? { q } : {}),
    ...(supplier ? { supplier } : {}),
    ...(status ? { status } : {}),
    ...(bank ? { bank } : {}),
    ...pickPeriodParams(opts),
  };
}

/** Bank, status and supplier names present in purchases, for the dropdowns. */
export async function listPurchaseFilterOptions(
  opts: { signal?: AbortSignal } = {}
): Promise<{ banks: string[]; statuses: string[]; suppliers: string[] }> {
  const { data } = await salesApi.get("/purchases/filter-options", {
    signal: opts.signal,
  });
  return data as { banks: string[]; statuses: string[]; suppliers: string[] };
}

/** Totals across the whole filtered set, not just the visible page. */
export async function summarizePurchases(
  opts: PurchaseFilterOpts = {}
): Promise<{ total: number; balance: number; count: number }> {
  const { data } = await salesApi.get("/purchases/summary", {
    params: purchaseFilterParams(opts),
    signal: opts.signal,
  });
  return data as { total: number; balance: number; count: number };
}

export async function listPurchases(
  page = 1,
  opts: ListPurchasesOpts = {}
): Promise<PurchasePage> {
  const { signal, page_size } = opts;

  const { data } = await salesApi.get("/purchases/", {
    params: { page, page_size, ...purchaseFilterParams(opts) },
    signal,
  });

  return data as PurchasePage;
}

export async function getPurchaseById(
  purchaseId: number,
  nocacheToken?: number
): Promise<Purchase> {
  const { data } = await salesApi.get(`/purchases/${purchaseId}`, {
    params: { _ts: nocacheToken ?? Date.now() },
    });
  return data as Purchase;
}

export async function createPurchase(
  payload: PurchaseCreate & { purchase_date?: Date | string }
): Promise<Purchase> {
  const body: any = {
    supplier_id: payload.supplier_id,
    bank_id: payload.bank_id,
    status_id: payload.status_id,
    cart: payload.items.map(i => ({
      product_id: i.product_id,
      quantity: i.quantity,
      unit_price: i.unit_price,
    })),
    ...(payload.purchase_date && {
      purchase_date:
        payload.purchase_date instanceof Date
          ? payload.purchase_date.toISOString()
          : payload.purchase_date,
    }),
  };

  const { data } = await salesApi.post("/purchases/create", body, {
    });
  return data as Purchase;
}

export async function deletePurchase(
  purchaseId: number
): Promise<{ message: string }> {
  const { data } = await salesApi.delete(`/purchases/${purchaseId}`, {
    });
  return data as { message: string };
}

export async function listPurchaseItems(
  purchaseId: number,
  nocacheToken?: number
): Promise<PurchaseDetailItem[]> {
  const { data } = await salesApi.get(`/purchases/${purchaseId}/items`, {
    params: { _ts: nocacheToken ?? Date.now() },
    });
  return data as PurchaseDetailItem[];
}

export async function listPurchasePayments(
  purchaseId: number,
  nocacheToken?: number
): Promise<PurchasePayment[]> {
  const { data } = await salesApi.get(
    `/purchase-payments/by-purchase/${purchaseId}`,
    {
      params: { _ts: nocacheToken ?? Date.now() },
      }
  );
  return data as PurchasePayment[];
}

export async function createPurchasePayment(
  payload: PurchasePaymentCreate
): Promise<PurchasePayment> {
  const { data } = await salesApi.post("/purchase-payments/create", payload, {
    });
  return data as PurchasePayment;
}

export async function deletePurchasePayment(
  paymentId: number
): Promise<{ message: string }> {
  const { data } = await salesApi.delete(`/purchase-payments/${paymentId}`, {
    });
  return data as { message: string };
}
