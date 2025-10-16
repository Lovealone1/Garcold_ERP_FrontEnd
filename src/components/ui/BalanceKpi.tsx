// components/ui/BalanceKpi.tsx
"use client";

import React, { useMemo, useState } from "react";
import {
    Wallet as WalletLucide, CreditCard, PiggyBank, Banknote, Coins, DollarSign,
} from "lucide-react";
import { MaterialIcon } from "@/components/ui/material-icon";

type Bank = { nombre: string; saldo: number };
type Props = { banks: Bank[]; total: number };

const money = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
});

export default function BalanceKpi({ banks, total }: Props) {
    const [selected, setSelected] = useState<number | null>(null);

    const items = useMemo(() => {
        const arr = [...(banks ?? [])].filter((b) => (b.saldo ?? 0) > 0);
        arr.sort((a, b) => b.saldo - a.saldo);
        return arr;
    }, [banks]);

    const icons = [WalletLucide, CreditCard, PiggyBank, Banknote, Coins, DollarSign];

    // escala de verdes con contraste
    const colorAt = (i: number, n: number) => {
        const t = n <= 1 ? 0 : i / (n - 1);
        const whitePct = Math.round(10 + 60 * (1 - t)); // 70..10
        const blackPct = Math.round(10 + 60 * t);       // 10..70
        return i % 2 === 0
            ? `color-mix(in srgb, #16a34a ${100 - whitePct}%, white ${whitePct}%)`
            : `color-mix(in srgb, #16a34a ${100 - blackPct}%, black ${blackPct}%)`;
    };

    const withPct = items.map((b, i) => ({
        ...b,
        pct: total > 0 ? (b.saldo / total) * 100 : 0,
        color: colorAt(i, Math.max(1, items.length)),
    }));

    const displayTotal = selected == null ? total : (withPct[selected]?.saldo ?? 0);

    const barSegments =
        selected == null
            ? withPct
            : [{ ...withPct[selected], pct: 100 }];

    const toggle = (idx: number) => setSelected((s) => (s === idx ? null : idx));

    return (
        <div className="rounded-xl border border-tg bg-[var(--panel-bg)] p-4 sm:p-5 min-h-[120px]">
            {/* Header igual a KpiCard: icono en círculo + título */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                    <span
                        className={[
                            "h-7 w-7 rounded-full border border-tg",
                            "bg-[color-mix(in_srgb,var(--tg-primary) 10%, transparent)]",
                            "text-[var(--tg-primary)] flex items-center justify-center",
                        ].join(" ")}
                        aria-hidden
                    >
                        <MaterialIcon
                            name="account_balance_wallet" // mismo estilo que KpiCard
                            set="rounded"
                            size={18}
                            fill={0}
                            weight={600}
                            grade={0}
                        />
                    </span>

                    <h3 className="text-sm md:text-base font-semibold text-tg-primary tracking-wide">
                        Balance
                    </h3>
                </div>

                {/* placeholder para futura trend/pill (coherente con KpiCard) */}
                <div className="h-6 min-w-[90px]" />
            </div>

            {/* Valor con exactamente la misma tipografía que KpiCard */}
            <div className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight">
                {money.format(displayTotal || 0)}
            </div>

            {/* Barra porcentual */}
            <div className="mt-3 h-3 rounded-full bg-[color-mix(in_srgb,var(--tg-card-bg) 80%,transparent)] overflow-hidden relative">
                <div className="absolute inset-0 flex">
                    {barSegments.map((b, i) => (
                        <div
                            key={i}
                            className="group relative h-full transition-[width] duration-300"
                            style={{ width: `${b.pct}%`, background: b.color }}
                            title={`${b.nombre}: ${money.format(b.saldo)}`}
                        >
                            <div
                                className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap
                  rounded border border-tg bg-[var(--panel-bg)] px-2 py-0.5 text-[10px]
                  opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <strong>{money.format(b.saldo)}</strong>{" "}
                                · {((b.saldo / (total || 1)) * 100).toFixed(1)}%
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Leyendas (máx 6), con dot y un icono por banco; clic para aislar */}
            <div className="mt-3 flex flex-wrap items-center gap-4">
                {withPct.slice(0, 6).map((b, i) => {
                    const Icon = icons[i % icons.length];
                    const active = selected === i;
                    return (
                        <button
                            key={i}
                            type="button"
                            onClick={() => toggle(i)}
                            className={[
                                "flex items-center gap-2 group",
                                "transition transform",
                                active ? "scale-110" : "opacity-80 hover:opacity-100",
                            ].join(" ")}
                            title={
                                active
                                    ? `Mostrando solo: ${b.nombre}. Click para volver al total`
                                    : `${b.nombre}`
                            }
                        >
                            <span className="relative inline-flex">
                                <span
                                    className={[
                                        "h-3 w-3 rounded-full transition",
                                        active ? "ring-2 ring-emerald-400" : "",
                                    ].join(" ")}
                                    style={{ background: b.color }}
                                />
                                <span className="absolute inset-[3px] rounded-full bg-[color-mix(in_srgb,white_60%,transparent)]" />
                            </span>
                            <Icon className="h-4 w-4 transition" style={{ color: b.color }} />
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
