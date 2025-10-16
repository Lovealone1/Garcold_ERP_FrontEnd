// components/charts/GastosLineChart.tsx
"use client";
import * as React from "react";
import { LineChart, lineElementClasses } from "@mui/x-charts/LineChart";
import type { GastosBloqueDTO } from "@/types/reporte-general";

type Props = {
    gastos: GastosBloqueDTO;
    height?: number;
    widthPercent?: number;   // 10..100
    compactLabels?: boolean; // default true
};

const MES_CORTO = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const labelOf = (fecha: string, compact: boolean) => {
    if (!compact) return fecha;
    if (fecha.length === 7) { const [y, m] = fecha.split("-"); return `${MES_CORTO[(+m || 1) - 1]} ${y}`; }
    if (fecha.length === 10) return fecha.slice(5);
    return fecha;
};

export default function GastosLineChart({
    gastos,
    height = 140,             // <-- más acotado
    widthPercent = 100,
    compactLabels = true,
}: Props) {
    const wrapRef = React.useRef<HTMLDivElement>(null);
    const [wrapW, setWrapW] = React.useState(0);

    React.useEffect(() => {
        const el = wrapRef.current; if (!el) return;
        const ro = new ResizeObserver(([e]) => setWrapW(e.contentRect.width));
        ro.observe(el); return () => ro.disconnect();
    }, []);

    const labels = React.useMemo(
        () => gastos.series.series.map(p => labelOf(p.fecha, compactLabels)),
        [gastos.series.series, compactLabels]
    );
    const valores = React.useMemo(
        () => gastos.series.series.map(p => p.monto ?? 0),
        [gastos.series.series]
    );

    const maxY = Math.max(1, ...valores);
    const pct = Math.min(100, Math.max(10, widthPercent));
    const widthPx = Math.max(320, Math.round((wrapW || 0) * (pct / 100)));

    const AXIS = "var(--tg-muted)";
    const GRID = "color-mix(in srgb, var(--tg-muted) 25%, transparent)";

    return (
        <div ref={wrapRef} className="w-full">
            <LineChart
                width={widthPx}
                height={height}
                margin={{ top: 6, right: 8, bottom: 18, left: 1 }}  // compacta
                xAxis={[{
                    data: labels,
                    scaleType: "point",
                    tickLabelStyle: { fill: AXIS, color: AXIS, fontSize: 10 },
                }]}
                yAxis={[{
                    min: 0,
                    max: maxY * 1.1,
                    tickLabelStyle: { fill: AXIS, color: AXIS, fontSize: 10 },
                }]}
                grid={{ horizontal: true, vertical: false }}
                axisHighlight={{ x: "none", y: "none" }}
                series={[{
                    id: "gastos_total",
                    data: valores,
                    color: "var(--tg-primary)",    // <-- color visible
                    curve: "monotoneX",
                    showMark: false,               // sin puntos
                }]}
                sx={{
                    "& .MuiChartsAxis-tickLabel": { fill: `${AXIS} !important`, color: `${AXIS} !important` },
                    "& .MuiChartsAxis-line": { stroke: `${AXIS} !important` },
                    "& .MuiChartsAxis-tick": { stroke: `${AXIS} !important` },
                    "& .MuiChartsGrid-line": { stroke: GRID },
                    [`& .${lineElementClasses.root}`]: { strokeWidth: 2 },
                }}
            />
        </div>
    );
}
