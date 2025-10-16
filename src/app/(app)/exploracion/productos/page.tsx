// app/(analitica)/productos/exploracion/page.tsx
"use client";

import { useMemo, useState } from "react";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Autocomplete, { type AutocompleteRenderGetTagProps } from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import Checkbox from "@mui/material/Checkbox";
import ListItemText from "@mui/material/ListItemText";
import Chip from "@mui/material/Chip";
import type { DateRange } from "react-day-picker";

import DateRangePicker from "@/components/ui/DateRangePicker/DateRangePicker";
import { useProductosAll } from "@/hooks/productos/useProductosAll";
import useProductosVendidos from "@/hooks/productos/useProductosVendidos";
import type { Producto } from "@/types/productos";
import type { ProductoVentasDTO } from "@/types/productos";

const MAX_SELECT = 6;
const money = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
const toISO = (d: Date) => d.toISOString().slice(0, 10);

export default function ProductosExploracionPage() {
    const { items: catalogo, loading: loadingProd } = useProductosAll();

    const [selProds, setSelProds] = useState<Producto[]>([]);
    const [queryProd, setQueryProd] = useState("");

    const [range, setRange] = useState<DateRange | undefined>();
    const date_from = range?.from ? toISO(new Date(range.from)) : toISO(new Date());
    const date_to = range?.to ? toISO(new Date(range.to)) : date_from;

    const product_ids = useMemo(() => selProds.map(p => p.id), [selProds]);

    const { data, loading, error, reload } = useProductosVendidos({
        date_from, date_to, product_ids,
        enabled: false, // solo con botón
    });

    // top 6 por cantidad vendida
    const results = useMemo<ProductoVentasDTO[]>(
        () => (data ?? []).slice().sort((a, b) => b.cantidad_vendida - a.cantidad_vendida).slice(0, 6),
        [data]
    );

    function clearFilters() {
        setSelProds([]);
        setQueryProd("");
        setRange(undefined);
    }

    const textFieldSx = {
        mt: 0.25,
        "& .MuiOutlinedInput-root": {
            minHeight: 40,
            background: "var(--tg-card-bg)",
            color: "var(--tg-card-fg)",
            borderRadius: 10,
            alignItems: "center",
            paddingTop: 0.25,
            paddingBottom: 0.25,
        },
        "& .MuiOutlinedInput-notchedOutline": { borderColor: "var(--tg-border)" },
        "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": { borderColor: "var(--tg-border)" },
        "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "var(--tg-primary)" },
        "& .MuiSvgIcon-root": { color: "var(--tg-muted)" },
    } as const;

    const autoSlotProps = {
        paper: { sx: { bgcolor: "var(--tg-card-bg)", color: "var(--tg-card-fg)", border: "1px solid var(--tg-border)" } },
        listbox: {
            sx: {
                "& .MuiAutocomplete-option.Mui-focused, & .MuiAutocomplete-option[aria-selected='true']": {
                    bgcolor: "color-mix(in srgb, var(--tg-primary) 14%, transparent)",
                    color: "var(--tg-card-fg)",
                },
            },
        },
    } as const;

    return (
        <div className="app-shell__frame">
            <div className="bg-[var(--page-bg)] rounded-xl h-full flex flex-col px-4 md:px-5 pb-5 pt-4">
                <Typography variant="h5" sx={{ mb: 1.25, fontWeight: 700 }}>
                    Exploración de productos
                </Typography>

                {/* Controles */}
                <div className="flex items-end gap-3 flex-wrap">
                    {/* Productos */}
                    <div style={{ flex: 1.3, minWidth: 320, maxWidth: 520 }}>
                        <Typography variant="body2" sx={{ color: "var(--tg-muted)", fontWeight: 600, mb: 0.25 }}>
                            Productos ({selProds.length}/{MAX_SELECT})
                        </Typography>
                        <Autocomplete
                            size="small"
                            multiple
                            options={catalogo}
                            loading={loadingProd}
                            value={selProds}
                            inputValue={queryProd}
                            onInputChange={(_, val, reason) => setQueryProd(reason === "clear" ? "" : val)}
                            isOptionEqualToValue={(o, v) => o.id === v.id}
                            getOptionLabel={(o) => `${o.referencia} — ${o.descripcion}`}
                            filterSelectedOptions
                            limitTags={3}
                            onChange={(_, vals, reason) => {
                                if (reason === "selectOption" && (vals as Producto[]).length > MAX_SELECT) return;
                                setSelProds(vals as Producto[]);
                            }}
                            renderTags={(value: Producto[], getTagProps: AutocompleteRenderGetTagProps) =>
                                value.map((opt, index) => {
                                    const tagProps = getTagProps({ index });
                                    return (
                                        <Chip
                                            {...tagProps}
                                            key={opt.id}
                                            label={opt.referencia}
                                            size="small"
                                            sx={{
                                                height: 22,
                                                borderRadius: 6,
                                                bgcolor: "transparent",
                                                border: "1px solid var(--tg-border)",
                                                color: "var(--tg-card-fg)",
                                                "& .MuiChip-deleteIcon": { color: "var(--tg-muted)" },
                                            }}
                                        />
                                    );
                                })
                            }
                            renderOption={(props, option, { selected }) => {
                                const { key, ...liProps } = props as React.HTMLAttributes<HTMLLIElement> & { key: string };
                                return (
                                    <li key={key} {...liProps}>
                                        <Checkbox
                                            size="small"
                                            checked={selected}
                                            sx={{ mr: 1, color: "var(--tg-muted)", "&.Mui-checked": { color: "var(--tg-primary)" } }}
                                        />
                                        <ListItemText
                                            primary={`${option.referencia} — ${option.descripcion}`}
                                            slotProps={{ primary: { sx: { color: "var(--tg-card-fg)" } } }}
                                        />
                                    </li>
                                );
                            }}
                            slotProps={autoSlotProps}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    placeholder={selProds.length === 0 ? "Digite referencia o descripción…" : ""}
                                    sx={textFieldSx}
                                />
                            )}
                        />
                    </div>

                    {/* Rango */}
                    <div style={{ flex: 1, minWidth: 260, maxWidth: 360 }}>
                        <Typography variant="body2" sx={{ color: "var(--tg-muted)", fontWeight: 600, mb: 0.25 }}>
                            Rango de fechas
                        </Typography>
                        <DateRangePicker value={range} onChange={setRange} />
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-2" style={{ marginLeft: "auto" }}>
                        <span
                            role="button"
                            tabIndex={0}
                            onClick={clearFilters}
                            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && clearFilters()}
                            className="cursor-pointer text-sm text-tg-primary hover:underline select-none"
                            title="Limpiar filtros"
                            aria-label="Limpiar filtros"
                            style={{ lineHeight: "40px" }}
                        >
                            Limpiar filtros
                        </span>

                        <Button
                            variant="contained"
                            onClick={() => reload()}
                            sx={{
                                textTransform: "none",
                                bgcolor: "var(--tg-primary)",
                                color: "var(--tg-primary-fg)",
                                "&:hover": { bgcolor: "color-mix(in srgb, var(--tg-primary) 88%, black 12%)" },
                                height: 40,
                            }}
                        >
                            Buscar
                        </Button>
                    </div>
                </div>

                <div className="h-px w-full mt-3" style={{ background: "var(--tg-border)" }} />

                {error ? <div className="text-sm text-red-600 mt-3">{String(error)}</div> : null}

                {/* GRID Resultados: UNA sola columna, cards a lo ancho */}
                <div className="grid grid-cols-1 gap-4 mt-3">
                    {(loading && !data)
                        ? Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-[96px] rounded-xl border border-tg bg-[var(--tg-card-bg)]">
                                <div className="h-full animate-pulse bg-black/10 dark:bg-white/10 rounded-xl" />
                            </div>
                        ))
                        : results.map((item) => <ProductoCard key={item.id} item={item} />)}
                </div>

                {!loading && results.length === 0 && product_ids.length > 0 ? (
                    <div className="text-sm text-tg-muted border border-tg rounded-md p-4 mt-3">Sin resultados.</div>
                ) : null}
            </div>
        </div>
    );
}

function ProductoCard({ item }: { item: ProductoVentasDTO }) {
    const totalVendido = item.precio_venta * item.cantidad_vendida;
    return (
        <div className="rounded-xl border p-4"
            style={{ borderColor: "var(--tg-border)", background: "var(--tg-card-bg)" }}>
            <div className="grid gap-3 items-center
                      md:grid-cols-[1fr_140px_140px_150px_160px]">
                {/* info izquierda */}
                <div className="min-w-0">
                    <div className="font-semibold text-[var(--tg-card-fg)] truncate">{item.descripcion}</div>
                    <div className="text-sm" style={{ color: "var(--tg-muted)" }}>Ref: {item.referencia}</div>
                </div>

                {/* precio compra */}
                <div className="text-right">
                    <div className="text-sm" style={{ color: "var(--tg-muted)" }}>Precio compra</div>
                    <div className="font-medium">{money.format(item.precio_compra)}</div>
                </div>

                {/* precio venta */}
                <div className="text-right">
                    <div className="text-sm" style={{ color: "var(--tg-muted)" }}>Precio venta</div>
                    <div className="font-medium">{money.format(item.precio_venta)}</div>
                </div>

                {/* cantidad vendida */}
                <div className="text-right">
                    <div className="text-sm" style={{ color: "var(--tg-muted)" }}>Cantidad vendida</div>
                    <div className="font-semibold">{item.cantidad_vendida}</div>
                </div>

                {/* total vendido */}
                <div className="text-right">
                    <div className="text-sm" style={{ color: "var(--tg-muted)" }}>Total vendido</div>
                    <div className="font-semibold">{money.format(totalVendido)}</div>
                </div>
            </div>
        </div>
    );
}
