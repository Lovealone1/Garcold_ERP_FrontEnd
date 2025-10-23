"use client";
import { useState } from "react";
import { MaterialIcon } from "@/components/ui/material-icon";
import { Entity, Fmt } from "@/services/sales/export.api";

type Props = {
    open: boolean;
    onClose: () => void;
    onDownload: (entity: Entity, fmt: Fmt, filename?: string) => Promise<void>;
    loading: boolean;
    error?: string | null;
    entities?: Entity[];
    fixedEntity?: Entity;
    title?: string;
    defaultName?: string;
};

export default function ExportDialog({
    open,
    onClose,
    onDownload,
    loading,
    error,
    entities = ["customers", "products", "suppliers"],
    fixedEntity,
    title,
    defaultName,
}: Props) {
    const initialEntity = fixedEntity ?? entities[0];
    const [entity, setEntity] = useState<Entity>(initialEntity);
    const [fmt, setFmt] = useState<Fmt>("csv");
    const [name, setName] = useState<string>(defaultName ?? String(initialEntity));
    if (!open) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-busy={loading || undefined}
            className="fixed inset-0 z-50 grid place-items-center bg-black/50"
            onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
            onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}
        >
            <div className="relative w-[480px] rounded-lg border border-tg bg-[var(--panel-bg)] shadow-xl">
                {/* Top loading bar */}
                {loading && (
                    <div className="absolute left-0 top-0 h-[2px] w-full overflow-hidden" role="progressbar" aria-label="Cargando">
                        <div className="h-full w-1/3 bg-tg-primary animate-exportbar" />
                    </div>
                )}

                <div className="px-4 py-3 border-b border-tg flex items-center gap-2">
                    <MaterialIcon name="file_download" size={18} />
                    <h3 className="text-base font-semibold">{title ?? "Exportar datos"}</h3>
                </div>

                <div className="px-4 py-4 space-y-3 text-sm">
                    {!fixedEntity && (
                        <div>
                            <label className="block text-xs text-tg-muted mb-1">Entidad</label>
                            <select
                                className="w-full rounded-md border border-tg bg-[var(--panel-bg)] px-2 py-2"
                                value={entity}
                                onChange={(e) => {
                                    const v = e.target.value as Entity;
                                    setEntity(v);
                                    setName(String(v));
                                }}
                                disabled={loading}
                            >
                                {entities.map((e) => <option key={e} value={e}>{e}</option>)}
                            </select>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-tg-muted mb-1">Formato</label>
                            <select
                                className="w-full rounded-md border border-tg bg-[var(--panel-bg)] px-2 py-2"
                                value={fmt}
                                onChange={(e) => setFmt(e.target.value as Fmt)}
                                disabled={loading}
                            >
                                <option value="csv">CSV</option>
                                <option value="xlsx">XLSX</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-tg-muted mb-1">Nombre archivo</label>
                            <input
                                className="w-full rounded-md border border-tg bg-[var(--panel-bg)] px-2 py-2"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {error ? <p className="text-red-500">{error}</p> : null}
                </div>

                <div className="px-4 py-3 border-t border-tg flex justify-end gap-2">
                    <button onClick={onClose} className="h-9 rounded-md px-3 text-sm" disabled={loading}>Cerrar</button>
                    <button
                        onClick={() => onDownload(entity, fmt, `${name}.${fmt}`)}
                        className="h-9 rounded-md bg-tg-primary px-3 text-sm font-medium text-tg-on-primary disabled:opacity-60"
                        disabled={loading}
                    >
                        {loading ? "Generando…" : "Descargar"}
                    </button>
                </div>
            </div>

            {/* Keyframes locales */}
            <style jsx>{`
        @keyframes exportbar {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(30%); }
          100% { transform: translateX(200%); }
        }
        .animate-exportbar {
          animation: exportbar 1.1s ease-in-out infinite;
        }
      `}</style>
        </div>
    );
}
