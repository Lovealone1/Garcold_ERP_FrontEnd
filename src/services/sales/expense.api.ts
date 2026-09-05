import salesApi from "../salesApi";
import type {
    Expense,
    ExpensesPage,
    ExpenseCreate,
} from "@/types/expense";

type ExpenseFilterOpts = {
    signal?: AbortSignal;
    q?: string;
    category?: string;
    bank?: string;
    date_from?: string;
    date_to?: string;
};

type ListExpensesOpts = ExpenseFilterOpts & { page_size?: number };

function expenseFilterParams(
    opts: ExpenseFilterOpts
): Record<string, string | undefined> {
    const { q, category, bank, date_from, date_to } = opts;
    return {
        ...(q ? { q } : {}),
        ...(category ? { category } : {}),
        ...(bank ? { bank } : {}),
        ...(date_from ? { date_from } : {}),
        ...(date_to ? { date_to } : {}),
    };
}

export async function listExpenses(
    page = 1,
    opts: ListExpensesOpts = {}
): Promise<ExpensesPage> {
    const { signal, page_size } = opts;

    const { data } = await salesApi.get("/expenses/page", {
        params: { page, page_size, ...expenseFilterParams(opts) },
        signal,
    });

    return data as ExpensesPage;
}

/** Category and bank names present in expenses, for the filter dropdowns. */
export async function listExpenseFilterOptions(
    opts: { signal?: AbortSignal } = {}
): Promise<{ categories: string[]; banks: string[] }> {
    const { data } = await salesApi.get("/expenses/filter-options", {
        signal: opts.signal,
    });
    return data as { categories: string[]; banks: string[] };
}

/** Summed amount across the whole filtered set. */
export async function summarizeExpenses(
    opts: ExpenseFilterOpts = {}
): Promise<{ total: number; count: number }> {
    const { data } = await salesApi.get("/expenses/summary", {
        params: expenseFilterParams(opts),
        signal: opts.signal,
    });
    return data as { total: number; count: number };
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
