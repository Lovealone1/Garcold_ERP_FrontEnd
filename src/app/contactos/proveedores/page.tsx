// app/(comercial)/proveedores/page.tsx
"use client";

import { useEffect, useMemo, useState, CSSProperties } from "react";
import { MaterialIcon } from "@/components/ui/material-icon";
import ProveedorCreate, { type NuevoProveedor } from "@/features/proveedores/ProveedorCreate";

type Proveedor = {
  id: number;
  cc_nit: string;
  nombre: string;
  direccion: string;
  ciudad: string;
  celular?: string | null;
  correo?: string | null;
  fecha_creacion?: string;
};

export default function ProveedoresPage() {
  const [rows, setRows] = useState<Proveedor[]>([]);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [size] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // modal
  const [openCreate, setOpenCreate] = useState(false);
  const [createKey, setCreateKey] = useState(0); // fuerza reset del form al abrir

  const fetchList = () => {
    setLoading(true);
    fetch(`/api/proveedores?page=${page}&size=${size}&q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((res: { items: Proveedor[]; total: number }) => {
        setRows(res.items);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchList();
  }, [page, size, q]);

  const handleCreate = async (data: NuevoProveedor) => {
    await fetch("/api/proveedores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setOpenCreate(false);
    fetchList(); // refresca
  };

  const from = useMemo(() => (total === 0 ? 0 : (page - 1) * size + 1), [page, size, total]);
  const to = useMemo(() => Math.min(page * size, total), [page, size, total]);
  const pageCount = useMemo(() => Math.max(1, Math.ceil(total / size)), [total, size]);

  const frameVars: CSSProperties = {
    ["--content-x" as any]: "16px",
    ["--page-bg" as any]: "color-mix(in srgb, var(--tg-bg) 96%, white 4%)",
    ["--panel-bg" as any]: "color-mix(in srgb, var(--tg-card-bg) 90%, black 10%)",
  };

  return (
    <div className="app-shell__frame min-h-screen" style={frameVars}>
      <div className="bg-[var(--page-bg)] rounded-xl px-[var(--content-x)] pb-[var(--content-b)] pt-3">
        {/* Barra superior */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold text-tg-fg">Proveedores</h2>

          <div className="flex flex-wrap items-center gap-2">
            {/* Búsqueda */}
            <label className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-tg-muted">
                <MaterialIcon name="search" size={18} />
              </span>
              <input
                type="search"
                placeholder="Buscar proveedor"
                className="h-10 w-[260px] rounded-md border border-tg bg-tg-card text-tg-card pl-9 pr-3 outline-none focus:ring-2 focus:ring-tg-primary"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </label>

            {/* Filtros dummy */}
            <button className="h-10 min-w-[140px] rounded-md border border-tg bg-tg-card px-3 text-left text-sm text-tg-muted">
              <span className="inline-flex items-center gap-2">
                <MaterialIcon name="expand_more" size={18} /> Estado
              </span>
            </button>
            <button className="h-10 min-w-[140px] rounded-md border border-tg bg-tg-card px-3 text-left text-sm text-tg-muted">
              <span className="inline-flex items-center gap-2">
                <MaterialIcon name="expand_more" size={18} /> Municipio
              </span>
            </button>
            <button className="h-10 min-w-[140px] rounded-md border border-tg bg-tg-card px-3 text-left text-sm text-tg-muted">
              <span className="inline-flex items-center gap-2">
                <MaterialIcon name="expand_more" size={18} /> Barrio
              </span>
            </button>

            <button
              onClick={() => {
                setCreateKey((k) => k + 1); // resetea el form
                setOpenCreate(true);
              }}
              className="h-10 rounded-md bg-tg-primary px-4 text-sm font-medium text-tg-on-primary shadow-sm"
            >
              Nuevo proveedor
            </button>
          </div>
        </div>

        {/* Tabla */}
        <div className="rounded-xl overflow-hidden border border-[var(--panel-border)] bg-[var(--panel-bg)] shadow-md">
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--table-head-bg)] text-[var(--table-head-fg)]">
                  <th className="px-4 py-3 text-left">Nombre</th>
                  <th className="px-4 py-3 text-left">CC/NIT</th>
                  <th className="px-4 py-3 text-left">Correo</th>
                  <th className="px-4 py-3 text-left">Celular</th>
                  <th className="px-4 py-3 text-left">Dirección</th>
                  <th className="px-4 py-3 text-left">Ciudad</th>
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 10 }).map((_, i) => (
                    <tr key={`sk-${i}`} className="border-t border-tg">
                      {Array.from({ length: 7 }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 w-full animate-pulse rounded bg-black/10 dark:bg-white/10" />
                        </td>
                      ))}
                    </tr>
                  ))
                  : rows.length === 0
                    ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-10 text-center text-tg-muted">
                          Sin registros
                        </td>
                      </tr>
                    )
                    : rows.map((r) => (
                      <tr key={r.id} className="border-t border-tg hover:bg-black/5 dark:hover:bg-white/5">
                        <td className="px-4 py-3">{r.nombre}</td>
                        <td className="px-4 py-3">{r.cc_nit}</td>
                        <td className="px-4 py-3">{r.correo || "—"}</td>
                        <td className="px-4 py-3">{r.celular || "—"}</td>
                        <td className="px-4 py-3">{r.direccion}</td>
                        <td className="px-4 py-3">{r.ciudad}</td>
                        <td className="px-2 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <button className="rounded p-2 hover:bg-black/10 dark:hover:bg-white/10" aria-label="ver">
                              <MaterialIcon name="visibility" size={18} />
                            </button>
                            <button className="rounded p-2 hover:bg-black/10 dark:hover:bg-white/10" aria-label="editar">
                              <MaterialIcon name="edit" size={18} />
                            </button>
                            <button className="rounded p-2 hover:bg-black/10 dark:hover:bg-white/10" aria-label="eliminar">
                              <MaterialIcon name="delete" size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>

          {/* Pie */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-tg px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm">Líneas por página</span>
              <select
                value={10}
                disabled
                className="h-9 rounded-md border border-tg bg-[var(--panel-bg)] px-2 text-sm text-tg-muted"
              >
                <option value={10}>10</option>
              </select>
            </div>

            <nav className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-8 rounded px-2 text-sm disabled:opacity-40 hover:bg-black/10 dark:hover:bg-white/10"
              >
                Anterior
              </button>
              {Array.from({ length: pageCount }).slice(0, 5).map((_, i) => {
                const p = i + 1;
                const active = p === page;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`h-8 min-w-8 rounded px-2 text-sm ${active ? "bg-tg-primary text-tg-on-primary" : "hover:bg-black/10 dark:hover:bg-white/10"
                      }`}
                  >
                    {p}
                  </button>
                );
              })}
              {pageCount > 5 && <span className="px-1">…</span>}
              <button
                disabled={page >= pageCount}
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                className="h-8 rounded px-2 text-sm disabled:opacity-40 hover:bg-black/10 dark:hover:bg-white/10"
              >
                Próximo
              </button>
            </nav>

            <div className="text-sm text-tg-muted">Exhibiendo {from}-{to} de {total} registros</div>
          </div>
        </div>
      </div>

      {/* Modal crear proveedor */}
      {openCreate && (
        <ProveedorCreate
          key={createKey}
          mode="modal"
          open={openCreate}
          onClose={() => setOpenCreate(false)}
          onSubmit={handleCreate}
          loading={false}
          defaults={{}}
        />
      )}
    </div>
  );
}
