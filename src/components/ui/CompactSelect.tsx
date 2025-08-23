"use client";

import React from 'react';

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
  className = '',
  disabled = false
}) => {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`
        w-full bg-transparent border-0 border-b border-gray-300
        focus:border-b-2 focus:border-green-500 focus:outline-none
        py-1 px-0 text-sm transition-colors duration-200
        disabled:text-gray-400 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default CompactSelect;
