"use client";

import { Children, cloneElement, forwardRef, isValidElement, useCallback, useLayoutEffect, useRef, useState, type ReactElement, type ReactNode, type CSSProperties } from "react";
import Select, { type SelectChangeEvent } from "@mui/material/Select";
import MenuItem, { type MenuItemProps } from "@mui/material/MenuItem";
import Autocomplete, { type AutocompleteProps } from "@mui/material/Autocomplete";
import Paper, { type PaperProps } from "@mui/material/Paper";
import Popper, { type PopperProps } from "@mui/material/Popper";
import type { PopoverActions } from "@mui/material/Popover";
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

const MENU_GAP = 4;
const VIEWPORT_MARGIN = 12;
const MAX_MENU_HEIGHT = 360;

function belowTrigger(rect: DOMRect, view: Window) {
    const viewport = view.visualViewport;
    const leftEdge = (viewport?.offsetLeft ?? 0) + VIEWPORT_MARGIN;
    const rightEdge = (viewport?.offsetLeft ?? 0) + (viewport?.width ?? view.innerWidth) - VIEWPORT_MARGIN;
    const bottomEdge = (viewport?.offsetTop ?? 0) + (viewport?.height ?? view.innerHeight) - VIEWPORT_MARGIN;
    const width = Math.min(rect.width, Math.max(0, rightEdge - leftEdge));
    const top = rect.bottom + MENU_GAP;
    return {
        top,
        left: Math.max(leftEdge, Math.min(rect.left, rightEdge - width)),
        width,
        maxHeight: Math.max(0, Math.min(MAX_MENU_HEIGHT, bottomEdge - top)),
    };
}

const DropdownPaper = styled(DropdownSurface)({
    ...surfaceStyles,
    boxSizing: "border-box",
    maxHeight: "var(--dropdown-max-height, 360px)",
    overflow: "auto",
    "& .MuiAutocomplete-listbox": {
        boxSizing: "border-box",
        maxHeight: "var(--dropdown-max-height, 360px)",
    },
});
const DropdownMenuPaper = styled(DropdownSurface)({
    ...surfaceStyles,
    boxSizing: "border-box",
    position: "absolute",
    overflowY: "auto",
    overflowX: "hidden",
    minWidth: 16,
    minHeight: 0,
    maxWidth: "calc(100% - 32px)",
    maxHeight: "calc(100% - 32px)",
    outline: 0,
});
const DropdownPopper = styled(Popper)({ zIndex: 1500, maxWidth: "calc(100vw - 24px)" });

// Recomputed by Popper on scroll/resize as well as when options change.
const availableHeight: NonNullable<PopperProps["modifiers"]>[number] = {
    name: "availableHeight",
    enabled: true,
    phase: "beforeWrite",
    requires: ["computeStyles"],
    fn({ state }) {
        const view = state.elements.popper.ownerDocument.defaultView;
        if (!view) return;
        const bounds = belowTrigger(state.elements.reference.getBoundingClientRect(), view);
        state.elements.popper.style.setProperty("--dropdown-max-height", `${bounds.maxHeight}px`);
    },
};

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
    const triggerRef = useRef<HTMLDivElement>(null);
    const popoverRef = useRef<PopoverActions>(null);
    const [open, setOpen] = useState(false);
    const [bounds, setBounds] = useState({ top: 0, left: 0, width: 0, maxHeight: MAX_MENU_HEIGHT });
    const options = Children.toArray(children).filter(isValidElement) as ReactElement<MenuItemProps>[];
    const normalized = options.map(option => cloneElement(option, { value: String(option.props.value ?? "") }));
    // Options may arrive after the current value. Avoid an out-of-range control.
    const selected = normalized.find(option => option.props.value === String(value));
    const measure = useCallback(() => {
        const trigger = triggerRef.current;
        const view = trigger?.ownerDocument.defaultView;
        if (trigger && view) setBounds(belowTrigger(trigger.getBoundingClientRect(), view));
    }, []);
    useLayoutEffect(() => {
        if (!open) return;
        measure();
        const view = triggerRef.current?.ownerDocument.defaultView;
        if (!view) return;
        const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(measure);
        if (triggerRef.current) observer?.observe(triggerRef.current);
        view.addEventListener("scroll", measure, true);
        view.addEventListener("resize", measure);
        view.visualViewport?.addEventListener("resize", measure);
        view.visualViewport?.addEventListener("scroll", measure);
        return () => {
            observer?.disconnect();
            view.removeEventListener("scroll", measure, true);
            view.removeEventListener("resize", measure);
            view.visualViewport?.removeEventListener("resize", measure);
            view.visualViewport?.removeEventListener("scroll", measure);
        };
    }, [open, measure]);
    useLayoutEffect(() => {
        if (open) popoverRef.current?.updatePosition();
    }, [open, bounds]);
    return (
        <Select<string>
            {...props}
            ref={triggerRef}
            disabled={props.disabled || normalized.length === 0}
            value={selected ? String(value) : ""}
            onChange={onChange}
            open={open}
            onOpen={() => { measure(); setOpen(true); }}
            onClose={() => setOpen(false)}
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
                action: popoverRef,
                // MUI's viewport correction otherwise slides a tall menu over
                // its trigger. Keep the anchor fixed and scroll the options.
                marginThreshold: null,
                anchorPosition: { top: bounds.top, left: bounds.left },
                transformOrigin: { vertical: "top", horizontal: "left" },
                anchorReference: "anchorPosition",
                sx: { zIndex: 1500 },
                slots: { paper: DropdownMenuPaper },
                slotProps: {
                    paper: {
                        style: { minWidth: bounds.width },
                        sx: {
                            width: `${bounds.width}px`,
                            maxHeight: `${bounds.maxHeight}px`,
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
                        { name: "offset", options: { offset: [0, MENU_GAP] } },
                        { name: "preventOverflow", options: { padding: VIEWPORT_MARGIN, altAxis: false } },
                        availableHeight,
                    ],
                },
            }}
        />
    );
}
