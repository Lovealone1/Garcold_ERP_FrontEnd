"use client";
import type { Inversion } from "@/types/inversiones";

const money = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

export default function InversionCard({
    inversion,
    selected = false,
    onSelect,
}: {
    inversion: Inversion;
    selected?: boolean;
    onSelect?: (checked: boolean) => void;
}) {
    const now = new Date().getTime();
    const venc = new Date(inversion.fecha_vencimiento).getTime();
    const dot = now < venc ? "bg-emerald-500" : "bg-red-500";

    return (
        <button
            type="button"
            onClick={() => onSelect?.(!selected)}
            className={`w-full rounded-lg border p-4 bg-tg-card text-left transition ${selected ? "border-emerald-500 ring-2 ring-emerald-500/30" : "border-tg"
                }`}
        >
            <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold">{inversion.nombre}</h3>
                <span className={`inline-block h-3 w-3 rounded-full ${dot}`} />
            </div>
            <div className="mt-2 text-2xl font-bold">{money.format(inversion.saldo)}</div>
            <div className="mt-1 text-xs text-tg-muted">
                Vence: {new Date(inversion.fecha_vencimiento).toLocaleDateString("es-CO")}
            </div>
        </button>
    );
}
