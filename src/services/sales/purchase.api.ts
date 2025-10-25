import salesApi from "../salesApi";
import type {
  Purchase,
  PurchasePage,
  PurchaseCreate,
  PurchaseDetailItem,
  PurchasePayment,
  PurchasePaymentCreate,
} from "@/types/purchase";

export async function listPurchases(
  page = 1,
  params?: Record<string, any>,
  nocacheToken?: number
): Promise<PurchasePage> {
  const { data } = await salesApi.get("/purchases/", {
    params: { page, ...params, _ts: nocacheToken ?? Date.now() },
    headers: { "Cache-Control": "no-cache" },
  });
  return data as PurchasePage;
}

export async function getPurchaseById(
  purchaseId: number,
  nocacheToken?: number
): Promise<Purchase> {
  const { data } = await salesApi.get(`/purchases/${purchaseId}`, {
    params: { _ts: nocacheToken ?? Date.now() },
    headers: { "Cache-Control": "no-cache" },
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
    headers: { "Cache-Control": "no-cache" },
  });
  return data as Purchase;
}

export async function deletePurchase(
  purchaseId: number
): Promise<{ message: string }> {
  const { data } = await salesApi.delete(`/purchases/${purchaseId}`, {
    headers: { "Cache-Control": "no-cache" },
  });
  return data as { message: string };
}

export async function listPurchaseItems(
  purchaseId: number,
  nocacheToken?: number
): Promise<PurchaseDetailItem[]> {
  const { data } = await salesApi.get(`/purchases/${purchaseId}/items`, {
    params: { _ts: nocacheToken ?? Date.now() },
    headers: { "Cache-Control": "no-cache" },
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
      headers: { "Cache-Control": "no-cache" },
    }
  );
  return data as PurchasePayment[];
}

export async function createPurchasePayment(
  payload: PurchasePaymentCreate
): Promise<PurchasePayment> {
  const { data } = await salesApi.post("/purchase-payments/create", payload, {
    headers: { "Cache-Control": "no-cache" },
  });
  return data as PurchasePayment;
}

export async function deletePurchasePayment(
  paymentId: number
): Promise<{ message: string }> {
  const { data } = await salesApi.delete(`/purchase-payments/${paymentId}`, {
    headers: { "Cache-Control": "no-cache" },
  });
  return data as { message: string };
}
