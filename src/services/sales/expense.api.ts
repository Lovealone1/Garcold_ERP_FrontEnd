import salesApi from "../salesApi";
import { pickPeriodParams, type PeriodParams } from "@/lib/period/period";
import type {
    Expense,
    ExpensesPage,
    ExpenseCreate,
} from "@/types/expense";

type ExpenseFilterOpts = PeriodParams & {
    signal?: AbortSignal;
    q?: string;
    category?: string;
    bank?: string;
};

type ListExpensesOpts = ExpenseFilterOpts & { page_size?: number };

function expenseFilterParams(
    opts: ExpenseFilterOpts
): Record<string, string | number | undefined> {
    const { q, category, bank } = opts;
    return {
        ...(q ? { q } : {}),
        ...(category ? { category } : {}),
        ...(bank ? { bank } : {}),
        ...pickPeriodParams(opts),
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
