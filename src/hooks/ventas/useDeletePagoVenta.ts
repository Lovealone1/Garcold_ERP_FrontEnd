"use client";
import { useState } from "react";
import { deletePagoVenta } from "@/services/sales/ventas.api";

export function useDeletePagoVenta() {
    const [loading, setLoading] = useState(false);

    async function remove(pagoId: number): Promise<boolean> {
        setLoading(true);
        try {
            const { ok } = await deletePagoVenta(pagoId);
            return !!ok;
        } finally {
            setLoading(false);
        }
    }

    return { remove, loading };
}
