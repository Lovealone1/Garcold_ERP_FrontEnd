// components/sidebar/Header.tsx
"use client";

import Link from "next/link";
import Image from "next/image";

export default function SidebarHeader({
    expanded,
    basePath,
}: {
    expanded: boolean;
    basePath: string;
}) {
    const cardBg = "color-mix(in srgb, var(--tg-placeholder) 15%, var(--tg-card-bg))";
    const cardBorder = "color-mix(in srgb, var(--tg-fg) 8%, var(--tg-border))";
    const logoBg = "color-mix(in srgb, #000000 95%, transparent)";

    const BOX = expanded ? 40 : 38;
    const ICON = expanded ? 30 : 28;
    const PAD = expanded ? 8 : 6;
    const SQUARE = 52;

    return (
        <div className="px-1.5 pt-4 pb-3">
            {/* Card contenedor (conserva tus estilos) */}
            <div
                className={
                    expanded
                        ? "block w-full rounded-lg border px-3 py-2 transition-all duration-150"
                        : "inline-flex mx-auto rounded-xl border transition-all duration-150"
                }
                style={{
                    background: cardBg,
                    borderColor: cardBorder,
                    ...(expanded ? {} : { width: SQUARE, height: SQUARE, padding: PAD }),
                }}
            >
                <div
                    className={`flex items-center ${expanded ? "gap-3" : "justify-center w-full h-full"
                        }`}
                >
                    {/* Link solo sobre el logo+texto, no sobre los 3 puntos */}
                    {expanded ? (
                        <>
                            <Link href="/inicio" className="flex items-center gap-3 flex-1 min-w-0">
                                <span
                                    className="grid place-items-center rounded-md"
                                    style={{ width: BOX, height: BOX, background: logoBg }}
                                >
                                    <Image
                                        src={`${basePath}/garcold.png`}
                                        alt="Garcold"
                                        width={ICON}
                                        height={ICON}
                                        className="object-contain"
                                        priority
                                    />
                                </span>

                                <span className="text-lg font-extrabold tracking-tight truncate">
                                    Tienda Garcold
                                </span>
                            </Link>

                            {/* Tres puntos sin interacción */}
                            <span
                                aria-hidden
                                className="material-symbols-rounded text-[20px] text-tg-muted ml-1"
                            >
                                more_vert
                            </span>
                        </>
                    ) : (
                        <Link href="/inicio" className="grid place-items-center w-full h-full">
                            <span
                                className="grid place-items-center rounded-lg"
                                style={{ width: BOX, height: BOX, background: logoBg }}
                            >
                                <Image
                                    src={`${basePath}/garcold.png`}
                                    alt="Garcold"
                                    width={ICON}
                                    height={ICON}
                                    className="object-contain"
                                    priority
                                />
                            </span>
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
