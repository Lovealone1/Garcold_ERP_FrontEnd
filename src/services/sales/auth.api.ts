import axios from "axios";
import salesApi from "../salesApi";
import type { AuthSyncDTO, MeDTO } from "@/types/auth";

export async function syncSelf(payload: AuthSyncDTO = {}): Promise<MeDTO | null> {
  try {
    const { data } = await salesApi.post("/auth/sync-self", payload);
    return data as MeDTO;
  } catch (e: any) {
    if (axios.isAxiosError(e) && e.response?.status === 401) return null;
    throw e;
  }
}

export async function getMe(): Promise<MeDTO | null> {
  try {
    const { data } = await salesApi.get("/auth/me");
    return data as MeDTO;
  } catch (e: any) {
    if (axios.isAxiosError(e) && e.response?.status === 401) return null;
    throw e;
  }
}
