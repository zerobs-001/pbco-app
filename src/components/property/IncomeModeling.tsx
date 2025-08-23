"use client";

import React, { useState, useMemo } from "react";
import CompactInput from "../ui/CompactInput";

interface IncomeItem {
  id: string;
  name: string;
  amount: number;
  growthRate: number;
  isCustom: boolean;
}

interface IncomeModelingProps {
  onIncomeChange: (totalIncome: number, incomeItems: IncomeItem[]) => void;
  initialIncome?: number;
}

const DEFAULT_INCOME_ITEMS: IncomeItem[] = [
  {
    id: "rental_income",
    name: "Rental Income",
    amount: 0,
    growthRate: 3.0,
    isCustom: true // Changed to true so it can be removed
  },
  {
    id: "other_income",
    name: "Other Income",
    amount: 0,
    growthRate: 2.0,
    isCustom: true // Changed to true so it can be removed
  }
];

export default function IncomeModeling({ onIncomeChange, initialIncome = 0 }: IncomeModelingProps) {
  const [incomeItems, setIncomeItems] = useState<IncomeItem[]>(() => {
    // Initialize with rental income if provided
    if (initialIncome > 0) {
      const items = [...DEFAULT_INCOME_ITEMS];
      items[0].amount = initialIncome;
      return items;
    }
    return DEFAULT_INCOME_ITEMS;
  });

  const totalIncome = useMemo(() => {
    return incomeItems.reduce((total, item) => total + item.amount, 0);
  }, [incomeItems]);

  // Notify parent of changes
  React.useEffect(() => {
    onIncomeChange(totalIncome, incomeItems);
  }, [totalIncome, incomeItems, onIncomeChange]);

  const updateIncomeItem = (id: string, field: keyof IncomeItem, value: string | number) => {
    setIncomeItems(items => 
      items.map(item => 
        item.id === id 
          ? { ...item, [field]: field === 'name' ? value : parseFloat(value.toString()) || 0 }
          : item
      )
    );
  };

  const addCustomIncomeItem = () => {
    const newItem: IncomeItem = {
      id: `custom_${Date.now()}`,
      name: "Custom Income",
      amount: 0,
      growthRate: 2.0,
      isCustom: true
    };
    setIncomeItems(items => [...items, newItem]);
  };

  const removeIncomeItem = (id: string) => {
    setIncomeItems(items => items.filter(item => item.id !== id));
  };

  const formatCurrency = (amount: number): string => {
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    } else {
      return `$${amount.toFixed(0)}`;
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-green-50 border-l-2 border-green-400 p-3">
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold text-green-800">Total Annual Income</span>
          <span className="text-sm font-bold text-green-900">{formatCurrency(totalIncome)}</span>
        </div>
      </div>

      {/* Table Header */}
      <div className="border-b border-gray-200 pb-2">
        <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-700">
          <div className="col-span-4">Income Source</div>
          <div className="col-span-3">Annual Amount</div>
          <div className="col-span-2">Growth %</div>
          <div className="col-span-2 text-right">Per Month</div>
          <div className="col-span-1"></div>
        </div>
      </div>

      {/* Income Items Table */}
      <div className="space-y-1">
        {incomeItems.map((item) => (
          <div key={item.id} className="grid grid-cols-12 gap-2 items-center py-1 hover:bg-gray-50 rounded">
            {/* Income Source */}
            <div className="col-span-4">
              {item.isCustom ? (
                <CompactInput
                  value={item.name}
                  onChange={(value) => updateIncomeItem(item.id, 'name', value)}
                  placeholder="Income source"
                  className="text-xs"
                />
              ) : (
                <div className="text-xs font-medium text-gray-900 py-1 border-b border-transparent">
                  {item.name}
                </div>
              )}
            </div>

            {/* Annual Amount */}
            <div className="col-span-3">
              <CompactInput
                type="number"
                value={item.amount ? item.amount.toString() : ''}
                onChange={(value) => updateIncomeItem(item.id, 'amount', value)}
                placeholder="0"
                className="text-xs"
              />
            </div>

            {/* Growth Rate */}
            <div className="col-span-2">
              <CompactInput
                type="number"
                step={0.1}
                value={item.growthRate ? item.growthRate.toString() : ''}
                onChange={(value) => updateIncomeItem(item.id, 'growthRate', value)}
                placeholder="0.0"
                className="text-xs"
              />
            </div>

            {/* Per Month (Display) */}
            <div className="col-span-2">
              <div className="text-xs text-gray-600 py-1 border-b border-transparent text-right">
                {formatCurrency(item.amount / 12)}
              </div>
            </div>

            {/* Remove Button */}
            <div className="col-span-1 flex justify-end">
              <button
                onClick={() => removeIncomeItem(item.id)}
                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                title="Remove item"
              >
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Custom Item Button */}
      <button
        onClick={addCustomIncomeItem}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-[#2563eb] bg-[#f8fafc] border border-[#e5e7eb] border-dashed rounded hover:bg-[#eff6ff] hover:border-[#2563eb] transition-colors"
      >
        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Income Item
      </button>
    </div>
  );
}
