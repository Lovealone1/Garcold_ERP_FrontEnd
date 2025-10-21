"use client";

type Props = {
    active: "users" | "roles";
    onTab: (tab: "users" | "roles") => void;
    onReload?: () => void;
    onActivateAll?: () => void;
    onDeactivateAll?: () => void;
    actionsDisabled?: boolean;
};

export default function TeamHeader({
    active,
    onTab,
    onReload,
    onActivateAll,
    onDeactivateAll,
    actionsDisabled,
}: Props) {
    const baseTab =
        "relative px-3 py-2 text-sm text-tg-muted hover:text-tg-card focus:outline-none";
    const activeTab =
        'text-tg-primary after:content-[""] after:absolute after:left-0 after:right-0 after:bottom-[-1px] after:h-[2px] after:bg-[var(--tg-primary)]';

    return (
        <div className="flex items-center gap-3 border-b border-tg px-4 py-3">
            <button
                className={`${baseTab} ${active === "users" ? activeTab : ""}`}
                onClick={() => onTab("users")}
            >
                Todos los usuarios
            </button>

            <button
                className={`${baseTab} ${active === "roles" ? activeTab : ""}`}
                onClick={() => onTab("roles")}
            >
                Gestor de roles
            </button>

            <div className="ml-auto flex items-center gap-3">
                {onReload && (
                    <button
                        className="px-3 py-1.5 text-sm rounded-lg border border-tg"
                        onClick={onReload}
                    >
                        Recargar
                    </button>
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
