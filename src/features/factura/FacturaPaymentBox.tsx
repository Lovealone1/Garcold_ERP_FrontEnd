"use client";
import * as React from "react";
import type { VentaFacturaDTO } from "@/types/factura";

type Props = {
    data: VentaFacturaDTO;
    className?: string;
};

const money = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });

export default function FacturaPaymentBox({ data, className }: Props) {
    const tipoVenta = data.estado.toLowerCase().includes("credito")
        ? "credito"
        : "contado";
    const estadoLabel =
        tipoVenta === "credito" ? "Venta Crédito" : "Venta Contado";

    const empresa = data.compania;

    return (
        <section className={`w-full ${className ?? ""}`}>
            {/* Divider superior */}
            <div className="w-full h-px bg-[#acacac]" />

            {/* Contenido principal */}
            <div className="flex justify-between items-start py-3 px-3 w-full">
                {/* Detalles de pago */}
                <div className="flex flex-col gap-1">
                    <div className="text-[12px] font-extrabold uppercase tracking-wide text-[#111827]">
                        Detalles de pago:
                    </div>
                    <div className="text-[13px] leading-tight">
                        <div>
                            <span className="text-[#6b7280]">Estado:&nbsp;</span>
                            <span className="text-[#111827] font-medium">{estadoLabel}</span>
                        </div>
                        <div>
                            <span className="text-[#6b7280]">Nro. de cuenta:&nbsp;</span>
                            <span className="text-[#111827] font-medium">
                                {data.numero_cuenta ?? "—"}
                            </span>
                        </div>

                        {/* Campo condicional: saldo restante */}
                        {data.saldo_restante > 0 && (
                            <div>
                                <span className="text-[#6b7280]">Saldo restante:&nbsp;</span>
                                <span className="text-[#111827] font-semibold">
                                    $ {money.format(data.saldo_restante)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Total alineado a la derecha */}
                <div className="ml-auto -mr-3 flex-shrink-0">
                    <div className="inline-flex items-baseline bg-[#718093] px-4 py-1 text-white rounded-sm">
                        <span className="uppercase text-[14px] font-medium">Total:&nbsp;</span>
                        <span className="text-[18px] font-bold">
                            $ {money.format(data.total)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Divider inferior */}
            <div className="w-full h-px bg-[#acacac]" />

            {/* Mensaje de agradecimiento y contacto */}
            <div className="px-3 pt-3 pb-3 text-center text-[12px] leading-snug text-[#718093]">
                <p className="mb-1">
                    <span className="text-[#111827] font-semibold">¡Gracias por su compra!</span>
                </p>
                <p>
                    Si tiene dudas o comentarios sobre esta factura, comuníquese con{" "}
                    <span className="text-[#111827] font-medium">
                        {empresa.nombre_completo}
                    </span>
                    .
                </p>
                <p className="mt-1">
                    <a
                        href={`mailto:${empresa.email_facturacion}`}
                        className="text-[#718093] hover:underline"
                    >
                        {empresa.email_facturacion}
                    </a>{" "}
                    {empresa.celular && (
                        <>
                            {" | "}
                            <a
                                href={`tel:${empresa.celular}`}
                                className="text-[#718093] hover:underline"
                            >
                                {empresa.celular}
                            </a>
                        </>
                    )}
                </p>
            </div>
        </section>
    );
}
