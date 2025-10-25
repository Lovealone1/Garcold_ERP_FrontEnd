import { PageDTO } from "./page";

export interface Purchase {
  id: number;
  supplier: string;
  bank: string;
  status: string;
  total: number;
  balance: number;
  purchase_date: string; 
}

export type PurchasePage = PageDTO<Purchase>;

export interface PurchaseItemInput {
  product_id: number;
  quantity: number;
  unit_price: number;
}

export interface PurchaseCreate {
  supplier_id: number;
  bank_id: number;
  status_id: number;
  items: PurchaseItemInput[];
  purchase_date?: Date | string;
}

export interface PurchasePayment {
  id: number;
  purchase_id: number;
  bank: string;           
  balance: number;      
  amount_paid: number;         
  created_at: string;    
}

export interface PurchasePaymentCreate {
  purchase_id: number;
  bank_id: number;
  amount: number;
  created_at?: string;    
}

export interface PurchaseDetailItem {
  purchase_id: number;
  product_reference: string;
  quantity: number;
  unit_price: number;
  total: number;
}