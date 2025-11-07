import salesApi from "../salesApi";
import type { Profit, ProfitPageDTO, ProfitDetail } from "@/types/profit";

type Opts = { nocacheToken?: number; signal?: AbortSignal };
type ListOpts = { signal?: AbortSignal; page_size?: number; q?: string }; 

const ts = () => Date.now();
const nocache = { "Cache-Control": "no-cache" };

export async function listProfits(
  page = 1,
  opts: ListOpts = {}
): Promise<ProfitPageDTO> {
  const { signal, page_size } = opts;

  const params: Record<string, string | number | undefined> = {
    page,
    page_size,
  };

  const { data } = await salesApi.get("/profits/", {
    params,
    signal,
    withCredentials: false,
  });

  return data as ProfitPageDTO;
}

export async function fetchAllProfits(opts?: Opts): Promise<Profit[]> {
  let page = 1;
  const acc: Profit[] = [];

  const first = await listProfits(page, { signal: opts?.signal });
  acc.push(...first.items);

  while (page < (first.total_pages ?? 1)) {
    page += 1;
    const p = await listProfits(page, { signal: opts?.signal });
    acc.push(...p.items);
  }

  return acc;
}

export async function getProfitBySaleId(
  saleId: number,
  opts?: Opts
): Promise<Profit> {
  const { data } = await salesApi.get(`/profits/by-sale/${saleId}`, {
    params: { _ts: opts?.nocacheToken ?? ts() },
    headers: nocache,
    signal: opts?.signal,
  });
  return data as Profit;
}

export async function listProfitDetailsBySaleId(
  saleId: number,
  opts?: Opts
): Promise<ProfitDetail[]> {
  const { data } = await salesApi.get(`/profits/details/${saleId}`, {
    params: { _ts: opts?.nocacheToken ?? ts() },
    headers: nocache,
    signal: opts?.signal,
  });
  return data as ProfitDetail[];
}


