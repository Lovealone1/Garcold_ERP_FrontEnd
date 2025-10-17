import salesApi from "../salesApi";
import type {
  Investment,
  InvestmentsPage,
  InvestmentCreate,
  InvestmentUpdateBalance,
} from "@/types/investment";

export async function listInvestments(page = 1, nocacheToken?: number): Promise<InvestmentsPage> {
  const { data } = await salesApi.get("/investments/page", {
    params: { page, _ts: nocacheToken ?? Date.now() },
    headers: { "Cache-Control": "no-cache" },
  });
  return data as InvestmentsPage;
}

export async function fetchAllInvestments(nocacheToken?: number): Promise<Investment[]> {
  let page = 1;
  const acc: Investment[] = [];
  const first = await listInvestments(page, nocacheToken);
  acc.push(...first.items);
  while (page < first.total_pages) {
    page += 1;
    const p = await listInvestments(page, nocacheToken);
    acc.push(...p.items);
  }
  return acc;
}

export async function getInvestment(id: number): Promise<Investment> {
  const { data } = await salesApi.get(`/investments/by-id/${id}`);
  return data as Investment;
}

export async function createInvestment(payload: InvestmentCreate): Promise<Investment> {
  const { data } = await salesApi.post("/investments/create", payload);
  return data as Investment;
}

export async function updateInvestmentBalance(
  id: number,
  payload: InvestmentUpdateBalance
): Promise<Investment> {
  const { data } = await salesApi.patch(`/investments/by-id/${id}/balance`, { new_balance: payload.balance });
  return data as Investment;
}

export async function deleteInvestment(id: number): Promise<{ message: string }> {
  const { data } = await salesApi.delete(`/investments/by-id/${id}`);
  return data as { message: string };
}
