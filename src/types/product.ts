import { PageDTO } from "./page";

export type TopProductQty = {
    product_id: number;
    product: string;
    total_quantity: number;
};

export interface ProductDTO {
  id: number;
  reference: string;
  description: string;
  quantity: number;
  purchase_price: number;
  sale_price: number;
  is_active: boolean;
  created_at: string; 
  barcode: string | null;
  barcode_type: string | null;
}

export type ProductPageDTO = PageDTO<ProductDTO>;


export interface SaleProductsDTO {
  id: number;
  reference: string;
  description: string;
  sold_quanity: number; 
  purchase_price: number;
  sale_price: number;
}

export type ProductCreate = Omit<ProductDTO, "id" | "created_at">;
export type ProductUpdate = Omit<ProductDTO, "id" |"is_active" |"created_at">;
export type NewProduct = ProductCreate;
