"use client";

import { MaterialIcon } from "./material-icon";

type Props = {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
};

/** Compact navigation that keeps every touch target within narrow cards. */
export default function MobilePagination({ page, totalPages, onPageChange }: Props) {
    const lastPage = Math.max(1, totalPages);
    const buttonClass = "h-11 w-11 shrink-0 grid place-items-center rounded-md border border-tg disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-tg-primary";

    return (
        <nav aria-label="Paginación" className="grid w-full min-w-0 grid-cols-[44px_44px_minmax(0,1fr)_44px_44px] items-center gap-1 sm:hidden">
            <button type="button" aria-label="Primera página" className={buttonClass} disabled={page <= 1} onClick={() => onPageChange(1)}>
                <MaterialIcon name="first_page" size={18} />
            </button>
            <button type="button" aria-label="Página anterior" className={buttonClass} disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
                <MaterialIcon name="chevron_left" size={18} />
            </button>
            <span aria-live="polite" className="min-w-0 text-center text-xs leading-5 [overflow-wrap:anywhere]">
                {page} / {lastPage}
            </span>
            <button type="button" aria-label="Página siguiente" className={buttonClass} disabled={page >= lastPage} onClick={() => onPageChange(page + 1)}>
                <MaterialIcon name="chevron_right" size={18} />
            </button>
            <button type="button" aria-label="Última página" className={buttonClass} disabled={page >= lastPage} onClick={() => onPageChange(lastPage)}>
                <MaterialIcon name="last_page" size={18} />
            </button>
        </nav>
    );
}
