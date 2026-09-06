"use client";

import { useMemo } from "react";
import KpiCard from "@/components/ui/KpiCard";
import BalanceKpi from "@/components/ui/BalanceKpi";
import HalfDonutKpi from "@/components/ui/HalfDonutKpi";
import VentasAreaChart from "@/components/charts/VentasAreaChart";
import { useFinalDashboard } from "@/hooks/reportes/useFinalDashboard";
import { monthCapEs, utilidadMesActual } from "@/utils/report-dates";
import { usePeriod } from "@/components/providers/PeriodProvider";
import { toDashboardMeta } from "@/lib/period/dashboardMeta";
import { todayInBogota } from "@/lib/period/period";
import type { RequestMetaDTO } from "@/types/reporte-general";
import TopProductosGrid from "@/components/tables/TopProductosGrid";
import CuentasCardsPanel from "@/components/tables/CuentasCardPanel";
import GastosLineChart from "@/components/charts/GastosLineChart";
const money = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export default function DashboardPage() {
  // The dashboard used to be pinned to `{ bucket: "year", year: <this year> }`,
  // so every figure on it reported the whole year with no way to ask for less.
  // It now follows the period chosen in the header.
  const { period } = usePeriod();
  const payload: RequestMetaDTO = useMemo(() => toDashboardMeta(period), [period]);
  const { data, loading } = useFinalDashboard(payload, { topLimit: 10 });

  // Ventas
  const ventasTotal = data?.sales.total_sales ?? 0;
  const ventasCredito = data?.sales.total_credit ?? 0;

  // Compras
  const comprasTotal = data?.purchases.total_purchases ?? 0;
  const comprasPorPagar = data?.purchases.total_payables ?? 0;

  // Utilidad
  const utilTotal = data?.profit.total_profit ?? 0;

  // "Utilidad <mes>" reads the current month out of a monthly series, so it
  // only means anything while the period on show is the current year. Pick a
  // month and the series turns daily; pick another year and the current month
  // is not in it -- either way it would quietly render $0 next to a real
  // total, which reads as "we made nothing this month" rather than "this
  // figure does not apply here".
  const today = todayInBogota();
  const showUtilMes =
    period.kind === "calendar" &&
    period.month === null &&
    period.year === today.year;
  const utilMes =
    showUtilMes && data?.profit ? utilidadMesActual(data.profit.series) : 0;
  const mesCap = monthCapEs();

  return (
    <div>
      {/* KPIs */}
      {/* Faltaba un escalón entre 640 y 1280: en toda esa franja —tablets y
          portátiles pequeños— los cinco KPI se quedaban en dos columnas y
          luego saltaban directos a cinco. */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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
          secondaryLabel={showUtilMes ? `Utilidad ${mesCap}` : undefined}
          secondaryValue={
            showUtilMes ? (loading ? "—" : money.format(utilMes)) : undefined
          }
          iconName="paid"
        />
        <BalanceKpi
          banks={(data?.banks?.banks ?? []).map(b => ({
            nombre: b.name,
            saldo: b.balance,
          }))}
          total={data?.banks?.total ?? 0}
        />
        <HalfDonutKpi
          creditos={data?.credits?.total ?? 0}
          inversiones={data?.investments?.total ?? 0}
        />
        <div className="hidden xl:block xl:col-span-3" />
      </div>

      {/* Fila: gráfica izquierda + CxC/CxP derecha */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 mt-1">
        {/* Izquierda: gráfica */}
        <div className="rounded-xl border border-tg bg-[var(--panel-bg)] p-4 xl:col-span-6">
          <h4 className="text-xm font-bold text-tg-primary">
            Histórico de ventas y utilidades
          </h4>
          {data?.sales?.series && data?.profit?.series && (
            <VentasAreaChart
              ventas={data.sales}
              utilidades={data.profit}
              height={320}
              widthPercent={100}
            />
          )}
        </div>

        {/* Derecha: tablas CxC / CxP */}
        <div className="xl:col-span-6">
          <CuentasCardsPanel
            accounts_receivable={data?.sales?.accounts_receivable ?? []}
            accounts_payable={data?.purchases?.accounts_payable ?? []}
            itemsBeforeScroll={5}
            gapPx={10}
          />

        </div>
      </div>

      {/* Top productos + gastos */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 mt-4">
        {data?.top_products?.length ? (
          <div className="rounded-xl border border-tg bg-[var(--panel-bg)] p-4 xl:col-span-6">
            <TopProductosGrid items={data.top_products} />
          </div>
        ) : null}
        <div className="rounded-xl border border-tg bg-[var(--panel-bg)] p-4 xl:col-span-6">
          <h4 className="text-xm font-bold text-tg-primary mb-2">
            Histórico de gastos
          </h4>
          {data?.expenses?.series && (
            // Si tu componente aún espera el shape viejo, crea un adapter antes.
            <GastosLineChart gastos={data.expenses} height={125} widthPercent={100} />
          )}
        </div>
      </div>
    </div>
  );
}
