// services/profile.api.ts
import { supabase } from "@/lib/supabase/client";

export type ProfileDTO = {
    userId: string;
    email: string | null;
    fullName: string;
    phone: string;
    avatarUrl: string | null;
};

const BUCKET = "Avatars" as const;

export async function loadProfile(): Promise<ProfileDTO> {
    const { data: au, error } = await supabase.auth.getUser();
    if (error) throw error;
    const u = au.user;
    if (!u) throw new Error("Sin sesión");

    const m = u.user_metadata ?? {};
    return {
        userId: u.id,
        email: u.email ?? null,
        fullName: m.full_name ?? m.name ?? "",
        phone: m.phone ?? "",
        avatarUrl: m.avatar_url ?? null,
    };
}

export async function saveProfile(input: { fullName: string; phone: string }) {
    const { error } = await supabase.auth.updateUser({
        data: { full_name: input.fullName || null, phone: input.phone || null },
    });
    if (error) throw error;
}

/** Verifica la contraseña actual reautenticando al usuario. */
export async function verifyPassword(email: string, currentPassword: string) {
    const { error } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
    });
    if (error) throw error;
}

/** Cambia la contraseña del usuario ya verificado. */
export async function updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
}

export async function uploadAvatar(params: { userId: string; file: File }) {
    const { userId, file } = params;
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const key = `${userId}/avatar.${ext}`;

    const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(key, file, { upsert: true, contentType: file.type || "image/*" });
    if (upErr) throw upErr;

    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(key);
    const url = pub.publicUrl;

    const { error: mdErr } = await supabase.auth.updateUser({
        data: { avatar_url: url },
    });
    if (mdErr) throw mdErr;

    return url;
}
