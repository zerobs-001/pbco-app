"use client";

import React from 'react';

interface CompactInputProps {
  id?: string;
  type?: 'text' | 'number' | 'date' | 'email';
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
  className = '',
  disabled = false,
  min,
  max,
  step
}) => {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      min={min}
      max={max}
      step={step}
      className={`
        w-full bg-transparent border-0 border-b border-gray-300
        focus:border-b-2 focus:border-green-500 focus:outline-none
        py-1 px-0 text-sm transition-colors duration-200
        disabled:text-gray-400 disabled:cursor-not-allowed
        ${className}
      `}
    />
  );
};

export default CompactInput;
