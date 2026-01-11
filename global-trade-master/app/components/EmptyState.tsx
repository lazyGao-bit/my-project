'use client';

import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = ''
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-20 px-4 text-center rounded-[2rem] border border-dashed border-stone-200 bg-[#fffcf7] ${className}`}>
      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-soft mb-6 border border-stone-100">
        <Icon className="w-7 h-7 text-stone-300" />
      </div>
      <h3 className="text-xl font-bold text-[#443d3a] mb-2 font-serif tracking-wide">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-stone-500 max-w-sm mb-8 leading-relaxed">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center justify-center rounded-full bg-[#443d3a] px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-stone-700 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
