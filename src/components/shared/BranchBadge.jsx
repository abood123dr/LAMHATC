import React from "react";
import { BRANCHES } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function BranchBadge({ branch, size = "md" }) {
  const info = BRANCHES[branch];
  if (!info) return null;

  const sizes = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-3 py-1 text-sm gap-1.5",
    lg: "px-4 py-1.5 text-sm gap-2",
  };

  const colors = {
    saudi: "bg-emerald-50 text-emerald-700 border-emerald-200",
    turkey: "bg-rose-50 text-rose-700 border-rose-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        colors[branch],
        sizes[size]
      )}
    >
      <span>{info.flag}</span>
      <span>{info.label}</span>
    </span>
  );
}