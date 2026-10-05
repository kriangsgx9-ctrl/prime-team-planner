// Shown instantly by Next.js while a page's Server Component is still
// rendering/fetching — without this, clicking a nav link does nothing
// visible until the whole response arrives, which reads as "frozen" even
// when the actual server time is short. The header/sidebar stay mounted
// (this only replaces the {children} slot in the layout); only the content
// area shows this skeleton.
export default function Loading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4 shadow-sm">
        <div className="h-5 w-40 rounded bg-[var(--bg)]" />
        <div className="mt-2 h-3 w-64 rounded bg-[var(--bg)]" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-20 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4 shadow-sm">
          <div className="h-3 w-16 rounded bg-[var(--bg)]" />
          <div className="mt-3 h-5 w-20 rounded bg-[var(--bg)]" />
        </div>
        <div className="h-20 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4 shadow-sm">
          <div className="h-3 w-16 rounded bg-[var(--bg)]" />
          <div className="mt-3 h-5 w-20 rounded bg-[var(--bg)]" />
        </div>
      </div>
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4 shadow-sm">
        <div className="h-4 w-32 rounded bg-[var(--bg)]" />
        <div className="mt-3 space-y-2">
          <div className="h-10 rounded-xl bg-[var(--bg)]" />
          <div className="h-10 rounded-xl bg-[var(--bg)]" />
          <div className="h-10 rounded-xl bg-[var(--bg)]" />
        </div>
      </div>
    </div>
  );
}
