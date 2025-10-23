import salesApi from "../salesApi";
import type { ExpenseCategory, ExpenseCategoryCreate } from "@/types/expense-category";

export async function listExpenseCategories(
    nocacheToken?: number
): Promise<ExpenseCategory[]> {
    const { data } = await salesApi.get("/expense-categories", {
        params: { _ts: nocacheToken ?? Date.now() },
        headers: { "Cache-Control": "no-cache" },
    });
    return data as ExpenseCategory[];
}

export async function createExpenseCategory(
    payload: ExpenseCategoryCreate
): Promise<ExpenseCategory> {
    const { data } = await salesApi.post("/expense-categories/create", payload);
    return data as ExpenseCategory;
}

export async function deleteExpenseCategory(
    id: number
): Promise<{ message: string }> {
    const { data } = await salesApi.delete(`/expense-categories/by-id/${id}`);
    return data as { message: string };
}
