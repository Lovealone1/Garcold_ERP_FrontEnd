"use client";

import { useState } from "react";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import type { Bank, BankCreate } from "@/types/bank";
import { useCreateBank } from "@/hooks/bancos/useCreateBank";
import { useNotifications } from "@/components/providers/NotificationsProvider";

type Props = { onCreated?: (bank: Bank) => void; onCancel?: () => void };

export default function BankCreateForm({ onCreated, onCancel }: Props) {
    const { success, error } = useNotifications();
    const { create, loading } = useCreateBank({
        onSuccess: (b) => {
            success("Banco creado");
            onCreated?.(b);
            setName(""); setBalance("0"); setAccount("");
        },
        onError: (e) => error((e as any)?.response?.data?.detail ?? "No se pudo crear el banco"),
    });

    const [name, setName] = useState("");
    const [balance, setBalance] = useState<string>("0");
    const [account, setAccount] = useState("");

    const fieldSx = {
        "& .MuiOutlinedInput-root": {
            height: 44,
            background: "var(--tg-card-bg)",
            color: "var(--tg-card-fg)",
            borderRadius: "10px",
            "& fieldset": { borderColor: "var(--tg-border)" },
            "&:hover fieldset": { borderColor: "var(--tg-border)" },
            "&.Mui-focused fieldset": {
                borderColor: "var(--tg-primary)",
                boxShadow: "0 0 0 2px color-mix(in srgb, var(--tg-primary) 25%, transparent)",
            },
        },
        "& .MuiInputBase-input::placeholder": { color: "var(--tg-placeholder)", opacity: 1 },
    } as const;

    function parseMoney(v: string) {
        const normalized = v.replace(/\s+/g, "").replace(/\./g, "").replace(",", ".");
        const n = Number(normalized);
        return Number.isFinite(n) ? n : NaN;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const nameTrim = name.trim();
        if (!nameTrim) return error("Ingresa un nombre");
        const n = parseMoney(balance);
        if (!Number.isFinite(n) || n < 0) return error("Saldo inicial inválido");
        const payload: BankCreate = {
            name: nameTrim,
            balance: Number(n.toFixed(2)),
            account_number: account.trim() || undefined,
        };
        await create(payload);
    }

    return (
        <form onSubmit={handleSubmit}>
            <Stack spacing={1.25}>
                <label className="text-sm font-medium" htmlFor="bank-name">Nombre del banco</label>
                <TextField
                    id="bank-name"
                    placeholder="Nombre del banco"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    sx={fieldSx}
                    autoFocus
                />

                <label className="text-sm font-medium" htmlFor="bank-balance">Saldo inicial</label>
                <TextField
                    id="bank-balance"
                    placeholder="0.00"
                    inputMode="decimal"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    sx={{ ...fieldSx, "& .MuiInputBase-input": { color: "var(--tg-muted)" } }}
                />

                <label className="text-sm font-medium" htmlFor="bank-account">N.º de cuenta (opcional)</label>
                <TextField
                    id="bank-account"
                    placeholder="000-000000-00"
                    value={account}
                    onChange={(e) => setAccount(e.target.value)}
                    sx={fieldSx}
                />

                <div className="flex justify-end gap-2 mt-1">
                    {onCancel && (
                        <Button type="button" onClick={onCancel} disabled={loading} sx={{ textTransform: "none", color: "var(--tg-muted)" }}>
                            Cancelar
                        </Button>
                    )}
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={loading}
                        sx={{
                            textTransform: "none",
                            bgcolor: "var(--tg-primary)",
                            color: "var(--tg-primary-fg)",
                            "&:hover": { bgcolor: "color-mix(in srgb, var(--tg-primary) 88%, black 12%)" },
                        }}
                    >
                        {loading ? (
                            <>
                                <CircularProgress size={16} sx={{ mr: 1, color: "var(--tg-primary-fg)" }} />
                                Guardando…
                            </>
                        ) : (
                            "Crear banco"
                        )}
                    </Button>
                </div>
            </Stack>
        </form>
    );
}
