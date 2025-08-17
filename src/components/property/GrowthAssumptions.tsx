"use client";

import React from "react";
import CollapsibleSection from "../ui/CollapsibleSection";

interface ModelingAssumptions {
  rentGrowth: number;
  capitalGrowth: number;
  inflationRate: number;
  discountRate: number;
  taxRate: number;
}

interface GrowthAssumptionsProps {
  assumptions: ModelingAssumptions;
  onAssumptionsChange: (assumptions: ModelingAssumptions) => void;
}

export default function GrowthAssumptions({ assumptions, onAssumptionsChange }: GrowthAssumptionsProps) {
  
  const updateAssumption = (field: keyof ModelingAssumptions, value: string) => {
    onAssumptionsChange({
      ...assumptions,
      [field]: parseFloat(value) || 0
    });
  };

  const summary = (
    <div className="text-sm text-[#6b7280]">
      Rent: {assumptions.rentGrowth}% | Capital: {assumptions.capitalGrowth}% | Inflation: {assumptions.inflationRate}%
    </div>
  );

  return (
    <CollapsibleSection 
      title="Growth & Cashflow Assumptions" 
      summary={summary}
      defaultExpanded={false}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Growth Rates */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-[#111827] border-b border-[#e5e7eb] pb-2">
            Growth Rates
          </h3>
          
          <div>
            <label className="block text-xs font-medium text-[#6b7280] mb-2">
              Rent Growth Rate (% per annum)
            </label>
            <input
              type="number"
              step="0.1"
              value={assumptions.rentGrowth || ''}
              onChange={(e) => updateAssumption('rentGrowth', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
              placeholder="3.0"
            />
            <p className="text-xs text-[#6b7280] mt-1">Annual increase in rental income</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#6b7280] mb-2">
              Capital Growth Rate (% per annum)
            </label>
            <input
              type="number"
              step="0.1"
              value={assumptions.capitalGrowth || ''}
              onChange={(e) => updateAssumption('capitalGrowth', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
              placeholder="5.0"
            />
            <p className="text-xs text-[#6b7280] mt-1">Annual increase in property value</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#6b7280] mb-2">
              Inflation Rate (% per annum)
            </label>
            <input
              type="number"
              step="0.1"
              value={assumptions.inflationRate || ''}
              onChange={(e) => updateAssumption('inflationRate', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
              placeholder="2.5"
            />
            <p className="text-xs text-[#6b7280] mt-1">General inflation rate for expenses</p>
          </div>
        </div>

        {/* Financial Assumptions */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-[#111827] border-b border-[#e5e7eb] pb-2">
            Financial Assumptions
          </h3>
          
          <div>
            <label className="block text-xs font-medium text-[#6b7280] mb-2">
              Discount Rate (% per annum)
            </label>
            <input
              type="number"
              step="0.1"
              value={assumptions.discountRate || ''}
              onChange={(e) => updateAssumption('discountRate', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
              placeholder="8.0"
            />
            <p className="text-xs text-[#6b7280] mt-1">Rate for NPV calculations</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#6b7280] mb-2">
              Tax Rate (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={assumptions.taxRate || ''}
              onChange={(e) => updateAssumption('taxRate', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
              placeholder="30.0"
            />
            <p className="text-xs text-[#6b7280] mt-1">Marginal tax rate for calculations</p>
          </div>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="mt-6 pt-4 border-t border-[#e5e7eb]">
        <h4 className="text-xs font-medium text-[#6b7280] mb-3">Quick Presets</h4>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => onAssumptionsChange({
              rentGrowth: 3.0,
              capitalGrowth: 5.0,
              inflationRate: 2.5,
              discountRate: 8.0,
              taxRate: 30.0
            })}
            className="px-3 py-1 text-xs font-medium text-[#2563eb] bg-[#eff6ff] border border-[#2563eb] rounded-md hover:bg-[#dbeafe] transition-colors"
          >
            Conservative
          </button>
          <button
            onClick={() => onAssumptionsChange({
              rentGrowth: 4.0,
              capitalGrowth: 7.0,
              inflationRate: 3.0,
              discountRate: 10.0,
              taxRate: 35.0
            })}
            className="px-3 py-1 text-xs font-medium text-[#2563eb] bg-[#eff6ff] border border-[#2563eb] rounded-md hover:bg-[#dbeafe] transition-colors"
          >
            Moderate
          </button>
          <button
            onClick={() => onAssumptionsChange({
              rentGrowth: 5.0,
              capitalGrowth: 8.0,
              inflationRate: 3.5,
              discountRate: 12.0,
              taxRate: 40.0
            })}
            className="px-3 py-1 text-xs font-medium text-[#2563eb] bg-[#eff6ff] border border-[#2563eb] rounded-md hover:bg-[#dbeafe] transition-colors"
          >
            Aggressive
          </button>
        </div>
      </div>
    </CollapsibleSection>
  );
}
