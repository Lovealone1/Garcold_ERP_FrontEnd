// src/app/(print)/layout.tsx   (sin "use client")
import "./print.css";

export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="print-wrap">
      <div className="print-sheet">{children}</div>
    </div>
  );
}
