export interface Loan {
  id: number;
  name: string;
  amount: number;
  created_at: string; // ISO datetime
}

export interface LoansPage {
  items: Loan[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export type LoanCreate = {
  name: string;
  amount: number;
};

export type LoanUpdate = Omit<Loan, "id" | "created_at">;

export type LoanUpdateAmount = { amount: number };
