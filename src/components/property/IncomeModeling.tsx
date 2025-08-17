"use client";

import React, { useState, useMemo } from "react";
import CollapsibleSection from "../ui/CollapsibleSection";

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

  const summary = (
    <div className="font-medium text-[#111827]">
      Total: {formatCurrency(totalIncome)}/year
    </div>
  );

  return (
    <CollapsibleSection 
      title="Income Modeling" 
      summary={summary}
      defaultExpanded={false}
    >
      <div className="space-y-4">
        {/* Summary Bar */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-green-800">Total Annual Income</span>
            <span className="text-lg font-bold text-green-900">{formatCurrency(totalIncome)}</span>
          </div>
        </div>

        {/* Income Items */}
        <div className="space-y-3">
          {incomeItems.map((item) => (
            <div key={item.id} className="border border-[#e5e7eb] rounded-lg p-4">
              <div className="grid grid-cols-1 gap-3 items-center md:grid-cols-12">
                {/* Name */}
                <div className="col-span-1 md:col-span-4">
                  <label className="block text-xs font-medium text-[#6b7280] mb-1">
                    Income Source
                  </label>
                  {item.isCustom ? (
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateIncomeItem(item.id, 'name', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                    />
                  ) : (
                    <div className="text-sm font-medium text-[#111827] py-2">{item.name}</div>
                  )}
                </div>

                {/* Annual Amount */}
                <div className="col-span-1 md:col-span-3">
                  <label className="block text-xs font-medium text-[#6b7280] mb-1">
                    Annual Amount
                  </label>
                  <input
                    type="number"
                    value={item.amount || ''}
                    onChange={(e) => updateIncomeItem(item.id, 'amount', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                    placeholder="0"
                  />
                </div>

                {/* Growth Rate */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-medium text-[#6b7280] mb-1">
                    Growth %
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={item.growthRate || ''}
                    onChange={(e) => updateIncomeItem(item.id, 'growthRate', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                    placeholder="0.0"
                  />
                </div>

                {/* Monthly Amount (Display) */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-medium text-[#6b7280] mb-1">
                    Per Month
                  </label>
                  <div className="text-sm text-[#6b7280] py-2">
                    {formatCurrency(item.amount / 12)}
                  </div>
                </div>

                {/* Remove Button */}
                <div className="col-span-1 md:col-span-1 flex justify-end">
                  <button
                    onClick={() => removeIncomeItem(item.id)}
                    className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                    title="Remove item"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Custom Item Button */}
        <button
          onClick={addCustomIncomeItem}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-[#2563eb] bg-[#f8fafc] border border-[#e5e7eb] border-dashed rounded-lg hover:bg-[#eff6ff] hover:border-[#2563eb] transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Custom Income Item
        </button>
      </div>
    </CollapsibleSection>
  );
}
