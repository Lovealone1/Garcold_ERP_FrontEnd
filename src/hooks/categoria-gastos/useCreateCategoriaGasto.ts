"use client";
import { useState } from "react";
import type { CategoriaGastosDTO, CategoriaGastosResponseDTO } from "@/types/categoria-gastos";
import { createCategoriaGastos } from "@/services/sales/categoria-gastos.api";

export function useCreateCategoriaGasto(onCreated?: (c: CategoriaGastosResponseDTO) => void) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function create(payload: CategoriaGastosDTO) {
        setLoading(true);
        setError(null);
        try {
            const res = await createCategoriaGastos(payload);
            onCreated?.(res);
            return res;
        } catch (e: any) {
            setError(e?.message ?? "Error creando categoría");
            throw e;
        } finally {
            setLoading(false);
        }
    }

    return { create, loading, error };
}