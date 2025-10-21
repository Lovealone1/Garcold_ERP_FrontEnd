"use client";

import { useMemo } from "react";
import TgSwitch from "@/components/ui/TgSwitch";
import type { RolePermissionOut } from "@/types/permissions";
import { labelModule, labelAction } from "@/utils/permission/label-helpers";

type Grouped = Record<string, Record<string, boolean>>;

const ACTION_ORDER = [
    "view", "read", "create", "update", "delete", "export", "import",
    "approve", "cancel", "update_balance", "update_amount",
    "product_read", "product_upload", "purchase_read", "sold_in_range",
];

function groupByModule(perms: RolePermissionOut[]): Grouped {
    const out: Grouped = {};
    for (const p of perms) {
        const [mod, act] = p.code.split(".", 2);
        if (!mod || !act) continue;
        (out[mod] ??= {})[act] = !!p.active;
    }
    return out;
}

type Props = {
    perms: RolePermissionOut[];
    saving: boolean;
    setOne: (code: string, on: boolean) => Promise<void> | void;
    setMany: (codes: string[], on: boolean) => Promise<void> | void;
};

export default function RolesPermissionsContent({ perms, saving, setOne, setMany }: Props) {
    const grouped = useMemo(() => groupByModule(perms), [perms]);

    return (
        <div className="px-4 pb-4">
            <div className="overflow-x-auto rounded-lg border border-tg">
                <table className="w-full border-collapse text-sm">
                    <thead className="bg-[var(--table-head-bg)] text-[var(--table-head-fg)]">
                        <tr>
                            <th className="text-left px-3 py-2 w-56">Módulo</th>
                            <th className="text-left px-3 py-2">Acciones</th>
                            <th className="text-right px-3 py-2 w-28">Todos</th>
                        </tr>
                    </thead>
                    <tbody className="bg-[var(--panel-bg)]">
                        {Object.entries(grouped).map(([module, actions]) => {
                            const order = [
                                ...ACTION_ORDER.filter((a) => a in actions),
                                ...Object.keys(actions).filter((a) => !ACTION_ORDER.includes(a)),
                            ];
                            const vals = Object.values(actions);
                            const allOn = vals.length > 0 && vals.every(Boolean);
                            const someOn = vals.some(Boolean);

                            return (
                                <tr key={module} className="border-t border-[var(--panel-border)]">
                                    <td className="px-3 py-2 font-medium capitalize">{labelModule(module)}</td>
                                    <td className="px-3 py-2">
                                        <div className="flex flex-wrap gap-x-6 gap-y-3">
                                            {order.map((action) => (
                                                <label key={action} className="inline-flex items-center gap-2">
                                                    <TgSwitch
                                                        checked={!!actions[action]}
                                                        onChange={(next) => setOne(`${module}.${action}`, next)}
                                                        disabled={saving}
                                                    />
                                                    <span className="capitalize">{labelAction(action)}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-3 py-2">
                                        <div className="flex justify-end">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 accent-[var(--tg-primary)]"
                                                checked={allOn}
                                                ref={(el) => {
                                                    if (el) el.indeterminate = !allOn && someOn;
                                                }}
                                                onChange={(e) => {
                                                    const next = e.target.checked;
                                                    const codes = order.map((a) => `${module}.${a}`);
                                                    void setMany(codes, next);
                                                }}
                                                disabled={saving}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {!perms.length && (
                            <tr>
                                <td colSpan={3} className="px-3 py-6 text-center text-tg-muted">
                                    Sin permisos para mostrar.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
