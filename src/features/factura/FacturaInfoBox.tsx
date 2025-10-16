"use client";
import * as React from "react";
import type { CompaniaDTO } from "@/types/factura";

type Props = {
    compania: CompaniaDTO;
    fecha: string;
    className?: string;
};

export default function FacturaInfoBox({ compania, fecha, className }: Props) {
    return (
        <section className={`w-full ${className ?? ""}`}>
            <div className="flex justify-between items-start gap-8">
                {/* Columna izquierda: Empresa */}
                <div className="flex-1 text-left px-3 break-words">
                    <div className="text-[14px] font-bold text-[#111827] whitespace-normal break-words">
                        {compania.nombre_completo}
                    </div>
                    <div className="text-[13px] text-[#6b7280]">CC/NIT: {compania.cc_nit}</div>
                    <div className="text-[13px] text-[#6b7280]">{compania.email_facturacion}</div>
                    {compania.celular && (
                        <div className="text-[13px] text-[#6b7280]">Cel: {compania.celular}</div>
                    )}
                    <div className="text-[13px] text-[#6b7280]">{compania.direccion}</div>
                </div>

                {/* Columna derecha: Ubicación + fecha */}
                <div className="text-right w-[280px] pr-4">
                    <div className="text-[14px] font-semibold text-[#111827]">
                        {compania.municipio} - {compania.departamento}
                    </div>

                    {compania.codigo_postal && (
                        <div className="mt-1 text-[12px] text-[#6b7280]">
                            Código Postal:&nbsp;
                            <span className="text-[13px] font-semibold text-[#111827]">
                                {compania.codigo_postal}
                            </span>
                        </div>
                    )}

                    <div className="mt-2 text-[13px] text-[#6b7280]">Fecha de generación:</div>
                    <div className="text-[14px] font-bold text-[#111827]">{fecha}</div>
                </div>
            </div>

            {/* Divider */}
            <div className="mt-3 h-px bg-[#acacac]" />
        </section>
    );
}
