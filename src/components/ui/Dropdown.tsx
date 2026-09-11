"use client";

import { Children, cloneElement, forwardRef, isValidElement, useCallback, useState, type ReactElement, type ReactNode, type CSSProperties } from "react";
import Select, { type SelectChangeEvent } from "@mui/material/Select";
import MenuItem, { type MenuItemProps } from "@mui/material/MenuItem";
import Autocomplete, { type AutocompleteProps } from "@mui/material/Autocomplete";
import Paper, { type PaperProps } from "@mui/material/Paper";
import Popper from "@mui/material/Popper";
import TextField from "@mui/material/TextField";
import { styled } from "@mui/material/styles";

// Both selection modes share the same surface, option states and touch targets.
const optionStyles = {
    minHeight: 44,
    borderRadius: "6px",
    whiteSpace: "normal",
    overflowWrap: "anywhere",
    fontSize: "14px",
    "&.Mui-selected, &[aria-selected='true']": {
        backgroundColor: "color-mix(in srgb, var(--tg-primary) 16%, var(--tg-card-bg))",
        fontWeight: 600,
    },
    "&.Mui-focusVisible, &.Mui-focused, &:hover": {
        backgroundColor: "color-mix(in srgb, var(--tg-primary) 12%, var(--tg-card-bg))",
    },
} as const;

const surfaceStyles = {
    backgroundColor: "var(--tg-card-bg, #fff)",
    color: "var(--tg-card-fg, #172026)",
    border: "1px solid var(--tg-border, #cbd5e1)",
    borderRadius: "10px",
    boxShadow: "0 12px 32px rgb(0 0 0 / 20%)",
    backgroundImage: "none",
    "& .MuiMenuItem-root, & .MuiAutocomplete-option": optionStyles,
};

const DropdownSurface = forwardRef<HTMLDivElement, PaperProps>(function DropdownSurface(props, ref) {
    return <Paper {...props} ref={ref} onPointerDown={event => {
        // A portalled option still belongs to its calendar/form popover.
        event.stopPropagation();
        props.onPointerDown?.(event);
    }} />;
});

const DropdownPaper = styled(DropdownSurface)(surfaceStyles);
const DropdownMenuPaper = styled(DropdownSurface)({
    ...surfaceStyles,
    boxSizing: "border-box",
    position: "absolute",
    overflowY: "auto",
    overflowX: "hidden",
    minWidth: 16,
    minHeight: 16,
    maxWidth: "calc(100% - 32px)",
    maxHeight: "calc(100% - 32px)",
    outline: 0,
});
const DropdownPopper = styled(Popper)({ zIndex: 1400, maxWidth: "calc(100vw - 24px)" });

export function DropdownOption(props: MenuItemProps) {
    return <MenuItem {...props} />;
}

type Props = {
    value?: string | number;
    onChange?: (event: SelectChangeEvent<string>) => void;
    children: ReactNode;
    disabled?: boolean;
    required?: boolean;
    autoFocus?: boolean;
    name?: string;
    id?: string;
    className?: string;
    style?: CSSProperties;
    title?: string;
    "aria-label"?: string;
    "aria-labelledby"?: string;
    "aria-describedby"?: string;
};

/** The application select: a themed, portalled listbox, never a native select. */
export default function Dropdown({ children, value = "", onChange, ...props }: Props) {
    const [menuWidth, setMenuWidth] = useState<number>();
    const options = Children.toArray(children).filter(isValidElement) as ReactElement<MenuItemProps>[];
    const normalized = options.map(option => cloneElement(option, { value: String(option.props.value ?? "") }));
    // Options may arrive after the current value. Avoid an out-of-range control.
    const selected = normalized.find(option => option.props.value === String(value));
    const handleOpen = useCallback((event: React.SyntheticEvent) => {
        const trigger = event.currentTarget as HTMLElement;
        const anchor = trigger.parentElement ?? trigger;
        const width = anchor.getBoundingClientRect().width || trigger.getBoundingClientRect().width;
        if (width > 0) setMenuWidth(Math.ceil(width));
    }, []);
    return (
        <Select<string>
            {...props}
            disabled={props.disabled || normalized.length === 0}
            value={selected ? String(value) : ""}
            onChange={onChange}
            onOpen={handleOpen}
            native={false}
            variant="standard"
            disableUnderline
            autoWidth={false}
            displayEmpty
            renderValue={() => selected?.props.children ?? "Seleccionar"}
            inputProps={{
                "aria-label": props["aria-label"],
                "aria-labelledby": props["aria-labelledby"],
                "aria-describedby": props["aria-describedby"],
            }}
            sx={{
                font: "inherit", color: "inherit", minWidth: 0,
                "& .MuiSelect-select": { padding: "0 24px 0 0 !important", minHeight: "unset", display: "block" },
                "& .MuiSelect-select:focus": { backgroundColor: "transparent" },
                "&.Mui-focused": { outline: "2px solid var(--tg-primary)", outlineOffset: "2px" },
                "&.Mui-disabled": { opacity: 0.6 },
                "& .Mui-disabled": { WebkitTextFillColor: "currentColor" },
                "& .MuiSelect-icon": { color: "var(--tg-muted)", right: 0 },
            }}
            MenuProps={{
                transitionDuration: 0,
                marginThreshold: 12,
                anchorOrigin: { vertical: "bottom", horizontal: "left" },
                transformOrigin: { vertical: "top", horizontal: "left" },
                anchorReference: "anchorEl",
                slots: { paper: DropdownMenuPaper },
                slotProps: {
                    paper: {
                        sx: {
                            width: menuWidth ? `${menuWidth}px` : undefined,
                            minWidth: menuWidth ? `${menuWidth}px` : undefined,
                            maxHeight: "min(360px, calc(100dvh - 24px))",
                            maxWidth: "calc(100vw - 24px)",
                        },
                    },
                    list: { sx: { padding: "4px" }, "aria-label": props["aria-label"] },
                },
            }}
        >
            {normalized}
        </Select>
    );
}

type MultipleProps = {
    options: { value: number; label: string }[];
    value: number[];
    onChange: (values: number[]) => void;
    label: string;
    max?: number;
    disabled?: boolean;
};

export function MultipleDropdown({ options, value, onChange, label, max = Infinity, disabled }: MultipleProps) {
    return (
        <SearchDropdown
            multiple
            disableCloseOnSelect
            options={options}
            value={options.filter(option => value.includes(option.value))}
            onChange={(_, selected) => {
                if (selected.length <= max) onChange(selected.map(option => option.value));
            }}
            disabled={disabled}
            isOptionEqualToValue={(a, b) => a.value === b.value}
            getOptionLabel={option => option.label}
            getOptionDisabled={option => value.length >= max && !value.includes(option.value)}
            renderTags={selected => <span className="ml-2 text-sm text-tg-muted">{selected.length}{Number.isFinite(max) ? `/${max}` : ""}</span>}
            renderOption={({ key, ...props }, option, { selected }) => (
                <li key={key} {...props}>
                    <span aria-hidden="true" className="mr-2 inline-grid h-5 w-5 shrink-0 place-items-center rounded border border-tg text-tg-primary">{selected ? "✓" : ""}</span>
                    {option.label}
                </li>
            )}
            renderInput={params => <TextField {...params} size="small" placeholder={label} slotProps={{ htmlInput: { ...params.inputProps, "aria-label": label } }} />}
            sx={{ width: 300, maxWidth: "100%" }}
        />
    );
}

/** Searchable/multiple selection keeps the same dropdown surface and keyboard behavior. */
export function SearchDropdown<
    T,
    Multiple extends boolean | undefined = false,
    DisableClearable extends boolean | undefined = false,
    FreeSolo extends boolean | undefined = false,
>(props: AutocompleteProps<T, Multiple, DisableClearable, FreeSolo>) {
    return (
        <Autocomplete
            openText="Abrir opciones"
            closeText="Cerrar opciones"
            clearText="Limpiar selección"
            noOptionsText="Sin opciones"
            loadingText="Cargando…"
            {...props}
            disablePortal={false}
            slots={{ ...props.slots, paper: DropdownPaper, popper: DropdownPopper }}
            slotProps={{
                ...props.slotProps,
                popper: {
                    ...(typeof props.slotProps?.popper === "object" ? props.slotProps.popper : {}),
                    placement: "bottom-start",
                    modifiers: [
                        ...(typeof props.slotProps?.popper === "object" && Array.isArray(props.slotProps.popper.modifiers)
                            ? props.slotProps.popper.modifiers
                            : []),
                        { name: "flip", enabled: false },
                        { name: "preventOverflow", options: { padding: 8, altAxis: true } },
                    ],
                },
            }}
        />
    );
}
