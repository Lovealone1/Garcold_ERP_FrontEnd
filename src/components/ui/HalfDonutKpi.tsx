// components/ui/FinanzasDonutKpi.tsx
"use client";

import React, { useMemo } from "react";
import { MaterialIcon } from "@/components/ui/material-icon";

type Props = {
    creditos: number;
    inversiones: number;
    title?: string;
    iconName?: string;
};

const money = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
});

export default function FinanzasDonutKpi({
    creditos,
    inversiones,
    title = "Finanzas",
    iconName = "donut_large",
}: Props) {
    const { pInv } = useMemo(() => {
        const t = Math.max(0, creditos || 0) + Math.max(0, inversiones || 0);
        const pi = t > 0 ? (inversiones / t) * 100 : 0;
        return { pInv: pi };
    }, [creditos, inversiones]);

    const COLORS = {
        inv: "#16a34a",
        cred: "#0e6f33",
        track: "color-mix(in srgb, #16a34a 12%, black 88%)",
    };

    const gradient = `conic-gradient(${COLORS.inv} ${pInv}% , ${COLORS.cred} 0)`;

    return (
        <div className="rounded-xl border border-tg bg-[var(--panel-bg)] p-4 sm:p-5">
            {/* Header */}
            <div className="flex items-center gap-2 mb-1">
                <span className="h-7 w-7 rounded-full border border-tg bg-[color-mix(in_srgb,var(--tg-primary) 10%,transparent)] text-[var(--tg-primary)] flex items-center justify-center">
                    <MaterialIcon name={iconName} set="rounded" size={18} weight={600} />
                </span>
                <span className="text-sm md:text-base font-semibold text-tg-primary tracking-wide">
                    {title}
                </span>
            </div>

            {/* Contenido */}
            <div className="grid grid-cols-12 items-center gap-2">
                {/* Leyendas */}
                <div className="col-span-7 md:col-span-7 space-y-2">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS.inv }} />
                            <span className="text-[11px] sm:text-xs text-tg-muted">Inversiones</span>
                        </div>
                        <div className="mt-0.5 font-extrabold tracking-tight text-xl sm:text-xl leading-tight">
                            {money.format(inversiones || 0)}
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS.cred }} />
                            <span className="text-[11px] sm:text-xs text-tg-muted">Créditos</span>
                        </div>
                        <div className="mt-0.5 font-extrabold tracking-tight text-xl sm:text-xl leading-tight">
                            {money.format(creditos || 0)}
                        </div>
                    </div>
                </div>

                {/* Donut más grande y grueso, sin crecer la card */}
                <div className="col-span-5 md:col-span-5 flex justify-end">
                    <div
                        className="relative aspect-square rounded-full"
                        // ↑ aumentamos el tamaño efectivo del donut
                        style={{
                            width: "100px",              // antes ~96–112; ahora más grande
                            // responsive sin clases arbitrarias:
                            // en pantallas ≥640px y ≥768px:
                            // @ts-ignore – estilos inline con media queries
                            ...(typeof window === "undefined"
                                ? {}
                                : {}),
                            background: gradient,
                        }}
                        title={`Inversiones: ${money.format(inversiones || 0)} · Créditos: ${money.format(creditos || 0)}`}
                    >
                        {/* overlay tenue para dar profundidad */}
                        <div
                            className="absolute inset-0 rounded-full"
                            style={{ background: `conic-gradient(${COLORS.track} 0 100%)`, opacity: 0.15 }}
                        />
                        {/* aro grueso: incrementamos inset */}
                        <div
                            className="absolute rounded-full border"
                            style={{
                                inset: "20px",              // antes 14–16px -> más grueso visual
                                background: "var(--panel-bg)",
                                borderColor: "var(--tg-border)",
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
