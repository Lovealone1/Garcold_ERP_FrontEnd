"use client";
import { useState } from "react";
import { MaterialIcon } from "@/components/ui/material-icon";
import type { Entity, Delimiter } from "@/services/sales/import.api";

type Props = {
    open: boolean;
    onClose: () => void;
    onRun: (opts: {
        entity: Entity;
        file: File;
        dryRun?: boolean;
        delimiter?: Delimiter;
        sheet?: string | null;
        headerRow?: number;
    }) => Promise<any>;
    loading: boolean;
    error?: string | null;
    report?: any;
    entities?: Entity[];
    fixedEntity?: Entity;
    title?: string;
    accept?: string;
};

const DEFAULT_ENTITIES = ["customers", "products", "suppliers"] as const;

export default function ImportDialog({
    open,
    onClose,
    onRun,
    loading,
    error,
    report,
    entities = DEFAULT_ENTITIES as unknown as Entity[],
    fixedEntity,
    title,
    accept = ".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}: Props) {
    const [file, setFile] = useState<File | null>(null);
    const [entity, setEntity] = useState<Entity>(fixedEntity ?? entities[0]!);
    const [delimiter, setDelimiter] = useState<Delimiter>(",");
    const [sheet, setSheet] = useState<string>("");
    const [headerRow, setHeaderRow] = useState<number>(1);
    const [dryRun, setDryRun] = useState<boolean>(true);

    if (!open) return null;

    const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget && !loading) onClose();
    };

    const handleImport = () => {
        if (!file) return;
        onRun({
            entity,
            file,
            delimiter,
            sheet: sheet || null,
            headerRow,
            dryRun,
        });
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-busy={loading || undefined}
            className="fixed inset-0 z-50 grid place-items-center bg-black/50"
            onKeyDown={(e) => {
                if (e.key === "Escape") onClose();
            }}
            onClick={handleBackdrop}
        >
            <div className="relative w-[560px] rounded-lg border border-tg bg-[var(--panel-bg)] shadow-xl">
                {loading && (
                    <div
                        className="absolute left-0 top-0 h-[2px] w-full overflow-hidden"
                        role="progressbar"
                        aria-label="Cargando"
                    >
                        <div className="h-full w-1/3 bg-tg-primary animate-pulse" />
                    </div>
                )}

                <div className="px-4 py-3 border-b border-tg flex items-center gap-2">
                    <MaterialIcon name="file_upload" size={18} />
                    <h3 className="text-base font-semibold">{title ?? "Importar datos"}</h3>
                </div>

                <div className="px-4 py-4 space-y-3 text-sm">
                    {!fixedEntity && (
                        <div>
                            <label className="block text-xs text-tg-muted mb-1">Entidad</label>
                            <select
                                className="w-full rounded-md border border-tg bg-[var(--panel-bg)] px-2 py-2"
                                value={entity}
                                onChange={(e) => setEntity(e.target.value as Entity)}
                                disabled={loading}
                            >
                                {entities.map((e) => (
                                    <option key={e} value={e}>
                                        {e}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="block text-xs text-tg-muted">Archivo</label>
                        <input
                            type="file"
                            accept={accept}
                            onChange={(e) => setFile(e.currentTarget.files?.[0] ?? null)}
                            disabled={loading}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-tg-muted mb-1">Delimitador</label>
                            <select
                                className="w-full rounded-md border border-tg bg-[var(--panel-bg)] px-2 py-2"
                                value={delimiter}
                                onChange={(e) => setDelimiter(e.target.value as Delimiter)}
                                disabled={loading}
                            >
                                <option value=",">,</option>
                                <option value=";">;</option>
                                <option value={"\t"}>tab</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-tg-muted mb-1">Fila encabezado</label>
                            <input
                                type="number"
                                min={1}
                                value={headerRow}
                                onChange={(e) => setHeaderRow(Number(e.target.value))}
                                className="w-full rounded-md border border-tg bg-[var(--panel-bg)] px-2 py-2"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-tg-muted mb-1">Hoja (.xlsx)</label>
                            <input
                                type="text"
                                placeholder="Opcional"
                                value={sheet}
                                onChange={(e) => setSheet(e.target.value)}
                                className="w-full rounded-md border border-tg bg-[var(--panel-bg)] px-2 py-2"
                                disabled={loading}
                            />
                        </div>
                        <label className="mt-6 inline-flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={dryRun}
                                onChange={() => setDryRun((v) => !v)}
                                disabled={loading}
                            />
                            <span>Validar sin aplicar</span>
                        </label>
                    </div>

                    {error ? <p className="text-red-500">{error}</p> : null}
                    {report ? (
                        <pre className="max-h-40 overflow-auto bg-black/10 p-2 rounded">
                            {JSON.stringify(report, null, 2)}
                        </pre>
                    ) : null}
                </div>

                <div className="px-4 py-3 border-t border-tg flex justify-end gap-2">
                    <button onClick={onClose} className="h-9 rounded-md px-3 text-sm" disabled={loading}>
                        Cerrar
                    </button>
                    <button
                        onClick={handleImport}
                        className="h-9 rounded-md px-3 text-sm font-medium disabled:opacity-60 border border-tg-primary text-tg-primary bg-[var(--panel-bg)] hover:bg-[color-mix(in_srgb,var(--tg-primary)_10%,transparent)]"
                        disabled={!file || loading}
                    >
                        {loading ? "Importando…" : "Importar"}
                    </button>
                </div>
            </div>
        </div>
    );
}
