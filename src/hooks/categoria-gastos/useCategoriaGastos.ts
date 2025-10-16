"use client";
import { useEffect, useState } from "react";
import type { CategoriaGastosResponseDTO } from "@/types/categoria-gastos";
import { listCategoriasGastos } from "@/services/sales/categoria-gastos.api";

export function useCategoriasGastos() {
    const [items, setItems] = useState<CategoriaGastosResponseDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                setLoading(true);
                const data = await listCategoriasGastos();
                if (active) setItems(data);
            } catch (e: any) {
                if (active) setError(e?.message ?? "Error listando categorías");
            } finally {
                if (active) setLoading(false);
            }
        })();
        return () => {
            active = false;
        };
    }, []);

    return { items, loading, error };
}