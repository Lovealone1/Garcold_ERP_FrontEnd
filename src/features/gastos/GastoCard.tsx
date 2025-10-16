"use client";
import React from "react";
import type { Gasto } from "@/types/gastos";

const money = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

export default function GastoCard({ gasto }: { gasto: Gasto }) {
    const fecha = new Date(gasto.fecha_gasto).toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "2-digit" });
    return (
        <div className="rounded-xl border border-tg p-6 bg-[var(--panel-bg)]">
            <div className="flex items-center justify-between mb-3">
                <span className="text-base text-tg-primary">{gasto.categoria_gasto_id}</span>
                <span className="text-sm text-tg-muted">{gasto.nombre_banco}</span>
            </div>
            <div className="text-3xl font-extrabold">{money.format(gasto.monto)}</div>
            <div className="mt-1 text-sm text-tg-muted">{fecha}</div>
        </div>
    );
}