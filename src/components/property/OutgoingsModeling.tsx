"use client";

import React, { useState, useMemo } from "react";
import CompactInput from "../ui/CompactInput";

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
    isCustom: true // Changed to true so it can be removed
  },
  {
    id: "property_management",
    name: "Property Management",
    amount: 0,
    growthRate: 3.0,
    isCustom: true // Changed to true so it can be removed
  },
  {
    id: "insurance",
    name: "Building & Landlord Insurance",
    amount: 0,
    growthRate: 4.0,
    isCustom: true // Changed to true so it can be removed
  },
  {
    id: "council_rates",
    name: "Council Rates + Water Estimate",
    amount: 0,
    growthRate: 3.5,
    isCustom: true // Changed to true so it can be removed
  },
  {
    id: "yard_maintenance",
    name: "Yard Maintenance (multi-dwelling)",
    amount: 0,
    growthRate: 3.0,
    isCustom: true // Changed to true so it can be removed
  },
  {
    id: "maintenance_allowance",
    name: "Maintenance Allowance",
    amount: 0,
    growthRate: 4.0,
    isCustom: true // Changed to true so it can be removed
  },
  {
    id: "land_tax",
    name: "Land Tax (if applicable)",
    amount: 0,
    growthRate: 3.0,
    isCustom: true // Changed to true so it can be removed
  },
  {
    id: "principal_payments",
    name: "Principal Payments",
    amount: 0,
    growthRate: 0,
    isCustom: true // Changed to true so it can be removed
  },
  {
    id: "deductions_rebate",
    name: "Potential Deductions / Rebate",
    amount: 0,
    growthRate: 0,
    isCustom: true // Changed to true so it can be removed
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
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    } else {
      return `$${amount.toFixed(0)}`;
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-secondary/10 border-l-4 border-secondary p-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-secondary">Total Annual Outgoings</span>
          <span className="text-lg font-bold text-secondary">{formatCurrency(totalOutgoings)}</span>
        </div>
      </div>

      {/* Table Header */}
      <div className="border-b border-border pb-2">
        <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-secondary">
          <div className="col-span-4">Expense Category</div>
          <div className="col-span-3">Annual Amount</div>
          <div className="col-span-2">Growth %</div>
          <div className="col-span-2 text-right">Per Month</div>
          <div className="col-span-1"></div>
        </div>
      </div>

      {/* Outgoing Items Table */}
      <div className="space-y-1">
        {outgoingItems.map((item) => (
          <div key={item.id} className="grid grid-cols-12 gap-2 items-center py-1 hover:bg-secondary/5 rounded">
            {/* Expense Category */}
            <div className="col-span-4">
              {item.isCustom ? (
                <CompactInput
                  value={item.name}
                  onChange={(value) => updateOutgoingItem(item.id, 'name', value)}
                  placeholder="Expense category"
                  className="text-xs h-8"
                />
              ) : (
                <div className="text-xs font-medium text-foreground py-2 px-1">
                  {item.name}
                </div>
              )}
            </div>

            {/* Annual Amount */}
            <div className="col-span-3">
              <CompactInput
                type="currency"
                value={item.amount ? item.amount.toString() : ''}
                onChange={(value) => updateOutgoingItem(item.id, 'amount', value.replace(/,/g, ''))}
                placeholder="0"
                className="text-xs h-8"
              />
            </div>

            {/* Growth Rate */}
            <div className="col-span-2">
              <CompactInput
                type="number"
                step={0.1}
                value={item.growthRate ? item.growthRate.toString() : ''}
                onChange={(value) => updateOutgoingItem(item.id, 'growthRate', value)}
                placeholder="0.0"
                className="text-xs h-8"
              />
            </div>

            {/* Per Month (Display) */}
            <div className="col-span-2">
              <div className="text-xs text-muted-foreground py-2 px-1 text-right">
                {formatCurrency(item.amount / 12)}
              </div>
            </div>

            {/* Remove Button */}
            <div className="col-span-1 flex justify-end">
              <button
                onClick={() => removeOutgoingItem(item.id)}
                className="p-1 text-destructive hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
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
        onClick={addCustomOutgoingItem}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-secondary bg-secondary/10 border border-secondary border-dashed rounded hover:bg-secondary/20 hover:border-secondary transition-colors"
      >
        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Expense Item
      </button>
    </div>
  );
}
