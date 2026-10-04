"use client";

import { useSidebar } from "./SidebarContext";

export function SidebarToggleButton() {
  const { open, setOpen } = useSidebar();
  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/10 text-lg hover:bg-white/20 md:hidden"
      title="เมนู"
    >
      ☰
    </button>
  );
}
