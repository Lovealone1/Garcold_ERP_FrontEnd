import { PageDTO } from "./page";

export interface Profit {
  id: number;
  sale_id: number;
  profit: number;
  created_at: string; 
}

export type ProfitPageDTO = PageDTO<Profit>;

export interface ProfitDetail {
  sale_id: number;
  product_id: number;
  reference?: string | null;
  description?: string | null;
  quantity: number;
  purchase_price: number;
  sale_price: number;
  profit_total: number;
}
