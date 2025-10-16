"use client";
import * as React from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
  margin?: string;      // "12mm"
  width?: string;       // "8.5in" | "210mm"
  height?: string;      // << controla el largo. Ej: "10in"
};

export default function FacturaPaper({
  children,
  className,
  margin = "12mm",
  width = "8.5in",
  height = "11in",      // antes era min-height; ahora altura fija más corta
}: Props) {
  return (
    <section className={`factura-paper ${className ?? ""}`}>
      {children}

      <style jsx>{`
        .factura-paper {
          width: ${width};
          height: ${height};
          background: #ffffff;
          color: #111111;
          margin: 16px auto;
          padding: ${margin};
          box-shadow: 0 2px 12px rgba(0,0,0,.12);
          border-radius: 4px;
        }

        :global(.page-break) { break-after: page; }
        :global(.avoid-break) { break-inside: avoid; }

        @media print {
          @page { size: ${width} ${height}; margin: 0; }
          html, body { background: #ffffff !important; }
          .factura-paper {
            box-shadow: none;
            margin: 0;
            width: ${width};
            height: ${height};
            padding: ${margin};
            border-radius: 0;
          }
        }
      `}</style>
    </section>
  );
}
