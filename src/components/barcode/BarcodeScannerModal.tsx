"use client";

import { useEffect, useRef, useState } from "react";
import {
    BrowserMultiFormatReader,
    IScannerControls,
} from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";

type Props = {
    open: boolean;
    onDetected: (code: string, format?: string) => void;
    onClose: () => void;
};

const hints = new Map();
hints.set(DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.CODE_39,
    BarcodeFormat.CODE_128,
    BarcodeFormat.ITF,
]);
hints.set(DecodeHintType.TRY_HARDER, true);

export function BarcodeScannerModal({ open, onDetected, onClose }: Props) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;
        if (!videoRef.current) return;

        const reader = new BrowserMultiFormatReader(hints as any);
        let controls: IScannerControls | null = null;
        let active = true;

        const stopStream = () => {
            const video = videoRef.current;
            if (!video) return;
            const stream = video.srcObject as MediaStream | null;
            if (stream) {
                stream.getTracks().forEach((t) => t.stop());
            }
            video.srcObject = null;
        };

        (async () => {
            try {
                controls = await reader.decodeFromConstraints(
                    {
                        audio: false,
                        video: {
                            facingMode: { ideal: "environment" },
                        },
                    },
                    videoRef.current as HTMLVideoElement,
                    (result, _err, c) => {
                        if (!active) return;
                        if (result) {
                            active = false;
                            c.stop();
                            stopStream();

                            const raw = (result as any).getBarcodeFormat?.();
                            let formatName: string | undefined;

                            if (typeof raw === "number") {
                                formatName = (BarcodeFormat as any)[raw];
                            } else if (typeof raw === "string") {
                                formatName = raw;
                            }

                            onDetected(result.getText(), formatName);
                            onClose(); 
                        }
                    }
                );
            } catch {
                if (active) setError("No se pudo acceder a la cámara");
            }
        })();

        return () => {
            active = false;
            try {
                controls?.stop();
            } catch {
            }
            stopStream();
        };
    }, [open, onDetected, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70">
            <div
                className="relative w-full max-w-sm h-[80vh] rounded-2xl flex flex-col"
                style={{
                    backgroundColor: "var(--tg-bg)",
                    color: "var(--tg-fg)",
                    border: "1px solid var(--tg-bg)",
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2 text-xs">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-1 text-[var(--tg-muted)] hover:text-[var(--tg-primary)]"
                    >
                        ✕
                    </button>
                    <span className="text-[var(--tg-muted)] text-xs">Escáner</span>
                    <span className="text-[var(--tg-primary)] text-lg">⚡</span>
                </div>

                {/* Video + marco */}
                <div className="flex-1 relative px-4 pb-4">
                    <div className="w-full h-full rounded-xl overflow-hidden relative">
                        <video
                            ref={videoRef}
                            className="w-full h-full object-cover"
                            muted
                            autoPlay
                            playsInline
                        />
                        <div className="pointer-events-none absolute inset-0 bg-black/35" />
                        <div
                            className="
                pointer-events-none
                absolute left-1/2 top-1/2
                -translate-x-1/2 -translate-y-1/2
                w-[82%] h-[32%]
                rounded-xl
              "
                            style={{
                                border: "2px solid var(--tg-primary)",
                                boxShadow: "0 0 0 9999px rgba(0,0,0,0.45)",
                            }}
                        >
                            <div
                                className="absolute left-2 right-2 top-1/2 -translate-y-1/2 h-[2px]"
                                style={{ backgroundColor: "var(--tg-primary)" }}
                            />
                        </div>
                    </div>
                </div>

                {/* Mensaje inferior */}
                <div
                    className="mx-3 mb-3 rounded-xl text-center text-xs font-medium py-2"
                    style={{
                        backgroundColor: "var(--tg-primary)",
                        color: "var(--tg-primary-fg)",
                    }}
                >
                    Apunta la cámara al código de barras
                </div>

                {error && (
                    <div className="px-3 pb-2 text-[10px] text-red-400 text-center">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}
