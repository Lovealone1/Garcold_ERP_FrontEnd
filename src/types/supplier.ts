import { PageDTO } from "./page";
export interface Supplier {
  id: number;
  name: string;
  tax_id?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  created_at: string; 
}

export interface SupplierLite {
  id: number;
  name: string;
}

export type SupplierPage =PageDTO<Supplier>;

export type SupplierCreate = Omit<Supplier, "id" | "created_at">;
export type SupplierUpdate = Omit<Supplier, "id" | "created_at">;

export type NewSupplier = SupplierCreate;
