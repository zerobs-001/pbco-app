"use client";

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface CompactSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const CompactSelect: React.FC<CompactSelectProps> = ({
  id,
  value,
  onChange,
  options,
  placeholder,
  className,
  disabled = false
}) => {
  // Filter out options with empty string values to prevent Radix UI error
  const validOptions = options.filter(option => option.value !== '');
  
  return (
    <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger 
        id={id}
        className={cn(
          "h-9 px-3 py-2",
          "focus:ring-2 focus:ring-primary focus:ring-offset-2",
          "border-input bg-background",
          "transition-colors duration-200",
          className
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {validOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CompactSelect;
