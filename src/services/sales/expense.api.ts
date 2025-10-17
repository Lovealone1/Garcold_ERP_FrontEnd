import salesApi from "../salesApi";
import type {
    Expense,
    ExpenseView,
    ExpensesPage,
    ExpenseCreate,
} from "@/types/expense";

export async function listExpenses(
    page = 1,
    params?: Record<string, any>,
    nocacheToken?: number
): Promise<ExpensesPage> {
    const { data } = await salesApi.get("/expenses/page", {
        params: { page, ...(params ?? {}), _ts: nocacheToken ?? Date.now() },
        headers: { "Cache-Control": "no-cache" },
    });
    return data as ExpensesPage; 
}

export async function fetchAllExpenses(
    params?: Record<string, any>,
    nocacheToken?: number
): Promise<ExpenseView[]> {
    let page = 1;
    const acc: ExpenseView[] = [];
    const first = await listExpenses(page, params, nocacheToken);
    acc.push(...first.items);
    while (page < first.total_pages) {
        page += 1;
        const p = await listExpenses(page, params, nocacheToken);
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
