import { useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Dropdown, { DropdownOption, MultipleDropdown } from "../Dropdown";
import ModalOverlay from "../ModalOverlay";
import { DayPicker } from "react-day-picker";
import { CalendarMonthDropdown, CalendarYearDropdown } from "../DateRangePicker/CalendarDropdown";

describe("Dropdown", () => {
    it("emits string IDs, submits the selected value and renders no native select", async () => {
        const changed = vi.fn();
        function Form() {
            const [value, setValue] = useState("");
            return <form data-testid="form"><Dropdown name="bank" aria-label="Banco" value={value} onChange={e => {
                changed(e.target.value); setValue(e.target.value);
            }}>
                <DropdownOption value="">Selecciona banco</DropdownOption>
                <DropdownOption value={7}>Caja</DropdownOption>
            </Dropdown></form>;
        }
        const { container } = render(<Form />);
        fireEvent.mouseDown(screen.getByRole("combobox", { name: "Banco" }));
        fireEvent.click(await screen.findByRole("option", { name: "Caja" }));
        expect(changed).toHaveBeenCalledWith("7");
        expect(screen.getByRole("combobox")).toHaveTextContent("Caja");
        expect(new FormData(screen.getByTestId("form") as HTMLFormElement).get("bank")).toBe("7");
        expect(container.querySelector("select")).toBeNull();
    });

    it("supports keyboard selection and skips disabled options", async () => {
        const user = userEvent.setup();
        const changed = vi.fn();
        render(<Dropdown aria-label="Estado" value="cash" onChange={e => changed(e.target.value)}>
            <DropdownOption value="cash">Contado</DropdownOption>
            <DropdownOption value="blocked" disabled>Bloqueado</DropdownOption>
            <DropdownOption value="credit">Crédito</DropdownOption>
        </Dropdown>);
        await user.tab();
        await user.keyboard("{Enter}{ArrowDown}{Enter}");
        expect(changed).toHaveBeenCalledWith("credit");
    });

    it("closes its menu with Escape without closing the parent modal", async () => {
        const user = userEvent.setup();
        const close = vi.fn();
        render(<ModalOverlay open onClose={close}><Dropdown aria-label="Banco" value="1">
            <DropdownOption value="1">Caja</DropdownOption>
        </Dropdown></ModalOverlay>);
        fireEvent.mouseDown(await screen.findByRole("combobox"));
        await screen.findByRole("listbox");
        await user.keyboard("{Escape}");
        await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull());
        expect(close).not.toHaveBeenCalled();
        expect(screen.getByRole("combobox")).toHaveFocus();
    });

    it("does not open a disabled control and updates when asynchronous options arrive", () => {
        const { rerender } = render(<Dropdown aria-label="Banco" value={7} disabled>{[]}</Dropdown>);
        fireEvent.mouseDown(screen.getByRole("combobox"));
        expect(screen.queryByRole("listbox")).toBeNull();
        rerender(<Dropdown aria-label="Banco" value={7}><DropdownOption value={7}>Caja</DropdownOption></Dropdown>);
        expect(screen.getByRole("combobox")).toHaveTextContent("Caja");
    });

    it("anchors below the full control and limits the menu to the space below it", async () => {
        const { container } = render(<Dropdown aria-label="Estado" value="1">
            <DropdownOption value="1">Contado</DropdownOption>
            <DropdownOption value="2">Crédito</DropdownOption>
        </Dropdown>);
        const control = container.querySelector(".MuiInputBase-root") as HTMLElement;
        const rect = vi.spyOn(control, "getBoundingClientRect").mockReturnValue({
            top: window.innerHeight - 144,
            bottom: window.innerHeight - 100,
            left: 24, right: 224, width: 200, height: 44,
            x: 24, y: window.innerHeight - 144, toJSON: () => ({}),
        });
        try {
            fireEvent.mouseDown(screen.getByRole("combobox", { name: "Estado" }));
            const listbox = await screen.findByRole("listbox");
            const paper = listbox.closest(".MuiPaper-root") as HTMLElement;
            expect(paper).toHaveStyle({ top: `${window.innerHeight - 96}px`, left: "24px", width: "200px", maxHeight: "84px" });

            rect.mockReturnValue({ top: 100, bottom: 144, left: 24, right: 224, width: 200, height: 44, x: 24, y: 100, toJSON: () => ({}) });
            fireEvent.scroll(window);
            await waitFor(() => expect(paper).toHaveStyle({ top: "148px", maxHeight: "360px" }));
        } finally {
            rect.mockRestore();
        }
    });

    it("keeps the multi-selection limit and still allows removing selected items", async () => {
        const user = userEvent.setup();
        function Multi() {
            const [value, setValue] = useState([1]);
            return <MultipleDropdown label="Productos" options={[{ value: 1, label: "Uno" }, { value: 2, label: "Dos" }]}
                value={value} onChange={setValue} max={1} />;
        }
        render(<Multi />);
        await user.click(screen.getByRole("combobox"));
        expect(await screen.findByRole("option", { name: "Dos" })).toHaveAttribute("aria-disabled", "true");
        await user.click(screen.getByRole("option", { name: "Uno" }));
        expect(screen.getByRole("option", { name: "Dos" })).not.toHaveAttribute("aria-disabled", "true");
        await user.click(screen.getByRole("option", { name: "Dos" }));
        expect(screen.getByRole("option", { name: "Dos" })).toHaveAttribute("aria-selected", "true");
    });

    it("navigates calendar months and years through custom controls", async () => {
        const changed = vi.fn();
        const { container } = render(<DayPicker captionLayout="dropdown" defaultMonth={new Date(2026, 8, 1)}
            startMonth={new Date(2025, 0)} endMonth={new Date(2027, 11)} onMonthChange={changed}
            components={{ MonthsDropdown: CalendarMonthDropdown, YearsDropdown: CalendarYearDropdown }} />);
        const controls = screen.getAllByRole("combobox");
        fireEvent.mouseDown(controls[0]);
        fireEvent.click(await screen.findByRole("option", { name: "January" }));
        expect(changed).toHaveBeenLastCalledWith(new Date(2026, 0, 1));
        fireEvent.mouseDown(controls[1]);
        fireEvent.click(await screen.findByRole("option", { name: "2025" }));
        expect(changed).toHaveBeenLastCalledWith(new Date(2025, 0, 1));
        expect(container.querySelector("select")).toBeNull();
    });
});
