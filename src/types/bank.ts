export interface Bank {
  id: number;
  name: string;
  balance: number;
  created_at: string;                 // ISO-8601
  updated_at?: string | null;         // ISO-8601 
  account_number?: string | null;
}

export type BankCreate = Omit<Bank, "id" | "balance" | "created_at" | "updated_at">;

export type BankUpdate = Pick<Bank, "name">;

export type NewBank = BankCreate;
