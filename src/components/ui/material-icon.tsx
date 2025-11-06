"use client";
import { useEffect, useState } from "react";

export type MaterialIconSet = "rounded" | "outlined" | "sharp";

export function MaterialIcon({
  name,
  set = "rounded",
  size = 20,
  fill = 0,
  weight = 400,
  grade = 0,
  className = "",
  title,
}: {
  name: string;
  set?: MaterialIconSet;
  size?: number;
  fill?: 0 | 1;
  weight?: number;
  grade?: number;
  className?: string;
  title?: string;
}) {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const familyMap: Record<MaterialIconSet, string> = {
    rounded: "Material Symbols Rounded",
    outlined: "Material Symbols Outlined",
    sharp: "Material Symbols Sharp",
  };
  const family = familyMap[set];

  return (
    <span
      aria-hidden={hydrated && title ? undefined : true}
      title={hydrated ? title : undefined}
      suppressHydrationWarning
      className={className}
      style={{
        fontFamily: family,
        fontVariationSettings: `"FILL" ${fill}, "wght" ${weight}, "GRAD" ${grade}, "opsz" ${size}`,
        fontSize: size,
        lineHeight: 1,
        display: "inline-flex",
        alignItems: "center",
      }}
    >
      {name}
    </span>
  );
}
