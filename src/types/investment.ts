export interface Investment {
  id: number;
  name: string;
  balance: number;
  maturity_date: string; 
}

export interface InvestmentsPage {
  items: Investment[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export type InvestmentCreate = {
  name: string;
  balance: number;
  maturity_date: string; 
};

export type InvestmentUpdateBalance = {
  balance: number;
};
