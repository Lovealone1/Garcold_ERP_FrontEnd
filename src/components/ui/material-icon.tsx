import React from 'react';

export type MaterialIconSet = 'rounded' | 'outlined' | 'sharp';

export function MaterialIcon({
  name,
  set = 'rounded',
  size = 20,
  fill = 0,
  weight = 400,
  grade = 0,
  className = '',
  title,
}: Readonly<{
  name: string;
  set?: MaterialIconSet;
  size?: number;
  fill?: 0 | 1;
  weight?: number; // 100..700
  grade?: number; // -25..200
  className?: string;
  title?: string;
}>) {
  const familyMap: Record<MaterialIconSet, string> = {
    rounded: 'Material Symbols Rounded',
    outlined: 'Material Symbols Outlined',
    sharp: 'Material Symbols Sharp',
  };
  const family = familyMap[set];

  return (
    <span
      aria-hidden={title ? undefined : true}
      title={title}
      className={className}
      style={{
        fontFamily: family,
        fontVariationSettings: `"FILL" ${fill}, "wght" ${weight}, "GRAD" ${grade}, "opsz" ${size}`,
        fontSize: size,
        lineHeight: 1,
        display: 'inline-flex',
        alignItems: 'center',
      }}
    >
      {name}
    </span>
  );
}
