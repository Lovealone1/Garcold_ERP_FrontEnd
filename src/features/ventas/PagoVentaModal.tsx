"use client";

import { useEffect, useMemo, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import Grid from "@mui/material/Grid";
import { usePagosVenta } from "@/hooks/ventas/usePagosVenta";
import { useCreatePagoVenta } from "@/hooks/ventas/useCreatePagoVenta";
import { useDeletePagoVenta } from "@/hooks/ventas/useDeletePagoVenta";
import { listBanks } from "@/services/sales/bank.api";
import { getSaleById } from "@/services/sales/sale.api";
import type { Bank } from "@/types/bank";
import type { Sale } from "@/types/sale";
import { useNotifications } from "@/components/providers/NotificationsProvider";

const money = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

type Props = {
    open: boolean;
    onClose: () => void;
    venta: Sale | null;
    onPaid?: (ventaId: number) => void;
};

export default function PagoVentaModal({ open, onClose, venta, onPaid }: Props) {
    const ventaId = venta?.id ?? null;

    const [ventaInfo, setVentaInfo] = useState<Sale | null>(venta ?? null);
    useEffect(() => { setVentaInfo(venta ?? null); }, [venta, open]);

    const { items, loading, reload } = usePagosVenta(ventaId);
    const { create, loading: creating } = useCreatePagoVenta();
    const { remove, loading: deleting } = useDeletePagoVenta();
    const { success, error } = useNotifications();

    const [bancos, setBancos] = useState<Bank[]>([]);
    const [bancoId, setBancoId] = useState<number | "">("");
    const [monto, setMonto] = useState<string>("");

    useEffect(() => { (async () => { try { setBancos(await listBanks(Date.now())); } catch { setBancos([]); } })(); }, []);
    useEffect(() => { setBancoId(""); setMonto(""); }, [ventaId, open]);

    const estadoColor = useMemo(() => {
        if (!ventaInfo) return undefined;
        if (ventaInfo.remaining_balance > 0) return "bg-yellow-500/20 text-yellow-400";
        if (ventaInfo.status.toLowerCase().includes("contado") || ventaInfo.status.toLowerCase().includes("cancelada"))
            return "bg-emerald-500/20 text-emerald-400";
        return "bg-sky-500/20 text-sky-400";
    }, [ventaInfo]);

    async function refreshVenta() {
        if (!ventaId) return;
        try {
            const fresh = await getSaleById(ventaId, Date.now());
            setVentaInfo(fresh);
        } catch { }
    }

    async function handleAbonar() {
        if (ventaId == null) return;
        const num = Number(monto);
        if (!bancoId || !num || num <= 0) { error("Selecciona banco y un monto válido"); return; }
        try {
            await create({ sale_id: ventaId, bank_id: Number(bancoId), amount: num });
            success("Abono registrado");
            await reload();
            await refreshVenta();
            onPaid?.(ventaId);
            setMonto("");
            setBancoId("");
        } catch (e: any) {
            error(e?.response?.data?.detail ?? "No fue posible registrar el pago");
        }
    }

    async function handleDelete(pagoId: number) {
        if (!ventaId) return; // por seguridad

        try {
            await remove(pagoId, ventaId);
            success("Pago eliminado");
            await reload();
            await refreshVenta();
            onPaid?.(ventaId);
        } catch (e: any) {
            error(e?.response?.data?.detail ?? "No fue posible eliminar el pago");
        }
    }

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="md"
            slotProps={{ paper: { sx: { borderRadius: 2, border: "1px solid var(--panel-border)", bgcolor: "var(--tg-card-bg)", color: "var(--tg-card-fg)" } } }}
        >
            <DialogTitle sx={{ fontWeight: 600, pb: 1.5 }}>
                {ventaInfo ? `Pagos de la venta #${ventaInfo.id}` : "Pagos"}
            </DialogTitle>

            <DialogContent dividers sx={{ borderColor: "var(--panel-border)" }}>
                {ventaInfo && (
                    <div className="mb-4 rounded-lg border border-tg p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <div className="text-base font-semibold">{ventaInfo.customer}</div>
                                <div className="text-xs opacity-70">ID venta: {ventaInfo.id}</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${estadoColor}`}>
                                    {ventaInfo.remaining_balance > 0 ? "Venta crédito" : ventaInfo.status}
                                </span>
                                <span className="px-2 py-1 rounded bg-black/10 text-xs">
                                    Total: {money.format(ventaInfo.total)}
                                </span>
                                <span className="px-2 py-1 rounded bg-black/10 text-xs">
                                    Saldo: {money.format(ventaInfo.remaining_balance)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {ventaInfo?.remaining_balance ? (
                    <Stack gap={2} sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Registrar abono</Typography>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, md: 5 }}>
                                <select
                                    className="h-11 w-full rounded-md border border-tg bg-tg-card px-3 text-sm text-tg-card"
                                    value={bancoId}
                                    onChange={(e) => setBancoId((e.target.value ? Number(e.target.value) : "") as any)}
                                >
                                    <option value="">Selecciona banco</option>
                                    {bancos.map((b) => (<option key={b.id} value={b.id}>{b.name}</option>))}
                                </select>
                            </Grid>
                            <Grid size={{ xs: 12, md: 5 }}>
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    min={0}
                                    className="h-11 w-full rounded-md border border-tg bg-tg-card px-3 text-sm text-tg-card"
                                    placeholder="Monto a abonar"
                                    value={monto}
                                    onChange={(e) => setMonto(e.target.value)}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 2 }}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    disabled={creating}
                                    onClick={handleAbonar}
                                    sx={{ height: 44, textTransform: "none", bgcolor: "var(--tg-primary)", color: "var(--tg-primary-fg)", "&:hover": { bgcolor: "color-mix(in srgb, var(--tg-primary) 88%, black 12%)" } }}
                                >
                                    {creating ? "Guardando…" : "Abonar"}
                                </Button>
                            </Grid>
                        </Grid>
                    </Stack>
                ) : (
                    <Typography variant="body2" sx={{ mb: 2, opacity: 0.8 }}>Esta venta no tiene saldo pendiente.</Typography>
                )}

                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Historial de pagos</Typography>
                <div className="rounded-md border border-tg overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-[var(--table-head-bg)] text-[var(--table-head-fg)]">
                                <th className="px-3 py-2 text-left">Fecha</th>
                                <th className="px-3 py-2 text-left">Banco</th>
                                <th className="px-3 py-2 text-right">Monto</th>
                                <th className="px-3 py-2 text-center w-[64px]">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <tr key={i} className="border-t border-tg">
                                        {Array.from({ length: 4 }).map((__, j) => (
                                            <td key={j} className="px-3 py-2">
                                                <div className="h-4 w-full animate-pulse rounded bg-black/10 dark:bg-white/10" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : items.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-3 py-6 text-center text-tg-muted">Sin pagos registrados</td>
                                </tr>
                            ) : (
                                items.map((p) => (
                                    <tr key={p.id} className="border-t border-tg">
                                        <td className="px-3 py-2">{new Date(p.created_at).toLocaleString()}</td>
                                        <td className="px-3 py-2">{p.bank}</td>
                                        <td className="px-3 py-2 text-right">{money.format(p.amount_paid)}</td>
                                        <td className="px-2 py-1 text-center">
                                            <Tooltip title="Eliminar" arrow>
                                                <span>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleDelete(p.id)}
                                                        disabled={deleting}
                                                        sx={{ color: "var(--tg-primary)", borderRadius: "9999px", "&:hover": { backgroundColor: "color-mix(in srgb, var(--tg-primary) 22%, transparent)" } }}
                                                    >
                                                        <DeleteOutlineIcon fontSize="small" />
                                                    </IconButton>
                                                </span>
                                            </Tooltip>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose} sx={{ textTransform: "none", color: "var(--tg-muted)" }}>Cerrar</Button>
            </DialogActions>
        </Dialog>
    );
}
