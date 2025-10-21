"use client";
type Props = {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  id?: string;
  ariaLabel?: string;
  className?: string;
};

export default function TgSwitch({ checked, onChange, disabled, id, ariaLabel, className }: Props) {
  return (
    <label
      htmlFor={id}
      className={`inline-flex items-center select-none ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"} ${className ?? ""}`}
    >
      <input
        id={id}
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        onChange={e => onChange(e.target.checked)}
        aria-label={ariaLabel}
      />
      {/* track */}
      <span
        className="relative h-5 w-9 rounded-full transition-colors
                   bg-[color-mix(in_srgb,var(--tg-muted)_35%,transparent)]
                   peer-checked:bg-[var(--tg-primary)]
                   peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-[var(--tg-primary)]
                   peer-checked:[&>span]:translate-x-4"
      >
        {/* thumb */}
        <span
          className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-[var(--tg-card-bg)]
                     shadow transition-transform translate-x-0"
        />
      </span>
    </label>
  );
}
