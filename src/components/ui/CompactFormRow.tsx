"use client";

import React from 'react';

interface CompactFormRowProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

const CompactFormRow: React.FC<CompactFormRowProps> = ({
  label,
  required = false,
  children,
  className = ''
}) => {
  return (
    <div className={`flex items-center py-2 ${className}`}>
      <div className="w-2/5 pr-3">
        <label className="text-xs font-medium text-gray-700 leading-tight">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      </div>
      <div className="w-3/5">
        {children}
      </div>
    </div>
  );
};

export default CompactFormRow;
