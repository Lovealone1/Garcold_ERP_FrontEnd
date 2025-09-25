import { useCallback, useState } from "react";
import { createVenta } from "@/services/sales/ventas.api";
import { useNotifications } from "@/components/providers/NotificationsProvider";
import type { VentaCreate, Venta } from "@/types/ventas";

type Options = {
    onSuccess?: (venta: Venta) => void;
    onError?: (e: unknown) => void;
};

export function useCreateVenta(opts: Options = {}) {
    const { success, error: notifyError } = useNotifications();
    const [loading, setLoading] = useState(false);
    const [venta, setVenta] = useState<Venta | null>(null);
    const [error, setError] = useState<unknown>(null);

    const mutate = useCallback(async (payload: VentaCreate) => {
        setLoading(true);
        setError(null);
        try {
            const v = await createVenta(payload);
            setVenta(v);
            success("Venta creada correctamente");
            opts.onSuccess?.(v);
            return v;
        } catch (e: any) {
            const msg = e?.response?.data?.detail ?? "No fue posible crear la venta";
            setError(e);
            notifyError(msg);
            opts.onError?.(e);
            throw e;
        } finally {
            setLoading(false);
        }
    }, [notifyError, success, opts]);

    const reset = useCallback(() => {
        setVenta(null);
        setError(null);
        setLoading(false);
    }, []);

    return { create: mutate, loading, venta, error, reset };
}
