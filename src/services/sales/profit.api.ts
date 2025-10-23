import salesApi from "../salesApi";
import type { Profit, ProfitPageDTO, ProfitDetail } from "@/types/profit";

export async function listProfits(
  page = 1,
  nocacheToken?: number
): Promise<ProfitPageDTO> {
  const { data } = await salesApi.get("/profits/", {
    params: { page, _ts: nocacheToken ?? Date.now() },
    headers: { "Cache-Control": "no-cache" },
  });
  return data as ProfitPageDTO;
}

export async function getProfitBySaleId(saleId: number): Promise<Profit> {
  const { data } = await salesApi.get(`/profits/by-sale/${saleId}`);
  return data as Profit;
}

export async function fetchAllProfits(
  nocacheToken?: number
): Promise<Profit[]> {
  let page = 1;
  const acc: Profit[] = [];
  const first = await listProfits(page, nocacheToken);
  acc.push(...first.items);
  while (page < first.total_pages) {
    page += 1;
    const p = await listProfits(page, nocacheToken);
    acc.push(...p.items);
  }
  return acc;
}

export async function listProfitDetailsBySaleId(
  saleId: number
): Promise<ProfitDetail[]> {
  const { data } = await salesApi.get(`/profits/details/${saleId}`);
  return data as ProfitDetail[];
}
