"use client";

import { useMemo, useState, CSSProperties } from "react";
import { MaterialIcon } from "@/components/ui/material-icon";
import ProductoForm from "@/features/productos/ProductoForm";
import ProductoView from "@/features/productos/ProductoView";
import ProductImagesModal from "@/features/productos/ProductImagesModal";
import { useProductos } from "@/hooks/productos/useProductos";
import { useProducto } from "@/hooks/productos/useProducto";
import { createProduct, updateProduct, deleteProduct, toggleProductActive } from "@/services/sales/product.api";
import type { ProductDTO, ProductCreate, ProductUpdate } from "@/types/product";
import { useNotifications } from "@/components/providers/NotificationsProvider";

const money = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

export default function ProductosPage() {
  const {
    items: rows,
    page, pageSize, total, totalPages, hasPrev, hasNext,
    loading, setPage,
    filters, setFilters,
    options,
    reload,
    upsertOne
  } = useProductos(10);

  const { success, error: err } = useNotifications();

  // Crear
  const [openCreate, setOpenCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  // Ver
  const [viewId, setViewId] = useState<number | null>(null);
  const [openView, setOpenView] = useState(false);
  const { producto, loading: viewLoading, refetch: refetchView } = useProducto(viewId);

  // Editar
  const [editId, setEditId] = useState<number | null>(null);
  const [openEdit, setOpenEdit] = useState(false);
  const { producto: editProducto, loading: editLoading } = useProducto(editId);

  // Eliminar
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Media
  const [mediaProductId, setMediaProductId] = useState<number | null>(null);
  const [openMedia, setOpenMedia] = useState(false);

  const from = useMemo(() => (total === 0 ? 0 : (page - 1) * pageSize + 1), [page, pageSize, total]);
  const to = useMemo(() => Math.min(page * pageSize, total), [page, pageSize, total]);

  const [start, end] = useMemo(() => {
    const win = 5;
    if (totalPages <= win) return [1, totalPages] as const;
    const s = Math.max(1, Math.min(page - 2, totalPages - (win - 1)));
    return [s, s + (win - 1)] as const;
  }, [page, totalPages]);

  const frameVars: CSSProperties = { ["--content-x" as any]: "16px" };

  // Crear
  async function handleCreateSubmit(payload: ProductCreate | ProductUpdate) {
    setCreating(true);
    try {
      await createProduct(payload as ProductCreate);
      setOpenCreate(false);
      setPage(1);
      reload?.();
      success("Producto creado correctamente");
    } catch (e: any) {
      err(e?.response?.data?.detail ?? "Error creando producto");
    } finally {
      setCreating(false);
    }
  }

  // Editar
  async function handleEditSubmit(payload: ProductCreate | ProductUpdate) {
    if (!editId) return;
    try {
      await updateProduct(editId, payload as ProductUpdate);
      setOpenEdit(false);
      upsertOne({ id: editId, ...(payload as ProductUpdate) });
      reload?.();
      success("Producto actualizado");
    } catch (e: any) {
      err(e?.response?.data?.detail ?? "Error actualizando producto");
    }
  }

  // Eliminar
  async function handleConfirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteProduct(deleteId);
      setOpenDelete(false);
      setDeleteId(null);
      reload?.();
      success("Producto eliminado");
    } catch (e: any) {
      err(e?.response?.data?.detail ?? "Error eliminando producto");
    } finally {
      setDeleting(false);
    }
  }

  // Toggle activo
  async function handleToggleActivo(id: number, current: boolean) {
    try {
      const res = await toggleProductActive(id);
      const isActive = res.is_active ?? !current;
      upsertOne({ id, is_active: isActive });
      if (viewId === id) refetchView();
      success(isActive ? "Producto activado" : "Producto desactivado");
    } catch (e: any) {
      err(e?.response?.data?.detail ?? "No se pudo cambiar el estado");
    }
  }

  function handleClearFilters() {
    setFilters({ q: "", estado: undefined });
  }

  return (
    <div className="app-shell__frame overflow-hidden" style={frameVars}>
      <div className="bg-[var(--page-bg)] rounded-xl h-full flex flex-col px-[var(--content-x)] pt-3 pb-5">
        <div className="shrink-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold text-tg-fg">Productos</h2>

            <div className="flex flex-wrap items-center gap-2">
              {/* Buscar */}
              <label className="relative flex items-center flex-none h-10 w-[260px]">
                <span className="absolute inset-y-0 left-3 flex items-center text-tg-muted pointer-events-none">
                  <MaterialIcon name="search" size={18} />
                </span>
                <input
                  type="search"
                  placeholder="Buscar.."
                  className="h-10 w-full rounded-md border border-tg bg-tg-card text-tg-card pl-9 pr-3 
             focus:outline-none focus:ring-tg-primary"
                  value={filters.q ?? ""}
                  onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
                />
              </label>

              {/* Estado */}
              <select
                className="h-10 flex-none w-[160px] rounded-md border border-tg bg-tg-card px-3 text-sm text-tg-muted 
             focus:outline-none"
                value={filters.estado ?? ""}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, estado: (e.target.value || undefined) as "activos" | "inactivos" | undefined }))
                }
              >
                <option value="">Todos</option>
                <option value="activos">Activos</option>
                <option value="inactivos">Inactivos</option>
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
                Nuevo producto
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
                  <th className="px-4 py-3 text-left">Referencia</th>
                  <th className="px-4 py-3 text-left">Descripción</th>
                  <th className="px-4 py-3 text-right">Stock</th>
                  <th className="px-4 py-3 text-right">Precio compra</th>
                  <th className="px-4 py-3 text-right">Precio venta</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={`sk-${i}`} className="border-t border-tg">
                      {Array.from({ length: 7 }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 w-full animate-pulse rounded bg-black/10 dark:bg.white/10 dark:bg-white/10" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-tg-muted">Sin registros</td>
                  </tr>
                ) : (
                  rows.map((r: ProductDTO) => (
                    <tr key={r.id} className="border-t border-tg hover:bg-black/5 dark:hover:bg-white/5">
                      <td className="px-4 py-3">{r.reference}</td>
                      <td className="px-4 py-3">{r.description}</td>
                      <td className="px-4 py-3 text-right">{r.quantity ?? 0}</td>
                      <td className="px-4 py-3 text-right">{money.format(r.purchase_price)}</td>
                      <td className="px-4 py-3 text-right">{money.format(r.sale_price)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${r.is_active ? "bg-green-600/15 text-green-700 dark:text-green-300" : "bg-red-600/15 text-red-700 dark:text-red-300"}`}>
                          {r.is_active ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex items-center justify-center gap-1">
                          {/* Ver */}
                          <button
                            className="p-2 rounded-full text-tg-primary hover:bg-[color-mix(in_srgb,var(--tg-primary)_22%,transparent)]"
                            aria-label="ver"
                            onClick={() => { setViewId(r.id); setOpenView(true); }}
                          >
                            <MaterialIcon name="visibility" size={18} />
                          </button>

                          {/* Editar */}
                          <button
                            className="p-2 rounded-full text-tg-primary hover:bg-[color-mix(in_srgb,var(--tg-primary)_22%,transparent)]"
                            aria-label="editar"
                            onClick={() => { setEditId(r.id); setOpenEdit(true); }}
                          >
                            <MaterialIcon name="edit" size={18} />
                          </button>

                          {/* Media */}
                          <button
                            className="p-2 rounded-full text-tg-primary hover:bg-[color-mix(in_srgb,var(--tg-primary)_22%,transparent)]"
                            aria-label="media"
                            title="Imágenes"
                            onClick={() => { setMediaProductId(r.id); setOpenMedia(true); }}
                          >
                            <MaterialIcon name="photo_camera" size={18} />
                          </button>

                          {/* Activar/Desactivar */}
                          <button
                            className="p-2 rounded-full hover:bg-[color-mix(in_srgb,var(--tg-primary)_22%,transparent)]"
                            aria-label={r.is_active ? "desactivar" : "activar"}
                            onClick={() => handleToggleActivo(r.id, r.is_active)}
                            title={r.is_active ? "Desactivar" : "Activar"}
                          >
                            <MaterialIcon
                              name={r.is_active ? "toggle_on" : "toggle_off"}
                              size={22}
                              className={r.is_active ? "text-tg-primary" : "text-tg-muted"}
                            />
                          </button>

                          {/* Eliminar */}
                          <button
                            className="p-2 rounded-full text-tg-primary hover:bg-[color-mix(in_srgb,var(--tg-primary)_22%,transparent)]"
                            aria-label="eliminar"
                            onClick={() => { setDeleteId(r.id); setOpenDelete(true); }}
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
              <button
                disabled={!hasPrev}
                onClick={() => setPage(1)}
                className="h-8 w-8 rounded text-sm disabled:opacity-40 hover:bg-black/10 dark:hover:bg-white/10 grid place-items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-tg-primary"
                aria-label="Primera página"
                title="Primera página"
              >
                <MaterialIcon name="first_page" size={18} />
              </button>

              <button
                disabled={!hasPrev}
                onClick={() => setPage(page - 1)}
                className="h-8 w-8 rounded text-sm disabled:opacity-40 hover:bg-black/10 dark:hover:bg-white/10 grid place-items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-tg-primary"
                aria-label="Anterior"
                title="Anterior"
              >
                <MaterialIcon name="chevron_left" size={18} />
              </button>

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

              <button
                disabled={!hasNext}
                onClick={() => setPage(page + 1)}
                className="h-8 w-8 rounded text-sm disabled:opacity-40 hover:bg-black/10 dark:hover:bg-white/10 grid place-items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-tg-primary"
                aria-label="Próximo"
                title="Próximo"
              >
                <MaterialIcon name="chevron_right" size={18} />
              </button>

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
        <ProductoForm
          intent="create"
          open={openCreate}
          onClose={() => setOpenCreate(false)}
          onSubmit={handleCreateSubmit}
          loading={creating}
        />
      )}

      {/* Ver */}
      {openView && (
        <ProductoView
          open={openView}
          onClose={() => setOpenView(false)}
          producto={producto}
          loading={viewLoading}
        />
      )}

      {/* Editar */}
      {openEdit && (
        <ProductoForm
          intent="edit"
          open={openEdit}
          onClose={() => setOpenEdit(false)}
          onSubmit={handleEditSubmit}
          loading={editLoading}
          defaults={editProducto ? {
            reference: editProducto.reference,
            descripcion: editProducto.description,
            quantity: editProducto.quantity ?? 0,
            purchase_price: editProducto.purchase_price,
            sale_price: editProducto.sale_price,
            is_active: editProducto.is_active,
          } : undefined}
        />
      )}

      {/* Media */}
      {openMedia && mediaProductId !== null && (
        <ProductImagesModal
          open={openMedia}
          productId={mediaProductId}
          onClose={() => setOpenMedia(false)}
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
            <div className="px-4 py-4 text-sm">¿Seguro que deseas eliminar este producto? Esta acción no se puede deshacer.</div>
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
