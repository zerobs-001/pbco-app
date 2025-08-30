"use client";

import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatNumber, unformatNumber } from "@/lib/utils/formatters";

interface CompactInputProps {
  id?: string;
  type?: 'text' | 'number' | 'date' | 'email' | 'password' | 'currency';
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
}

const CompactInput: React.FC<CompactInputProps> = ({
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  className,
  disabled = false,
  min,
  max,
  step
}) => {
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Handle currency/number formatting
  const isCurrencyField = type === 'currency' || type === 'number';

  useEffect(() => {
    if (isCurrencyField && !isFocused) {
      // Format for display when not focused
      setDisplayValue(value ? formatNumber(value) : '');
    } else {
      // Show raw value when focused or non-currency field
      setDisplayValue(value?.toString() || '');
    }
  }, [value, isFocused, isCurrencyField]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    if (isCurrencyField) {
      // Remove formatting and validate
      const unformatted = unformatNumber(inputValue);
      setDisplayValue(inputValue);
      onChange(unformatted);
    } else {
      setDisplayValue(inputValue);
      onChange(inputValue);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (isCurrencyField) {
      // Show unformatted value for editing
      setDisplayValue(unformatNumber(value?.toString() || ''));
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (isCurrencyField) {
      // Format for display
      setDisplayValue(value ? formatNumber(value) : '');
    }
  };

  return (
    <Input
      id={id}
      type={isCurrencyField ? 'text' : type}
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      disabled={disabled}
      min={min}
      max={max}
      step={step}
      className={cn(
        "h-9 px-3 py-2",
        "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        "border-input bg-background",
        "transition-colors duration-200",
        className
      )}
    />
  );
};

export default CompactInput;
