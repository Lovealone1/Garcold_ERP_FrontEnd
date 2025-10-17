import { PageDTO } from "./page";

export interface Transaction {
  id: number;
  bank_id: number;
  amount: number;
  type_id: number | null;
  description?: string | null;
  created_at: string;    
  is_auto: boolean;
}

export interface TransactionView {
  id: number;
  bank: string;
  amount: number;
  type_str: string;
  description?: string | null;
  created_at: string;  
  is_auto: boolean;  
}

export type TransactionPageDTO = PageDTO<TransactionView>;

export interface TransactionCreated {
  id: number;
  bank_id: number;
  amount: number;
  type_id: number | null;
  description?: string | null;
  created_at: string;     
  is_auto: boolean;
}

export interface TransactionCreate {
  bank_id: number;
  amount: number;
  type_id?: number | null;
  description?: string | null;
  is_auto?: boolean;      
  created_at?: string;    
}

export type TransactionUpdate = Omit<Transaction, "id">;
