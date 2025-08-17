"use client";

import React, { useState } from "react";

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  summary?: React.ReactNode;
  className?: string;
}

export default function CollapsibleSection({ 
  title, 
  children, 
  defaultExpanded = false,
  summary,
  className = ""
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <section className={`rounded-xl border border-[#e5e7eb] bg-white shadow-sm ${className}`}>
      {/* Header */}
      <div 
        className="flex items-center justify-between p-5 cursor-pointer hover:bg-[#f9fafb] transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#111827]">{title}</h2>
            {summary && (
              <div className="text-sm text-[#6b7280]">
                {summary}
              </div>
            )}
          </div>
        </div>
        
        {/* Chevron Icon */}
        <svg 
          className={`h-5 w-5 text-[#6b7280] transition-transform ml-3 ${
            isExpanded ? 'rotate-180' : ''
          }`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      
      {/* Content */}
      {isExpanded && (
        <div className="px-5 pb-5 border-t border-[#f3f4f6]">
          <div className="pt-4">
            {children}
          </div>
        </div>
      )}
    </section>
  );
}
