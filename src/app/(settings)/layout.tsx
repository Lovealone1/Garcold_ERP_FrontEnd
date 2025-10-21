"use client";
import { SettingsNav } from "@/features/settings/SettingsNav";
import { useMe } from "@/hooks/auth/useMe";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const { data } = useMe({ refreshOnFocus: true });
  const permissions: string[] = data?.permissions ?? [];

  return (
    <div className="app-shell__content flex gap-6 mt-4 md:mt-6">
      <SettingsNav permissions={permissions} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
