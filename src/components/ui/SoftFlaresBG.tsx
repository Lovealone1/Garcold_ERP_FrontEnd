"use client";

export default function SoftFlaresBG() {
    return (
        <>
            {/* flare verde grande arriba-izquierda */}
            <div
                aria-hidden
                className="pointer-events-none absolute -top-32 -left-32 h-[42rem] w-[42rem] rounded-full
                   bg-[radial-gradient(closest-side,rgba(34,197,94,.20),transparent)] blur-3xl"
            />
            {/* flare azul grande abajo-derecha */}
            <div
                aria-hidden
                className="pointer-events-none absolute -bottom-32 -right-10 h-[48rem] w-[48rem] rounded-full
                   bg-[radial-gradient(closest-side,rgba(59,130,246,.16),transparent)] blur-[100px]"
            />
            {/* flare esmeralda suave centro-izq */}
            <div
                aria-hidden
                className="pointer-events-none absolute top-1/3 -left-20 h-[28rem] w-[28rem] rounded-full
                   bg-[radial-gradient(closest-side,rgba(16,185,129,.14),transparent)] blur-[80px]"
            />
            {/* halo sutil superior */}
            <div
                aria-hidden
                className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 h-[36rem] w-[60rem] rounded-full
                   bg-[radial-gradient(closest-side,rgba(255,255,255,.06),transparent)] blur-[120px] opacity-60"
            />
            {/* viñeta */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0
                   bg-[radial-gradient(120%_100%_at_80%_0%,rgba(0,0,0,.28),transparent)]"
            />
        </>
    );
}
