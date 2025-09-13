// components/ui/Breadcrumbs.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

type Override = { label?: string; href?: string };
type Overrides = Record<string, Override>;

type Props = {
    className?: string;
    titleClassName?: string;
    showPageTitle?: boolean;         // default true
    homeLabel?: string;              // default "Inicio"
    overrides?: Overrides;           // { "ventas":{label:"Sales"} }
    basePath?: string;               // si tus rutas cuelgan de /app o similar
};

const titleize = (s: string) =>
    s.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());

export default function Breadcrumbs({
    className,
    titleClassName,
    showPageTitle = true,
    homeLabel = "Inicio",
    overrides = {},
    basePath = "",
}: Props) {
    const pathname = usePathname();
    const fullPath = basePath ? pathname.replace(basePath, "") : pathname;
    const segments = fullPath.split("/").filter(Boolean);

    // Título = último segmento
    const title = segments.length ? titleize(overrides[segments.at(-1)!]?.label ?? segments.at(-1)!) : homeLabel;

    return (
        <div className={clsx("w-full", className)}>
            {showPageTitle && (
                <h1 className={clsx("text-2xl font-bold tracking-tight", titleClassName)}>
                    {title}
                </h1>
            )}

            <nav aria-label="breadcrumbs" className="mt-1 text-sm text-muted-foreground">
                <ol className="flex items-center flex-wrap">
                    {/* Home */}
                    <li className="flex items-center">
                        <Link href="/" className="inline-flex items-center hover:underline">
                            <span className="material-symbols-outlined text-base mr-1">home</span>
                            {homeLabel}
                        </Link>
                    </li>

                    {/* Separador y segmentos */}
                    {segments.map((seg, idx) => {
                        const raw = seg;
                        const ov = overrides[raw];
                        const label = titleize(ov?.label ?? raw);
                        const href = "/" + segments.slice(0, idx + 1).join("/");

                        const isLast = idx === segments.length - 1;

                        return (
                            <li key={href} className="flex items-center">
                                <span className="mx-2 opacity-50 select-none">/</span>
                                {isLast ? (
                                    <span className="text-foreground">{label}</span>
                                ) : (
                                    <Link href={ov?.href ?? href} className="hover:underline">
                                        {label}
                                    </Link>
                                )}
                            </li>
                        );
                    })}
                </ol>
            </nav>
        </div>
    );
}
