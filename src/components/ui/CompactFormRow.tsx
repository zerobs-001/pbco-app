"use client";

import React from 'react';
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface CompactFormRowProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
}

const CompactFormRow: React.FC<CompactFormRowProps> = ({
  label,
  required = false,
  children,
  className,
  htmlFor
}) => {
  return (
    <div className={cn("space-y-2 py-3", className)}>
      <Label 
        htmlFor={htmlFor}
        className="text-sm font-medium text-secondary leading-tight"
      >
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <div>
        {children}
      </div>
    </div>
  );
};

export default CompactFormRow;
