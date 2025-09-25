"use client";
import { useState } from "react";
import { createPagoVenta } from "@/services/sales/ventas.api";
import type { PagoVentaCreate, PagoVenta } from "@/types/ventas";

export function useCreatePagoVenta() {
    const [loading, setLoading] = useState(false);

    async function create(ventaId: number, payload: PagoVentaCreate): Promise<PagoVenta> {
        setLoading(true);
        try {
            return await createPagoVenta(ventaId, payload);
        } finally {
            setLoading(false);
        }
    }

    return { create, loading };
}
