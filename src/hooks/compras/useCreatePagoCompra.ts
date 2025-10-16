"use client";
import { useState } from "react";
import { createPagoCompra } from "@/services/sales/compras.api";
import type { PagoCompraCreate, PagoCompra } from "@/types/compras";

export function useCreatePagoCompra() {
    const [loading, setLoading] = useState(false);

    async function create(compraId: number, payload: PagoCompraCreate): Promise<PagoCompra> {
        setLoading(true);
        try {
            return await createPagoCompra(compraId, payload);
        } finally {
            setLoading(false);
        }
    }

    return { create, loading };
}
