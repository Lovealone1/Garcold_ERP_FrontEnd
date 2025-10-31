"use client";
import * as React from "react";
import type { SaleItemViewDesc } from "@/types/sale-invoice";

type Props = { items: SaleItemViewDesc[]; className?: string };

const num = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });

export default function FacturaItemsTable({ items, className }: Props) {
  return (
    <section className={`w-full ${className ?? ""}`}>
      {/* Encabezado */}
      <div className="grid [grid-template-columns:140px_1fr_90px_120px_120px] px-3 py-3 rounded-sm bg-[#718093] text-white uppercase tracking-wider text-[12px]">
        <div>Referencia</div>
        <div>Descripción</div>
        <div className="text-center">Cantidad</div>
        <div className="text-right">Precio</div>
        <div className="text-right">Subtotal</div>
      </div>

      {/* Filas */}
      {items.map((it, i) => (
        <div
          key={i}
          className="grid [grid-template-columns:140px_1fr_90px_120px_120px] px-3 py-2 border-b border-[#e5e7eb] text-[13px] text-[#111827]"
        >
          {/* FIX: aplicar estilos de celda a ref y desc */}
          <div className="cell">{it.product_reference}</div>
          <div className="cell">{it.product_description}</div>

          <div className="qty">{it.quantity}</div>

          <div className="money">
            <span className="sym">$</span>
            <span className="num">{num.format(it.unit_price)}</span>
          </div>
          <div className="money">
            <span className="sym">$</span>
            <span className="num">{num.format(it.total)}</span>
          </div>
        </div>
      ))}

      <style jsx>{`
        .cell { justify-self: left; align-self: left; }

        .qty { justify-self: center; align-self: center; }

        .money {
          display: inline-grid;
          grid-template-columns: 1ch auto;
          column-gap: 6px;
          justify-self: end;
          white-space: nowrap;
          font-variant-numeric: tabular-nums;
        }
        .sym { justify-self: end; }
        .num { text-align: right; }

        @media print {
          .cell { letter-spacing: 0 !important; text-transform: none !important; }
        }
      `}</style>
    </section>
  );
}
