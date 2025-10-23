"use client";
import { useEffect, useId, useState } from "react";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { es } from "date-fns/locale";
import { format, parse, isValid, startOfDay, endOfDay, isAfter } from "date-fns";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import styles from "./DateRangePicker.module.css";

export interface DateRangeInputProps {
  value?: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

const FMT = "dd/MM/yyyy";
const fmt = (r?: DateRange) =>
  !r?.from || !r?.to ? "" : `${format(r.from, FMT)} / ${format(r.to, FMT)}`;

function parseOne(s: string) {
  const d = parse(s.trim(), FMT, new Date());
  return isValid(d) ? d : null;
}
function parseRangeText(s: string): DateRange | undefined {
  const m = s.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/g);
  const [a, b] = m ?? [];
  const d1 = a ? parseOne(a) : null;
  const d2 = b ? parseOne(b) : null;
  if (d1 && d2) {
    const from = startOfDay(isAfter(d1, d2) ? d2 : d1);
    const to = endOfDay(isAfter(d1, d2) ? d1 : d2);
    return { from, to };
  }
  if (d1) return { from: startOfDay(d1), to: endOfDay(d1) };
  return undefined;
}

export default function DateRangeInput({
  value,
  onChange,
  disabled,
  className,
  placeholder = "dd/mm/aaaa / dd/mm/aaaa",
}: DateRangeInputProps) {
  const [open, setOpen] = useState(false);
  const [temp, setTemp] = useState<DateRange | undefined>(value);
  const [text, setText] = useState(fmt(value));
  const id = useId();

  useEffect(() => { setText(fmt(value)); }, [value]);
  useEffect(() => { if (open) setTemp(value); }, [open, value]);

  function commitFromInput() {
    const parsed = parseRangeText(text);
    if (!parsed?.from || !parsed?.to) { setText(fmt(value)); return; }
    onChange(parsed);
  }

  const now = new Date();
  const fromYear = now.getFullYear() - 2;
  const toYear = now.getFullYear() + 2;

  return (
    <div className={`relative inline-flex items-center ${className ?? ""}`}>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commitFromInput}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") { setText(fmt(value)); e.currentTarget.blur(); }
        }}
        placeholder={placeholder}
        disabled={disabled}
        className="h-10 w-[260px] rounded-md border border-tg bg-tg-card pr-10 pl-3 text-sm text-tg-card outline-none"
        aria-label="Rango de fechas"
      />

      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={id}
        className="absolute right-2 inline-grid h-7 w-7 place-items-center rounded hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-50"
        title="Abrir calendario"
      >
        <CalendarMonthOutlinedIcon fontSize="small" />
      </button>

      {open && (
        <div
          id={id}
          role="dialog"
          className="absolute left-0 top-[44px] z-50 w-[360px] max-w-[90vw] rounded-xl border border-tg bg-[var(--panel-bg,white)] p-3 shadow-xl"
        >
          <DayPicker
            mode="range"
            numberOfMonths={1}
            weekStartsOn={1}
            locale={es}
            selected={temp}
            onSelect={setTemp}
            showOutsideDays
            pagedNavigation
            captionLayout="dropdown"
            /* ✅ sustituye fromYear/toYear (deprecado) */
            startMonth={new Date(fromYear, 0)}
            endMonth={new Date(toYear, 11)}
            classNames={{
              day: styles.day,
              caption: styles.caption,   // nav en la misma fila de los dropdowns
              nav: styles.nav,           // contenedor flechas
              nav_button: styles.navBtn, // color flechas
            }}
            modifiersClassNames={{
              today: styles.today,
              range_start: styles.rangeStart,
              range_end: styles.rangeEnd,
              range_middle: styles.rangeMiddle,
              selected: styles.selected,
            }}
            /* ✅ fuerza el color de acento (flechas, focus…) a tg-primary */
            className={`p-2 ${styles.themeFix}`}
          />
          <div className="mt-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => { setTemp(undefined); setText(""); }}
              className="h-9 rounded-md border border-tg bg-transparent px-3 text-sm text-tg-muted hover:bg-black/5 dark:hover:bg-white/5"
            >
              Limpiar
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { setOpen(false); setText(fmt(value)); }}
                className="h-9 rounded-md border border-tg bg-tg-card px-3 text-sm text-tg-card hover:bg-black/5 dark:hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!temp?.from || !temp?.to}
                onClick={() => {
                  if (!temp?.from || !temp?.to) return;
                  const from = startOfDay(temp.from);
                  const to = endOfDay(temp.to);
                  const range = isAfter(from, to) ? { from: to, to: from } : { from, to };
                  onChange(range);
                  setText(fmt(range));
                  setOpen(false);
                }}
                className="h-9 rounded-md bg-tg-primary px-3 text-sm font-medium text-tg-on-primary shadow-sm disabled:opacity-50"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
