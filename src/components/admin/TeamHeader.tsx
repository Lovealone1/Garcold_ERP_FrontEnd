"use client";
import { IconButton } from "@mui/material";
import ReplayIcon from "@mui/icons-material/Replay";

type Props = {
    active: "users" | "roles";
    onTab: (tab: "users" | "roles") => void;
    onReload?: () => void;
    onActivateAll?: () => void;
    onDeactivateAll?: () => void;
    actionsDisabled?: boolean;
    onCreateUser?: () => void;
    onInviteUser?: () => void;
};

export default function TeamHeader({
    active, onTab, onReload, onActivateAll, onDeactivateAll, actionsDisabled,
    onCreateUser, onInviteUser,
}: Props) {
    const baseTab =
        "relative px-3 py-2 text-sm text-tg-muted hover:text-tg-card focus:outline-none";
    const activeTab =
        'text-tg-primary after:content-[""] after:absolute after:left-0 after:right-0 after:bottom-[-1px] after:h-[2px] after:bg-[var(--tg-primary)]';

    return (
        <div className="flex items-center gap-3 border-b border-tg px-4 py-3">
            <button className={`${baseTab} ${active === "users" ? activeTab : ""}`} onClick={() => onTab("users")}>
                Todos los usuarios
            </button>
            <button className={`${baseTab} ${active === "roles" ? activeTab : ""}`} onClick={() => onTab("roles")}>
                Gestor de roles
            </button>

            <div className="ml-auto flex items-center gap-3">
                {active === "users" && (
                    <>
                        <button
                            className="px-3 py-1.5 text-sm rounded-lg bg-tg-primary text-tg-on-primary"
                            onClick={onCreateUser}
                        >
                            Crear usuario
                        </button>
                        <button
                            className="px-3 py-1.5 text-sm rounded-lg bg-tg-primary text-tg-on-primary flex items-center gap-2"
                            onClick={onInviteUser}
                            title="Invitar por correo"
                        >
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                                <path d="M20 18V7.5l-8 6-8-6V18h16Zm0-12H4l8 6 8-6Z" />
                            </svg>
                            Invitar
                        </button>
                    </>
                )}

                {onReload && (
                    <IconButton
                        aria-label="Recargar"
                        onClick={onReload}
                        size="small"
                        sx={{
                            border: "1px solid var(--tg-border)",
                            borderRadius: "0.5rem",
                            width: 34,
                            height: 34,
                            color: "inherit",
                        }}
                    >
                        <ReplayIcon fontSize="small" />
                    </IconButton>
                )}

                {onDeactivateAll && (
                    <button
                        className="px-3 py-1.5 text-sm rounded-lg border border-tg"
                        onClick={onDeactivateAll}
                        disabled={!!actionsDisabled}
                    >
                        Desactivar todo
                    </button>
                )}
                {onActivateAll && (
                    <button
                        className="px-3 py-1.5 text-sm rounded-lg bg-tg-primary text-tg-on-primary"
                        onClick={onActivateAll}
                        disabled={!!actionsDisabled}
                    >
                        Activar todo
                    </button>
                )}
            </div>
        </div>
    );
}
