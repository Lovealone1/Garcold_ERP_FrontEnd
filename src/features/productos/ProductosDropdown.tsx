"use client";

import { MultipleDropdown } from "@/components/ui/Dropdown";
import type { ProductDTO } from "@/types/product";

type Props = {
    items: ProductDTO[];
    value: number[];
    onChange: (ids: number[]) => void;
    max?: number;
    label?: string;
    disabled?: boolean;
};

export default function ProductosDropdown({ items, value, onChange, max = 6, label = "Elegir productos", disabled }: Props) {
    return <MultipleDropdown options={items.map(p => ({ value: p.id, label: p.reference + " — " + p.description }))}
        value={value} onChange={onChange} max={max} label={label} disabled={disabled} />;
}
