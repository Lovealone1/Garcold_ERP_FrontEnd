// app/(dashboard)/dashboard/page.tsx
"use client";

import KpiCard from "@/components/ui/KpiCard";
import BalanceKpi from "@/components/ui/BalanceKpi";
import HalfDonutKpi from "@/components/ui/HalfDonutKpi";
import VentasAreaChart from "@/components/charts/VentasAreaChart";
import { useReporteGeneral } from "@/hooks/reportes/useReporteGeneral";
import { monthCapEs, utilidadMesActual } from "@/utils/report-dates";
import type { SolicitudMetaDTO } from "@/types/reporte-general";
import TopProductosGrid from "@/components/tables/TopProductosGrid";
import CuentasCardsPanel from "@/components/tables/CuentasCardPanel";
import GastosLineChart from "@/components/charts/GastosLineChart";

const money = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
});

export default function DashboardPage() {
    const payload: SolicitudMetaDTO = { bucket: "year", year: 2025 };
    const { data, loading } = useReporteGeneral(payload);

    const ventasTotal = data?.ventas.total_ventas ?? 0;
    const ventasCredito = data?.ventas.total_creditos ?? 0;

    const comprasTotal = data?.compras.total_compras ?? 0;
    const comprasPorPagar = data?.compras.total_por_pagar ?? 0;

    const utilTotal = data?.utilidad.total_utilidad ?? 0;
    const utilMes = data?.utilidad ? utilidadMesActual(data.utilidad.series) : 0;
    const mesCap = monthCapEs();

    return (
        <div>
            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
                <KpiCard
                    title="Ventas"
                    value={loading ? "—" : money.format(ventasTotal)}
                    caption="Total de ventas"
                    secondaryLabel="Ventas a crédito"
                    secondaryValue={loading ? "—" : money.format(ventasCredito)}
                    iconName="point_of_sale"
                />
                <KpiCard
                    title="Compras"
                    value={loading ? "—" : money.format(comprasTotal)}
                    caption="Total de compras"
                    secondaryLabel="Por pagar"
                    secondaryValue={loading ? "—" : money.format(comprasPorPagar)}
                    iconName="shopping_cart"
                />
                <KpiCard
                    title="Utilidades"
                    value={loading ? "—" : money.format(utilTotal)}
                    caption="Total de utilidades"
                    secondaryLabel={`Utilidad ${mesCap}`}
                    secondaryValue={loading ? "—" : money.format(utilMes)}
                    iconName="paid"
                />
                <BalanceKpi banks={data?.bancos?.bancos ?? []} total={data?.bancos?.total ?? 0} />
                <HalfDonutKpi creditos={data?.creditos?.total ?? 0} inversiones={data?.inversiones?.total ?? 0} />
                <div className="hidden xl:block xl:col-span-3" />
            </div>

            {/* Fila: gráfica izquierda + CxC/CxP derecha */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 mt-1">
                {/* Izquierda: gráfica */}
                <div className="rounded-xl border border-tg bg-[var(--panel-bg)] p-4 xl:col-span-6">
                    <h4 className="text-xm font-bold text-tg-primary">Histórico de ventas y utilidades</h4>
                    {data?.ventas?.series && data?.utilidad?.series && (
                        <VentasAreaChart
                            ventas={data.ventas}
                            utilidades={data.utilidad}
                            height={320}
                            widthPercent={100}
                        />
                    )}
                </div>

                {/* Derecha: tablas CxC / CxP */}
                <div className="xl:col-span-6">
                    <CuentasCardsPanel
                        cxc={data?.ventas?.cuentas_por_cobrar ?? []}
                        cxp={data?.compras?.cuentas_por_pagar ?? []}
                        itemsBeforeScroll={5} // scroll desde el 4.º
                        gapPx={10}            // tu space-y-2
                    />
                </div>
            </div>

            {/* Top productos */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 mt-4">
                {data?.top_productos?.length ? (
                    <div className="rounded-xl border border-tg bg-[var(--panel-bg)] p-4 xl:col-span-6">
                        <TopProductosGrid items={data.top_productos} />
                    </div>
                ) : null}
                <div className="rounded-xl border border-tg bg-[var(--panel-bg)] p-4 xl:col-span-6">
                    <h4 className="text-xm font-bold text-tg-primary mb-2">Histórico de gastos</h4>
                    {data?.gastos?.series && (
                        <GastosLineChart gastos={data.gastos} height={125} widthPercent={100} />
                    )}
                </div>
            </div>
        </div>
    );
}
