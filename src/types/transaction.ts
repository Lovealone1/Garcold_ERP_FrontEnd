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

/** Period echoed by list and summary endpoints after server-side resolution. */
export interface ResolvedPeriod {
  date_from: string | null;
  date_to: string | null;
  resolved_from: "default" | "calendar" | "range" | "all";
}

/** Normalized summary payload: numeric amounts are kept separate from metadata. */
export interface TransactionSummary {
  amounts: Record<string, number>;
  period?: ResolvedPeriod;
}
