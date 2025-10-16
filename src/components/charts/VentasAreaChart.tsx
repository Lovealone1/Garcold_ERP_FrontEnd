// components/charts/VentasAreaChart.tsx
"use client";
import * as React from "react";
import { LineChart, lineElementClasses } from "@mui/x-charts/LineChart";
import type { SalesBlockDTO, ProfitBlockDTO } from "@/types/reporte-general";

type Props = {
    ventas: SalesBlockDTO;
    utilidades: ProfitBlockDTO;
    height?: number;
    compactLabels?: boolean;
    widthPercent?: number;
};

const money = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

const MES_CORTO = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const labelOf = (fecha: string, compact: boolean) => {
    if (!compact) return fecha;
    if (fecha.length === 7) { const [y, m] = fecha.split("-"); return `${MES_CORTO[(+m || 1) - 1]} ${y}`; }
    if (fecha.length === 10) return fecha.slice(5);
    return fecha;
};

export default function VentasAreaChart({
    ventas,
    utilidades,
    height = 170,
    compactLabels = true,
    widthPercent = 50,
}: Props) {
    const wrapRef = React.useRef<HTMLDivElement>(null);
    const [wrapW, setWrapW] = React.useState(0);

    React.useEffect(() => {
        const el = wrapRef.current;
        if (!el) return;
        const ro = new ResizeObserver(([entry]) => setWrapW(entry.contentRect.width));
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const labels = React.useMemo(
        () => ventas.series.series.map(p => labelOf(p.date, compactLabels)),
        [ventas.series.series, compactLabels],
    );
    const ventasData = React.useMemo(() => ventas.series.series.map(p => p.total ?? 0), [ventas.series.series]);
    const utilidadesData = React.useMemo(() => utilidades.series.series.map(p => p.profit ?? 0), [utilidades.series.series]);

    const maxY = Math.max(1, ...ventasData, ...utilidadesData);

    const pct = Math.min(100, Math.max(10, widthPercent));
    const widthPx = Math.max(360, Math.round((wrapW || 0) * (pct / 100)));

    const AXIS_TEXT = "var(--tg-muted)";
    const AXIS_LINE = "var(--tg-muted)";
    const GRID = "color-mix(in srgb, var(--tg-muted) 25%, transparent)";
    const LEGEND_FG = "var(--tg-fg)";

    return (
        <div ref={wrapRef} className="w-full">
            <LineChart
                width={widthPx}
                height={height}
                xAxis={[{
                    data: labels,
                    scaleType: "point",
                    tickLabelStyle: { fill: AXIS_TEXT, color: AXIS_TEXT, fontSize: 11 },
                }]}
                yAxis={[{
                    min: 0,
                    max: maxY * 1.1,
                    tickLabelStyle: { fill: AXIS_TEXT, color: AXIS_TEXT, fontSize: 11 },
                }]}
                grid={{ horizontal: true, vertical: false }}
                axisHighlight={{ x: "line", y: "none" }}
                margin={{ bottom: 15 }}
                slotProps={{
                    legend: { position: { vertical: "bottom", horizontal: "start" } },
                }}
                series={[
                    {
                        id: "ventas_total",
                        data: ventasData,
                        label: "Ventas",
                        area: true,
                        showMark: false,
                        color: "var(--tg-primary)",
                        valueFormatter: v => money.format(Number(v) || 0),
                    },
                    {
                        id: "utilidades_total",
                        data: utilidadesData,
                        label: "Utilidades",
                        area: true,
                        showMark: false,
                        color: "var(--tg-fg)",
                        valueFormatter: v => money.format(Number(v) || 0),
                    },
                ]}
                sx={{
                    // highlight
                    "& .MuiChartsAxisHighlight-root": {
                        stroke: "var(--tg-muted) !important",
                        strokeDasharray: "none !important",
                        strokeWidth: 1,
                    },
                    // ejes
                    "& .MuiChartsAxis-tickLabel": { fill: `${AXIS_TEXT} !important`, color: `${AXIS_TEXT} !important` },
                    "& .MuiChartsAxis-label": { fill: `${AXIS_TEXT} !important`, color: `${AXIS_TEXT} !important` },
                    "& .MuiChartsAxis-line": { stroke: `${AXIS_LINE} !important` },
                    "& .MuiChartsAxis-tick": { stroke: `${AXIS_LINE} !important` },
                    // grilla
                    "& .MuiChartsGrid-line": { stroke: GRID },
                    // línea de serie
                    [`& .${lineElementClasses.root}`]: { strokeWidth: 2 },
                    // leyenda
                    "& .MuiChartsLegend-root": { alignItems: "flex-end" },
                    "& .MuiChartsLegend-label": { color: LEGEND_FG },
                    "& .MuiChartsLegend-mark": { width: 8, height: 9, borderRadius: 1 },
                    "& .MuiChartsLegend-series": { gap: 1 },
                }}
            />
        </div>
    );
}
