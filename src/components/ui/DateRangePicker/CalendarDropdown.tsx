"use client";

import { useDayPicker, type DropdownProps } from "react-day-picker";
import Dropdown, { DropdownOption } from "../Dropdown";

/** Navigate the single-month calendars through DayPicker's public context. */
function CalendarDropdown({ options = [], value, disabled, "aria-label": label, unit }: DropdownProps & { unit: "month" | "year" }) {
    const { months, goToMonth } = useDayPicker();
    const current = months[0].date;
    return (
        <Dropdown
            aria-label={label}
            value={typeof value === "number" || typeof value === "string" ? value : ""}
            onChange={event => goToMonth(new Date(
                unit === "year" ? Number(event.target.value) : current.getFullYear(),
                unit === "month" ? Number(event.target.value) : current.getMonth(),
                1,
            ))}
            disabled={disabled}
            className="h-9 rounded-md border border-tg bg-tg-card px-2 text-sm text-tg-card"
        >
            {options.map(option => (
                <DropdownOption key={option.value} value={option.value} disabled={option.disabled}>
                    {option.label}
                </DropdownOption>
            ))}
        </Dropdown>
    );
}

export function CalendarMonthDropdown(props: DropdownProps) {
    return <CalendarDropdown {...props} unit="month" />;
}

export function CalendarYearDropdown(props: DropdownProps) {
    return <CalendarDropdown {...props} unit="year" />;
}
