"use client";
import Image from "next/image";
import * as React from "react";
import type { CompaniaDTO } from "@/types/factura";

type Props = {
  compania: CompaniaDTO;
  numero: string;
  fecha?: string;
  showDivider?: boolean;
};

export default function FacturaHeader({ compania, numero, fecha, showDivider = true }: Props) {
  const raw = (compania.razon_social || "").trim().replace(/\s{2,}/g, " ");
  const [first, ...rest] = raw.split(" ");
  const top = (first || "").toUpperCase();
  const bottom = rest.length ? rest.join(" ").toUpperCase() : "";

  return (
    <header className="mb-2">
      <div className="flex items-start justify-between">
        {/* Logo + razón social en dos líneas */}
        <div className="py-3 flex items-center gap-1">
          <Image src="/garcold.png" alt={`${raw} logo`} width={110} height={96} priority />
          <div className="leading-tight brand">
            <div className="brand-top">{top}</div>
            {bottom && <div className="brand-bottom text-[#718093]">{bottom}</div>}
          </div>
        </div>

        {/* Número y fecha — ahora más alineado a la derecha */}
        <div className="text-right pr-[0mm]">
          <div className="rounded-lg bg-[#ffffff] px-6 py-2 inline-block min-w-[190px]">
            <div className="text-[13px] text-[#6b7280]">Número de factura:</div>
            <div className="text-[14px] font-bold text-[#111827]">{numero}</div>
            {fecha ? (
              <>
                <div className="mt-1 text-[12px] text-[#6b7280]">Fecha:</div>
                <div className="text-[14px] font-bold text-[#111827]">{fecha}</div>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {showDivider && <div className="divider" />}

      <style jsx>{`
        .brand-top { font-weight: 900; font-size: 25px; color: #18252d; line-height: 0.6; }
        .brand-bottom { font-weight: 800; font-size: 30px; color: #718093; line-height: 1.1; margin-top: 2px; }
        .divider { margin-top: 12px; height: 1px; background: #acacac; }
      `}</style>
    </header>
  );
}
