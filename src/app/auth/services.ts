"use client";

import { supabase } from "@/lib/supabase/client";
import { syncSelf } from "@/services/auth.api";
import type { AuthSyncDTO, MeDTO } from "@/types/auth";

export interface LoginPayload { username: string; password: string }

function toSyncPayload(u: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>): AuthSyncDTO {
  const md = (u as any).user_metadata ?? {};
  return {
    email: u.email ?? null,
    display_name: md.full_name || md.name || null,
    avatar_url: md.avatar_url || null,
  };
}

export async function getCurrentUser() {
  const { data, error } = await supabase().auth.getUser();
  if (error) throw error;
  return data.user;
}

export async function getSession() {
  const { data, error } = await supabase().auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function syncBackend(): Promise<MeDTO | null> {
  const u = await getCurrentUser();
  if (!u) return null;
  const payload = toSyncPayload(u);
  return await syncSelf(payload);
}

export async function login({ username, password }: LoginPayload): Promise<MeDTO> {
  const { data, error } = await supabase().auth.signInWithPassword({ email: username, password });
  if (error) throw error;
  const me = await syncBackend();
  if (!me) throw new Error("No session after login");
  return me;
}

export async function loginWithGoogle(redirectTo?: string) {
  const url = redirectTo ?? `${window.location.origin}/auth/callback`;
  const { error } = await supabase().auth.signInWithOAuth({ provider: "google", options: { redirectTo: url } });
  if (error) throw error;
}

export function onAuthStateChange(callback?: () => void) {
  const { data: { subscription } } = supabase().auth.onAuthStateChange(async (_evt, session) => {
    if (session) await syncBackend();
    callback?.();
  });
  return () => subscription.unsubscribe();
}

export async function bootstrapAuth(): Promise<MeDTO | null> {
  const session = await getSession();
  if (!session) return null;
  return await syncBackend();
}
