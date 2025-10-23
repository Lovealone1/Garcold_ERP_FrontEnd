import salesApi from "../salesApi";
import type { Bank, BankCreate } from "@/types/bank";

export async function listBanks(nocacheToken?: number): Promise<Bank[]> {
  const { data } = await salesApi.get("/banks", {
    params: { _ts: nocacheToken ?? Date.now() },
    headers: { "Cache-Control": "no-cache" },
  });
  return data as Bank[];
}

export async function createBank(payload: BankCreate): Promise<Bank> {
  const { data } = await salesApi.post("/banks/create", payload);
  return data as Bank;
}

export async function updateBankBalance(id: number, new_balance: number): Promise<Bank> {
  const { data } = await salesApi.patch(`/banks/balance/${id}`, { new_balance });
  return data as Bank;
}

export async function deleteBank(id: number): Promise<{ message: string }> {
  const { data } = await salesApi.delete(`/banks/${id}`);
  return data as { message: string };
}
