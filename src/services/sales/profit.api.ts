import salesApi from "../salesApi";
import type { Profit, ProfitPageDTO, ProfitDetail } from "@/types/profit";

type Opts = { nocacheToken?: number; signal?: AbortSignal };
type ListOpts = {
  signal?: AbortSignal;
  page_size?: number;
  q?: string;
  date_from?: string;
  date_to?: string;
};

const ts = () => Date.now();
export async function listProfits(
  page = 1,
  opts: ListOpts = {}
): Promise<ProfitPageDTO> {
  const { signal, page_size, q, date_from, date_to } = opts;

  const params: Record<string, string | number | undefined> = {
    page,
    page_size,
    ...(q ? { q } : {}),
    ...(date_from ? { date_from } : {}),
    ...(date_to ? { date_to } : {}),
  };

  const { data } = await salesApi.get("/profits/", {
    params,
    signal,
    withCredentials: false,
  });

  return data as ProfitPageDTO;
}

export async function getProfitBySaleId(
  saleId: number,
  opts?: Opts
): Promise<Profit> {
  const { data } = await salesApi.get(`/profits/by-sale/${saleId}`, {
    params: { _ts: opts?.nocacheToken ?? ts() },
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
    signal: opts?.signal,
  });
  return data as ProfitDetail[];
}

/** Total profit across the whole filtered set, not just the visible page. */
export async function summarizeProfits(
  opts: { signal?: AbortSignal; q?: string; date_from?: string; date_to?: string } = {}
): Promise<{ total: number; count: number }> {
  const { signal, q, date_from, date_to } = opts;
  const { data } = await salesApi.get("/profits/summary", {
    params: {
      ...(q ? { q } : {}),
      ...(date_from ? { date_from } : {}),
      ...(date_to ? { date_to } : {}),
    },
    signal,
  });
  return data as { total: number; count: number };
}
