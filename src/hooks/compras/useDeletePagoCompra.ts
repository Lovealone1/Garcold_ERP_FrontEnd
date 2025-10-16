"use client";
import { useState } from "react";
import { deletePagoCompra } from "@/services/sales/compras.api";

export function useDeletePagoCompra() {
    const [loading, setLoading] = useState(false);

    async function remove(pagoId: number): Promise<boolean> {
        setLoading(true);
        try {
            const { ok } = await deletePagoCompra(pagoId);
            return !!ok;
        } finally {
            setLoading(false);
        }
    }

    return { remove, loading };
}
