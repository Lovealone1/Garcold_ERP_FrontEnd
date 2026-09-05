import salesApi from "../salesApi";
import type {
    TransactionPageDTO,
    TransactionCreate,
    TransactionCreated,
} from "@/types/transaction";
import type { OriginFilter } from "@/hooks/transacciones/useTransacciones";

type FilterOpts = {
    signal?: AbortSignal;
    q?: string;
    bank?: string;
    type?: string;
    origin?: OriginFilter;
    date_from?: string;
    date_to?: string;
};

type ListOpts = FilterOpts & { page_size?: number };

function filterParams(opts: FilterOpts): Record<string, string | undefined> {
    const { q, bank, type, origin, date_from, date_to } = opts;
    return {
        ...(q ? { q } : {}),
        ...(bank ? { bank } : {}),
        ...(type ? { type } : {}),
        ...(origin && origin !== "all" ? { origin } : {}),
        ...(date_from ? { date_from } : {}),
        ...(date_to ? { date_to } : {}),
    };
}

export async function listTransactions(
    page = 1,
    opts: ListOpts = {}
): Promise<TransactionPageDTO> {
    const { signal, page_size } = opts;

    const { data } = await salesApi.get("/transactions", {
        params: { page, page_size, ...filterParams(opts) },
        signal,
    });
    return data as TransactionPageDTO;
}

/** Bank and type names present in the data, for the filter dropdowns. */
export async function listTransactionFilterOptions(
    opts: { signal?: AbortSignal } = {}
): Promise<{ banks: string[]; types: string[] }> {
    const { data } = await salesApi.get("/transactions/filter-options", {
        signal: opts.signal,
    });
    return data as { banks: string[]; types: string[] };
}

/** Total amount per type across the whole filtered set, not just one page. */
export async function summarizeTransactions(
    opts: FilterOpts = {}
): Promise<Record<string, number>> {
    const { data } = await salesApi.get("/transactions/summary", {
        params: filterParams(opts),
        signal: opts.signal,
    });
    return data as Record<string, number>;
}

export async function createTransaction(
    payload: TransactionCreate,
): Promise<TransactionCreated> {
    const { data } = await salesApi.post("/transactions/create", payload, {
        timeout: 20000,
    });
    return data as TransactionCreated;
}

export async function deleteTransaction(
    transactionId: number,
): Promise<{ message: string }> {
    const { data } = await salesApi.delete(`/transactions/delete/${transactionId}`, {
        timeout: 20000,
    });
    return data as { message: string };
}

