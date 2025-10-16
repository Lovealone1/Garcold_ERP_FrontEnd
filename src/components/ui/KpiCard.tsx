// components/ui/KpiCard.tsx
"use client";
import React from "react";
import { MaterialIcon, type MaterialIconSet } from "@/components/ui/material-icon"; // ajusta la ruta si cambia

type Props = {
    title: string;
    value: React.ReactNode;
    trend?: React.ReactNode;
    caption?: string;
    secondaryLabel?: string;
    secondaryValue?: React.ReactNode;
    className?: string;

    /** Icono (Material Symbols) mostrado antes del título */
    iconName?: string;          // p.ej. "trending_up"
    iconSet?: MaterialIconSet;  // 'rounded' | 'outlined' | 'sharp'
    iconSize?: number;          // tamaño del símbolo (px)
    iconFill?: 0 | 1;
    iconWeight?: number;        // 100..700
    iconGrade?: number;         // -25..200
    iconClassName?: string;     // estilos extra para el <span> del icono
};

export default function KpiCard({
    title,
    value,
    trend,
    caption,
    secondaryLabel,
    secondaryValue,
    className,
    iconName,
    iconSet = "rounded",
    iconSize = 18,
    iconFill = 0,
    iconWeight = 600,
    iconGrade = 0,
    iconClassName,
}: Props) {
    return (
        <div
            className={[
                "rounded-xl border border-tg bg-[var(--panel-bg)]",
                "p-4 sm:p-5 min-h-[120px]",
                className ?? "",
            ].join(" ")}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                    {iconName ? (
                        <span
                            className={[
                                "h-7 w-7 rounded-full border border-tg",
                                "bg-[color-mix(in_srgb,var(--tg-primary) 10%, transparent)]",
                                "text-[var(--tg-primary)] flex items-center justify-center",
                            ].join(" ")}
                            aria-hidden
                        >
                            <MaterialIcon
                                name={iconName}
                                set={iconSet}
                                size={iconSize}
                                fill={iconFill}
                                weight={iconWeight}
                                grade={iconGrade}
                                className={iconClassName ?? ""}
                                title={title}
                            />
                        </span>
                    ) : null}

                    <h3 className="text-sm md:text-base font-semibold text-tg-primary tracking-wide">
                        {title}
                    </h3>
                </div>

                <div className="h-6 min-w-[90px] flex items-center justify-end">
                    {trend ?? null}
                </div>
            </div>

            <div className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight">
                {value}
            </div>

            {caption ? (
                <div className="mt-2 text-[11px] sm:text-xs text-tg-muted">{caption}</div>
            ) : null}

            {(secondaryLabel || secondaryValue) && (
                <div className="mt-1 text-xs sm:text-sm text-tg-muted leading-tight">
                    {secondaryLabel}
                    {secondaryValue !== undefined && (
                        <>
                            {secondaryLabel ? ": " : null}
                            <span className="font-bold text-foreground text-[13px] sm:text-base">
                                {secondaryValue}
                            </span>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
