"use client";
import * as React from "react";
import type { Cliente } from "@/types/clientes";

type Props = {
    cliente: Cliente;
    className?: string;
};

export default function FacturaClienteBox({ cliente, className }: Props) {
    return (
        <section className={`w-full px-2 mt-2 mb-2 ${className ?? ""}`}>
            <div className="grid grid-cols-[270px_1fr_160px] gap-y-0 gap-x-4 leading-tight">
                {/* Encabezado */}
                <div className="text-[15px] font-bold text-[#111827]">Cliente:</div>
                <div className="text-[14px] text-[#6b7280]">CC/NIT: {cliente.cc_nit}</div>
                <div className="text-[13px] text-[#6b7280] text-right">
                    Cel: {cliente.celular ?? "-"}
                </div>

                {/* Fila 2 */}
                <div className="text-[13px] text-[#111827] col-span-1">{cliente.nombre}</div>
                <div className="text-[13px] text-[#6b7280] col-span-1">
                    {cliente.correo ?? "-"}
                </div>
                <div className="text-[13px] text-[#6b7280] text-right col-span-1">
                    {cliente.ciudad} - {cliente.direccion}
                </div>
            </div>

            <div className="-mx-2 mt-2 h-px bg-[#acacac]" />
        </section>
    );
}
