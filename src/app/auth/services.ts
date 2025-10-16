import { supabase } from "@/lib/supabase/client";

export interface LoginPayload {
  username: string; // email
  password: string;
}

/**
 * Login con email/contraseña vía Supabase.
 * Mantiene la firma anterior: { username, password }.
 */
export async function login({ username, password }: LoginPayload) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: username,
    password,
  });
  if (error) throw error;
  return data; // { user, session }
}

/** Login con Google (OAuth). */
export async function loginWithGoogle(redirectTo?: string) {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: redirectTo ?? `${window.location.origin}/auth/callback` },
  });
  if (error) throw error;
}


/** Usuario actual (solo Supabase). */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

/** Alias por compatibilidad si antes usabas getMe(). */
export const getMe = getCurrentUser;

/** Sesión actual. */
export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

/** Suscripción a cambios de auth. Devuelve un unsubscribe. */
export function onAuthStateChange(callback: () => void) {
  const { data: sub } = supabase.auth.onAuthStateChange((_event, _session) => {
    callback();
  });
  return () => sub.subscription.unsubscribe();
}
