// components/cuentas/CuentasCardsPanel.tsx
"use client";
import * as React from "react";
import type { CXCItemDTO, CXPItemDTO } from "@/types/reporte-general";
import { fmtFecha } from "@/builders/cuentas";

type Props = {
    cxc: CXCItemDTO[] | null | undefined;
    cxp: CXPItemDTO[] | null | undefined;
    defaultKind?: "cobrar" | "pagar";
    /** Forzar altura. Si no se pasa, se calcula para que empiece a scrollear tras N items. */
    maxHeight?: number;
    /** Nº de items visibles antes del scroll cuando no pasas maxHeight. */
    itemsBeforeScroll?: number; // default 3
    /** Gap vertical entre cards en px (space-y-2 = 8). */
    gapPx?: number; // default 8
    className?: string;
};

const money = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
});

export default function CuentasCardsPanel({
    cxc,
    cxp,
    defaultKind = "cobrar",
    maxHeight,
    itemsBeforeScroll = 3,
    gapPx = 8,
    className,
}: Props) {
    const [kind, setKind] = React.useState<"cobrar" | "pagar">(defaultKind);

    const safeCxc = Array.isArray(cxc) ? cxc : [];
    const safeCxp = Array.isArray(cxp) ? cxp : [];
    const rows = kind === "cobrar" ? safeCxc : safeCxp;

    // altura auto para que el scroll empiece después del N-ésimo item
    const listRef = React.useRef<HTMLUListElement>(null);
    const [autoMaxH, setAutoMaxH] = React.useState<number | null>(null);

    React.useLayoutEffect(() => {
        if (!listRef.current) return;
        const first = listRef.current.querySelector("li");
        if (!first) return;
        const h = first.getBoundingClientRect().height;
        const calc = itemsBeforeScroll * h + (itemsBeforeScroll - 1) * gapPx;
        setAutoMaxH(Math.ceil(calc));
    }, [rows, itemsBeforeScroll, gapPx, kind]);

    const scrollerMaxH = maxHeight ?? autoMaxH ?? 420;

    return (
        <section className={`rounded-xl border border-tg bg-[var(--panel-bg)] ${className ?? ""}`}>
            <header className="flex items-center justify-between gap-3 px-4 pt-3 pb-2">
                <h4 className="text-xm font-bold text-tg-primary">
                    {kind === "cobrar" ? "Cuentas por cobrar" : "Cuentas por pagar"}
                </h4>
                <div className="inline-flex overflow-hidden rounded-lg border border-tg">
                    <button
                        type="button"
                        onClick={() => setKind("cobrar")}
                        aria-pressed={kind === "cobrar"}
                        className={`px-3 py-1 text-sm ${kind === "cobrar"
                                ? "bg-[var(--tg-primary)] text-[var(--tg-card-bg)]"
                                : "text-[var(--tg-fg)] hover:bg-[color-mix(in_srgb,var(--tg-fg) 8%,transparent)]"
                            }`}
                    >
                        Cobrar
                    </button>
                    <button
                        type="button"
                        onClick={() => setKind("pagar")}
                        aria-pressed={kind === "pagar"}
                        className={`px-3 py-1 text-sm ${kind === "pagar"
                                ? "bg-[var(--tg-primary)] text-[var(--tg-card-bg)]"
                                : "text-[var(--tg-fg)] hover:bg-[color-mix(in_srgb,var(--tg-fg) 8%,transparent)]"
                            }`}
                    >
                        Pagar
                    </button>
                </div>
            </header>

            <div className="nice-scroll overflow-y-auto px-3 pb-3" style={{ maxHeight: scrollerMaxH ?? undefined }}>
                <ul ref={listRef} className="space-y-2">
                    {rows.map((r, i) => (
                        <li
                            key={i}
                            className="w-full rounded-lg border border-tg bg-[color-mix(in_srgb,var(--panel-bg) 94%,transparent)] p-3"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="truncate text-[var(--tg-fg)] text-sm font-medium">
                                        {"cliente" in r ? r.cliente : r.proveedor}
                                    </div>
                                    <div className="text-[var(--tg-muted)] text-xs">{fmtFecha(r.fecha)}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[var(--tg-muted)] text-[11px]">Total</div>
                                    <div className="text-[var(--tg-fg)] text-sm font-semibold">{money.format(r.total ?? 0)}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[var(--tg-muted)] text-[11px]">
                                        {kind === "cobrar" ? "Saldo restante" : "Saldo"}
                                    </div>
                                    <div className="text-[var(--tg-fg)] text-sm font-semibold">
                                        {money.format(("saldo_restante" in r ? r.saldo_restante : r.saldo) ?? 0)}
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                    {!rows.length && <li className="text-[var(--tg-muted)] text-sm py-6 text-center">Sin datos.</li>}
                </ul>
            </div>

            <style jsx>{`
        .nice-scroll::-webkit-scrollbar{width:10px}
        .nice-scroll::-webkit-scrollbar-track{background:color-mix(in srgb,var(--panel-bg) 85%,transparent);border-radius:10px}
        .nice-scroll::-webkit-scrollbar-thumb{background:color-mix(in srgb,var(--tg-muted) 70%,transparent);border-radius:10px;border:2px solid transparent;background-clip:content-box}
        .nice-scroll:hover::-webkit-scrollbar-thumb{background:color-mix(in srgb,var(--tg-primary) 70%,transparent);border:2px solid transparent;background-clip:content-box}
        .nice-scroll{scrollbar-width:thin;scrollbar-color:color-mix(in srgb,var(--tg-muted) 70%,transparent) transparent}
      `}</style>
        </section>
    );
}
