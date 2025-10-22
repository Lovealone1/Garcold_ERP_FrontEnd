"use client";

import { useEffect, useMemo, useState } from "react";
import type { CompanyDTO } from "@/types/company";
import { useCompany } from "@/hooks/company/useCompany";
import { usePatchCompany } from "@/hooks/company/usePatchCompany";
import { type CompanyPatch } from "@/services/sales/company.api";

type Form = Omit<CompanyDTO, "id">;

const emptyForm: Form = {
  razon_social: "", nombre_completo: "", cc_nit: "", email_facturacion: "",
  celular: null, direccion: "", municipio: "", departamento: "",
  codigo_postal: null, regimen: "COMUN",
};

export default function CompanySettingsPage() {
  const { data, loading, error, reload } = useCompany();
  const { mutate, loading: saving } = usePatchCompany();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Form>(emptyForm);

  useEffect(() => {
    if (!data) return;
    setForm({
      razon_social: data.razon_social,
      nombre_completo: data.nombre_completo,
      cc_nit: data.cc_nit,
      email_facturacion: data.email_facturacion,
      celular: data.celular ?? null,
      direccion: data.direccion,
      municipio: data.municipio,
      departamento: data.departamento,
      codigo_postal: data.codigo_postal ?? null,
      regimen: data.regimen,
    });
  }, [data]);

  const changedPayload: CompanyPatch = useMemo(() => {
    if (!data) return {};
    const diff: Record<string, unknown> = {};
    (Object.keys(form) as (keyof Form)[]).forEach((k) => {
      if ((form[k] ?? null) !== ((data as any)[k] ?? null)) diff[k] = form[k];
    });
    return diff as CompanyPatch;
  }, [form, data]);

  const dirty = useMemo(() => Object.keys(changedPayload).length > 0, [changedPayload]);

  const onEdit = () => setEditing(true);
  const onCancel = () => {
    if (!data) return;
    setEditing(false);
    setForm({
      razon_social: data.razon_social,
      nombre_completo: data.nombre_completo,
      cc_nit: data.cc_nit,
      email_facturacion: data.email_facturacion,
      celular: data.celular ?? null,
      direccion: data.direccion,
      municipio: data.municipio,
      departamento: data.departamento,
      codigo_postal: data.codigo_postal ?? null,
      regimen: data.regimen,
    });
  };

  const onSave = async () => {
    if (!dirty) return;
    await mutate(changedPayload);
    await reload();
    setEditing(false);
  };

  const set = <K extends keyof Form>(key: K, val: Form[K]) =>
    setForm((s) => ({ ...s, [key]: val }));

  return (
    <div className="app-shell__content">
      <div className="mb-3">
        <h1 className="text-xl font-semibold">Compañía</h1>
      </div>

      <div className="bg-tg-card text-tg-card rounded-xl border border-tg">
        {(loading || saving) && (
          <div className="h-1 w-full bg-[color-mix(in_srgb,var(--tg-muted)_20%,transparent)] overflow-hidden">
            <div className="h-full w-1/2 bg-tg-primary animate-[progress_1.2s_linear_infinite]" />
          </div>
        )}

        {error ? (
          <div className="px-4 py-3 text-sm text-red-600">No fue posible cargar la compañía.</div>
        ) : null}

        {/* Contenido arriba */}
        <div className="px-4 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Razón social" value={form.razon_social} onChange={(v) => set("razon_social", v)} readOnly={!editing} />
          <Field label="Nombre completo" value={form.nombre_completo} onChange={(v) => set("nombre_completo", v)} readOnly={!editing} />
          <Field label="CC/NIT" value={form.cc_nit} onChange={(v) => set("cc_nit", v)} readOnly={!editing} />
          <Field label="Email de facturación" type="email" value={form.email_facturacion} onChange={(v) => set("email_facturacion", v)} readOnly={!editing} />
          <Field label="Celular" value={form.celular ?? ""} onChange={(v) => set("celular", v || null)} readOnly={!editing} />
          <Field label="Dirección" value={form.direccion} onChange={(v) => set("direccion", v)} readOnly={!editing} />
          <Field label="Municipio" value={form.municipio} onChange={(v) => set("municipio", v)} readOnly={!editing} />
          <Field label="Departamento" value={form.departamento} onChange={(v) => set("departamento", v)} readOnly={!editing} />
          <Field label="Código postal" value={form.codigo_postal ?? ""} onChange={(v) => set("codigo_postal", v || null)} readOnly={!editing} />
          <SelectField
            label="Régimen"
            value={form.regimen}
            onChange={(v) => set("regimen", v as Form["regimen"])}
            readOnly={!editing}
            options={[
              { value: "COMUN", label: "Común" },
              { value: "NO_RESPONSABLE", label: "No responsable" },
              { value: "SIMPLE", label: "Simple" },
            ]}
          />
        </div>

        {/* Acciones abajo a la derecha */}
        <div className="px-4 py-3 border-t border-tg flex items-center justify-end gap-2">
          {!editing ? (
            <button
              className="px-3 py-1.5 rounded-lg border border-tg bg-tg-sidebar-item-bg text-tg-sidebar-item-fg text-sm"
              onClick={onEdit}
              disabled={loading || !!error || !data}
            >
              Editar
            </button>
          ) : (
            <>
              <button
                className="px-3 py-1.5 rounded-lg border border-tg bg-tg-card text-tg-card text-sm"
                onClick={onCancel}
                disabled={saving}
              >
                Cancelar
              </button>
              {dirty && (
                <button
                  className="px-3 py-1.5 bg-tg-primary text-tg-primary-fg rounded-xl text-sm disabled:opacity-60"
                  onClick={onSave}
                  disabled={saving}
                >
                  Guardar
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes progress { 0% {transform: translateX(-100%);} 100% {transform: translateX(200%);} }
      `}</style>
    </div>
  );
}

function Field({
  label, value, onChange, readOnly, type = "text",
}: { label: string; value: string; onChange: (v: string) => void; readOnly: boolean; type?: string; }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-tg-muted">{label}</span>
      <input
        className="px-3 py-2 rounded-lg border border-tg bg-tg-card text-tg-card text-sm disabled:opacity-60"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        disabled={readOnly}
      />
    </label>
  );
}

function SelectField({
  label, value, onChange, readOnly, options,
}: {
  label: string; value: string; onChange: (v: string) => void; readOnly: boolean;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-tg-muted">{label}</span>
      <select
        className="px-3 py-2 rounded-lg border border-tg bg-tg-card text-tg-card text-sm disabled:opacity-60"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={readOnly}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}
