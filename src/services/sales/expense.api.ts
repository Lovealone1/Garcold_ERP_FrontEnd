import salesApi from "../salesApi";
import type {
    Expense,
    ExpenseView,
    ExpensesPage,
    ExpenseCreate,
} from "@/types/expense";

type ListExpensesOpts = {
    signal?: AbortSignal;
    q?: string;
    category?: string;
    bank?: string;
    type?: string;
    page_size?: number;
};

export async function listExpenses(
    page = 1,
    opts: ListExpensesOpts = {}
): Promise<ExpensesPage> {
    const { signal, q, category, bank, type, page_size } = opts;

    const params: Record<string, string | number | undefined> = {
        page,
        page_size,
        ...(q ? { q } : {}),
        ...(category ? { category } : {}),
        ...(bank ? { bank } : {}),
        ...(type ? { type } : {}),
    };

    const { data } = await salesApi.get("/expenses/page", {
        params,
        signal,
        withCredentials: false,
    });

    return data as ExpensesPage;
}


export async function fetchAllExpenses(
    params?: Record<string, any>,
    nocacheToken?: number
): Promise<ExpenseView[]> {
    let page = 1;
    const acc: ExpenseView[] = [];
    const first = await listExpenses(page, params);
    acc.push(...first.items);
    while (page < first.total_pages) {
        page += 1;
        const p = await listExpenses(page, params);
        acc.push(...p.items);
    }
    return acc;
}

export async function createExpense(payload: ExpenseCreate): Promise<Expense> {
    const { data } = await salesApi.post("/expenses/create", payload);
    return data as Expense;
}

export async function deleteExpense(
    id: number
): Promise<{ message: string }> {
    const { data } = await salesApi.delete(`/expenses/by-id/${id}`);
    return data as { message: string };
}
