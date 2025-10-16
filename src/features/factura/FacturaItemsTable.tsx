"use client";
import * as React from "react";
import type { DetalleVentaViewDesc } from "@/types/factura";

type Props = {
    items: DetalleVentaViewDesc[];
    className?: string;
};

const num = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });

export default function FacturaItemsTable({ items, className }: Props) {
    return (
        <section className={`w-full ${className ?? ""}`}>
            {/* Encabezado */}
            <div className="grid [grid-template-columns:140px_1fr_90px_120px_120px] px-3 py-3 rounded-sm bg-[#718093] text-white uppercase tracking-wider text-[12px]">
                <div >Referencia</div>
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
                    <div className="truncate">{it.producto_referencia}</div>
                    <div className="truncate">{it.producto_descripcion}</div>

                    <div className="qty">{it.cantidad}</div>

                    <div className="money">
                        <span className="sym">$</span>
                        <span className="num">{num.format(it.precio)}</span>
                    </div>
                    <div className="money">
                        <span className="sym">$</span>
                        <span className="num">{num.format(it.total)}</span>
                    </div>
                </div>
            ))}

            <style jsx>{`
        .qty {
          justify-self: center;
          align-self: center;
        }
        .money {
          display: inline-grid;
          grid-template-columns: 1ch auto;
          column-gap: 6px;
          justify-self: end;
          white-space: nowrap;
          font-variant-numeric: tabular-nums;
        }
        .sym {
          justify-self: end;
        }
        .num {
          text-align: right;
        }
      `}</style>
        </section>
    );
}
