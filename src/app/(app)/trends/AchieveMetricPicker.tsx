"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/components/ui/primitives";

const OPTIONS = ["FYP", "NBC", "FYC"] as const;

export function AchieveMetricPicker({ achieveMetric }: { achieveMetric: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <div className="flex justify-center gap-2">
      {OPTIONS.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => {
            const params = new URLSearchParams(searchParams.toString());
            params.set("achieveMetric", opt);
            router.push(`/trends?${params.toString()}`);
          }}
          className={cn("rounded-full px-3 py-1 text-xs font-bold", achieveMetric === opt ? "bg-[var(--navy)] text-white" : "border border-[var(--line)]")}
        >
          เช็คจาก {opt}
        </button>
      ))}
    </div>
  );
}
