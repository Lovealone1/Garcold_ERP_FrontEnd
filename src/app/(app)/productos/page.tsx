

"use client";

import { useMemo, useState, useEffect, CSSProperties } from "react";
import { MaterialIcon } from "@/components/ui/material-icon";
import ProductoForm from "@/features/productos/ProductoForm";
import ProductoView from "@/features/productos/ProductoView";
import ProductImagesModal from "@/features/productos/ProductImagesModal";
import { useProductos } from "@/hooks/productos/useProductos";
import { useProducto } from "@/hooks/productos/useProducto";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductActive,
} from "@/services/sales/product.api";
import type { ProductDTO, ProductCreate, ProductUpdate } from "@/types/product";
import { useNotifications } from "@/components/providers/NotificationsProvider";
import { useImport } from "@/hooks/io/useImport";
import { useExport } from "@/hooks/io/useExport";
import ImportDialog from "@/features/io/ImportDialog";
import ExportDialog from "@/features/io/ExportDialog";
import { useProductsCache } from "@/hooks/productos/useProductsCache";
const money = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

const GRID_COLS = "30px 156px 1fr 112px 142px 142px 208px";
const HEADER_COLS = "65px 135px 1fr 110px 152px 132px 192px 18px";
const FRAME_BG = "color-mix(in srgb, var(--tg-bg) 90%, #fff 3%)";
const OUTER_BG = "color-mix(in srgb, var(--tg-bg) 55%, #000 45%)";
const INNER_BG = "color-mix(in srgb, var(--tg-bg) 95%, #fff 2%)";
const PILL_BG = "color-mix(in srgb, var(--tg-card-bg) 60%, #000 40%)";
const ACTION_BG = "color-mix(in srgb, var(--tg-primary) 28%, transparent)";
const pill =
  "min-w-[90px] h-8 px-2.5 rounded-md grid place-items-center text-[13px] text-white/90 border border-[var(--tg-border)]";
const actionBtn =
  "h-8 w-8 grid place-items-center rounded-full text-[var(--tg-primary)] hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-tg-primary";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 639px)");
    const handler = (e: MediaQueryListEvent | MediaQueryList) =>
      setIsMobile("matches" in e ? e.matches : (e as MediaQueryList).matches);
    handler(mql);
    mql.addEventListener?.("change", handler as any);
    return () => mql.removeEventListener?.("change", handler as any);
  }, []);
  return isMobile;
}

function Dot({ active }: { active: boolean }) {
  return <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: active ? "var(--tg-primary)" : "#d33" }} />;
}

function HeaderRow() {
  return (
    <div className="hidden sm:grid items-center gap-3 mb-2 font-extrabold mx-2" style={{ gridTemplateColumns: HEADER_COLS }}>
      <span />
      <span className="text-white">Referencia</span>
      <span className="text-white">Descripción</span>
      <span className="text-white text-center">Stock</span>
      <span className="text-white text-center">Precio compra</span>
      <span className="text-white text-center">Precio venta</span>
      <span className="text-white text-center">Acciones</span>
    </div>
  );
}

function ProductRow({
  p,
  onView,
  onEdit,
  onImages,
  onToggle,
  onDelete,
}: {
  p: ProductDTO;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onImages: (id: number) => void;
  onToggle: (id: number, current: boolean) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="relative rounded-xl border shadow-sm" style={{ background: OUTER_BG, borderColor: "var(--tg-border)" }}>
      <div className="hidden sm:block mx-1.5 my-2 rounded-md px-3 py-2.5" style={{ background: INNER_BG }}>
        <div className="grid items-center gap-3" style={{ gridTemplateColumns: GRID_COLS }}>
          <div className="grid place-items-center"><Dot active={!!p.is_active} /></div>
          <div className={`${pill} font-extrabold tracking-wide`} style={{ background: PILL_BG }}>{p.reference}</div>
          <div className="text-[13px] text-white/90 truncate">{p.description}</div>
          <div className={pill} style={{ background: PILL_BG }}>{p.quantity ?? 0}</div>
          <div className={pill} style={{ background: PILL_BG }}>{money.format(p.purchase_price)}</div>
          <div className={pill} style={{ background: PILL_BG }}>{money.format(p.sale_price)}</div>
          <div className="flex items-center justify-end gap-2">
            <button className={actionBtn} style={{ background: ACTION_BG }} aria-label="ver" onClick={() => onView(p.id)}>
              <MaterialIcon name="visibility" size={18} />
            </button>
            <button className={actionBtn} style={{ background: ACTION_BG }} aria-label="editar" onClick={() => onEdit(p.id)}>
              <MaterialIcon name="edit" size={18} />
            </button>
            <button className={actionBtn} style={{ background: ACTION_BG }} aria-label="imágenes" onClick={() => onImages(p.id)}>
              <MaterialIcon name="photo_camera" size={18} />
            </button>
            <button className={actionBtn} style={{ background: ACTION_BG }} aria-label={p.is_active ? "desactivar" : "activar"} onClick={() => onToggle(p.id, !!p.is_active)}>
              <MaterialIcon name={p.is_active ? "toggle_on" : "toggle_off"} size={18} />
            </button>
            <button className="h-8 w-8 grid place-items-center rounded-full" style={{ background: "#7a1010" }} aria-label="eliminar" onClick={() => onDelete(p.id)} title="Eliminar">
              <MaterialIcon name="delete" size={16} className="text-[#ff4d4f]" />
            </button>
          </div>
        </div>
      </div>

      <div className="sm:hidden mx-2.5 my-3 sm:my-2 rounded-md px-3 py-2" style={{ background: INNER_BG }}>
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2 min-w-0">
              <Dot active={!!p.is_active} />
              <span className="text-sm font-extrabold tracking-wide">{p.reference}</span>
              <span className="text-[13px] text-white/90 truncate">{p.description}</span>
            </div>
          </div>
          <div className="ml-2 flex items-center gap-2 shrink-0">
            <button className={actionBtn} style={{ background: ACTION_BG }} aria-label="ver" onClick={() => onView(p.id)}>
              <MaterialIcon name="visibility" size={18} />
            </button>
            <button className={actionBtn} style={{ background: ACTION_BG }} aria-label="editar" onClick={() => onEdit(p.id)}>
              <MaterialIcon name="edit" size={18} />
            </button>
            <button className={actionBtn} style={{ background: ACTION_BG }} aria-label="imágenes" onClick={() => onImages(p.id)}>
              <MaterialIcon name="photo_camera" size={18} />
            </button>
            <button className={actionBtn} style={{ background: ACTION_BG }} aria-label={p.is_active ? "desactivar" : "activar"} onClick={() => onToggle(p.id, !!p.is_active)}>
              <MaterialIcon name={p.is_active ? "toggle_on" : "toggle_off"} size={18} />
            </button>
            <button className="h-8 w-8 grid place-items-center rounded-full" style={{ background: "#7a1010" }} aria-label="eliminar" onClick={() => onDelete(p.id)}>
              <MaterialIcon name="delete" size={16} className="text-[#ff4d4f]" />
            </button>
          </div>
        </div>

        <div className="mt-2 grid grid-cols-3 gap-2">
          <div className="rounded-md border px-2 py-1 text-center text-[12px]" style={{ background: PILL_BG, borderColor: "var(--tg-border)" }}>
            <div className="uppercase opacity-70">Stock</div>
            <div className="font-semibold">{p.quantity ?? 0}</div>
          </div>
          <div className="rounded-md border px-2 py-1 text-center text-[12px]" style={{ background: PILL_BG, borderColor: "var(--tg-border)" }}>
            <div className="uppercase opacity-70">Compra</div>
            <div className="font-semibold">{money.format(p.purchase_price)}</div>
          </div>
          <div className="rounded-md border px-2 py-1 text-center text-[12px]" style={{ background: PILL_BG, borderColor: "var(--tg-border)" }}>
            <div className="uppercase opacity-70">Venta</div>
            <div className="font-semibold">{money.format(p.sale_price)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductosPage() {
  const isMobile = useIsMobile();
  const pageSizeWanted = isMobile ? 6 : 8;

  const {
    items: rows,
    page,
    setPage,
    total_pages,
    page_size,
    total,
    loading,
    filters,
    setFilters,
    loadMore,
    hasMoreServer,
    isFetchingMore,
    refresh,
    upsertOne,
  } = useProductos(1, pageSizeWanted);

  const { success, error: err } = useNotifications();
  const [openImport, setOpenImport] = useState(false);
  const [openExport, setOpenExport] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [viewId, setViewId] = useState<number | null>(null);
  const [openView, setOpenView] = useState(false);
  const { producto, loading: viewLoading, refetch: refetchView } = useProducto(viewId);
  const [editId, setEditId] = useState<number | null>(null);
  const [openEdit, setOpenEdit] = useState(false);
  const { producto: editProducto, loading: editLoading } = useProducto(editId);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [mediaProductId, setMediaProductId] = useState<number | null>(null);
  const [openMedia, setOpenMedia] = useState(false);
  const imp = useImport();
  const exp = useExport();

  const frameVars: CSSProperties = { ["--content-x" as any]: "8px" };

  const from = useMemo(() => (total === 0 ? 0 : (page - 1) * (page_size || pageSizeWanted) + 1), [page, page_size, pageSizeWanted, total]);
  const to = useMemo(() => Math.min(page * (page_size || pageSizeWanted), total || 0), [page, page_size, pageSizeWanted, total]);
  const { insertOptimistic, removeOptimistic, patchOptimistic, invalidateAll } = useProductsCache();
  const [start, end] = useMemo(() => {
    const win = 5;
    if (!total_pages || total_pages <= win) return [1, total_pages || 1] as const;
    const s = Math.max(1, Math.min(page - 2, (total_pages || 1) - (win - 1)));
    return [s, s + (win - 1)] as const;
  }, [page, total_pages]);

  useEffect(() => {
    const t = setTimeout(() => { loadMore(); }, 600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (page === total_pages && hasMoreServer && !isFetchingMore) {
      loadMore();
    }
  }, [page, total_pages, hasMoreServer, isFetchingMore, loadMore]);

  const goToPage = async (p: number) => {
    while (p > (total_pages || 1) && hasMoreServer && !isFetchingMore) {
      await loadMore();
    }
    setPage(Math.min(p, total_pages || 1));
  };

  const onPrev = () => { if (page > 1) setPage(page - 1); };
  const onNext = async () => {
    if (page < (total_pages || 1)) return setPage(page + 1);
    if (hasMoreServer && !isFetchingMore) {
      await loadMore();
      setPage(page + 1);
    }
  };
  const onLast = async () => {
    if (!total_pages) return;
    if (page >= total_pages && !hasMoreServer) return;
    while (hasMoreServer && !isFetchingMore) {
      await loadMore();
    }
    setPage(total_pages);
  };

  async function handleCreateSubmit(payload: ProductCreate) {
    setCreating(true);
    try {
      const created = await createProduct(payload);
      insertOptimistic(created);
      success("Producto creado");
      setOpenCreate(false);
      setPage(1);
      void invalidateAll();
    } catch (e: any) {
      err(e?.response?.data?.detail ?? "Error creando producto");
    } finally {
      setCreating(false);
    }
  }

  async function handleEditSubmit(payload: ProductUpdate) {
    if (!editId) return;
    try {
      const updated = await updateProduct(editId, payload);
      const { id: _ignore, ...rest } = updated;
      patchOptimistic({ id: editId, ...rest });
      success("Producto actualizado");
      setOpenEdit(false);
      void invalidateAll();
    } catch (e: any) {
      err(e?.response?.data?.detail ?? "Error actualizando producto");
    }
  }


  async function handleConfirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteProduct(deleteId);
      removeOptimistic(deleteId);
      await invalidateAll();
      success("Producto eliminado");
      setOpenDelete(false);
      setDeleteId(null);
      setPage(1);
    } catch (e: any) {
      err(e?.response?.data?.detail ?? "Error eliminando producto");
    } finally {
      setDeleting(false);
    }
  }

  async function handleToggleActivo(id: number, current: boolean) {
    try {
      const res = await toggleProductActive(id);
      const isActive = (res as any).is_active ?? !current;
      upsertOne({ id, is_active: isActive });
      if (viewId === id) refetchView();
      success(isActive ? "Producto activado" : "Producto desactivado");
    } catch (e: any) {
      err(e?.response?.data?.detail ?? "No se pudo cambiar el estado");
    }
  }

  return (
    <div className="app-shell__frame overflow-hidden" style={frameVars}>
      <div className="hidden sm:flex mb-3 items-center justify-between gap-3">
        <label className="relative flex h-10 w-full max-w-[440px]">
          <span className="absolute inset-y-0 left-3 flex items-center text-tg-muted pointer-events-none">
            <MaterialIcon name="search" size={18} />
          </span>
          <input
            type="search"
            placeholder="Buscar un producto..."
            className="h-10 w-full rounded-md border border-tg bg-tg-card text-tg-card pl-9 pr-8 focus:outline-none focus:ring-tg-primary"
            value={filters.q ?? ""}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
          />
          {(filters.q ?? "").length > 0 && (
            <button
              type="button"
              onClick={() => setFilters((f) => ({ ...f, q: "" }))}
              className="absolute inset-y-0 right-2 grid place-items-center text-white hover:text-tg-primary"
              aria-label="Limpiar búsqueda"
            >
              <MaterialIcon name="close" size={16} />
            </button>
          )}
        </label>

        <button
          onClick={() => setOpenCreate(true)}
          className="h-10 rounded-md px-4 text-sm font-extrabold shadow-sm inline-flex items-center gap-2"
          style={{ background: "var(--tg-primary)", color: "#fff" }}
        >
          <MaterialIcon name="add_circle" size={18} />
          Nuevo producto
        </button>
      </div>

      <div className="sm:hidden mb-3 space-y-2">
        <label className="relative flex h-10 w-full">
          <span className="absolute inset-y-0 left-3 flex items-center text-tg-muted pointer-events-none">
            <MaterialIcon name="search" size={18} />
          </span>
          <input
            type="search"
            placeholder="Buscar un producto..."
            className="h-10 w-full rounded-md border border-tg bg-tg-card text-tg-card pl-9 pr-8 focus:outline-none focus:ring-tg-primary"
            value={filters.q ?? ""}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
          />
          {(filters.q ?? "").length > 0 && (
            <button
              type="button"
              onClick={() => setFilters((f) => ({ ...f, q: "" }))}
              className="absolute inset-y-0 right-2 grid place-items-center text-white hover:text-tg-primary"
              aria-label="Limpiar búsqueda"
            >
              <MaterialIcon name="close" size={16} />
            </button>
          )}
        </label>

        <button
          onClick={() => setOpenCreate(true)}
          className="h-10 w-full rounded-md px-4 text-sm font-extrabold shadow-sm inline-flex items-center justify-center gap-2"
          style={{ background: "var(--tg-primary)", color: "#fff" }}
        >
          <MaterialIcon name="add_circle" size={18} />
          Nuevo producto
        </button>
      </div>

      <div className="rounded-xl border flex-1 min-h-0 flex flex-col overflow-hidden mb-1" style={{ background: FRAME_BG }}>
        <div className="px-3 pt-3">
          <HeaderRow />
        </div>

        <div className="flex-1 min-h-0 overflow-auto px-3 pb-1 space-y-4 sm:space-y-3.5">
          {loading
            ? Array.from({ length: page_size || pageSizeWanted }).map((_, i) => (
              <div key={`sk-${i}`} className="h-[60px] rounded-xl border bg-black/10 animate-pulse" />
            ))
            : rows.length === 0
              ? <div className="h-full grid place-items-center text-tg-muted text-sm">Sin registros</div>
              : rows.map((r) => (
                <ProductRow
                  key={r.id}
                  p={r}
                  onView={(id) => { setViewId(id); setOpenView(true); }}
                  onEdit={(id) => { setEditId(id); setOpenEdit(true); }}
                  onImages={(id) => { setMediaProductId(id); setOpenMedia(true); }}
                  onToggle={handleToggleActivo}
                  onDelete={(id) => { setDeleteId(id); setOpenDelete(true); }}
                />
              ))}
        </div>

        <div className="shrink-0 px-3 pt-1 pb-2 flex flex-wrap gap-3 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm">Líneas por página</span>
              <select value={page_size || pageSizeWanted} disabled className="h-9 rounded-md border border-tg bg-[var(--panel-bg)] px-2 text-sm text-tg-muted">
                <option value={page_size || pageSizeWanted}>{page_size || pageSizeWanted}</option>
              </select>
            </div>

            <button type="button" onClick={() => setOpenImport(true)} className="h-9 rounded-md border border-tg bg-[var(--panel-bg)] px-3 text-sm text-tg-muted inline-flex items-center gap-2">
              <MaterialIcon name="file_upload" size={16} /> Importar
            </button>
            <button type="button" onClick={() => setOpenExport(true)} className="h-9 rounded-md border border-tg bg-[var(--panel-bg)] px-3 text-sm text-tg-muted inline-flex items-center gap-2">
              <MaterialIcon name="file_download" size={16} /> Exportar
            </button>
          </div>

          <nav className="flex items-center gap-1">
            <button disabled={page <= 1} onClick={() => setPage(1)} className="h-9 w-9 grid place-items-center rounded bg-[color-mix(in_srgb,var(--tg-bg)_70%,#000)] border border-white/10 disabled:opacity-40">
              <MaterialIcon name="first_page" size={16} />
            </button>
            <button disabled={page <= 1} onClick={onPrev} className="h-9 w-9 grid place-items-center rounded bg-[color-mix(in_srgb,var(--tg-bg)_70%,#000)] border border-white/10 disabled:opacity-40">
              <MaterialIcon name="chevron_left" size={16} />
            </button>

            {Array.from({ length: (end - start + 1) || 1 }, (_, i) => (start ?? 1) + i).map((p) => {
              const active = p === page;
              return (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  className={`h-9 min-w-9 px-3 rounded border ${active ? "bg-tg-primary text-white border-transparent" : "bg-[color-mix(in_srgb,var(--tg-bg)_70%,#000)] text-white/90 border-white/10"} font-semibold`}
                  aria-current={active ? "page" : undefined}
                >
                  {p}
                </button>
              );
            })}

            <button disabled={!hasMoreServer && page >= (total_pages || 1)} onClick={onNext} className="h-9 w-9 grid place-items-center rounded bg-[color-mix(in_srgb,var(--tg-bg)_70%,#000)] border border-white/10 disabled:opacity-40">
              <MaterialIcon name="chevron_right" size={16} />
            </button>
            <button disabled={!hasMoreServer && page >= (total_pages || 1)} onClick={onLast} className="h-9 w-9 grid place-items-center rounded bg-[color-mix(in_srgb,var(--tg-bg)_70%,#000)] border border-white/10 disabled:opacity-40">
              <MaterialIcon name="last_page" size={16} />
            </button>

            <div className="h-9 min-w-[120px] grid place-items-center text-sm font-medium">
              {from} - {to} de {total ?? 0}
            </div>
          </nav>
        </div>
      </div>

      <ImportDialog
        open={openImport}
        onClose={() => { imp.reset(); setOpenImport(false); }}
        onRun={async (opts) => { try { await imp.importFile({ ...opts, entity: "products" }); success("Importación completada"); refresh(); } catch (e: any) { err(e?.message ?? "Error al importar"); } }}
        loading={imp.loading}
        error={imp.error?.message ?? null}
        report={imp.data}
        fixedEntity="products"
        title="Importar productos"
      />
      <ExportDialog
        open={openExport}
        onClose={() => {
          exp.reset();
          setOpenExport(false);
        }}
        onDownload={async (_entity, fmt, filename) => {
          const ok = await exp.download("products", fmt, filename);
          if (ok) {
            success("Exportación generada");
            exp.reset();
            setOpenExport(false);
          } else {
            err(exp.error?.message ?? "Error al exportar");
          }
          return ok;
        }}
        loading={exp.loading}
        error={exp.error?.message ?? null}
        entities={["customers", "products", "suppliers"]}
        fixedEntity="products"
        title="Exportar productos"
        defaultName="products"
      />

      {openCreate && (
        <ProductoForm
          intent="create"
          open={openCreate}
          onClose={() => setOpenCreate(false)}
          onSubmit={(data) => handleCreateSubmit(data as ProductCreate)}
          loading={creating}
        />
      )}
      {openView && <ProductoView open={openView} onClose={() => setOpenView(false)} producto={producto} loading={viewLoading} />}
      {openEdit && (
        <ProductoForm
          intent="edit"
          open={openEdit}
          onClose={() => setOpenEdit(false)}
          onSubmit={handleEditSubmit}
          loading={editLoading}
          defaults={
            editProducto
              ? {
                reference: editProducto.reference,
                description: editProducto.description,
                quantity: editProducto.quantity ?? 0,
                purchase_price: editProducto.purchase_price,
                sale_price: editProducto.sale_price,
                is_active: editProducto.is_active,
                barcode: editProducto.barcode ?? "",
                barcode_type: editProducto.barcode_type ?? "",
              }
              : undefined
          }
        />
      )}
      {openMedia && (
        <ProductImagesModal open={openMedia} productId={mediaProductId!} onClose={() => setOpenMedia(false)} />
      )}
      {openDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-black/50"
          onKeyDown={(e) => { if (e.key === "Escape") setOpenDelete(false); }}
          onClick={(e) => { if (e.target === e.currentTarget && !deleting) setOpenDelete(false); }}
        >
          <div className="w-[420px] rounded-lg border bg-[var(--panel-bg)] shadow-xl" style={{ borderColor: "var(--tg-border)" }}>
            <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: "var(--tg-border)" }}>
              <MaterialIcon name="warning" size={18} />
              <h3 className="text-base font-semibold">Confirmar eliminación</h3>
            </div>
            <div className="px-4 py-4 text-sm">¿Seguro que deseas eliminar este producto? Esta acción no se puede deshacer.</div>
            <div className="px-4 py-3 border-t flex justify-end gap-2" style={{ borderColor: "var(--tg-border)" }}>
              <button onClick={() => setOpenDelete(false)} className="h-9 rounded-md px-3 text-sm hover:bg-black/10" disabled={deleting}>Cancelar</button>
              <button onClick={handleConfirmDelete} className="h-9 rounded-md px-3 text-sm font-medium text-white disabled:opacity-60" style={{ background: "#7a1010" }} disabled={deleting}>
                {deleting ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
