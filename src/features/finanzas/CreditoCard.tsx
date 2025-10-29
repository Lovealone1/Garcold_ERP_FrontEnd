"use client";
import type { Loan } from "@/types/loan";

type Props = {
    credito: Loan;
    selected?: boolean;
    onSelect?: (checked: boolean) => void;
};

export default function LoanCard({ credito, selected = false, onSelect }: Props) {
    const money = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={() => onSelect?.(!selected)}
            onKeyDown={(e) => e.key === "Enter" && onSelect?.(!selected)}
            data-selected={selected}
            className={`border p-5 rounded-xl relative outline-none transition-colors
                  border-tg bg-[var(--tg-card-bg)] hover:border-[var(--tg-primary)]
                  data-[selected=true]:border-[var(--tg-primary)]
                  data-[selected=true]:ring-2 data-[selected=true]:ring-[var(--tg-primary)]
                  data-[selected=true]:bg-[color-mix(in_srgb,var(--tg-primary)10%,var(--tg-card-bg))]`}
        >
            <h3 className="text-lg font-semibold" style={{ color: "var(--tg-primary)" }}>{credito.name}</h3>
            <div className="mt-2 text-4xl font-extrabold tracking-tight">{money.format(credito.amount ?? 0)}</div>
            <div className="mt-2 text-xs text-tg-muted">
                Creado: <span className="font-light">{new Date(credito.created_at).toLocaleString()}</span>
            </div>
        </div>
    );
}
