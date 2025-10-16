// components/top/TopProductosGrid.tsx
"use client";
import * as React from "react";
import type { TopProductoItemDTO } from "@/types/reporte-general";

type Props = {
  items: TopProductoItemDTO[];
  className?: string;
};

export default function TopProductosGrid({ items, className }: Props) {
  const top = items.slice(0, 10);

  return (
    <section className={className}>
      <h4 className="text-xm font-bold text-tg-primary mb-2">Productos más vendidos</h4>

      <div
        className="
          grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5
          gap-x-2 gap-y-4 md:gap-y-5    /* más separación vertical */
        "
      >
        {top.map((p, i) => (
          <article
            key={p.producto_id ?? i}
            className="flex items-center gap-2 rounded-lg border border-tg p-2
                       bg-[color-mix(in_srgb,var(--panel-bg) 94%,transparent)]"
          >
            <div
              className="flex h-6 w-6 items-center justify-center rounded-full
                         bg-[var(--tg-primary)] text-[var(--tg-card-bg)] text-xs font-bold"
            >
              {i + 1}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[var(--tg-fg)] text-xs font-medium" title={p.producto}>
                {p.producto}
              </div>
              <div className="text-[var(--tg-muted)] text-[10px]">
                Cant: <span className="text-[var(--tg-fg)] font-semibold">{p.cantidad_total}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
