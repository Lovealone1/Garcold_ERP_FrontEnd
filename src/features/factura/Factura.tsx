"use client";
import * as React from "react";
import FacturaPaper from "./FacturaPaper";
import FacturaHeader from "./FacturaHeader";
import FacturaInfoBox from "./FacturaInfoBox";
import FacturaClienteBox from "./FacturaClienteBox";
import FacturaItemsTable from "./FacturaItemsTable";
import FacturaPaymentBox from "./FacturaPaymentBox";
import type { SaleInvoiceDTO, SaleItemViewDesc } from "@/types/sale-invoice";

const ITEMS_PER_PAGE = 13;

// segura contra undefined/null y size inválido
const chunk = <T,>(arr: readonly T[] | null | undefined, size: number): T[][] => {
    const a = arr ?? [];
    const s = Math.max(1, Math.trunc(size || 1));
    const out: T[][] = [];
    for (let i = 0; i < a.length; i += s) out.push(a.slice(i, i + s));
    return out;
};

// formatea "YYYY-MM-DD" sin shift de TZ
function formatEsDate(isoYmd: string | undefined): string {
    if (!isoYmd) return "";
    const [y, m, d] = isoYmd.split("-").map(Number);
    if (!y || !m || !d) return isoYmd;
    const dt = new Date(Date.UTC(y, m - 1, d));
    return dt.toLocaleDateString("es-CO", { year: "numeric", month: "2-digit", day: "2-digit" });
}

type Props = { data: SaleInvoiceDTO };

export default function Factura({ data }: Props) {
    const detalles: SaleItemViewDesc[] = data?.items ?? [];
    const pages = React.useMemo(() => chunk(detalles, ITEMS_PER_PAGE), [detalles]);

    const formattedFecha = formatEsDate(data?.date);

    return (
        <>
            {pages.map((pageItems, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === pages.length - 1;

                return (
                    <FacturaPaper key={idx}>
                        <div className="relative h-[1100px] flex flex-col">
                            {isFirst && (
                                <>
                                    <FacturaHeader
                                        company={data.company}
                                        numero={`GC-${data.sale_id}`}
                                        fecha={formattedFecha}
                                    />
                                    <FacturaInfoBox compania={data.company} fecha={formattedFecha} className="ml-auto" />
                                    <FacturaClienteBox cliente={data.customer} className="mt-1" />
                                </>
                            )}

                            <div className={isLast ? "flex-1 pb-24" : "flex-1"}>
                                <FacturaItemsTable items={pageItems} className={isFirst ? "mt-1" : ""} />
                            </div>

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
