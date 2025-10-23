import salesApi from "../salesApi";
import type { Loan, LoansPage, LoanCreate, LoanUpdateAmount } from "@/types/loan";

export async function listLoans(page = 1, nocacheToken?: number): Promise<LoansPage> {
  const { data } = await salesApi.get("/loans/page", {
    params: { page, _ts: nocacheToken ?? Date.now() },
    headers: { "Cache-Control": "no-cache" },
  });
  return data as LoansPage;
}

export async function fetchAllLoans(nocacheToken?: number): Promise<Loan[]> {
  let page = 1;
  const acc: Loan[] = [];
  const first = await listLoans(page, nocacheToken);
  acc.push(...first.items);
  while (page < first.total_pages) {
    page += 1;
    const p = await listLoans(page, nocacheToken);
    acc.push(...p.items);
  }
  return acc;
}

export async function getLoan(id: number): Promise<Loan> {
  const { data } = await salesApi.get(`/loans/by-id/${id}`);
  return data as Loan;
}

export async function createLoan(payload: LoanCreate): Promise<Loan> {
  const { data } = await salesApi.post("/loans/create", payload);
  return data as Loan;
}

export async function updateLoanAmount(id: number, payload: LoanUpdateAmount): Promise<Loan> {
  // Router espera { new_amount: number } en el body (embed=True)
  const { data } = await salesApi.patch(`/loans/by-id/${id}/amount`, { new_amount: payload.amount });
  return data as Loan;
}

export async function deleteLoan(id: number): Promise<{ message: string }> {
  const { data } = await salesApi.delete(`/loans/by-id/${id}`);
  return data as { message: string };
}
