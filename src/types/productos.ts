import { PageDTO } from "./page";
// === ProductDTO ===
export interface ProductDTO {
  /** Full product listing row */
  id: number;
  reference: string;
  description: string;
  quantity: number;
  purchase_price: number;
  sale_price: number;
  is_active: boolean;
  created_at: string; // ISO datetime
}

// PageDTO[ProductDTO]
export type ProductPageDTO = PageDTO<ProductDTO>;

// === SaleProductsDTO ===
// Nota: backend usa la clave `sold_quanity` (sic). Respeto el nombre tal cual.
export interface SaleProductsDTO {
  id: number;
  reference: string;
  description: string;
  sold_quanity: number; // cantidad vendida
  purchase_price: number;
  sale_price: number;
}

// Helpers de creación/actualización si los necesitas en UI
export type ProductCreate = Omit<ProductDTO, "id" | "created_at">;
export type ProductUpdate = Omit<ProductDTO, "id" |"is_active" |"created_at">;
export type NewProduct = ProductCreate;
