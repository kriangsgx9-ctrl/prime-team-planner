"use client";

import { useState } from "react";
import { IconBadge, cn } from "@/components/ui/primitives";

// Import and export are different intents (bring data in vs. take data out)
// — splitting them into a top-level mode switch instead of one long scroll
// of interleaved cards is the main legibility fix this page needed.
export function ImportExportTabs({ importSection, exportSection }: { importSection: React.ReactNode; exportSection: React.ReactNode }) {
  const [mode, setMode] = useState<"import" | "export">("import");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setMode("import")}
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-extrabold transition",
            mode === "import" ? "border-transparent bg-[var(--navy)] text-white shadow-sm" : "border-[var(--line)] bg-[var(--card)] text-[var(--muted)] hover:text-[var(--navy)]",
          )}
        >
          <IconBadge icon="📥" variant={mode === "import" ? "orange" : "soft"} size="sm" className="mr-0" />
          นำเข้าข้อมูล
        </button>
        <button
          type="button"
          onClick={() => setMode("export")}
          className={cn(
            "flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-extrabold transition",
            mode === "export" ? "border-transparent bg-[var(--navy)] text-white shadow-sm" : "border-[var(--line)] bg-[var(--card)] text-[var(--muted)] hover:text-[var(--navy)]",
          )}
        >
          <IconBadge icon="📤" variant={mode === "export" ? "orange" : "soft"} size="sm" className="mr-0" />
          ส่งออกข้อมูล
        </button>
      </div>
      {mode === "import" ? importSection : exportSection}
    </div>
  );
}
