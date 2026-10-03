export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export const inputClass =
  "w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[var(--orange)]";

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="block text-xs font-bold text-[var(--muted)]">{label}</span>
      {children}
      {hint && <span className="block text-xs text-[var(--muted)]">{hint}</span>}
    </label>
  );
}

export function PrimeButton({
  children,
  variant = "primary",
  full,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "outline" | "navy"; full?: boolean }) {
  const base = "rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:opacity-50";
  const styles = {
    primary: "bg-[var(--orange-cta)] text-white hover:brightness-110",
    navy: "bg-[var(--navy)] text-white hover:brightness-110",
    outline: "border border-[var(--navy)] text-[var(--navy)] bg-white hover:bg-[var(--orange-soft)]",
  };
  return (
    <button className={cn(base, styles[variant], full && "w-full", className)} {...props}>
      {children}
    </button>
  );
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4 shadow-sm", className)}>{children}</div>;
}

export function FormError({ error }: { error?: string }) {
  if (!error) return null;
  return <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>;
}
