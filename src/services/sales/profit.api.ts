import salesApi from "../salesApi";
import { pickPeriodParams, type PeriodParams } from "@/lib/period/period";
import type { Profit, ProfitPageDTO, ProfitDetail } from "@/types/profit";

type Opts = { nocacheToken?: number; signal?: AbortSignal };
type ProfitFilterOpts = PeriodParams & {
  signal?: AbortSignal;
  q?: string;
};
type ListOpts = ProfitFilterOpts & { page_size?: number };

const ts = () => Date.now();
export async function listProfits(
  page = 1,
  opts: ListOpts = {}
): Promise<ProfitPageDTO> {
  const { signal, page_size, q } = opts;

  const params: Record<string, string | number | undefined> = {
    page,
    page_size,
    ...(q ? { q } : {}),
    ...pickPeriodParams(opts),
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
  opts: ProfitFilterOpts = {}
): Promise<{ total: number; count: number }> {
  const { signal, q } = opts;
  const { data } = await salesApi.get("/profits/summary", {
    params: {
      ...(q ? { q } : {}),
      ...pickPeriodParams(opts),
    },
    signal,
  });
  return data as { total: number; count: number };
}
