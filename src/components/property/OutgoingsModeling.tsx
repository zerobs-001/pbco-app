"use client";

import React, { useState, useMemo } from "react";
import CollapsibleSection from "../ui/CollapsibleSection";

interface OutgoingItem {
  id: string;
  name: string;
  amount: number;
  growthRate: number;
  isCustom: boolean;
}

interface OutgoingsModelingProps {
  onOutgoingsChange: (totalOutgoings: number, outgoingItems: OutgoingItem[]) => void;
  initialExpenses?: number;
}

const DEFAULT_OUTGOING_ITEMS: OutgoingItem[] = [
  {
    id: "loan_interest",
    name: "Loan Interest",
    amount: 0,
    growthRate: 0,
    isCustom: false
  },
  {
    id: "property_management",
    name: "Property Management",
    amount: 0,
    growthRate: 3.0,
    isCustom: false
  },
  {
    id: "insurance",
    name: "Building & Landlord Insurance",
    amount: 0,
    growthRate: 4.0,
    isCustom: false
  },
  {
    id: "council_rates",
    name: "Council Rates + Water Estimate",
    amount: 0,
    growthRate: 3.5,
    isCustom: false
  },
  {
    id: "yard_maintenance",
    name: "Yard Maintenance (multi-dwelling)",
    amount: 0,
    growthRate: 3.0,
    isCustom: false
  },
  {
    id: "maintenance_allowance",
    name: "Maintenance Allowance",
    amount: 0,
    growthRate: 4.0,
    isCustom: false
  },
  {
    id: "land_tax",
    name: "Land Tax (if applicable)",
    amount: 0,
    growthRate: 3.0,
    isCustom: false
  },
  {
    id: "principal_payments",
    name: "Principal Payments",
    amount: 0,
    growthRate: 0,
    isCustom: false
  },
  {
    id: "deductions_rebate",
    name: "Potential Deductions / Rebate",
    amount: 0,
    growthRate: 0,
    isCustom: false
  }
];

export default function OutgoingsModeling({ onOutgoingsChange, initialExpenses = 0 }: OutgoingsModelingProps) {
  const [outgoingItems, setOutgoingItems] = useState<OutgoingItem[]>(() => {
    // Initialize with initial expenses if provided
    if (initialExpenses > 0) {
      const items = [...DEFAULT_OUTGOING_ITEMS];
      // Distribute initial expenses across maintenance allowance as a starting point
      const maintenanceIndex = items.findIndex(item => item.id === 'maintenance_allowance');
      if (maintenanceIndex !== -1) {
        items[maintenanceIndex].amount = initialExpenses;
      }
      return items;
    }
    return DEFAULT_OUTGOING_ITEMS;
  });

  const totalOutgoings = useMemo(() => {
    return outgoingItems.reduce((total, item) => total + item.amount, 0);
  }, [outgoingItems]);

  // Notify parent of changes
  React.useEffect(() => {
    onOutgoingsChange(totalOutgoings, outgoingItems);
  }, [totalOutgoings, outgoingItems, onOutgoingsChange]);

  const updateOutgoingItem = (id: string, field: keyof OutgoingItem, value: string | number) => {
    setOutgoingItems(items => 
      items.map(item => 
        item.id === id 
          ? { ...item, [field]: field === 'name' ? value : parseFloat(value.toString()) || 0 }
          : item
      )
    );
  };

  const addCustomOutgoingItem = () => {
    const newItem: OutgoingItem = {
      id: `custom_${Date.now()}`,
      name: "Custom Outgoing",
      amount: 0,
      growthRate: 3.0,
      isCustom: true
    };
    setOutgoingItems(items => [...items, newItem]);
  };

  const removeOutgoingItem = (id: string) => {
    setOutgoingItems(items => items.filter(item => item.id !== id));
  };

  const formatCurrency = (amount: number): string => {
    return `$${(amount / 1000).toFixed(amount >= 1000 ? 0 : 1)}${amount >= 1000 ? 'K' : ''}`;
  };

  const summary = (
    <div className="font-medium text-[#111827]">
      Total: {formatCurrency(totalOutgoings)}/year
    </div>
  );

  return (
    <CollapsibleSection 
      title="Outgoings Modeling" 
      summary={summary}
      defaultExpanded={false}
    >
      <div className="space-y-4">
        {/* Summary Bar */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-red-800">Total Annual Outgoings</span>
            <span className="text-lg font-bold text-red-900">{formatCurrency(totalOutgoings)}</span>
          </div>
        </div>

        {/* Outgoing Items */}
        <div className="space-y-3">
          {outgoingItems.map((item) => (
            <div key={item.id} className="border border-[#e5e7eb] rounded-lg p-4">
              <div className="grid grid-cols-12 gap-3 items-center">
                {/* Name */}
                <div className="col-span-4">
                  <label className="block text-xs font-medium text-[#6b7280] mb-1">
                    Expense Category
                  </label>
                  {item.isCustom ? (
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateOutgoingItem(item.id, 'name', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                    />
                  ) : (
                    <div className="text-sm font-medium text-[#111827] py-2">{item.name}</div>
                  )}
                </div>

                {/* Annual Amount */}
                <div className="col-span-3">
                  <label className="block text-xs font-medium text-[#6b7280] mb-1">
                    Annual Amount
                  </label>
                  <input
                    type="number"
                    value={item.amount || ''}
                    onChange={(e) => updateOutgoingItem(item.id, 'amount', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                    placeholder="0"
                  />
                </div>

                {/* Growth Rate */}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-[#6b7280] mb-1">
                    Growth %
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={item.growthRate || ''}
                    onChange={(e) => updateOutgoingItem(item.id, 'growthRate', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                    placeholder="0.0"
                  />
                </div>

                {/* Monthly Amount (Display) */}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-[#6b7280] mb-1">
                    Per Month
                  </label>
                  <div className="text-sm text-[#6b7280] py-2">
                    {formatCurrency(item.amount / 12)}
                  </div>
                </div>

                {/* Remove Button */}
                <div className="col-span-1 flex justify-end">
                  {item.isCustom && (
                    <button
                      onClick={() => removeOutgoingItem(item.id)}
                      className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                      title="Remove item"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Custom Item Button */}
        <button
          onClick={addCustomOutgoingItem}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-[#2563eb] bg-[#f8fafc] border border-[#e5e7eb] border-dashed rounded-lg hover:bg-[#eff6ff] hover:border-[#2563eb] transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Custom Outgoing Item
        </button>
      </div>
    </CollapsibleSection>
  );
}
