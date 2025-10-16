"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";

import GoogleIcon from "@mui/icons-material/Google";
import InstagramIcon from "@mui/icons-material/Instagram";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

import { supabase } from "@/lib/supabase/client";

const inputSx = {
    "& .MuiOutlinedInput-root": {
        height: 44,
        background: "var(--tg-card-bg)",
        color: "var(--tg-card-fg)",
        borderRadius: 12,
        "& fieldset": { borderColor: "var(--tg-border)" },
        "&:hover fieldset": { borderColor: "var(--tg-border)" },
        "&.Mui-focused fieldset": { borderColor: "var(--tg-primary)" },
    },
    "& .MuiInputBase-input::placeholder": { color: "var(--tg-muted)", opacity: 1 },
} as const;

const checkboxSx = {
    color: "var(--tg-muted)",
    "&.Mui-checked": { color: "var(--tg-primary)" },
} as const;

const LAST_EMAIL_KEY = "auth:last_email";

export default function LoginPage() {
    const r = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPwd] = useState("");
    const [showPwd, setShowPwd] = useState(false);
    const [remember, setRemember] = useState(true);
    const [loading, setL] = useState(false);
    const [error, setE] = useState("");

    // Prefill del último email
    useEffect(() => {
        try {
            const cached = localStorage.getItem(LAST_EMAIL_KEY);
            if (cached) setEmail(cached);
        } catch { }
    }, []);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setE("");
        setL(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;

            // Cachea email si "Recordarme" está activo
            try {
                if (remember) localStorage.setItem(LAST_EMAIL_KEY, email);
                else localStorage.removeItem(LAST_EMAIL_KEY);
            } catch { }

            if (data.session) r.replace("/bienvenido?next=/inicio");
            else throw new Error("No se pudo iniciar sesión");
        } catch (err: any) {
            setE(err?.message || "Usuario o contraseña incorrectos");
        } finally {
            setL(false);
        }
    }

    async function signInGoogle() {
        const origin = window.location.origin;
        await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: `${origin}/auth/callback?next=/inicio` },
        });
    }

    return (
        <div
            className="min-h-screen w-full bg-[var(--tg-bg)] text-[var(--tg-fg)] relative flex items-center justify-center"
            style={{ overflow: "hidden" }}
        >
            {/* Logo */}
            <header className="absolute left-4 top-4 md:left-6 md:top-6 z-20 flex items-center gap-3">
                <Image src="/garcold.png" alt="Tienda Garcold" width={28} height={28} className="rounded" />
                <span className="text-lg md:text-xl font-semibold">Tienda Garcold</span>
            </header>

            {/* BGs */}
            <div aria-hidden className="pointer-events-none absolute -top-24 -left-24 h-[38rem] w-[38rem] rounded-full bg-[radial-gradient(closest-side,rgba(34,197,94,.15),transparent)] blur-3xl" />
            <div aria-hidden className="pointer-events-none absolute -bottom-32 right-0 h-[42rem] w-[42rem] rounded-full bg-[radial-gradient(closest-side,rgba(59,130,246,.12),transparent)] blur-[90px]" />
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_100%_at_80%_0%,rgba(0,0,0,.22),transparent)]" />

            <div className="mx-auto max-w-6xl px-4 py-12 md:py-14">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* LEFT: Login */}
                    <div className="relative overflow-hidden rounded-2xl py-4 border" style={{ borderColor: "var(--tg-border)", background: "var(--tg-card-bg)" }}>
                        <div aria-hidden className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[radial-gradient(closest-side,rgba(34,197,94,.22),transparent)] blur-3xl" />
                        <div aria-hidden className="pointer-events-none absolute -bottom-16 -right-10 h-56 w-56 rounded-full bg-[radial-gradient(closest-side,rgba(59,130,246,.14),transparent)] blur-2xl" />

                        <div className="p-9 md:p-7">
                            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-4">Inicia sesión</h1>

                            <form onSubmit={onSubmit} className="space-y-3">
                                <TextField
                                    fullWidth
                                    size="small"
                                    placeholder="E-mail"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    sx={inputSx}
                                />

                                <TextField
                                    fullWidth
                                    size="small"
                                    type={showPwd ? "text" : "password"}
                                    placeholder="Contraseña"
                                    value={password}
                                    onChange={(e) => setPwd(e.target.value)}
                                    sx={inputSx}
                                    slotProps={{
                                        input: {
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
                                                        onClick={() => setShowPwd((v) => !v)}
                                                        edge="end"
                                                        size="small"
                                                        tabIndex={-1}
                                                        sx={{ color: "var(--tg-fg)" }}   // ← color del icono
                                                    >
                                                        {showPwd ? <VisibilityOff /> : <Visibility />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        },
                                    }}
                                />


                                <div className="flex items-center justify-between">
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                size="small"
                                                checked={remember}
                                                onChange={(e) => setRemember(e.target.checked)}
                                                sx={checkboxSx}
                                            />
                                        }
                                        label={<span className="text-sm" style={{ color: "var(--tg-card-fg)" }}>Recordarme</span>}
                                    />
                                    <Link href="/recuperar" className="text-sm hover:underline" style={{ color: "var(--tg-muted)" }}>
                                        ¿Olvidaste tu contraseña?
                                    </Link>
                                </div>

                                {error ? <div className="text-sm text-red-500">{error}</div> : null}

                                <Button
                                    type="submit"
                                    fullWidth
                                    disabled={loading}
                                    variant="contained"
                                    sx={{
                                        mt: 0.5,
                                        height: 46,
                                        textTransform: "none",
                                        bgcolor: "var(--tg-primary)",
                                        color: "var(--tg-primary-fg)",
                                        borderRadius: 12,
                                        "&:hover": { bgcolor: "color-mix(in srgb, var(--tg-primary) 88%, black 12%)" },
                                    }}
                                >
                                    {loading ? "Ingresando…" : "Iniciar sesión"}
                                </Button>

                                <div className="flex items-center gap-3 my-1.5">
                                    <Divider sx={{ flex: 1, borderColor: "var(--tg-border)" }} />
                                    <span className="text-xs" style={{ color: "var(--tg-muted)" }}>o</span>
                                    <Divider sx={{ flex: 1, borderColor: "var(--tg-border)" }} />
                                </div>

                                <Button
                                    onClick={signInGoogle}
                                    fullWidth
                                    variant="outlined"
                                    startIcon={<GoogleIcon />}
                                    sx={{
                                        height: 44,
                                        textTransform: "none",
                                        color: "var(--tg-card-fg)",
                                        borderColor: "var(--tg-border)",
                                        borderRadius: 12,
                                        bgcolor: "var(--tg-card-bg)",
                                        "&:hover": { borderColor: "var(--tg-primary)" },
                                    }}
                                >
                                    Continuar con Google
                                </Button>
                            </form>
                        </div>
                    </div>

                    {/* RIGHT */}
                    <div
                        className="hidden lg:block relative overflow-hidden rounded-2xl border p-6 md:p-7"
                        style={{ borderColor: "var(--tg-border)", background: "var(--tg-card-bg)" }}
                    >
                        <div aria-hidden className="pointer-events-none absolute -top-10 right-0 h-72 w-72 rounded-full bg-[radial-gradient(closest-side,rgba(34,197,94,.28),transparent)] blur-3xl" />
                        <div aria-hidden className="pointer-events-none absolute bottom-0 left-10 h-80 w-80 rounded-full bg-[radial-gradient(closest-side,rgba(0,212,113,.12),transparent)] blur-[60px]" />

                        <div className="mb-4 flex items-center gap-2 justify-end relative z-10">
                            <a href="https://wa.me/573001112233" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm" style={{ borderColor: "var(--tg-border)", background: "rgba(0,0,0,.08)" }} title="WhatsApp">
                                <WhatsAppIcon fontSize="small" /> WhatsApp
                            </a>
                            <a href="https://instagram.com/tu_cuenta" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm" style={{ borderColor: "var(--tg-border)", background: "rgba(0,0,0,.08)" }} title="Instagram">
                                <InstagramIcon fontSize="small" /> Instagram
                            </a>
                        </div>

                        <div className="rounded-xl border p-4 mb-6" style={{ borderColor: "var(--tg-border)", background: "linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02))" }}>
                            <div className="text-lg font-semibold mb-2">Acelera tu ERP</div>
                            <p className="text-sm mb-3" style={{ color: "var(--tg-muted)" }}>
                                Controla ventas, compras e inventario sin fricción. Factura en segundos y concilia pagos con precisión.
                            </p>
                            <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 mb-2" style={{ borderColor: "var(--tg-border)", background: "rgba(0,0,0,.06)" }}>
                                <div>
                                    <div className="text-xs" style={{ color: "var(--tg-muted)" }}>Ventas hoy</div>
                                    <div className="font-semibold">$ 350.400</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs" style={{ color: "var(--tg-muted)" }}>Órdenes</div>
                                    <div className="font-semibold">24</div>
                                </div>
                            </div>
                            <Button
                                size="small"
                                variant="outlined"
                                sx={{
                                    textTransform: "none",
                                    color: "var(--tg-card-fg)",
                                    borderColor: "var(--tg-border)",
                                    "&:hover": { borderColor: "var(--tg-primary)" },
                                    borderRadius: 999,
                                    px: 2.2,
                                    py: 0.3,
                                }}
                            >
                                Conocer más
                            </Button>
                        </div>

                        <h2 className="text-xl font-extrabold mb-2">Lanzamientos</h2>
                        <p className="text-sm" style={{ color: "var(--tg-muted)" }}>
                            Nuevo cierre diario, reglas de precios y paneles de análisis. Decisiones correctas basadas en datos en tiempo real.
                        </p>

                        <div className="mt-4 flex gap-2 text-[8px]" style={{ color: "var(--tg-muted)" }}>
                            <span>●</span><span>●</span><span>●</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
