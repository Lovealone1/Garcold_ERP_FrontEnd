// hooks/bancos/useUpdateSaldoBanco.ts
"use client";

import { useState } from "react";
import type { Banco } from "@/types/bancos";
import { updateSaldoBanco } from "@/services/sales/bancos.api";

export function useUpdateSaldoBanco(onSuccess?: (banco: Banco) => void) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function updateSaldo(id: number, nuevo_saldo: number): Promise<Banco> {
        setLoading(true);
        setError(null);
        try {
            const banco = await updateSaldoBanco(id, nuevo_saldo);
            onSuccess?.(banco);
            return banco;
        } catch (e: any) {
            const msg =
                e?.response?.data?.detail ??
                e?.message ??
                "Error actualizando saldo del banco";
            setError(msg);
            throw e;
        } finally {
            setLoading(false);
        }
    }

    return { updateSaldo, loading, error };
}
