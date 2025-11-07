"use client";

import { useCallback, useRef, useState } from "react";
import type { ProductDTO } from "@/types/product";
import { getProductByBarcode } from "@/services/sales/product.api";

type State = {
    loading: boolean;
    error: string | null;
    product: ProductDTO | null;
};

export function useProductByBarcode() {
    const [state, setState] = useState<State>({
        loading: false,
        error: null,
        product: null,
    });

    const abortRef = useRef<AbortController | null>(null);

    const lookup = useCallback(async (barcode: string) => {
        if (!barcode) return null;

        if (abortRef.current) {
            abortRef.current.abort();
        }
        const controller = new AbortController();
        abortRef.current = controller;

        setState((s) => ({ ...s, loading: true, error: null }));

        try {
            const product = await getProductByBarcode(barcode, {
                signal: controller.signal,
                nocacheToken: Date.now(), 
            });

            setState({
                loading: false,
                error: null,
                product, 
            });

            return product;
        } catch (err: any) {
            if (err.name === "CanceledError" || err.name === "AbortError") {
                return null;
            }

            setState({
                loading: false,
                error: "Error al buscar producto por código de barras",
                product: null,
            });
            throw err;
        }
    }, []);

    const reset = useCallback(() => {
        setState({ loading: false, error: null, product: null });
    }, []);

    return {
        ...state,
        lookup, 
        reset,
    };
}
