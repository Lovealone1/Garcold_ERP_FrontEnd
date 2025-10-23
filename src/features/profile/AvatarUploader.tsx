// AvatarUploader.tsx
"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function AvatarUploader() {
    const [loading, setLoading] = useState(false);

    async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);

        const { data: { user }, error: uErr } = await supabase().auth.getUser();
        if (uErr || !user) { setLoading(false); return alert("Sesión requerida"); }

        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const key = `${user.id}/avatar.${ext}`;

        const { error: upErr } = await supabase().storage.from("Avatars").upload(key, file, { upsert: true });
        if (upErr) { setLoading(false); return alert(upErr.message); }

        const { data: pub } = supabase().storage.from("Avatars").getPublicUrl(key);
        const avatarUrl = pub.publicUrl;

        const { error: dbErr } = await supabase().from("profiles")
            .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
            .eq("id", user.id);

        setLoading(false);
        if (dbErr) return alert(dbErr.message);
    }

    return (
        <label>
            <input type="file" accept="image/*" onChange={onFileChange} hidden />
            <span className="btn">{loading ? "Subiendo..." : "Cambiar avatar"}</span>
        </label>
    );
}
