import { PageDTO } from "./page";

export interface Customer {
  id: number;
  name: string;
  tax_id?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  balance: number;
  created_at: string; 
}

export interface CustomerLite {
  id: number;
  name: string;
}

export type CustomerPage = PageDTO<Customer>;

export type CustomerCreate = Omit<Customer, "id" | "created_at">;
export type CustomerUpdate = Omit<Customer, "id" | "created_at" | "balance">;
