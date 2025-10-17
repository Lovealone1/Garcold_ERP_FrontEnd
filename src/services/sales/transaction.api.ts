import salesApi from "../salesApi";
import type {
    TransactionPageDTO,
    TransactionView,
    TransactionCreate,
    TransactionCreated,
} from "@/types/transaction";

export async function listTransactions(
    page = 1,
    nocacheToken?: number
): Promise<TransactionPageDTO> {
    const { data } = await salesApi.get("/transactions", {
        params: { page, _ts: nocacheToken ?? Date.now() },
        headers: { "Cache-Control": "no-cache" },
    });
    return data as TransactionPageDTO;
}

export async function fetchAllTransactions(
    nocacheToken?: number
): Promise<TransactionView[]> {
    let page = 1;
    const acc: TransactionView[] = [];
    const first = await listTransactions(page, nocacheToken);
    acc.push(...first.items);
    while (page < first.total_pages) {
        page += 1;
        const p = await listTransactions(page, nocacheToken);
        acc.push(...p.items);
    }
    return acc;
}

export async function createTransaction(
    payload: TransactionCreate
): Promise<TransactionCreated> {
    const { data } = await salesApi.post("/transactions/create", payload, {
        headers: { "Cache-Control": "no-cache" },
    });
    return data as TransactionCreated;
}

export async function deleteTransaction(
    transactionId: number
): Promise<{ message: string }> {
    const { data } = await salesApi.delete(`/transactions/delete/${transactionId}`);
    return data as { message: string };
}
