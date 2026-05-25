import React from "react";

export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8 animate-fade-up">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="h-px w-8 bg-gold" />
          <span className="text-xs tracking-[0.2em] text-gold uppercase font-medium">
            نظام لمحاتك
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-muted-foreground mt-2 text-sm md:text-base">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}