"use client";
import { useEffect, useState, useCallback } from "react";
import { getProveedorById } from "@/services/sales/proveedores.api";
import type { Proveedor } from "@/types/proveedores";

export function useProveedor(proveedorId: number | null) {
  const [proveedor, setProveedor] = useState<Proveedor | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIt = useCallback(async () => {
    if (!proveedorId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getProveedorById(proveedorId);
      setProveedor(data);
    } catch (e: any) {
      setError(e?.message ?? "Error al cargar proveedor");
    } finally {
      setLoading(false);
    }
  }, [proveedorId]);

  useEffect(() => { fetchIt(); }, [fetchIt]);

  return { proveedor, loading, error, refetch: fetchIt };
}
