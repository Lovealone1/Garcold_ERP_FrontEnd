// components/barcode/ProductBarcode.tsx
"use client";

import Barcode, { type BarcodeProps } from "react-barcode";

type Props = {
    value: string;
    barcodeType?: string | null;
    compact?: boolean;
};

export function ProductBarcode({ value, barcodeType, compact }: Props) {
    if (!value) return null;

    const t = (barcodeType || "").toUpperCase();

    let format: BarcodeProps["format"];
    if (t === "EAN_13") format = "EAN13";
    else if (t === "EAN_8") format = "EAN8";
    else if (t === "UPC_A") format = "UPC";
    else if (t === "CODE_128") format = "CODE128";
    else if (t === "CODE_39") format = "CODE39";
    else if (t === "ITF" || t === "ITF_14") format = "ITF14";
    else format = /^\d+$/.test(value) ? "EAN13" : "CODE128";

    const wrapperStyle: React.CSSProperties = compact
        ? {
            display: "inline-block",
            padding: 0,
            margin: 0,
            border: "none",
            backgroundColor: "transparent",
        }
        : {
            padding: "8px 12px",
            borderRadius: "8px",
            backgroundColor: "var(--tg-card-bg)",
            border: "1px solid var(--tg-border)",
            display: "inline-block",
        };

    const height = compact ? 26 : 40;
    const width = compact ? 1 : 2;
    const fontSize = compact ? 9 : 12;

    return (
        <div style={wrapperStyle}>
            <Barcode
                value={value}
                format={format}
                height={height}
                width={width}
                displayValue
                background="transparent"
                lineColor="var(--tg-fg)"
                fontSize={fontSize}
            />
        </div>
    );
}
