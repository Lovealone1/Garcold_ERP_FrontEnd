"use client";

import { useCallback, useState } from "react";
import type { Bank } from "@/types/bank";
import type { BankCreate } from "@/types/bank"; 
import { createBank } from "@/services/sales/bank.api";

type Options = {
    onSuccess?: (bank: Bank) => void;
    onError?: (err: unknown) => void;
    onSettled?: () => void;
};

export function useCreateBank(options: Options = {}) {
    const { onSuccess, onError, onSettled } = options;
    const [loading, setLoading] = useState(false);

    const create = useCallback(async (payload: BankCreate): Promise<Bank> => {
        setLoading(true);
        try {
            const bank = await createBank(payload);
            onSuccess?.(bank);
            return bank;
        } catch (err) {
            onError?.(err);
            throw err;
        } finally {
            setLoading(false);
            onSettled?.();
        }
    }, [onSuccess, onError, onSettled]);

    return { create, loading };
}
