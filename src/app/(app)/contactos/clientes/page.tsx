"use client";

import { useMemo, useState, CSSProperties } from "react";
import { MaterialIcon } from "@/components/ui/material-icon";
import ClienteForm from "@/features/clientes/ClienteForm";
import ClienteView from "@/features/clientes/ClienteView";
import { useClientes } from "@/hooks/clientes/useClientes";
import { useCliente } from "@/hooks/clientes/useCliente";
import { createCliente, updateCliente, deleteCliente } from "@/services/sales/clientes.api";
import type { Cliente, ClienteCreate, ClienteUpdate } from "@/types/clientes";
import { useNotifications } from "@/components/providers/NotificationsProvider";

const money = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

export default function ClientesPage() {
  const {
    items: rows,
    page, pageSize, total, totalPages, hasPrev, hasNext,
    loading, setPage,
    filters, setFilters,
    options,
    reload,
    upsertOne
  } = useClientes(10);

  const { success, error } = useNotifications();

  // Crear
  const [openCreate, setOpenCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  // Ver
  const [viewId, setViewId] = useState<number | null>(null);
  const [openView, setOpenView] = useState(false);
  const { cliente, loading: viewLoading } = useCliente(viewId);

  // Editar
  const [editId, setEditId] = useState<number | null>(null);
  const [openEdit, setOpenEdit] = useState(false);
  const { cliente: editCliente, loading: editLoading } = useCliente(editId);

  // Eliminar
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const from = useMemo(() => (total === 0 ? 0 : (page - 1) * pageSize + 1), [page, pageSize, total]);
  const to = useMemo(() => Math.min(page * pageSize, total), [page, pageSize, total]);

  const [start, end] = useMemo(() => {
    const win = 5;
    if (totalPages <= win) return [1, totalPages] as const;
    const s = Math.max(1, Math.min(page - 2, totalPages - (win - 1)));
    return [s, s + (win - 1)] as const;
  }, [page, totalPages]);

  const frameVars: CSSProperties = {
    ["--content-x" as any]: "16px",
  };

  // Crear
  async function handleCreateSubmit(data: ClienteCreate) {
    setCreating(true);
    try {
      await createCliente(data);
      setOpenCreate(false);
      setPage(1);
      reload?.();
      success("Cliente creado correctamente");
    } catch (e: any) {
      error(e?.response?.data?.detail ?? "Error creando cliente");
    } finally {
      setCreating(false);
    }
  }

  // Editar
  async function handleEditSubmit(data: ClienteUpdate) {
    if (!editId) return;
    try {
      await updateCliente(editId, data);
      setOpenEdit(false);
      upsertOne({ id: editId, ...data });
      reload?.();
      success("Cliente actualizado");
    } catch (e: any) {
      error(e?.response?.data?.detail ?? "Error actualizando cliente");
    }
  }

  // Confirmar eliminación
  async function handleConfirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteCliente(deleteId);
      setOpenDelete(false);
      setDeleteId(null);
      reload?.();
      success("Cliente eliminado");
    } catch (e: any) {
      error(e?.response?.data?.detail ?? "Error eliminando cliente");
    } finally {
      setDeleting(false);
    }
  }

  function handleClearFilters() {
    setFilters({ q: "", ciudades: undefined, saldoPendiente: undefined });
  }

  // Ciudades multiselect
  const selectedCities = filters.ciudades ?? [];
  const allCities = options.ciudades;
  const allSelected = selectedCities.length > 0 && selectedCities.length === allCities.length;
  const citiesLabel = selectedCities.length === 0 ? "Ciudad" : allSelected ? "Todas" : `${selectedCities.length} seleccionadas`;

  const toggleCity = (city: string) => {
    setFilters(f => {
      const current = new Set(f.ciudades ?? []);
      current.has(city) ? current.delete(city) : current.add(city);
      const arr = Array.from(current);
      return { ...f, ciudades: arr.length ? arr : undefined };
    });
  };
  const toggleAllCities = () => {
    setFilters(f => (allSelected ? { ...f, ciudades: undefined } : { ...f, ciudades: [...allCities] }));
  };
  const [citiesOpen, setCitiesOpen] = useState(false);

  return (
    <div className="app-shell__frame overflow-hidden" style={frameVars}>
      <div className="bg-[var(--page-bg)] rounded-xl h-full flex flex-col px-[var(--content-x)] pt-3 pb-5">
        <div className="shrink-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold text-tg-fg">Clientes</h2>

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
                  onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
                />
              </label>

              {/* Ciudades */}
              <div className="relative flex-none w-[220px]">
                <button
                  type="button"
                  onClick={() => setCitiesOpen(o => !o)}
                  className="h-10 w-full rounded-md border border-tg bg-tg-card px-3 text-left text-sm text-tg-muted inline-flex items-center justify-between"
                >
                  <span>{citiesLabel}</span>
                  <MaterialIcon name="expand_less" size={18} />
                </button>

                {citiesOpen && (
                  <div className="absolute z-20 mt-1 w-full rounded-md border border-tg bg-[var(--panel-bg)] shadow-lg max-h-64 overflow-auto">
                    <div className="px-3 py-2 border-b border-tg">
                      <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" className="accent-current" checked={allSelected} onChange={toggleAllCities} />
                        <span>Seleccionar todas</span>
                      </label>
                    </div>
                    <ul className="p-2 space-y-1">
                      {allCities.map(ci => {
                        const checked = selectedCities.includes(ci);
                        return (
                          <li key={ci}>
                            <label className="flex items-center gap-2 text-sm cursor-pointer px-1 py-1 rounded hover:bg-black/10 dark:hover:bg-white/10">
                              <input type="checkbox" className="accent-current" checked={checked} onChange={() => toggleCity(ci)} />
                              <span>{ci}</span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>

              {/* Saldo pendiente */}
              <select
                className="h-10 flex-none w-[160px] rounded-md border border-tg bg-tg-card px-3 text-sm text-tg-muted 
             focus:outline-none "
                value={filters.saldoPendiente ?? ""}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    saldoPendiente: (e.target.value || undefined) as "si" | "no" | undefined,
                  }))
                }
              >
                <option value="">Saldo pendiente</option>
                <option value="si">Sí</option>
                <option value="no">No</option>
              </select>

              {/* Limpiar */}
              <span
                onClick={handleClearFilters}
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
              >
                Nuevo cliente
              </button>
            </div>
          </div>
        </div>

        <div className="h-2 shrink-0" />

        {/* Tabla */}
        <div className="rounded-xl border border-[var(--panel-border)] bg-[var(--panel-bg)] shadow-md flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--table-head-bg)] text-[var(--table-head-fg)]">
                  <th className="px-4 py-3 text-left">Nombre</th>
                  <th className="px-4 py-3 text-left">CC/NIT</th>
                  <th className="px-4 py-3 text-left">Correo</th>
                  <th className="px-4 py-3 text-left">Celular</th>
                  <th className="px-4 py-3 text-left">Ciudad</th>
                  <th className="px-4 py-3 text-right">Saldo</th>
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={`sk-${i}`} className="border-t border-tg">
                      {Array.from({ length: 7 }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 w-full animate-pulse rounded bg-black/10 dark:bg-white/10" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-tg-muted">Sin registros</td>
                  </tr>
                ) : (
                  rows.map((r: Cliente) => (
                    <tr key={r.id} className="border-t border-tg hover:bg-black/5 dark:hover:bg-white/5">
                      <td className="px-4 py-3">{r.nombre}</td>
                      <td className="px-4 py-3">{r.cc_nit}</td>
                      <td className="px-4 py-3">{r.correo || "—"}</td>
                      <td className="px-4 py-3">{r.celular || "—"}</td>
                      <td className="px-4 py-3">{r.ciudad}</td>
                      <td className="px-4 py-3 text-right">{money.format(r.saldo)}</td>
                      <td className="px-2 py-2">
                        <div className="flex items-center justify-center gap-1">
                          {/* Ver */}
                          <button
                            className="rounded p-2 hover:bg-black/10 dark:hover:bg-white/10"
                            aria-label="ver"
                            onClick={() => { setViewId(r.id); setOpenView(true); }}
                          >
                            <MaterialIcon name="visibility" size={18} className="text-tg-primary" />
                          </button>
                          {/* Editar */}
                          <button
                            className="rounded p-2 hover:bg-black/10 dark:hover:bg-white/10"
                            aria-label="editar"
                            onClick={() => { setEditId(r.id); setOpenEdit(true); }}
                          >
                            <MaterialIcon name="edit" size={18} className="text-tg-primary" />
                          </button>
                          {/* Eliminar */}
                          <button
                            className="rounded p-2 hover:bg-black/10 dark:hover:bg-white/10"
                            aria-label="eliminar"
                            onClick={() => { setDeleteId(r.id); setOpenDelete(true); }}
                          >
                            <MaterialIcon name="delete" size={18} className="text-tg-primary" />
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
              {/* Ir al inicio */}
              <button
                disabled={!hasPrev}
                onClick={() => setPage(1)}
                className="h-8 w-8 rounded text-sm disabled:opacity-40 hover:bg-black/10 dark:hover:bg-white/10 grid place-items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-tg-primary"
                aria-label="Primera página"
                title="Primera página"
              >
                <MaterialIcon name="first_page" size={18} />
              </button>

              {/* Anterior */}
              <button
                disabled={!hasPrev}
                onClick={() => setPage(page - 1)}
                className="h-8 w-8 rounded text-sm disabled:opacity-40 hover:bg-black/10 dark:hover:bg-white/10 grid place-items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-tg-primary"
                aria-label="Anterior"
                title="Anterior"
              >
                <MaterialIcon name="chevron_left" size={18} />
              </button>

              {/* Números */}
              {Array.from({ length: end - start + 1 }, (_, i) => start + i).map((p) => {
                const active = p === page;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`h-8 min-w-8 rounded px-2 text-sm ${active ? "bg-tg-primary text-tg-on-primary" : "hover:bg-black/10 dark:hover:bg-white/10"
                      } focus:outline-none focus-visible:ring-2 focus-visible:ring-tg-primary`}
                    aria-current={active ? "page" : undefined}
                  >
                    {p}
                  </button>
                );
              })}

              {end < totalPages && <span className="px-1">…</span>}

              {/* Siguiente */}
              <button
                disabled={!hasNext}
                onClick={() => setPage(page + 1)}
                className="h-8 w-8 rounded text-sm disabled:opacity-40 hover:bg-black/10 dark:hover:bg-white/10 grid place-items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-tg-primary"
                aria-label="Próximo"
                title="Próximo"
              >
                <MaterialIcon name="chevron_right" size={18} />
              </button>

              {/* Ir al final */}
              <button
                disabled={!hasNext}
                onClick={() => setPage(totalPages)}
                className="h-8 w-8 rounded text-sm disabled:opacity-40 hover:bg-black/10 dark:hover:bg-white/10 grid place-items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-tg-primary"
                aria-label="Última página"
                title="Última página"
              >
                <MaterialIcon name="last_page" size={18} />
              </button>
            </nav>

            <div className="text-sm text-tg-muted">Exhibiendo {from}-{to} de {total} registros</div>
          </div>
        </div>
      </div>

      {/* Crear */}
      {openCreate && (
        <ClienteForm
          intent="create"
          open={openCreate}
          onClose={() => setOpenCreate(false)}
          onSubmit={handleCreateSubmit}
          loading={creating}
        />
      )}

      {/* Ver */}
      {openView && (
        <ClienteView
          open={openView}
          onClose={() => setOpenView(false)}
          cliente={cliente}
          loading={viewLoading}
        />
      )}

      {/* Editar */}
      {openEdit && (
        <ClienteForm
          intent="edit"
          open={openEdit}
          onClose={() => setOpenEdit(false)}
          onSubmit={handleEditSubmit}
          loading={editLoading}
          defaults={editCliente ? {
            nombre: editCliente.nombre,
            cc_nit: editCliente.cc_nit,
            correo: editCliente.correo ?? "",
            celular: editCliente.celular ?? "",
            direccion: editCliente.direccion,
            ciudad: editCliente.ciudad,
          } : undefined}
        />
      )}

      {/* Eliminar */}
      {openDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-black/50"
          onKeyDown={(e) => { if (e.key === "Escape") setOpenDelete(false); }}
          onClick={(e) => { if (e.target === e.currentTarget && !deleting) setOpenDelete(false); }}
        >
          <div className="w-[420px] rounded-lg border border-tg bg-[var(--panel-bg)] shadow-xl">
            <div className="px-4 py-3 border-b border-tg flex items-center gap-2">
              <MaterialIcon name="warning" size={18} />
              <h3 className="text-base font-semibold">Confirmar eliminación</h3>
            </div>
            <div className="px-4 py-4 text-sm">¿Seguro que deseas eliminar este cliente? Esta acción no se puede deshacer.</div>
            <div className="px-4 py-3 border-t border-tg flex justify-end gap-2">
              <button onClick={() => setOpenDelete(false)} className="h-9 rounded-md px-3 text-sm hover:bg-black/10 dark:hover:bg-white/10" disabled={deleting}>
                Cancelar
              </button>
              <button onClick={handleConfirmDelete} className="h-9 rounded-md bg-red-600 px-3 text-sm font-medium text-white disabled:opacity-60" disabled={deleting}>
                {deleting ? "Eliminando…" : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
