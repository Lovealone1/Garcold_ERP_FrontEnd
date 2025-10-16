export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[var(--tg-bg)] text-[var(--tg-fg)]">{children}</div>;
}