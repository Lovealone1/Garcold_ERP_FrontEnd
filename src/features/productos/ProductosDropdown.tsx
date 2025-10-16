// features/productos/ProductosDropdown.tsx
"use client";

import { useCallback, useMemo, useState } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Menu, MenuItem, Checkbox, ListItemIcon, ListItemText } from "@mui/material";
import type { Producto } from "@/types/product";

type Props = {
    items: Producto[];
    value: number[];                // IDs seleccionados
    onChange: (ids: number[]) => void;
    max?: number;                   // default 6
    label?: string;
    disabled?: boolean;
};

export default function ProductosDropdown({
    items,
    value,
    onChange,
    max = 6,
    label = "Elegir productos",
    disabled,
}: Props) {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const checkedSet = useMemo(() => new Set(value), [value]);

    const handleOpen = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(e.currentTarget);
    }, []);
    const handleClose = useCallback(() => setAnchorEl(null), []);

    const toggle = useCallback(
        (id: number) => {
            const next = new Set(checkedSet);
            if (next.has(id)) next.delete(id);
            else if (next.size < max) next.add(id);
            onChange(Array.from(next));
        },
        [checkedSet, max, onChange]
    );

    // render de filas memoizado
    const rows = useMemo(
        () =>
            items.map((p) => {
                const checked = checkedSet.has(p.id);
                return (
                    <MenuItem
                        key={p.id}
                        onClick={() => toggle(p.id)}
                        sx={{
                            gap: 1,
                            "&:hover": { bgcolor: "color-mix(in srgb, var(--tg-primary) 12%, transparent)" },
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: 28 }}>
                            <Checkbox
                                size="small"
                                checked={checked}
                                sx={{ color: "var(--tg-muted)", "&.Mui-checked": { color: "var(--tg-primary)" } }}
                            />
                        </ListItemIcon>
                        <ListItemText
                            slotProps={{ primary: { sx: { color: "var(--tg-card-fg)" } } }}
                            primary={`${p.referencia} — ${p.descripcion}`}
                        />
                    </MenuItem>
                );
            }),
        [items, checkedSet, toggle]
    );

    return (
        <>
            <button
                type="button"
                onClick={handleOpen}
                disabled={disabled}
                className="h-10 rounded-md border border-tg bg-tg-card px-3 text-sm text-tg-card inline-flex items-center gap-2"
                aria-haspopup="menu"
                aria-expanded={open ? "true" : undefined}
                title={`${label} (máx. ${max})`}
            >
                <span className="text-tg-muted">{label}</span>
                <span className="text-tg-muted">({value.length}/{max})</span>
                <ExpandMoreIcon fontSize="small" />
            </button>

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                // ↓ sin animación ni bloqueo de scroll, mantiene montado
                transitionDuration={0}
                keepMounted
                disableScrollLock
                slotProps={{
                    paper: {
                        sx: {
                            bgcolor: "var(--tg-card-bg)",
                            color: "var(--tg-card-fg)",
                            border: "1px solid var(--tg-border)",
                            minWidth: 320,
                            maxHeight: 360,
                        },
                    },
                }}
                MenuListProps={{ dense: true, disablePadding: false }}
            >
                {rows}
            </Menu>
        </>
    );
}
