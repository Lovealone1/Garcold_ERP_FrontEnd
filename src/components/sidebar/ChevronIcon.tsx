"use client";
export default function ChevronIcon({ open }: { open: boolean }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={`transition-transform ${open ? "rotate-90" : ""}`}
        >
            <path d="M9 18l6-6l-6-6" />
        </svg>
    );
}
