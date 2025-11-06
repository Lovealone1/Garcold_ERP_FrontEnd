import salesApi from "../salesApi";
import type {
    TransactionPageDTO,
    TransactionView,
    TransactionCreate,
    TransactionCreated,
} from "@/types/transaction";
import type { OriginFilter } from "@/hooks/transacciones/useTransacciones";

type ListOpts = {
    signal?: AbortSignal;
    q?: string;
    bank?: string;
    type?: string;
    origin?: OriginFilter;
    page_size?: number;
};

export async function listTransactions(
    page = 1,
    opts: ListOpts = {}
): Promise<TransactionPageDTO> {
    const { signal, q, bank, type, origin, page_size } = opts;

    const params: Record<string, string | number | undefined> = {
        page,
        page_size, 
        ...(q ? { q } : {}),
        ...(bank ? { bank } : {}),
        ...(type ? { type } : {}),
        ...(origin && origin !== "all" ? { origin } : {}),
    };

    const { data } = await salesApi.get("/transactions", {
        params,
        signal,
        withCredentials: false,
    });
    return data as TransactionPageDTO;
}

export async function fetchAllTransactions(
    opts: ListOpts & { maxPages?: number } = {},
): Promise<TransactionView[]> {
    const { signal, maxPages = 1000, ...filters } = opts;
    const acc: TransactionView[] = [];
    let page = 1;

    for (let guard = 0; guard < maxPages; guard++) {
        const res = await listTransactions(page, { signal, ...filters });
        acc.push(...res.items);

        const hasNext =
            typeof res.has_next === "boolean"
                ? res.has_next
                : typeof res.total_pages === "number"
                    ? page < res.total_pages
                    : false;

        if (!hasNext) break;
        page += 1;
    }
    return acc;
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

