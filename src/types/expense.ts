import { PageDTO } from "./page";

export interface Expense {
  id: number;
  expense_category_id: number;
  amount: number;
  bank_id: number;
  expense_date: string; 
}

export interface ExpenseView {
  id: number;
  category_name: string;
  amount: number;
  bank_name: string;
  expense_date: string; 
}

export type ExpensesPage = PageDTO<ExpenseView>;

export interface ExpenseCreate {
  expense_category_id: number;
  bank_id: number;
  amount: number;
  expense_date: string; 
}

export interface ExpenseCreated {
  id: number;
  expense_category_id: number;
  bank_id: number;
  amount: number;
  expense_date: string; 
}
