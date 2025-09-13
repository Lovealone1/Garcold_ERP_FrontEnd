// app/(finanzas)/inversiones/page.tsx
"use client";

import { useEffect, useMemo, useState, CSSProperties } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

type Inversion = {
    id: number;               // existe pero NO se muestra
    nombre: string;
    saldo: number;
    fecha_vencimiento: string; // ISO (date)
};

const money = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

export default function InversionesPage() {
    const [rows, setRows] = useState<Inversion[]>([]);
    const [q, setQ] = useState("");
    const [page, setPage] = useState(1);
    const [size] = useState(10);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        fetch(`/api/inversiones?page=${page}&size=${size}&q=${encodeURIComponent(q)}`)
            .then((r) => r.json())
            .then((res: { items: Inversion[]; total: number }) => { setRows(res.items); setTotal(res.total); })
            .finally(() => setLoading(false));
    }, [page, size, q]);

    const from = useMemo(() => (total === 0 ? 0 : (page - 1) * size + 1), [page, size, total]);
    const to = useMemo(() => Math.min(page * size, total), [page, size, total]);
    const pageCount = useMemo(() => Math.max(1, Math.ceil(total / size)), [total, size]);

    const frameVars: CSSProperties = {
        ["--content-x" as any]: "16px",
        ["--page-bg" as any]: "color-mix(in srgb, var(--tg-bg) 96%, white 4%)",
        ["--panel-bg" as any]: "color-mix(in srgb, var(--tg-card-bg) 90%, black 10%)",
    };

    const onView = (r: Inversion) => { };

    return (
        <div className="app-shell__frame min-h-screen" style={frameVars}>
            <div className="bg-[var(--page-bg)] rounded-xl px-[var(--content-x)] pb-[var(--content-b)] pt-3">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-2xl font-semibold text-tg-fg">Inversiones</h2>
                    <div className="flex flex-wrap items-center gap-2">
                        <label className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-tg-muted">
                                <SearchIcon fontSize="small" />
                            </span>
                            <input
                                type="search"
                                placeholder="Buscar inversión"
                                className="h-10 w-[260px] rounded-md border border-tg bg-tg-card text-tg-card pl-9 pr-3 outline-none focus:ring-2 focus:ring-tg-primary"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                            />
                        </label>
                        <button onClick={() => { }} className="h-10 rounded-md bg-tg-primary px-4 text-sm font-medium text-tg-on-primary shadow-sm">
                            Nueva inversión
                        </button>
                    </div>
                </div>

                <div className="rounded-xl overflow-hidden border border-[var(--panel-border)] bg-[var(--panel-bg)] shadow-md">
                    <div className="overflow-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-[var(--table-head-bg)] text-[var(--table-head-fg)]">
                                    <th className="px-4 py-3 text-left">Nombre</th>
                                    <th className="px-4 py-3 text-right">Saldo</th>
                                    <th className="px-4 py-3 text-left">Vencimiento</th>
                                    <th className="px-4 py-3 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading
                                    ? Array.from({ length: 10 }).map((_, i) => (
                                        <tr key={`sk-${i}`} className="border-t border-tg">
                                            {Array.from({ length: 4 }).map((__, j) => (
                                                <td key={j} className="px-4 py-3">
                                                    <div className="h-4 w-full animate-pulse rounded bg-black/10 dark:bg-white/10" />
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                    : rows.length === 0 ? (
                                        <tr><td colSpan={4} className="px-4 py-10 text-center text-tg-muted">Sin registros</td></tr>
                                    ) : rows.map((r) => (
                                        <tr key={r.id} className="border-t border-tg hover:bg-black/5 dark:hover:bg-white/5">
                                            <td className="px-4 py-3">{r.nombre}</td>
                                            <td className="px-4 py-3 text-right">{money.format(r.saldo)}</td>
                                            <td className="px-4 py-3">{format(new Date(r.fecha_vencimiento), "dd MMM yyyy", { locale: es })}</td>
                                            <td className="px-2 py-2">
                                                <div className="flex items-center justify-center">
                                                    <Tooltip title="Ver detalles" arrow>
                                                        <IconButton size="small" onClick={() => onView(r)} aria-label="ver detalles">
                                                            <VisibilityOutlinedIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-tg px-4 py-3">
                        <div className="flex items-center gap-2">
                            <span className="text-sm">Líneas por página</span>
                            <select value={10} disabled className="h-9 rounded-md border border-tg bg-[var(--panel-bg)] px-2 text-sm text-tg-muted">
                                <option value={10}>10</option>
                            </select>
                        </div>
                        <nav className="flex items-center gap-1">
                            <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="h-8 rounded px-2 text-sm disabled:opacity-40 hover:bg-black/10 dark:hover:bg-white/10">Anterior</button>
                            {Array.from({ length: pageCount }).slice(0, 5).map((_, i) => {
                                const p = i + 1; const active = p === page;
                                return <button key={p} onClick={() => setPage(p)} className={`h-8 min-w-8 rounded px-2 text-sm ${active ? "bg-tg-primary text-tg-on-primary" : "hover:bg-black/10 dark:hover:bg-white/10"}`}>{p}</button>;
                            })}
                            {pageCount > 5 && <span className="px-1">…</span>}
                            <button disabled={page >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))} className="h-8 rounded px-2 text-sm disabled:opacity-40 hover:bg-black/10 dark:hover:bg-white/10">Próximo</button>
                        </nav>
                        <div className="text-sm text-tg-muted">Exhibiendo {from}-{to} de {total} registros</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
