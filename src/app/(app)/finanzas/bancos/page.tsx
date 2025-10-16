"use client";

import { useMemo, useState } from "react";
import {
    IconButton,
    Menu,
    MenuItem,
    Checkbox,
    ListItemIcon,
    ListItemText,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import AddIcon from "@mui/icons-material/Add";
import type { Banco } from "@/types/bancos";
import { useBancos } from "@/hooks/bancos/useBancos";
import { useDeleteBanco } from "@/hooks/bancos/useDeleteBanco";
import { useNotifications } from "@/components/providers/NotificationsProvider";
import SaldoForm from "@/features/bancos/SaldoForm";
const money = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
});

export default function BancosPage() {
    const { items, loading, reload } = useBancos();
    const { deleteBanco, loading: deleting } = useDeleteBanco();
    const { success, error } = useNotifications();

    // Selección explícita (desde el dropdown)
    const [visibleIds, setVisibleIds] = useState<number[]>([]);
    // Selección de tarjetas (acciones superiores)
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    // Primeros 6 por id si no se eligió nada en el dropdown
    const defaultFirst6 = useMemo(
        () => items.slice().sort((a, b) => a.id - b.id).slice(0, 6).map((b) => b.id),
        [items]
    );

    const effectiveIds = visibleIds.length ? visibleIds : defaultFirst6;
    const visibles = useMemo(
        () => items.filter((b) => effectiveIds.includes(b.id)),
        [items, effectiveIds]
    );

    const totalVisible = useMemo(
        () => visibles.reduce((acc, b) => acc + (b.saldo ?? 0), 0),
        [visibles]
    );

    // Dropdown
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleOpen = (e: React.MouseEvent<HTMLButtonElement>) =>
        setAnchorEl(e.currentTarget);
    const handleClose = () => setAnchorEl(null);

    function toggleDropdownId(id: number) {
        setVisibleIds((curr) => {
            const set = new Set(curr);
            if (set.has(id)) {
                set.delete(id);
                return Array.from(set);
            }
            if (set.size >= 6) return curr;
            set.add(id);
            return Array.from(set);
        });

        // Si estaba seleccionado para acciones y sale de visibles, lo deseleccionamos
        setSelectedIds((sel) => {
            if (!effectiveIds.includes(id)) return sel;
            const next = new Set(sel);
            if (!Array.from(next).some((x) => x === id)) return sel;
            next.delete(id);
            return next;
        });
    }

    function clearSelection() {
        setVisibleIds([]);
    }

    // Acciones (arriba) controladas por selección de cards
    const [editBanco, setEditBanco] = useState<Banco | null>(null);
    const [delBanco, setDelBanco] = useState<Banco | null>(null);

    function openUpdate() {
        const first = visibles.find((v) => selectedIds.has(v.id));
        if (first) setEditBanco(first);
    }
    function openDelete() {
        const first = visibles.find((v) => selectedIds.has(v.id));
        if (first) setDelBanco(first);
    }
    async function confirmDelete() {
        if (!delBanco) return;
        try {
            await deleteBanco(delBanco.id);
            success("Banco eliminado");
            setDelBanco(null);
            setSelectedIds(new Set());
            reload();
        } catch (e: any) {
            error(e?.response?.data?.detail ?? "Error eliminando banco");
        }
    }

    function toggleCardSelect(id: number) {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    return (
        <div className="px-4 pb-6 pt-3">
            {/* HEADER: Bancos + Total (izq) | Selector + Crear (der) */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-4">
                    <h1 className="text-4xl font-extrabold text-tg-fg">Bancos</h1>

                    {/* Card de total (sin etiqueta) justo al lado del título */}
                    <div
                        className="rounded-xl border px-4 py-2 min-w-[200px]"
                        style={{
                            borderColor: "var(--tg-border)",
                            background: "var(--tg-card-bg)",
                        }}
                        aria-label="total-visible"
                    >
                        <span className="text-2xl md:text-3xl font-extrabold tracking-tight">
                            {money.format(totalVisible)}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Botón de selección (dropdown) */}
                    <button
                        type="button"
                        onClick={handleOpen}
                        className="h-10 rounded-md border border-tg bg-tg-card px-3 text-sm text-tg-card inline-flex items-center gap-2"
                        aria-haspopup="menu"
                        aria-expanded={open ? "true" : undefined}
                        title="Elegir bancos a mostrar (máx. 6)"
                    >
                        <span className="text-tg-muted">Elegir bancos a mostrar</span>
                        <span className="text-tg-muted">
                            ({visibleIds.length || defaultFirst6.length}/6)
                        </span>
                        <ExpandMoreIcon fontSize="small" />
                    </button>

                    <Menu
                        anchorEl={anchorEl}
                        open={open}
                        onClose={handleClose}
                        slotProps={{
                            paper: {
                                sx: {
                                    bgcolor: "var(--tg-card-bg)",
                                    color: "var(--tg-card-fg)",
                                    border: "1px solid var(--tg-border)",
                                    minWidth: 280,
                                    maxHeight: 360,
                                },
                            },
                        }}
                    >
                        {items.map((b) => {
                            const checked = visibleIds.includes(b.id);
                            return (
                                <MenuItem
                                    key={b.id}
                                    onClick={() => toggleDropdownId(b.id)}
                                    sx={{
                                        gap: 1,
                                        "&:hover": {
                                            bgcolor: "color-mix(in srgb, var(--tg-primary) 12%, transparent)",
                                        },
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 28 }}>
                                        <Checkbox
                                            size="small"
                                            checked={checked}
                                            sx={{
                                                color: "var(--tg-muted)",
                                                "&.Mui-checked": { color: "var(--tg-primary)" },
                                                pointerEvents: "none",
                                            }}
                                        />
                                    </ListItemIcon>
                                    <ListItemText
                                        slotProps={{ primary: { sx: { color: "var(--tg-card-fg)" } } }}
                                        primary={b.nombre}
                                    />
                                </MenuItem>
                            );
                        })}
                    </Menu>

                    {visibleIds.length > 0 && (
                        <button
                            type="button"
                            onClick={clearSelection}
                            className="h-10 rounded-md border border-tg bg-tg-card px-3 text-sm text-tg-card"
                        >
                            Limpiar selecciones
                        </button>
                    )}

                    <button
                        type="button"
                        className="h-10 rounded-md bg-tg-primary px-3 text-sm font-medium text-tg-on-primary inline-flex items-center gap-1 shadow-sm"
                        onClick={() => {
                            /* abrir modal crear */
                        }}
                    >
                        <AddIcon fontSize="small" /> Crear banco
                    </button>
                </div>
            </div>

            {/* Acciones superiores (aparecen al seleccionar cards) */}
            {selectedIds.size > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={openUpdate}
                        className="h-9 rounded-md bg-tg-primary px-3 text-sm font-medium text-tg-on-primary"
                    >
                        Actualizar saldo
                    </button>
                    <button
                        type="button"
                        onClick={openDelete}
                        className="h-9 rounded-md border border-red-500 px-3 text-sm font-medium text-red-500 disabled:opacity-60"
                        disabled={deleting}
                    >
                        {deleting ? "Eliminando…" : "Eliminar banco"}
                    </button>
                </div>
            )}

            {/* GRID de tarjetas */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {loading &&
                    Array.from({ length: 6 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-[160px] rounded-xl border border-tg bg-[var(--tg-card-bg)]"
                        >
                            <div className="h-full animate-pulse bg-black/10 dark:bg-white/10 rounded-xl" />
                        </div>
                    ))}

                {!loading &&
                    visibles.map((b) => {
                        const isSelected = selectedIds.has(b.id);
                        return (
                            <div
                                key={b.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => toggleCardSelect(b.id)}
                                onKeyDown={(e) => e.key === "Enter" && toggleCardSelect(b.id)}
                                className={`rounded-xl border p-5 relative outline-none transition-colors ${isSelected
                                    ? "border-[var(--tg-primary)] ring-2 ring-[var(--tg-primary)] bg-[color-mix(in_srgb,var(--tg-primary)10%,var(--tg-card-bg))]"
                                    : "border-tg bg-[var(--tg-card-bg)] hover:border-[var(--tg-primary)]"
                                    }`}
                            >
                                <div className="absolute right-2 top-2">
                                    <IconButton
                                        size="small"
                                        sx={{ color: "var(--tg-muted)" }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <InfoOutlinedIcon fontSize="small" />
                                    </IconButton>
                                </div>

                                <h3
                                    className="text-lg font-semibold"
                                    style={{ color: "var(--tg-primary)" }}
                                >
                                    {b.nombre}
                                </h3>

                                <div className="mt-2 text-4xl lg:text-5xl font-extrabold tracking-tight">
                                    {money.format(b.saldo ?? 0)}
                                </div>

                                <div className="mt-2 text-xs text-tg-muted">
                                    Última actualización:{" "}
                                    <span className="font-light">
                                        {b.fecha_actualizacion
                                            ? new Date(b.fecha_actualizacion).toLocaleString()
                                            : "—"}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
            </div>

            {/* Modal editar saldo */}
            {editBanco && (
                <div
                    role="dialog"
                    aria-modal="true"
                    className="fixed inset-0 z-50 grid place-items-center bg-black/50"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setEditBanco(null);
                    }}
                >
                    <div className="w-[420px] rounded-lg border border-tg bg-[var(--panel-bg)] shadow-xl p-4">
                        <h3 className="text-base font-semibold mb-3">
                            Actualizar saldo — {editBanco.nombre}
                        </h3>
                        <SaldoForm
                            banco={editBanco}
                            onClose={() => {
                                setEditBanco(null);
                                setSelectedIds(new Set());
                                reload();
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Modal eliminar */}
            {delBanco && (
                <div
                    role="dialog"
                    aria-modal="true"
                    className="fixed inset-0 z-50 grid place-items-center bg-black/50"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setDelBanco(null);
                    }}
                >
                    <div className="w-[420px] rounded-lg border border-tg bg-[var(--panel-bg)] shadow-xl">
                        <div className="px-4 py-3 border-b border-tg">
                            <h3 className="text-base font-semibold">Eliminar banco</h3>
                        </div>
                        <div className="px-4 py-4 text-sm">
                            ¿Seguro que deseas eliminar{" "}
                            <span className="font-medium">{delBanco.nombre}</span>? Esta acción
                            no se puede deshacer.
                        </div>
                        <div className="px-4 py-3 border-t border-tg flex justify-end gap-2">
                            <button
                                className="h-9 rounded-md px-3 text-sm hover:bg-black/10 dark:hover:bg-white/10"
                                onClick={() => setDelBanco(null)}
                                disabled={deleting}
                            >
                                Cancelar
                            </button>
                            <button
                                className="h-9 rounded-md bg-red-600 px-3 text-sm font-medium text-white disabled:opacity-60"
                                onClick={confirmDelete}
                                disabled={deleting}
                            >
                                {deleting ? "Eliminando…" : "Eliminar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

