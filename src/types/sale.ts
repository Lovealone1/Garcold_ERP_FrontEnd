import { PageDTO } from "./page";

export interface Sale {
  id: number;
  customer: string;
  bank: string;
  status: string;
  total: number;
  remaining_balance: number;
  created_at: string; 
}

export type SalePage = PageDTO<Sale>;

export interface SaleItemInput {
  product_id: number;
  quantity: number;
  unit_price: number;
}

export interface SaleCreate {
  customer_id: number;
  bank_id: number;
  status_id: number;
  items: SaleItemInput[];
}

export interface SaleItemCreate {
  sale_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
}

export interface SaleInsert {
  customer_id: number;
  bank_id: number;
  total: number;
  status_id: number;
  remaining_balance?: number | null;
  created_at: string; 
}

export interface SaleItemView {
  sale_id: number;
  product_reference: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface SalePayment {
  id: number;
  sale_id: number;
  bank: string;
  remaining_balance: number;
  amount_paid: number;
  created_at: string; 
}

export interface SalePaymentCreate {
  sale_id: number;
  bank_id: number;
  amount: number;
}
