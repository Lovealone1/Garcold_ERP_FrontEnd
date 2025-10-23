// components/providers/PermissionsContext.tsx
"use client";
import { createContext, useContext } from "react";

export type PermissionsState = {
    ready: boolean;           // me + rol cargados
    list: string[];           // permisos efectivos
    has: (code: string) => boolean;
    reload: () => void;       // refetch me y permisos por rol
};

export const PermissionsContext = createContext<PermissionsState>({
    ready: false,
    list: [],
    has: () => false,
    reload: async () => { },
});

export function usePermissions(): PermissionsState {
    const ctx = useContext(PermissionsContext);
    if (!ctx) throw new Error("PermissionsContext.Provider missing");
    return ctx;
}
