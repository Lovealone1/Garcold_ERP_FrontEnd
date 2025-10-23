export type Bucket = "week" | "month" | "year" | "all";
export type Granularity = "day" | "month" | "year";

export type DateISO = string;

export interface RequestMetaDTO {
  bucket: Bucket;
  pivot?: DateISO;
  date_from?: DateISO;
  date_to?: DateISO;
  year?: number;
  month?: number;
}

// Meta de segmentación
export interface SegmentMetaDTO {
  bucket: Bucket;
  granularity: Granularity;
  from_: string;
  to: string;
  segments: number;
}

/* SALES */
export interface SalesSeriesItemDTO {
  date: string;
  total: number;
  remaining_balance: number;
}
export interface SalesSeriesDTO {
  meta: SegmentMetaDTO;
  series: SalesSeriesItemDTO[];
}
export interface ARItemDTO {
  customer: string;
  total: number;
  remaining_balance: number;
  date: string;
}
export interface SalesBlockDTO {
  total_sales: number;
  total_credit: number;
  series: SalesSeriesDTO;
  accounts_receivable: ARItemDTO[];
}

/* PURCHASES */
export interface PurchasesSeriesItemDTO {
  date: string;
  total: number;
  balance: number;
}
export interface PurchasesSeriesDTO {
  meta: SegmentMetaDTO;
  series: PurchasesSeriesItemDTO[];
}
export interface APItemDTO {
  supplier: string;
  total: number;
  balance: number;
  date: string;
}
export interface PurchasesBlockDTO {
  total_purchases: number;
  total_payables: number;
  series: PurchasesSeriesDTO;
  accounts_payable: APItemDTO[];
}

/* EXPENSES */
export interface ExpensesSeriesItemDTO {
  date: string;
  amount: number;
}
export interface ExpensesSeriesDTO {
  meta: SegmentMetaDTO;
  series: ExpensesSeriesItemDTO[];
}
export interface ExpensesBlockDTO {
  total_expenses: number;
  series: ExpensesSeriesDTO;
}

/* PROFIT */
export interface ProfitSeriesItemDTO {
  date: string;
  profit: number;
}
export interface ProfitSeriesDTO {
  meta: SegmentMetaDTO;
  series: ProfitSeriesItemDTO[];
}
export interface ProfitBlockDTO {
  total_profit: number;
  series: ProfitSeriesDTO;
}

/* BANKS */
export interface BankItemDTO {
  name: string;
  balance: number;
}
export interface BanksSummaryDTO {
  banks: BankItemDTO[];
  total: number;
}

/* TOP PRODUCTS */
export interface TopProductItemDTO {
  product_id: number;
  product: string;
  total_quantity: number;
}

/* CREDITS */
export interface CreditItemDTO {
  name: string;
  amount: number;
  created_at: DateISO; // "YYYY-MM-DD"
}
export interface CreditsSummaryDTO {
  credits: CreditItemDTO[];
  total: number;
}

/* INVESTMENTS */
export interface InvestmentItemDTO {
  name: string;
  balance: number;
  due_date: string | null; // "YYYY-MM-DD" | null
}
export interface InvestmentsSummaryDTO {
  investments: InvestmentItemDTO[];
  total: number;
}

/* FINAL RESPONSE */
export interface FinalReportDTO {
  meta: Record<string, any>; // Dict[str, Any] en backend
  sales: SalesBlockDTO;
  purchases: PurchasesBlockDTO;
  expenses: ExpensesBlockDTO;
  profit: ProfitBlockDTO;
  banks: BanksSummaryDTO;
  credits: CreditsSummaryDTO;
  investments: InvestmentsSummaryDTO;
  top_products?: TopProductItemDTO[] | null;
}
