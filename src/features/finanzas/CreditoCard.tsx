"use client";
import type { Credito } from "@/types/creditos";

const money = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

export default function CreditoCard({
    credito,
    selected = false,
    onSelect,
}: {
    credito: Credito;
    selected?: boolean;
    onSelect?: (checked: boolean) => void;
}) {
    return (
        <button
            type="button"
            onClick={() => onSelect?.(!selected)}
            className={`w-full rounded-lg border p-4 bg-tg-card text-left transition ${selected ? "border-emerald-500 ring-2 ring-emerald-500/30" : "border-tg"
                }`}
        >
            <h3 className="text-base font-semibold">{credito.nombre}</h3>
            <div className="mt-2 text-2xl font-bold">{money.format(credito.monto)}</div>
            <div className="mt-1 text-xs text-tg-muted">
                Creado: {new Date(credito.fecha_creacion).toLocaleDateString("es-CO")}
            </div>
        </button>
    );
}
