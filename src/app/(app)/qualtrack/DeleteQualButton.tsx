"use client";

import { deleteQualificationAction } from "@/app/actions/qualifications";

export function DeleteQualButton({ id, name }: { id: string; name: string }) {
  return (
    <button
      type="button"
      onClick={() => confirm(`ลบคุณวุฒิ "${name}"?`) && deleteQualificationAction(id)}
      className="shrink-0 rounded-lg border border-red-300 px-2.5 py-1 text-xs font-bold text-red-600"
    >
      ลบ
    </button>
  );
}
