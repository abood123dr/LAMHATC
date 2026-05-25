import React from "react";
import { Package } from "lucide-react";

export default function EmptyState({ icon: Icon = Package, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gold" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-bold text-foreground mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-5">{description}</p>
      )}
      {action}
    </div>
  );
}