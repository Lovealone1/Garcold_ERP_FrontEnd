"use client";

import { NotificationsProvider } from "@/components/providers/NotificationsProvider";
import { SettingsNav } from "@/features/settings/SettingsNav";
import { useMe } from "@/hooks/auth/useMe";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const { data } = useMe({ refreshOnFocus: true });
  const permissions: string[] = data?.permissions ?? [];

  return (
    <NotificationsProvider>
      {/*
        (settings) es un grupo de rutas hermano de (app): no pasa por AppShell,
        así que aquí no hay sidebar del que apartarse y `.app-shell__content`
        —que ahora reserva el riel de 64px en lg— no corresponde. Padding
        propio, y en móvil la nav pasa a apilarse encima en vez de robar ancho.
      */}
      <div
        className="flex min-h-dvh flex-col gap-4 py-4
                   pl-[max(0.75rem,env(safe-area-inset-left))]
                   pr-[max(0.75rem,env(safe-area-inset-right))]
                   md:flex-row md:gap-6 md:py-6
                   md:pl-[max(1.5rem,env(safe-area-inset-left))]
                   md:pr-[max(1.5rem,env(safe-area-inset-right))]"
      >
        <SettingsNav permissions={permissions} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </NotificationsProvider>
  );
}
