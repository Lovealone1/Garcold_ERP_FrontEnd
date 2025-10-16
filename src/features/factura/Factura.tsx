// components/factura/Factura.tsx
"use client";
import * as React from "react";
import FacturaPaper from "./FacturaPaper";
import FacturaHeader from "./FacturaHeader";
import FacturaInfoBox from "./FacturaInfoBox";
import FacturaClienteBox from "./FacturaClienteBox";
import FacturaItemsTable from "./FacturaItemsTable";
import FacturaPaymentBox from "./FacturaPaymentBox";
import type { VentaFacturaDTO } from "@/types/factura";

const ITEMS_PER_PAGE = 13;
const chunk = <T,>(arr: T[], size: number) =>
    Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
        arr.slice(i * size, i * size + size)
    );

type Props = {
    data: VentaFacturaDTO;
};

export default function Factura({ data }: Props) {
    const { venta_id, fecha, cliente, compania, detalles } = data;

    const pages = chunk(detalles, ITEMS_PER_PAGE);

    const formattedFecha = new Date(fecha).toLocaleDateString("es-CO", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });

    return (
        <>
            {pages.map((pageItems, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === pages.length - 1;

                return (
                    <FacturaPaper key={idx}>
                        <div className="relative h-[1100px] flex flex-col">
                            {/* Encabezado solo en la primera página */}
                            {isFirst && (
                                <>
                                    <FacturaHeader compania={compania} numero={`INV-${venta_id}`} fecha={formattedFecha} />
                                    <FacturaInfoBox compania={compania} fecha={formattedFecha} className="ml-auto" />
                                    <FacturaClienteBox cliente={cliente} className="mt-1" />
                                </>
                            )}

                            {/* Tabla de productos */}
                            <div className={isLast ? "flex-1 pb-24" : "flex-1"}>
                                <FacturaItemsTable items={pageItems} className={isFirst ? "mt-1" : ""} />
                            </div>

                            {/* Footer en la última página */}
                            {isLast && (
                                <div className="absolute left-0 right-0 bottom-[25mm]">
                                    <FacturaPaymentBox data={data} />
                                </div>
                            )}
                        </div>
                    </FacturaPaper>
                );
            })}
        </>
    );
}
