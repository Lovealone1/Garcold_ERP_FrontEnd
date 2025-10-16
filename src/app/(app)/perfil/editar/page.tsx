// app/perfil/editar/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import {
    loadProfile,
    saveProfile as saveProfileAPI,
    uploadAvatar as uploadAvatarAPI,
    verifyPassword as verifyPasswordAPI,
    updatePassword as updatePasswordAPI,
} from "@/services/profile.api";
import PhoneInput, { isValidPhoneNumber, getCountryCallingCode } from "react-phone-number-input";
import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";

/* ====================== utils ====================== */
const DEFAULT_COUNTRY: CountryCode = "CO";

function normalizePhone(raw?: string | null, defaultCountry: CountryCode = DEFAULT_COUNTRY) {
    if (!raw) return "";
    const r = raw.trim();
    try {
        const parsed = parsePhoneNumberFromString(r, { defaultCountry });
        return parsed?.number ?? r.replace(/[^\d+]/g, "");
    } catch {
        return r.replace(/[^\d+]/g, "");
    }
}

/* ========== Password input reutilizable ========== */
function PasswordField({
    label,
    value,
    onChange,
    show,
    setShow,
    placeholder = "********",
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    show: boolean;
    setShow: (v: boolean) => void;
    placeholder?: string;
}) {
    return (
        <div>
            <label className="block text-xs mb-1" style={{ color: "var(--tg-muted)" }}>
                {label}
            </label>

            <div className="relative">
                <input
                    type={show ? "text" : "password"}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 pr-10 text-sm"
                    style={{
                        borderColor: "var(--tg-border)",
                        background: "var(--tg-input-bg, transparent)",
                        color: "var(--tg-fg)",
                    }}
                    placeholder={placeholder}
                />

                <button
                    type="button"
                    onClick={() => setShow(!show)}
                    aria-label="Mostrar u ocultar"
                    className="absolute inset-y-0 right-2 h-full w-6 grid place-items-center rounded focus:outline-none"
                    style={{ color: "var(--tg-muted)" }}
                >
                    <span className="material-symbols-rounded block" style={{ fontSize: 16, lineHeight: 1 }}>
                        {show ? "visibility_off" : "visibility"}
                    </span>
                </button>
            </div>
        </div>
    );
}

/* ========== Compact themable country selector ========= */
function CountrySelect(props: any) {
    const { value, onChange, options, disabled, iconComponent: Icon } = props;
    const [open, setOpen] = useState(false);
    const [q, setQ] = useState("");
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const onDown = (e: MouseEvent) => {
            if (!ref.current || ref.current.contains(e.target as Node)) return;
            setOpen(false);
        };
        window.addEventListener("pointerdown", onDown);
        return () => window.removeEventListener("pointerdown", onDown);
    }, []);

    const filtered = q
        ? options.filter((o: any) => {
            const label = String(o.label ?? "").toLowerCase();
            const cc = String(getCountryCallingCode(o.value as CountryCode));
            const qq = q.toLowerCase().trim();
            return label.includes(qq) || cc.includes(q.replace(/\D/g, ""));
        })
        : options;

    return (
        <div ref={ref} className="tg-country relative" data-open={open ? "true" : "false"}>
            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen((v) => !v)}
                className="tg-country-btn"
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                {Icon && value ? <Icon country={value} /> : <span className="tg-flag-fallback" />}
                <span className="material-symbols-rounded text-[14px]" style={{ color: "var(--tg-muted)" }}>
                    expand_more
                </span>
            </button>

            {open && (
                <div className="tg-country-menu" role="listbox">
                    <input
                        autoFocus
                        placeholder="Buscar país o código"
                        className="tg-country-search"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                    />
                    <ul className="tg-country-list">
                        {filtered.map((o: any) => (
                            <li key={o.value}>
                                <button
                                    type="button"
                                    className={`tg-country-item ${o.value === value ? "is-active" : ""}`}
                                    onClick={() => {
                                        onChange?.(o.value);
                                        setOpen(false);
                                    }}
                                >
                                    {Icon ? <Icon country={o.value} /> : <span className="tg-flag-fallback" />}
                                    <span className="tg-country-label">{o.label}</span>
                                    <span className="tg-cc">+{getCountryCallingCode(o.value as CountryCode)}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

/* ====================== page ====================== */
export default function ProfileSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [pwdSaving, setPwdSaving] = useState(false);
    const [avatarSaving, setAvatarSaving] = useState(false);

    const [userId, setUserId] = useState<string | null>(null);
    const [email, setEmail] = useState<string | null>(null);

    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState<string>("");
    const [phoneError, setPhoneError] = useState<string | null>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    // password flow
    const [stage, setStage] = useState<"verify" | "set">("verify");
    const [currentPwd, setCurrentPwd] = useState("");
    const [newPwd, setNewPwd] = useState("");
    const [confirmPwd, setConfirmPwd] = useState("");

    // show/hide toggles
    const [showCur, setShowCur] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConf, setShowConf] = useState(false);

    const [msg, setMsg] = useState<string | null>(null);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const p = await loadProfile();
                setUserId(p.userId);
                setEmail(p.email);
                setFullName(p.fullName);
                setPhone(normalizePhone(p.phone));
                setAvatarUrl(p.avatarUrl);
            } catch (e: any) {
                setErr(e.message ?? "Error al cargar perfil");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    async function saveProfile() {
        if (phone && !isValidPhoneNumber(phone)) {
            setPhoneError("Número inválido");
            return;
        }
        if (!userId) return;
        setMsg(null);
        setErr(null);
        setSaving(true);
        try {
            await saveProfileAPI({ fullName, phone });
            setMsg("Perfil actualizado.");
        } catch (e: any) {
            setErr(e.message ?? "Error al guardar");
        } finally {
            setSaving(false);
        }
    }

    async function verifyCurrentPassword() {
        if (!email) {
            setErr("No hay email de sesión.");
            return;
        }
        if (!currentPwd) {
            setErr("Ingresa tu contraseña actual.");
            return;
        }
        setErr(null);
        setMsg(null);
        setPwdSaving(true);
        try {
            await verifyPasswordAPI(email, currentPwd);
            setStage("set");
            setMsg("Verificación correcta. Ingresa tu nueva contraseña.");
        } catch {
            setErr("Contraseña actual incorrecta.");
        } finally {
            setPwdSaving(false);
        }
    }

    async function updatePassword() {
        if (!newPwd || newPwd.length < 8) {
            setErr("La contraseña debe tener al menos 8 caracteres.");
            return;
        }
        if (newPwd !== confirmPwd) {
            setErr("Las contraseñas no coinciden.");
            return;
        }
        setErr(null);
        setMsg(null);
        setPwdSaving(true);
        try {
            await updatePasswordAPI(newPwd);
            setMsg("Contraseña actualizada.");
            setCurrentPwd("");
            setNewPwd("");
            setConfirmPwd("");
            setShowCur(false);
            setShowNew(false);
            setShowConf(false);
            setStage("verify");
        } catch (e: any) {
            setErr(e.message ?? "No se pudo actualizar la contraseña");
        } finally {
            setPwdSaving(false);
        }
    }

    async function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
        const input = e.currentTarget;
        const file = input.files?.[0];
        if (!file || !userId) return;

        if (!/image\/(jpeg|png|webp)/.test(file.type)) {
            setErr("Formato inválido.");
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            setErr("Máximo 2 MB.");
            return;
        }

        setMsg(null);
        setErr(null);
        setAvatarSaving(true);
        try {
            const url = await uploadAvatarAPI({ userId, file });
            setAvatarUrl(url);
            setMsg("Avatar actualizado.");
        } catch (e: any) {
            setErr(e.message ?? "Error al subir avatar");
        } finally {
            setAvatarSaving(false);
            input.value = "";
        }
    }

    if (loading)
        return (
            <div className="p-6 text-sm" style={{ color: "var(--tg-muted)" }}>
                Cargando…
            </div>
        );

    return (
        <div className="max-w-3xl w-full mx-auto p-6 space-y-8">
            <h1 className="text-2xl font-semibold" style={{ color: "var(--tg-fg)" }}>
                Configuración de perfil
            </h1>

            {(msg || err) && (
                <div
                    className="rounded-lg px-3 py-2 text-sm"
                    style={{
                        background: err ? "rgba(255,0,0,.08)" : "rgba(0,128,0,.1)",
                        color: err ? "var(--tg-danger)" : "var(--tg-success, #22c55e)",
                        border: `1px solid ${err ? "var(--tg-danger)" : "transparent"}`,
                    }}
                >
                    {err ?? msg}
                </div>
            )}

            {/* Avatar */}
            <section
                className="rounded-xl border p-4 flex items-center gap-4"
                style={{ borderColor: "var(--tg-border)", background: "var(--tg-card-bg)" }}
            >
                <div className="shrink-0">
                    {avatarUrl ? (
                        <img src={avatarUrl} alt="avatar" className="h-16 w-16 rounded-full object-cover" />
                    ) : (
                        <div
                            className="h-16 w-16 rounded-full grid place-items-center text-xl"
                            style={{ background: "var(--tg-muted-bg, #333)", color: "var(--tg-muted)" }}
                        >
                            ?
                        </div>
                    )}
                </div>
                <div className="space-y-2">
                    <div className="text-sm" style={{ color: "var(--tg-muted)" }}>
                        JPG, PNG o WEBP. Máx 2 MB.
                    </div>
                    <label className="inline-flex items-center gap-2">
                        <input type="file" accept="image/*" onChange={onAvatarChange} hidden />
                        <span
                            className="px-3 py-1.5 rounded-lg border cursor-pointer text-sm"
                            style={{ borderColor: "var(--tg-border)", background: "rgba(0,0,0,.06)" }}
                        >
                            {avatarSaving ? "Subiendo…" : "Cambiar avatar"}
                        </span>
                    </label>
                </div>
            </section>

            {/* Perfil */}
            <section
                className="rounded-xl border p-4 space-y-4"
                style={{ borderColor: "var(--tg-border)", background: "var(--tg-card-bg)" }}
            >
                <h2 className="text-lg font-medium" style={{ color: "var(--tg-fg)" }}>
                    Datos de perfil
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs mb-1" style={{ color: "var(--tg-muted)" }}>
                            Email
                        </label>
                        <input
                            value={email ?? ""}
                            disabled
                            className="w-full rounded-lg border px-3 py-2 text-sm bg-black/10"
                            style={{ borderColor: "var(--tg-border)", color: "var(--tg-muted)" }}
                        />
                    </div>

                    <div>
                        <label className="block text-xs mb-1" style={{ color: "var(--tg-muted)" }}>
                            Nombre Completo
                        </label>
                        <input
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full rounded-lg border px-3 py-2 text-sm"
                            style={{
                                borderColor: "var(--tg-border)",
                                background: "var(--tg-input-bg, transparent)",
                                color: "var(--tg-fg)",
                            }}
                            placeholder="Tu nombre visible"
                        />
                    </div>

                    <div>
                        <label className="block text-xs mb-1" style={{ color: "var(--tg-muted)" }}>
                            Teléfono
                        </label>

                        <div className="phone-field">
                            <PhoneInput
                                international
                                defaultCountry={DEFAULT_COUNTRY}
                                value={phone || undefined}
                                onChange={(v) => {
                                    setPhone(v ?? "");
                                    setPhoneError(null);
                                }}
                                placeholder="Número de celular"
                                countryCallingCodeEditable={false}
                                countrySelectComponent={CountrySelect}
                                className="w-full"
                            />
                        </div>

                        {phoneError && (
                            <p className="mt-1 text-xs" style={{ color: "var(--tg-danger)" }}>
                                {phoneError}
                            </p>
                        )}
                    </div>
                </div>

                <div className="pt-2">
                    <button
                        onClick={saveProfile}
                        disabled={saving}
                        className="px-3 py-2 rounded-lg text-sm"
                        style={{
                            background: "var(--tg-primary)",
                            color: "var(--tg-primary-fg)",
                            opacity: saving ? 0.7 : 1,
                        }}
                    >
                        {saving ? "Guardando…" : "Guardar cambios"}
                    </button>
                </div>
            </section>

            {/* Contraseña */}
            <section
                className="rounded-xl border p-4 space-y-4"
                style={{ borderColor: "var(--tg-border)", background: "var(--tg-card-bg)" }}
            >
                <h2 className="text-lg font-medium" style={{ color: "var(--tg-fg)" }}>
                    Cambiar contraseña
                </h2>

                {stage === "verify" ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <PasswordField
                                label="Contraseña actual"
                                value={currentPwd}
                                onChange={setCurrentPwd}
                                show={showCur}
                                setShow={setShowCur}
                            />
                        </div>

                        <div className="pt-2">
                            <button
                                onClick={verifyCurrentPassword}
                                disabled={pwdSaving}
                                className="px-3 py-2 rounded-lg text-sm"
                                style={{
                                    background: "var(--tg-primary)",
                                    color: "var(--tg-primary-fg)",
                                    opacity: pwdSaving ? 0.7 : 1,
                                }}
                            >
                                {pwdSaving ? "Verificando…" : "Verificar contraseña"}
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <PasswordField
                                label="Nueva contraseña"
                                value={newPwd}
                                onChange={setNewPwd}
                                show={showNew}
                                setShow={setShowNew}
                            />
                            <PasswordField
                                label="Confirmar contraseña"
                                value={confirmPwd}
                                onChange={setConfirmPwd}
                                show={showConf}
                                setShow={setShowConf}
                            />
                        </div>

                        <div className="pt-2 flex items-center gap-2">
                            <button
                                onClick={updatePassword}
                                disabled={pwdSaving}
                                className="px-3 py-2 rounded-lg text-sm"
                                style={{
                                    background: "var(--tg-primary)",
                                    color: "var(--tg-primary-fg)",
                                    opacity: pwdSaving ? 0.7 : 1,
                                }}
                            >
                                {pwdSaving ? "Actualizando…" : "Actualizar contraseña"}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setStage("verify");
                                    setNewPwd("");
                                    setConfirmPwd("");
                                }}
                                className="px-3 py-2 rounded-lg text-sm border"
                                style={{ borderColor: "var(--tg-border)", color: "var(--tg-fg)" }}
                            >
                                Cancelar
                            </button>
                        </div>
                    </>
                )}
            </section>
        </div>
    );
}
