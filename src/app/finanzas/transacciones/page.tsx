// app/(finanzas)/transacciones/page.tsx
"use client";

import { useMemo, useState, CSSProperties } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { MaterialIcon } from "@/components/ui/material-icon";

import { useTransacciones } from "@/hooks/transacciones/useTransacciones";
import { useDeleteTransaccion } from "@/hooks/transacciones/useDeleteTransaccion";
import { useCreateTransaccion } from "@/hooks/transacciones/useCreateTransaccion";
import { useAlertCenter, AlertHost } from "@/components/ui/AlertCenter"; 

const money = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

export default function TransaccionesPage() {
    const {
        items, page, setPage, loading, refresh,
        has_prev, has_next, total_pages, page_size, total,
        filters, setFilters, options,
    } = useTransacciones(1, 10);

    const { remove, loading: deleting } = useDeleteTransaccion();
    const { create, loading: creating } = useCreateTransaccion();

    // alertas
    const { alert, notify, close } = useAlertCenter();

    // crear
    const [openCreate, setOpenCreate] = useState(false);
    const [form, setForm] = useState({ banco_id: "", tipo_id: "", monto: "", descripcion: "" });

    // vista
    const viewRows = useMemo(() => items.map(r => ({ ...r, bancoLabel: `Banco ${r.banco_id}` })), [items]);
    const bancos = options.bancos;
    const tipos = options.tipos;

    // paginación
    const pageSize = page_size ?? 10;
    const totalPages = total_pages ?? 1;
    const hasPrev = !!has_prev;
    const hasNext = !!has_next;
    const from = useMemo(() => (total === 0 ? 0 : (page - 1) * pageSize + 1), [page, pageSize, total]);
    const to = useMemo(() => Math.min(page * pageSize, total ?? 0), [page, pageSize, total]);

    const [start, end] = useMemo(() => {
        const win = 5;
        if (totalPages <= win) return [1, totalPages] as const;
        const s = Math.max(1, Math.min(page - 2, totalPages - (win - 1)));
        return [s, s + (win - 1)] as const;
    }, [page, totalPages]);

    const frameVars: CSSProperties = { ["--content-x" as any]: "16px" };

    // eliminar con confirmación
    const [deleteId, setDeleteId] = useState<number | null>(null);
    async function confirmDelete() {
        if (!deleteId) return;
        try {
            await remove(deleteId);
            notify("success", `Transacción #${deleteId} eliminada`);
            setDeleteId(null);
            refresh();
        } catch (e: any) {
            const msg = e?.response?.data?.detail || e?.message || "Error eliminando transacción";
            notify("error", msg);
        }
    }

    // crear
    async function handleCreate() {
        const banco_id = Number(form.banco_id);
        const tipo_id = Number(form.tipo_id);
        const monto = Number(form.monto);
        if (!banco_id || !tipo_id || !monto) return;
        try {
            await create({ banco_id, tipo_id, monto, descripcion: form.descripcion || undefined });
            notify("success", "Transacción creada");
            setOpenCreate(false);
            setForm({ banco_id: "", tipo_id: "", monto: "", descripcion: "" });
            setPage(1);
            refresh();
        } catch (e: any) {
            const msg = e?.response?.data?.detail || e?.message || "Error creando transacción";
            notify("error", msg);
        }
    }

    function clearFilters() { setFilters({ q: "", banco: "", tipo: "", origen: "all" }); }

    return (
        <div className="app-shell__frame overflow-hidden" style={frameVars}>
            <div className="bg-[var(--page-bg)] rounded-xl h-full flex flex-col px-[var(--content-x)] pt-3 pb-5">
                {/* Header + filtros */}
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-2xl font-semibold text-tg-fg">Transacciones</h2>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Buscar */}
                        <label className="relative flex items-center flex-none h-10 w-[260px]">
                            <span className="absolute inset-y-0 left-3 flex items-center text-tg-muted pointer-events-none">
                                <MaterialIcon name="search" size={18} />
                            </span>
                            <input
                                type="search"
                                placeholder="Buscar"
                                className="h-10 w-full rounded-md border border-tg bg-tg-card text-tg-card pl-9 pr-3
                focus:outline-none focus:ring-tg-primary"
                                value={filters.q ?? ""}
                                onChange={(e) => { setPage(1); setFilters(f => ({ ...f, q: e.target.value })); }}
                            />
                        </label>

                        {/* Banco */}
                        <select
                            value={filters.banco ?? ""}
                            onChange={(e) => { setPage(1); setFilters(f => ({ ...f, banco: e.target.value })); }}
                            className="h-10 flex-none w-[180px] rounded-md border border-tg bg-tg-card px-3 text-sm text-tg-muted"
                        >
                            <option value="">Banco</option>
                            {bancos.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>

                        {/* Tipo */}
                        <select
                            value={filters.tipo ?? ""}
                            onChange={(e) => { setPage(1); setFilters(f => ({ ...f, tipo: e.target.value })); }}
                            className="h-10 flex-none w-[180px] rounded-md border border-tg bg-tg-card px-3 text-sm text-tg-muted"
                        >
                            <option value="">Tipo</option>
                            {tipos.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>

                        {/* Origen */}
                        <select
                            value={filters.origen ?? "all"}
                            onChange={(e) => setFilters(f => ({ ...f, origen: e.target.value as any }))}
                            className="h-10 flex-none w-[160px] rounded-md border border-tg bg-tg-card px-3 text-sm text-tg-muted"
                        >
                            <option value="all">Origen</option>
                            <option value="manual">Manual</option>
                            <option value="auto">Automática</option>
                        </select>

                        {/* Limpiar */}
                        <span
                            onClick={clearFilters}
                            className="cursor-pointer text-sm text-tg-primary hover:underline ml-2 mr-2 select-none"
                            role="button"
                            tabIndex={0}
                        >
                            Limpiar filtros
                        </span>

                        {/* Nuevo */}
                        <button
                            onClick={() => setOpenCreate(true)}
                            className="h-10 rounded-md bg-tg-primary px-4 text-sm font-medium text-tg-on-primary shadow-sm"
                            disabled={creating}
                        >
                            Nueva transacción
                        </button>
                    </div>
                </div>

                {/* Tabla */}
                <div className="rounded-xl border border-[var(--panel-border)] bg-[var(--panel-bg)] shadow-md flex-1 min-h-0 flex flex-col overflow-hidden">
                    <div className="flex-1 min-h-0 overflow-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-[var(--table-head-bg)] text-[var(--table-head-fg)]">
                                    <th className="px-4 py-3 text-left">#</th>
                                    <th className="px-4 py-3 text-left">Banco</th>
                                    <th className="px-4 py-3 text-left">Tipo</th>
                                    <th className="px-4 py-3 text-right">Monto</th>
                                    <th className="px-4 py-3 text-left">Descripción</th>
                                    <th className="px-4 py-3 text-left">Creación</th>
                                    <th className="px-4 py-3 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    Array.from({ length: pageSize }).map((_, i) => (
                                        <tr key={`sk-${i}`} className="border-t border-tg">
                                            {Array.from({ length: 7 }).map((__, j) => (
                                                <td key={j} className="px-4 py-3">
                                                    <div className="h-4 w-full animate-pulse rounded bg-black/10 dark:bg-white/10" />
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : items.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-10 text-center text-tg-muted">Sin registros</td>
                                    </tr>
                                ) : (
                                    viewRows.map((r) => (
                                        <tr key={r.id} className="border-t border-tg hover:bg-black/5 dark:hover:bg-white/5">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={`inline-block h-2.5 w-2.5 rounded-full ${r.origen === "auto" ? "bg-red-500" : "bg-emerald-500"}`}
                                                        aria-label={r.origen === "auto" ? "Automática" : "Manual"}
                                                        title={r.origen === "auto" ? "Automática" : "Manual"}
                                                    />
                                                    <span>{r.id}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">{r.bancoLabel}</td>
                                            <td className="px-4 py-3">{r.tipo_str}</td>
                                            <td className="px-4 py-3 text-right">{money.format(r.monto)}</td>
                                            <td className="px-4 py-3">{r.descripcion || "—"}</td>
                                            <td className="px-4 py-3">{format(new Date(r.fecha_creacion), "dd MMM yyyy", { locale: es })}</td>
                                            <td className="px-2 py-2">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        className={`rounded p-2 ${r.locked ? "text-tg-muted cursor-not-allowed" : "text-tg-primary hover:bg-black/10 dark:hover:bg-white/10"}`}
                                                        aria-label="eliminar"
                                                        onClick={() => !r.locked && setDeleteId(r.id)}
                                                        disabled={r.locked || deleting}
                                                        title={r.locked ? "Automática: no se puede eliminar" : "Eliminar"}
                                                    >
                                                        <MaterialIcon name="delete" size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Paginación */}
                    <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 border-t border-tg px-4 py-3">
                        <div className="flex items-center gap-2">
                            <span className="text-sm">Líneas por página</span>
                            <select value={pageSize} disabled className="h-9 rounded-md border border-tg bg-[var(--panel-bg)] px-2 text-sm text-tg-muted">
                                <option value={pageSize}>{pageSize}</option>
                            </select>
                        </div>

                        <nav className="flex items-center gap-1">
                            <button disabled={!hasPrev} onClick={() => setPage(1)} className="h-8 w-8 rounded text-sm disabled:opacity-40 hover:bg-black/10 dark:hover:bg-white/10 grid place-items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-tg-primary" aria-label="Primera página" title="Primera página">
                                <MaterialIcon name="first_page" size={18} />
                            </button>
                            <button disabled={!hasPrev} onClick={() => setPage(page - 1)} className="h-8 w-8 rounded text-sm disabled:opacity-40 hover:bg-black/10 dark:hover:bg-white/10 grid place-items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-tg-primary" aria-label="Anterior" title="Anterior">
                                <MaterialIcon name="chevron_left" size={18} />
                            </button>
                            {Array.from({ length: (Math.max(1, Math.min(totalPages, 5))) }).map((_, i) => {
                                const startCalc = Math.max(1, Math.min(page - 2, totalPages - 4));
                                const p = startCalc + i;
                                const active = p === page;
                                return (
                                    <button
                                        key={p}
                                        onClick={() => setPage(p)}
                                        className={`h-8 min-w-8 rounded px-2 text-sm ${active ? "bg-tg-primary text-tg-on-primary" : "hover:bg-black/10 dark:hover:bg-white/10"} focus:outline-none focus-visible:ring-2 focus-visible:ring-tg-primary`}
                                        aria-current={active ? "page" : undefined}
                                    >
                                        {p}
                                    </button>
                                );
                            })}
                            {end < totalPages && <span className="px-1">…</span>}
                            <button disabled={!hasNext} onClick={() => setPage(page + 1)} className="h-8 w-8 rounded text-sm disabled:opacity-40 hover:bg-black/10 dark:hover:bg-white/10 grid place-items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-tg-primary" aria-label="Próximo" title="Próximo">
                                <MaterialIcon name="chevron_right" size={18} />
                            </button>
                            <button disabled={!hasNext} onClick={() => setPage(totalPages)} className="h-8 w-8 rounded text-sm disabled:opacity-40 hover:bg-black/10 dark:hover:bg-white/10 grid place-items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-tg-primary" aria-label="Última página" title="Última página">
                                <MaterialIcon name="last_page" size={18} />
                            </button>
                        </nav>

                        <div className="text-sm text-tg-muted">Exhibiendo {from}-{to} de {total} registros</div>
                    </div>
                </div>
            </div>

            {/* Modal crear */}
            {openCreate && (
                <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-black/50"
                    onKeyDown={(e) => { if (e.key === "Escape") setOpenCreate(false); }}
                    onClick={(e) => { if (e.target === e.currentTarget && !creating) setOpenCreate(false); }}>
                    <div className="w-[420px] rounded-lg border border-tg bg-[var(--panel-bg)] shadow-xl">
                        <div className="px-4 py-3 border-b border-tg flex items-center gap-2">
                            <MaterialIcon name="add" size={18} />
                            <h3 className="text-base font-semibold">Nueva transacción</h3>
                        </div>
                        <div className="px-4 py-4 space-y-3">
                            <label className="block text-sm">
                                <span className="mb-1 block">Banco ID</span>
                                <input
                                    type="number"
                                    className="h-9 w-full rounded-md border border-tg bg-tg-card px-3"
                                    value={form.banco_id}
                                    onChange={(e) => setForm(f => ({ ...f, banco_id: e.target.value }))}
                                />
                            </label>
                            <label className="block text-sm">
                                <span className="mb-1 block">Tipo ID</span>
                                <input
                                    type="number"
                                    className="h-9 w-full rounded-md border border-tg bg-tg-card px-3"
                                    value={form.tipo_id}
                                    onChange={(e) => setForm(f => ({ ...f, tipo_id: e.target.value }))}
                                />
                            </label>
                            <label className="block text-sm">
                                <span className="mb-1 block">Monto</span>
                                <input
                                    type="number"
                                    className="h-9 w-full rounded-md border border-tg bg-tg-card px-3"
                                    value={form.monto}
                                    onChange={(e) => setForm(f => ({ ...f, monto: e.target.value }))}
                                />
                            </label>
                            <label className="block text-sm">
                                <span className="mb-1 block">Descripción (opcional)</span>
                                <input
                                    type="text"
                                    className="h-9 w-full rounded-md border border-tg bg-tg-card px-3"
                                    value={form.descripcion}
                                    onChange={(e) => setForm(f => ({ ...f, descripcion: e.target.value }))}
                                />
                            </label>
                        </div>
                        <div className="px-4 py-3 border-t border-tg flex justify-end gap-2">
                            <button onClick={() => setOpenCreate(false)} className="h-9 rounded-md px-3 text-sm hover:bg-black/10 dark:hover:bg-white/10" disabled={creating}>
                                Cancelar
                            </button>
                            <button onClick={handleCreate} className="h-9 rounded-md bg-tg-primary px-3 text-sm font-medium text-tg-on-primary disabled:opacity-60" disabled={creating}>
                                {creating ? "Creando…" : "Crear"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmar eliminar */}
            {deleteId != null && (
                <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-black/50"
                    onKeyDown={(e) => { if (e.key === "Escape") setDeleteId(null); }}
                    onClick={(e) => { if (e.target === e.currentTarget && !deleting) setDeleteId(null); }}>
                    <div className="w-[420px] rounded-lg border border-tg bg-[var(--panel-bg)] shadow-xl">
                        <div className="px-4 py-3 border-b border-tg flex items-center gap-2">
                            <MaterialIcon name="warning" size={18} />
                            <h3 className="text-base font-semibold">Confirmar eliminación</h3>
                        </div>
                        <div className="px-4 py-4 text-sm">¿Seguro que deseas eliminar esta transacción manual? Esta acción no se puede deshacer.</div>
                        <div className="px-4 py-3 border-t border-tg flex justify-end gap-2">
                            <button onClick={() => setDeleteId(null)} className="h-9 rounded-md px-3 text-sm hover:bg-black/10 dark:hover:bg-white/10" disabled={deleting}>
                                Cancelar
                            </button>
                            <button onClick={confirmDelete} className="h-9 rounded-md bg-red-600 px-3 text-sm font-medium text-white disabled:opacity-60" disabled={deleting}>
                                {deleting ? "Eliminando…" : "Eliminar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Host de alertas */}
            <AlertHost alert={alert} onClose={close} />
        </div>
    );
}
