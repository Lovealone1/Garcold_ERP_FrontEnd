"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function RouteMemory() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname) return;
    if (!pathname.startsWith("/settings")) {
      sessionStorage.setItem("tg:lastRoute", window.location.href);
    }
  }, [pathname]);
  return null;
}