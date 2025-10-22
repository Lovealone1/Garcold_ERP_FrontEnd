"use client";
import { useState } from "react";
import { createUser } from "@/services/user.api";
import type { CreateUserIn } from "@/types/user";
import IconButton from "@mui/material/IconButton";
import LockResetIcon from "@mui/icons-material/LockReset";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useNotifications } from "@/components/providers/NotificationsProvider"; 

function generatePassword(len = 14) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@$%&*?-_";
  const bytes = new Uint8Array(len);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[(bytes[i] ?? Math.floor(Math.random() * 256)) % alphabet.length]!;
  if (!/[A-Z]/.test(out)) out = "A" + out.slice(1);
  if (!/[a-z]/.test(out)) out = out.slice(0, 1) + "a" + out.slice(2);
  if (!/[0-9]/.test(out)) out = out.slice(0, 2) + "7" + out.slice(3);
  if (!/[!@$%&*\?\-_]/.test(out)) out = out.slice(0, 3) + "!" + out.slice(4);
  return out;
}

export default function CreateUserModal({
  open, onClose, onSaved,
}: { open: boolean; onClose: () => void; onSaved?: () => void }) {
  const { success, error } = useNotifications();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  if (!open) return null;
  const canSave = !!email && !!password;

  const handleGenerate = () => setPassword(generatePassword(14));
  const handleCopy = async () => {
    try {
      if (!password) return;
      await navigator.clipboard.writeText(password);
      success("Contraseña copiada");
    } catch (e) {
      error(e);
    }
  };

  const handle = async () => {
    setSaving(true);
    try {
      const payload: CreateUserIn = { email, password, user_metadata: { full_name: name } } as any;
      await createUser(payload);
      success("Usuario creado");
      onSaved?.();
      onClose();
    } catch (e) {
      error(e);
    } finally {
      setSaving(false);
    }
  };

  const iconBtnSx = {
    border: "1px solid var(--tg-border)",
    borderRadius: "0.5rem",
    color: "var(--tg-primary)",
    "&.Mui-disabled": { opacity: 0.5, color: "var(--tg-primary)" },
  } as const;

  return (
    <div className="fixed inset-0 bg-black/30 grid place-items-center z-50">
      <div className="w-[560px] max-w-[95vw] rounded-2xl border border-tg bg-tg-card text-tg-card">
        <div className="px-5 py-4 border-b border-tg flex justify-between">
          <h3 className="text-base font-medium">Crear usuario</h3>
          <button onClick={onClose} className="h-8 w-8 grid place-items-center rounded hover:bg-black/5">✕</button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div className="grid grid-cols-3 items-center gap-3">
            <label className="text-sm">Nombre</label>
            <input className="col-span-2 px-3 py-2 rounded-lg border border-tg bg-tg-card text-sm"
              value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="grid grid-cols-3 items-center gap-3">
            <label className="text-sm">Email</label>
            <input className="col-span-2 px-3 py-2 rounded-lg border border-tg bg-tg-card text-sm"
              type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="grid grid-cols-3 items-center gap-3">
            <label className="text-sm">Password</label>
            <div className="col-span-2 flex items-center gap-1">
              <input className="flex-1 px-3 py-2 rounded-lg border border-tg bg-tg-card text-sm"
                type="text" value={password} onChange={(e) => setPassword(e.target.value)} />
              <IconButton aria-label="Generar contraseña" onClick={handleGenerate} size="small" sx={iconBtnSx}>
                <LockResetIcon fontSize="small" />
              </IconButton>
              <IconButton aria-label="Copiar contraseña" onClick={handleCopy} disabled={!password} size="small" sx={iconBtnSx}>
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-tg flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 rounded border border-tg text-sm">Cancelar</button>
          <button onClick={handle} disabled={!canSave || saving}
            className="px-3 py-2 rounded text-sm border border-[color-mix(in_srgb,var(--tg-primary)_40%,transparent)] bg-[color-mix(in_srgb,var(--tg-primary)_18%,transparent)]">
            {saving ? "Creando…" : "Crear"}
          </button>
        </div>
      </div>
    </div>
  );
}
