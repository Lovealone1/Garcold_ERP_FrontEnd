// app/(ventas)/proveedores/page.tsx
"use client";

import { useMemo, useState, useEffect, CSSProperties } from "react";
import { MaterialIcon } from "@/components/ui/material-icon";
import ProveedorForm from "@/features/proveedores/ProveedorForm";
import ProveedorView from "@/features/proveedores/ProveedorView";
import { useSuppliers } from "@/hooks/proveedores/useSuppliers";
import { useSupplier } from "@/hooks/proveedores/useProveedor";
import { createSupplier, updateSupplier, deleteSupplier } from "@/services/sales/supplier.api";
import type { Supplier, SupplierCreate, SupplierUpdate } from "@/types/supplier";
import { useNotifications } from "@/components/providers/NotificationsProvider";
import { useImport } from "@/hooks/io/useImport";
import { useExport } from "@/hooks/io/useExport";
import ImportDialog from "@/features/io/ImportDialog";
import ExportDialog from "@/features/io/ExportDialog";
import { useMediaQuery } from "@/hooks/ui/useMediaQuery";

/* Tokens visuales */
const FRAME_BG = "color-mix(in srgb, var(--tg-bg) 90%, #fff 3%)";
const OUTER_BG = "color-mix(in srgb, var(--tg-bg) 55%, #000 45%)";
const INNER_BG = "color-mix(in srgb, var(--tg-bg) 95%, #fff 2%)";
const PILL_BG = "color-mix(in srgb, var(--tg-card-bg) 60%, #000 40%)";
const ACTION_BG = "color-mix(in srgb, var(--tg-primary) 28%, transparent)";
const BORDER = "var(--tg-border)";

/* Base compacta */
const pill =
  "min-w-[90px] h-8 px-2.5 rounded-md grid place-items-center text-[13px] text-white/90 border";
const actionBtn =
  "h-8 w-8 grid place-items-center rounded-full text-[var(--tg-primary)] hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-tg-primary";

/* Utilidad */
const clip = (s?: string | null, n = 22) =>
  (s ?? "—").length > n ? (s as string).slice(0, n).trimEnd() + "…" : (s ?? "—");

/* Per-page por montaje: móvil 5, desktop 8 */
function getInitialPerPage() {
  if (typeof window === "undefined") return 8;
  return window.matchMedia("(max-width: 639px)").matches ? 5 : 8;
}

/* Indicador */
function Dot({ color }: { color: string }) {
  return <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: color }} />;
}

/* Header desktop */
function HeaderRow() {
  return (
    <div
      className="hidden sm:grid items-center gap-3 mb-2 font-extrabold mx-2"
      style={{ gridTemplateColumns: "30px 240px 1fr 200px 200px 180px" }}
    >
      <span />
      <span className="text-white">Nombre</span>
      <span className="text-white">Contacto</span>
      <span className="text-white text-center">CC/NIT</span>
      <span className="text-white text-center">Ciudad</span>
      <span className="text-white text-center">Acciones</span>
    </div>
  );
}

/* Card/Fila */
function SupplierRow({
  s,
  onView,
  onEdit,
  onDelete,
}: {
  s: Supplier;
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="relative rounded-xl border shadow-sm" style={{ background: OUTER_BG, borderColor: BORDER }}>
      {/* Desktop */}
      <div className="hidden sm:block mx-1.5 my-2 rounded-md px-3 py-2.5" style={{ background: INNER_BG }}>
        <div className="grid items-center gap-3" style={{ gridTemplateColumns: "30px 240px 1fr 200px 200px 180px" }}>
          <div className="grid place-items-center">
            <Dot color="var(--tg-primary)" />
          </div>

          <div className={`${pill} font-extrabold tracking-wide`} style={{ background: PILL_BG, borderColor: BORDER }}>
            {clip(s.name, 34)}
          </div>

          <div className="text-[13px] text-white/90 truncate">
            {s.email || "—"} • {s.phone || "—"}
          </div>

          <div
            className={`${pill} max-w-[240px] min-w-[150px] whitespace-nowrap overflow-hidden text-ellipsis`}
            style={{ background: PILL_BG, borderColor: BORDER }}
            title={s.tax_id || "—"}
          >
            {clip(s.tax_id ?? "", 20)}
          </div>

          <div
            className={`${pill} max-w-[260px] min-w-[200px] whitespace-nowrap overflow-hidden text-ellipsis`}
            style={{ background: PILL_BG, borderColor: BORDER }}
            title={s.city || "—"}
          >
            {clip(s.city, 22)}
          </div>

          <div className="flex items-center justify-end gap-2">
            <button className={actionBtn} style={{ background: ACTION_BG }} aria-label="ver" onClick={() => onView(s.id)}>
              <MaterialIcon name="visibility" size={18} />
            </button>
            <button className={actionBtn} style={{ background: ACTION_BG }} aria-label="editar" onClick={() => onEdit(s.id)}>
              <MaterialIcon name="edit" size={18} />
            </button>
            <button
              className="h-8 w-8 grid place-items-center rounded-full"
              style={{ background: "#7a1010" }}
              aria-label="eliminar"
              onClick={() => onDelete(s.id)}
              title="Eliminar"
            >
              <MaterialIcon name="delete" size={16} className="text-[#ff4d4f]" />
            </button>
          </div>
        </div>
      </div>

      {/* Móvil */}
      <div className="sm:hidden mx-2.5 my-3 rounded-md px-3 py-2 min-h-[84px]" style={{ background: INNER_BG }}>
        <div className="flex items-start gap-2">
          <Dot color="var(--tg-primary)" />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2 min-w-0">
              <span className="text-sm font-extrabold tracking-wide truncate">{s.name}</span>
            </div>
            <div className="mt-0.5 text-[12px] text-white/80 truncate">
              {s.email || "—"} • {s.phone || "—"}
            </div>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <div className="rounded-md border px-2 py-1 text-center text-[12px]" style={{ background: PILL_BG, borderColor: BORDER }}>
                <div className="uppercase opacity-70">CC/NIT</div>
                <div className="font-medium whitespace-nowrap overflow-hidden text-ellipsis" title={s.tax_id || "—"}>
                  {clip(s.tax_id ?? "", 16)}
                </div>
              </div>
              <div className="rounded-md border px-2 py-1 text-center text-[12px]" style={{ background: PILL_BG, borderColor: BORDER }}>
                <div className="uppercase opacity-70">Ciudad</div>
                <div className="font-medium whitespace-nowrap overflow-hidden text-ellipsis" title={s.city || "—"}>
                  {clip(s.city, 18)}
                </div>
              </div>
            </div>
          </div>

          <div className="ml-2 flex items-center gap-2 shrink-0">
            <button className={actionBtn} style={{ background: ACTION_BG }} aria-label="ver" onClick={() => onView(s.id)}>
              <MaterialIcon name="visibility" size={18} />
            </button>
            <button className={actionBtn} style={{ background: ACTION_BG }} aria-label="editar" onClick={() => onEdit(s.id)}>
              <MaterialIcon name="edit" size={18} />
            </button>
            <button
              className="h-8 w-8 grid place-items-center rounded-full"
              style={{ background: "#7a1010" }}
              aria-label="eliminar"
              onClick={() => onDelete(s.id)}
            >
              <MaterialIcon name="delete" size={16} className="text-[#ff4d4f]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Página */
export default function ProveedoresPage() {
  // perPage fijo por montaje: móvil 5
  const [perPage] = useState<number>(getInitialPerPage);
  const isNarrow = useMediaQuery("(max-width: 639px)");

  const {
    items: rows,
    page,
    pageSize,
    total,
    totalPages,
    hasPrev,
    hasNext,
    loading,
    setPage,
    filters,
    setFilters,
    options,
    reload,
    upsertOne,
  } = useSuppliers(perPage); // << importante: respetar perPage

  const { success, error } = useNotifications();

  // Crear
  const [openCreate, setOpenCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  // Ver
  const [viewId, setViewId] = useState<number | null>(null);
  const [openView, setOpenView] = useState(false);
  const { supplier: viewSupplier, loading: viewLoading } = useSupplier(viewId);

  // Editar
  const [editId, setEditId] = useState<number | null>(null);
  const [openEdit, setOpenEdit] = useState(false);
  const { supplier: editSupplier, loading: editLoading } = useSupplier(editId);

  // Eliminar
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // IO
  const [openImport, setOpenImport] = useState(false);
  const [openExport, setOpenExport] = useState(false);
  const imp = useImport();
  const exp = useExport();

  const frameVars: CSSProperties = { ["--content-x" as any]: "8px" };

  // cerrar dropdown de ciudades al cambiar ancho
  const [citiesOpen, setCitiesOpen] = useState(false);
  useEffect(() => { setCitiesOpen(false); }, [isNarrow]);

  const from = useMemo(() => (total === 0 ? 0 : (page - 1) * pageSize + 1), [page, pageSize, total]);
  const to = useMemo(() => Math.min(page * pageSize, total), [page, pageSize, total]);

  const [start, end] = useMemo(() => {
    const win = 5;
    if (totalPages <= win) return [1, totalPages] as const;
    const s = Math.max(1, Math.min(page - 2, totalPages - (win - 1)));
    return [s, s + (win - 1)] as const;
  }, [page, totalPages]);

  // Crear
  async function handleCreateSubmit(data: SupplierCreate) {
    setCreating(true);
    try {
      await createSupplier(data);
      setOpenCreate(false);
      setPage(1);
      reload?.();
      success("Proveedor creado");
    } catch (e: any) {
      error(e?.response?.data?.detail ?? "Error creando proveedor");
    } finally {
      setCreating(false);
    }
  }

  // Editar
  async function handleEditSubmit(data: SupplierUpdate) {
    if (!editId) return;
    try {
      await updateSupplier(editId, data);
      setOpenEdit(false);
      upsertOne({ id: editId, ...data });
      reload?.();
      success("Proveedor actualizado");
    } catch (e: any) {
      error(e?.response?.data?.detail ?? "Error actualizando proveedor");
    }
  }

  // Eliminar
  async function handleConfirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteSupplier(deleteId);
      setOpenDelete(false);
      setDeleteId(null);
      reload?.();
      success("Proveedor eliminado");
    } catch (e: any) {
      error(e?.response?.data?.detail ?? "Error eliminando proveedor");
    } finally {
      setDeleting(false);
    }
  }

  function handleClearFilters() {
    setFilters({ q: "", cities: undefined });
  }

  // Ciudades multiselect
  const selectedCities = filters.cities ?? [];
  const allCities = options.cities ?? [];
  const allSelected = selectedCities.length > 0 && selectedCities.length === allCities.length;
  const citiesLabel =
    selectedCities.length === 0 ? "Ciudad" : allSelected ? "Todas" : `${selectedCities.length} seleccionadas`;
  const toggleCity = (city: string) =>
    setFilters((f) => {
      const s = new Set(f.cities ?? []);
      s.has(city) ? s.delete(city) : s.add(city);
      const arr = Array.from(s);
      return { ...f, cities: arr.length ? arr : undefined };
    });
  const toggleAllCities = () =>
    setFilters((f) => (allSelected ? { ...f, cities: undefined } : { ...f, cities: [...allCities] }));

  return (
    <div className="app-shell__frame overflow-hidden" style={frameVars}>
      {/* Toolbar desktop */}
      <div className="hidden sm:flex mb-3 items-center justify-between gap-3">
        <label className="relative flex h-10 w-full max-w-[440px]">
          <span className="absolute inset-y-0 left-3 flex items-center text-tg-muted pointer-events-none">
            <MaterialIcon name="search" size={18} />
          </span>
          <input
            type="search"
            placeholder="Buscar proveedor..."
            className="h-10 w-full rounded-md border border-tg bg-tg-card text-tg-card pl-9 pr-8 focus:outline-none focus:ring-tg-primary text-[16px] sm:text-sm"
            value={filters.q ?? ""}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
          />
          {(filters.q ?? "").length > 0 && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="absolute inset-y-0 right-2 grid place-items-center text-white hover:text-tg-primary"
              aria-label="Limpiar búsqueda"
            >
              <MaterialIcon name="close" size={16} />
            </button>
          )}
        </label>

        <div className="flex items-center gap-2">
          {/* Ciudades */}
          <div className="relative w-[220px]">
            <button
              type="button"
              onClick={() => setCitiesOpen((o) => !o)}
              className="h-10 w-full rounded-md border border-tg bg-tg-card px-3 text-left text-[16px] sm:text-sm text-tg-muted inline-flex items-center justify-between"
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
                  {allCities.map((ci) => {
                    const checked = selectedCities.includes(ci);
                    return (
                      <li key={ci}>
                        <label className="flex items-center gap-2 text-sm cursor-pointer px-1 py-1 rounded hover:bg.black/10 dark:hover:bg.white/10">
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

          <button
            onClick={() => setOpenCreate(true)}
            className="h-10 rounded-md px-4 text-sm font-extrabold shadow-sm inline-flex items-center gap-2"
            style={{ background: "var(--tg-primary)", color: "#fff" }}
          >
            <MaterialIcon name="add_circle" size={18} />
            Nuevo proveedor
          </button>
        </div>
      </div>

      {/* Toolbar móvil */}
      <div className="sm:hidden mb-3 space-y-2">
        <label className="relative flex h-10 w-full">
          <span className="absolute inset-y-0 left-3 flex items-center text-tg-muted pointer-events-none">
            <MaterialIcon name="search" size={18} />
          </span>
          <input
            type="search"
            placeholder="Buscar proveedor..."
            className="h-10 w-full rounded-md border border-tg bg-tg-card text-tg-card pl-9 pr-8 focus:outline-none focus:ring-tg-primary text-[16px] sm:text-sm"
            value={filters.q ?? ""}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
          />
          {(filters.q ?? "").length > 0 && (
            <button
              type="button"
              onClick={handleClearFilters}
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
          Nuevo proveedor
        </button>

        <div className="grid grid-cols-1 gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setCitiesOpen((o) => !o)}
              className="h-10 w-full rounded-md border border-tg bg-tg-card px-3 text-left text-[16px] sm:text-sm text-tg-muted inline-flex items-center justify-between"
            >
              <span>{citiesLabel}</span>
              <MaterialIcon name="expand_less" size={18} />
            </button>
            {citiesOpen && (
              <div className="absolute z-20 mt-1 w-full rounded-md border border-tg bg-[var(--panel-bg)] shadow-lg max-h-64 overflow-auto">
                <div className="px-3 py-2 border-b border-tg">
                  <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" className="accent-current" checked={allSelected} onChange={toggleAllCities} />
                    <span>Todas</span>
                  </label>
                </div>
                <ul className="p-2 space-y-1">
                  {allCities.map((ci) => {
                    const checked = selectedCities.includes(ci);
                    return (
                      <li key={ci}>
                        <label className="flex items-center gap-2 text-sm cursor-pointer px-1 py-1 rounded hover:bg.black/10 dark:hover:bg.white/10">
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
        </div>
      </div>

      {/* Marco y lista */}
      <div className="rounded-xl border flex-1 min-h-0 flex flex-col overflow-hidden mb-1" style={{ background: FRAME_BG, borderColor: BORDER }}>
        <div className="px-3 pt-3">
          <HeaderRow />
        </div>

        <div className="flex-1 min-h-0 overflow-auto px-3 pb-1 space-y-4 sm:space-y-3.5">
          {loading
            ? Array.from({ length: perPage }).map((_, i) => (
              <div key={`sk-${i}`} className="h-[60px] rounded-xl border bg-black/10 animate-pulse" />
            ))
            : rows.length === 0
              ? <div className="h-full grid place-items-center text-tg-muted text-sm">Sin registros</div>
              : rows.map((r) => (
                <SupplierRow
                  key={r.id}
                  s={r}
                  onView={(id) => { setViewId(id); setOpenView(true); }}
                  onEdit={(id) => { setEditId(id); setOpenEdit(true); }}
                  onDelete={(id) => { setDeleteId(id); setOpenDelete(true); }}
                />
              ))}
        </div>

        {/* Paginación + IO */}
        <div className="shrink-0 px-3 pt-1 pb-2 flex flex-wrap gap-3 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm">Líneas por página</span>
              <select value={pageSize} disabled className="h-9 rounded-md border border-tg bg-[var(--panel-bg)] px-2 text-sm text-tg-muted">
                <option value={pageSize}>{pageSize}</option>
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
            <button disabled={!hasPrev} onClick={() => setPage(1)} className="h-9 w-9 grid place-items-center rounded bg-[color-mix(in_srgb,var(--tg-bg)_70%,#000)] border border-white/10 disabled:opacity-40">
              <MaterialIcon name="first_page" size={16} />
            </button>
            <button disabled={!hasPrev} onClick={() => setPage(page - 1)} className="h-9 w-9 grid place-items-center rounded bg-[color-mix(in_srgb,var(--tg-bg)_70%,#000)] border border-white/10 disabled:opacity-40">
              <MaterialIcon name="chevron_left" size={16} />
            </button>

            {Array.from({ length: end - start + 1 }, (_, i) => start + i).map((p) => {
              const active = p === page;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`h-9 min-w-9 px-3 rounded border ${active ? "bg-tg-primary text-white border-transparent" : "bg-[color-mix(in_srgb,var(--tg-bg)_70%,#000)] text-white/90 border-white/10"} font-semibold`}
                  aria-current={active ? "page" : undefined}
                >
                  {p}
                </button>
              );
            })}

            <button disabled={!hasNext} onClick={() => setPage(page + 1)} className="h-9 w-9 grid place-items-center rounded bg-[color-mix(in_srgb,var(--tg-bg)_70%,#000)] border border-white/10 disabled:opacity-40">
              <MaterialIcon name="chevron_right" size={16} />
            </button>
            <button disabled={!hasNext} onClick={() => setPage(totalPages)} className="h-9 w-9 grid place-items-center rounded bg-[color-mix(in_srgb,var(--tg-bg)_70%,#000)] border border-white/10 disabled:opacity-40">
              <MaterialIcon name="last_page" size={16} />
            </button>

            <div className="h-9 min-w-[120px] grid place-items-center text-sm font-medium">
              {from} - {to} de {total}
            </div>
          </nav>
        </div>
      </div>

      {/* IO dialogs */}
      <ImportDialog
        open={openImport}
        onClose={() => { imp.reset(); setOpenImport(false); }}
        onRun={async (opts) => {
          try {
            await imp.importFile({ ...opts, entity: "suppliers" });
            success("Importación completada");
            reload?.();
          } catch (e: any) {
            error(e?.message ?? "Error al importar");
          }
        }}
        loading={imp.loading}
        error={imp.error?.message ?? null}
        report={imp.data}
        fixedEntity="suppliers"
        title="Importar proveedores"
      />

      <ExportDialog
        open={openExport}
        onClose={() => { exp.reset(); setOpenExport(false); }}
        onDownload={async (_e, fmt, filename) => {
          try {
            await exp.download("suppliers", fmt, filename);
          } catch (e: any) {
            error(e?.message ?? "Error al exportar");
          }
        }}
        loading={exp.loading}
        error={exp.error?.message ?? null}
        entities={["customers", "products", "suppliers"]}
        fixedEntity="suppliers"
        title="Exportar proveedores"
        defaultName="suppliers"
      />

      {/* Crear */}
      {openCreate && (
        <ProveedorForm
          intent="create"
          open={openCreate}
          onClose={() => setOpenCreate(false)}
          onSubmit={handleCreateSubmit}
          loading={creating}
        />
      )}

      {/* Ver */}
      {openView && (
        <ProveedorView
          open={openView}
          onClose={() => setOpenView(false)}
          proveedor={viewSupplier || null}
          loading={viewLoading}
        />
      )}

      {/* Editar */}
      {openEdit && (
        <ProveedorForm
          intent="edit"
          open={openEdit}
          onClose={() => setOpenEdit(false)}
          onSubmit={handleEditSubmit}
          loading={editLoading}
          defaults={
            editSupplier
              ? {
                name: editSupplier.name,
                tax_id: editSupplier.tax_id ?? "",
                email: editSupplier.email ?? "",
                phone: editSupplier.phone ?? "",
                address: editSupplier.address ?? "",
                city: editSupplier.city ?? "",
              }
              : undefined
          }
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
          <div className="w-[420px] rounded-lg border bg-[var(--panel-bg)] shadow-xl" style={{ borderColor: BORDER }}>
            <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: BORDER }}>
              <MaterialIcon name="warning" size={18} />
              <h3 className="text-base font-semibold">Confirmar eliminación</h3>
            </div>
            <div className="px-4 py-4 text-sm">¿Seguro que deseas eliminar este proveedor? Esta acción no se puede deshacer.</div>
            <div className="px-4 py-3 border-t flex justify-end gap-2" style={{ borderColor: BORDER }}>
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
