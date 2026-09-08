"use client";

import type { ComponentType } from "react";
import { getCountryCallingCode, type Country } from "react-phone-number-input";
import TextField from "@mui/material/TextField";
import { SearchDropdown } from "./Dropdown";

type CountryOption = { value?: Country; label: string; divider?: boolean };
type Props = {
    value?: Country;
    onChange: (value?: Country) => void;
    options: CountryOption[];
    disabled?: boolean;
    iconComponent?: ComponentType<{ country: Country; label: string }>;
};

export default function CountryDropdown({ value, onChange, options, disabled, iconComponent: Icon }: Props) {
    const choices = options.filter(option => !option.divider);
    const code = (option: CountryOption) => option.value ? `+${getCountryCallingCode(option.value)}` : "";
    return (
        <SearchDropdown
            options={choices}
            value={choices.find(option => option.value === value) ?? null}
            onChange={(_, option) => onChange(option?.value)}
            disabled={disabled}
            getOptionLabel={option => option.value ?? option.label}
            isOptionEqualToValue={(a, b) => a.value === b.value}
            filterOptions={(items, { inputValue }) => {
                const query = inputValue.trim().toLocaleLowerCase();
                return items.filter(option => `${option.label} ${option.value ?? ""} ${code(option)}`.toLocaleLowerCase().includes(query));
            }}
            renderOption={({ key, ...props }, option) => (
                <li key={key} {...props}>
                    {Icon && option.value && <span className="mr-2 w-5 shrink-0"><Icon country={option.value} label={option.label} /></span>}
                    <span className="flex-1">{option.label}</span>
                    <span className="ml-2 text-tg-muted">{code(option)}</span>
                </li>
            )}
            renderInput={params => <TextField {...params} size="small" slotProps={{ htmlInput: { ...params.inputProps, "aria-label": "País o código telefónico" } }} />}
            sx={{ width: 96, flexShrink: 0, "& input": { color: "var(--tg-card-fg)" } }}
        />
    );
}
