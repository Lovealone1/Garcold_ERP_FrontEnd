// components/providers/MeContext.tsx
"use client";
import { createContext, useContext } from "react";
import type { MeDTO } from "@/types/auth";

/**
 * MeDTO debería incluir al menos:
 * - user_id: string
 * - email: string
 * - display_name: string
 * - role: string            // código del rol
 * - permissions: string[]   // códigos activos
 * - role_id?: number        // opcional si el backend lo expone
 */

export type MeState = {
    me: MeDTO | null;
    loading: boolean;
    refresh?: () => Promise<void>;
};

export const MeContext = createContext<MeState>({ me: null, loading: true });

export function useMeContext(): MeState {
    const ctx = useContext(MeContext);
    if (!ctx) throw new Error("MeContext.Provider missing");
    return ctx;
}
