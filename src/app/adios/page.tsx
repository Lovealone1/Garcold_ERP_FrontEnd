"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { gsap } from "gsap";
import SplitText from "@/components/ui/SplitText";
import SoftFlaresBG from "@/components/ui/SoftFlaresBG";

function AdiosInner() {
    const r = useRouter();
    const q = useSearchParams();
    const next = q.get("next") || "/login";

    const pageRef = useRef<HTMLDivElement>(null);
    const textWrapRef = useRef<HTMLDivElement>(null);
    const logoRef = useRef<HTMLDivElement>(null);

    const [phase, setPhase] = useState<"text" | "logo">("text");
    const textDone = useRef(false);

    const onTextDone = () => {
        if (textDone.current) return;
        textDone.current = true;
        gsap.to(textWrapRef.current, { opacity: 0, duration: 0.35, ease: "power2.out" });
        setTimeout(() => setPhase("logo"), 120);
    };

    useEffect(() => {
        if (phase !== "logo") return;
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
            tl.set(logoRef.current, { opacity: 0, scale: 0.9, y: 20 })
                .to(logoRef.current, { opacity: 1, scale: 1.18, y: 0, duration: 1.0 })
                .to(logoRef.current, { scale: 1.28, duration: 0.5, ease: "power2.inOut" }, "+=0.25")
                .to(logoRef.current, { opacity: 0, duration: 0.6, ease: "power2.in" }, "+=0.15")
                .to(pageRef.current, { opacity: 0, duration: 0.45 })
                .add(() => r.replace(next));
        }, pageRef);
        return () => ctx.revert();
    }, [phase, r, next]);

    return (
        <div ref={pageRef} className="relative min-h-dvh w-full grid place-items-center bg-[var(--tg-bg)] text-[var(--tg-fg)] overflow-hidden">
            <SoftFlaresBG />

            <div ref={textWrapRef} style={{ display: phase === "text" ? "block" : "none" }} className="px-6">
                <SplitText
                    text="Hasta luego"
                    tag="h1"
                    className="font-extrabold leading-[0.98] text-center text-[clamp(64px,12vw,180px)] overflow-visible"
                    splitType="chars"
                    delay={0.085 * 1000}
                    duration={0.85}
                    ease="expo.out"
                    from={{ opacity: 0, y: 38 }}
                    to={{ opacity: 1, y: 0 }}
                    threshold={0}
                    rootMargin="200%"
                    textAlign="center"
                    onLetterAnimationComplete={onTextDone}
                />
            </div>

            <div ref={logoRef} style={{ display: phase === "logo" ? "block" : "none" }} className="select-none pointer-events-none">
                <Image src="/garcold.png" alt="Garcold" width={400} height={400} className="rounded-[28px]" priority />
            </div>
        </div>
    );
}

export default function Page() {
    return (
        <Suspense fallback={null}>
            <AdiosInner />
        </Suspense>
    );
}
