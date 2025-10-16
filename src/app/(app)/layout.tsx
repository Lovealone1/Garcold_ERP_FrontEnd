import { redirect } from "next/navigation";
import AppShell from "@/components/layout/appshell";
import { supabaseServer } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return <AppShell>{children}</AppShell>;
}
