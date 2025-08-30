"use client";

import React from "react";
import CompactInput from "../ui/CompactInput";
import CompactFormRow from "../ui/CompactFormRow";

interface ModelingAssumptions {
  rentGrowth: number;
  capitalGrowth: number;
  inflationRate: number;
  discountRate: number;
  taxRate: number;
  medicareLevy: number;
  vacancyRate: number;
  pmFeeRate: number;
  depreciationRate: number;
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

  return (
    <div className="space-y-4">
      {/* Growth Rates */}
      <div>
        <h3 className="text-sm font-semibold text-secondary mb-2">Growth Rates</h3>
        <div className="space-y-1">
          <CompactFormRow label="Rent Growth (% p.a.)" required htmlFor="rent-growth">
            <CompactInput
              id="rent-growth"
              type="number"
              step={0.1}
              value={assumptions.rentGrowth ? assumptions.rentGrowth.toString() : ''}
              onChange={(value) => updateAssumption('rentGrowth', value)}
              placeholder="3.0"
            />
          </CompactFormRow>

          <CompactFormRow label="Capital Growth (% p.a.)" required htmlFor="capital-growth">
            <CompactInput
              id="capital-growth"
              type="number"
              step={0.1}
              value={assumptions.capitalGrowth ? assumptions.capitalGrowth.toString() : ''}
              onChange={(value) => updateAssumption('capitalGrowth', value)}
              placeholder="5.0"
            />
          </CompactFormRow>

          <CompactFormRow label="Inflation Rate (% p.a.)" required htmlFor="inflation-rate">
            <CompactInput
              id="inflation-rate"
              type="number"
              step={0.1}
              value={assumptions.inflationRate ? assumptions.inflationRate.toString() : ''}
              onChange={(value) => updateAssumption('inflationRate', value)}
              placeholder="2.5"
            />
          </CompactFormRow>
        </div>
      </div>

      {/* Tax & Financial */}
      <div className="pt-3 border-t border-border">
        <h3 className="text-sm font-semibold text-secondary mb-2">Tax & Financial</h3>
        <div className="space-y-1">
          <CompactFormRow label="Marginal Tax Rate (%)" required htmlFor="tax-rate">
            <CompactInput
              id="tax-rate"
              type="number"
              step={0.1}
              value={assumptions.taxRate ? assumptions.taxRate.toString() : ''}
              onChange={(value) => updateAssumption('taxRate', value)}
              placeholder="30.0"
            />
          </CompactFormRow>

          <CompactFormRow label="Medicare Levy (%)" htmlFor="medicare-levy">
            <CompactInput
              id="medicare-levy"
              type="number"
              step={0.1}
              value={assumptions.medicareLevy ? assumptions.medicareLevy.toString() : ''}
              onChange={(value) => updateAssumption('medicareLevy', value)}
              placeholder="2.0"
            />
          </CompactFormRow>

          <CompactFormRow label="Discount Rate (% p.a.)" htmlFor="discount-rate">
            <CompactInput
              id="discount-rate"
              type="number"
              step={0.1}
              value={assumptions.discountRate ? assumptions.discountRate.toString() : ''}
              onChange={(value) => updateAssumption('discountRate', value)}
              placeholder="8.0"
            />
          </CompactFormRow>

          <CompactFormRow label="Depreciation Rate (%)" htmlFor="depreciation-rate">
            <CompactInput
              id="depreciation-rate"
              type="number"
              step={0.1}
              value={assumptions.depreciationRate ? assumptions.depreciationRate.toString() : ''}
              onChange={(value) => updateAssumption('depreciationRate', value)}
              placeholder="2.5"
            />
          </CompactFormRow>
        </div>
      </div>

      {/* Property Management */}
      <div className="pt-3 border-t border-border">
        <h3 className="text-sm font-semibold text-secondary mb-2">Property Management</h3>
        <div className="space-y-1">
          <CompactFormRow label="Vacancy Rate (%)" required htmlFor="vacancy-rate">
            <CompactInput
              id="vacancy-rate"
              type="number"
              step={0.1}
              value={assumptions.vacancyRate ? assumptions.vacancyRate.toString() : ''}
              onChange={(value) => updateAssumption('vacancyRate', value)}
              placeholder="5.0"
            />
          </CompactFormRow>

          <CompactFormRow label="PM Fee (% of rent)" required htmlFor="pm-fee-rate">
            <CompactInput
              id="pm-fee-rate"
              type="number"
              step={0.1}
              value={assumptions.pmFeeRate ? assumptions.pmFeeRate.toString() : ''}
              onChange={(value) => updateAssumption('pmFeeRate', value)}
              placeholder="8.0"
            />
          </CompactFormRow>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="pt-3 border-t border-border">
        <h3 className="text-sm font-semibold text-secondary mb-2">Quick Presets</h3>
        <div className="flex gap-2">
          <button
            onClick={() => onAssumptionsChange({
              rentGrowth: 3.0,
              capitalGrowth: 5.0,
              inflationRate: 2.5,
              discountRate: 8.0,
              taxRate: 30.0,
              medicareLevy: 2.0,
              vacancyRate: 5.0,
              pmFeeRate: 8.0,
              depreciationRate: 2.5
            })}
            className="px-3 py-1 text-xs font-medium text-secondary bg-secondary/10 border border-secondary rounded hover:bg-secondary/20 transition-colors"
          >
            Conservative
          </button>
          <button
            onClick={() => onAssumptionsChange({
              rentGrowth: 4.0,
              capitalGrowth: 7.0,
              inflationRate: 3.0,
              discountRate: 10.0,
              taxRate: 35.0,
              medicareLevy: 2.0,
              vacancyRate: 7.0,
              pmFeeRate: 8.5,
              depreciationRate: 2.5
            })}
            className="px-3 py-1 text-xs font-medium text-secondary bg-secondary/10 border border-secondary rounded hover:bg-secondary/20 transition-colors"
          >
            Moderate
          </button>
          <button
            onClick={() => onAssumptionsChange({
              rentGrowth: 5.0,
              capitalGrowth: 8.0,
              inflationRate: 3.5,
              discountRate: 12.0,
              taxRate: 40.0,
              medicareLevy: 2.0,
              vacancyRate: 10.0,
              pmFeeRate: 9.0,
              depreciationRate: 2.5
            })}
            className="px-3 py-1 text-xs font-medium text-secondary bg-secondary/10 border border-secondary rounded hover:bg-secondary/20 transition-colors"
          >
            Aggressive
          </button>
        </div>
      </div>
    </div>
  );
}
