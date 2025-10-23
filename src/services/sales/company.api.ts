import salesApi from "../salesApi";
import type { CompanyDTO } from "@/types/company";

export type CompanyPatch = Partial<Omit<CompanyDTO, "id">>;

export async function getCompany(
  nocacheToken?: number
): Promise<CompanyDTO> {
  const { data } = await salesApi.get("/company/", {
    params: { _ts: nocacheToken ?? Date.now() },
    headers: { "Cache-Control": "no-cache" },
  });
  return data as CompanyDTO;
}

export async function patchCompany(
  payload: CompanyPatch
): Promise<CompanyDTO> {
  const { data } = await salesApi.patch("/company/", payload);
  return data as CompanyDTO;
}

