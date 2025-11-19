"use client";

import { useCallback, useRef, useState } from "react";
import { getProductByBarcode } from "@/services/sales/product.api";
import type { ProductDTO } from "@/types/product";

type State = {
    product: ProductDTO | null;
    loading: boolean;
    error: string | null;
};

export function useProductByBarcode() {
    const [state, setState] = useState<State>({
        product: null,
        loading: false,
        error: null,
    });

    const cacheRef = useRef<Map<string, ProductDTO | null>>(
        new Map()
    );

    const abortRef = useRef<AbortController | null>(null);

    const lookup = useCallback(async (rawBarcode: string) => {
        const barcode = rawBarcode.trim();
        if (!barcode) {
            setState((prev) => ({ ...prev, product: null, error: null }));
            return null;
        }

        if (cacheRef.current.has(barcode)) {
            const cached = cacheRef.current.get(barcode) ?? null;
            setState((prev) => ({
                ...prev,
                product: cached,
                loading: false,
                error: null,
            }));
            return cached;
        }

        if (abortRef.current) {
            abortRef.current.abort();
        }
        const ac = new AbortController();
        abortRef.current = ac;

        setState((prev) => ({
            ...prev,
            loading: true,
            error: null,
        }));

        try {
            const product = await getProductByBarcode(barcode, {
                signal: ac.signal,
            });

            cacheRef.current.set(barcode, product ?? null);

            setState((prev) => ({
                ...prev,
                product: product ?? null,
                loading: false,
                error: null,
            }));

            return product ?? null;
        } catch (err: any) {
            if (ac.signal.aborted) {
                return null;
            }

            setState((prev) => ({
                ...prev,
                loading: false,
                error:
                    err?.message ??
                    "No fue posible consultar el producto por código de barras",
            }));
            throw err;
        }
    }, []);

    const reset = useCallback(() => {
        setState({ product: null, loading: false, error: null });
    }, []);

    return {
        product: state.product,
        loading: state.loading,
        error: state.error,
        lookup, 
        reset,
    };
}
