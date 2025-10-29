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
  bank_id: number;          
};

export type InvestmentUpdateBalance = {
  balance: number;
};

export type InvestmentAddBalanceIn =
  | {
      investment_id: number; 
      amount: number;        
      kind: "interest";
      description?: string | null;
      source_bank_id?: never;
    }
  | {
      investment_id: number; 
      amount: number;       
      kind: "topup";
      source_bank_id: number; 
      description?: string | null;
    };

export type InvestmentWithdrawIn =
  | {
      investment_id: number; 
      kind: "full";
      destination_bank_id?: number; 
      amount?: never;
      description?: string | null;
    }
  | {
      investment_id: number; 
      kind: "partial";
      amount: number; 
      destination_bank_id?: number; 
      description?: string | null;
    };

export type InvestmentWithdrawResult = Investment | { deleted: true; investment_id: number };