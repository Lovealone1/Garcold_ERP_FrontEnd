// components/providers/ClientAppProviders.tsx
"use client";
import { MeContext, type MeState } from "@/components/providers/MeContext";
import { PermissionProvider } from "./PermissionProvider";
import type { MeDTO } from "@/types/auth";

export default function ClientAppProviders({
    me,
    children,
}: { me: MeDTO | null; children: React.ReactNode }) {
    const meState: MeState = { me, loading: false };
    return (
        <MeContext.Provider value={meState}>
            <PermissionProvider me={me}>{children}</PermissionProvider>
        </MeContext.Provider>
    );
}
