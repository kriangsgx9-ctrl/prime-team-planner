import { resolveIcon } from "@/lib/icons";

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

const ICON_BADGE_VARIANT = {
  navy: "bg-gradient-to-br from-[var(--navy)] to-[var(--navy-light)] text-white",
  orange: "bg-gradient-to-br from-[var(--orange)] to-[var(--orange-cta)] text-white",
  soft: "bg-[var(--orange-soft)] text-[var(--orange-cta)]",
  green: "bg-green-50 text-green-600",
};
const ICON_BADGE_SIZE = {
  sm: "size-[26px] rounded-lg text-xs",
  md: "size-[34px] rounded-[10px] text-base",
  lg: "size-11 rounded-[13px] text-xl",
};

// Small colored badge wrapping an icon — the "icon-badge" treatment from the
// original offline app's redesign, used in front of card/section headings
// throughout. Resolves to the app's hand-drawn SVG line-icon set when one
// exists for the given emoji key, falling back to the raw emoji otherwise.
export function IconBadge({ icon, variant = "soft", size = "md", className }: { icon: string; variant?: keyof typeof ICON_BADGE_VARIANT; size?: keyof typeof ICON_BADGE_SIZE; className?: string }) {
  const Svg = resolveIcon(icon);
  return (
    <span className={cn("mr-1.5 inline-flex shrink-0 items-center justify-center leading-none [&>svg]:size-[1em] [&>svg]:block", ICON_BADGE_VARIANT[variant], ICON_BADGE_SIZE[size], className)}>
      {Svg ? <Svg /> : icon}
    </span>
  );
}
