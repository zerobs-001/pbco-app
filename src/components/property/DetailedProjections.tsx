"use client";

import React, { useMemo } from "react";
import CollapsibleSection from "../ui/CollapsibleSection";

interface ProjectionData {
  year: number;
  propertyValue: number;
  loanAmount: number;
  equity: number;
  principalPayments: number;
  principalPaymentsCumulative: number;
  estimatedInterestRate: number;
  grossIncome: number;
  grossYieldPercent: number;
  cashOutflows: number;
  interestExpense: number;
  operatingExpenses: number;
  netAnnualCashflow: number;
  netAnnualCashflowCumulative: number;
  netYieldPercent: number;
  incomePerMonth: number;
  capitalGrowthAnnual: number;
  capitalGrowthCumulative: number;
  totalPerformance: number;
  totalPerformanceIncPrincipal: number;
  cashOnCashReturnCumulative: number;
  returnOnInvestedCapital: number;
}

interface DetailedProjectionsProps {
  propertyValue: number;
  totalIncome: number;
  totalOutgoings: number;
  loanAmount: number;
  interestRate: number;
  assumptions: {
    rentGrowth: number;
    capitalGrowth: number;
    inflationRate: number;
    discountRate: number;
    taxRate: number;
  };
  totalCashInvested: number;
}

export default function DetailedProjections({
  propertyValue,
  totalIncome,
  totalOutgoings,
  loanAmount,
  interestRate,
  assumptions,
  totalCashInvested
}: DetailedProjectionsProps) {

  const projections = useMemo(() => {
    const data: ProjectionData[] = [];
    const currentYear = new Date().getFullYear();
    
    let cumulativePrincipalPayments = 0;
    let cumulativeCashflow = 0;
    let cumulativeCapitalGrowth = 0;

    for (let i = 0; i < 30; i++) {
      const year = currentYear + i;
      const yearIndex = i;

      // Property value with capital growth
      const currentPropertyValue = propertyValue * Math.pow(1 + assumptions.capitalGrowth / 100, yearIndex);
      
      // Loan calculations (assuming P&I loan)
      const monthlyRate = interestRate / 100 / 12;
      const totalPayments = 30 * 12; // 30 year loan
      const monthlyPayment = loanAmount > 0 && monthlyRate > 0 
        ? (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
          (Math.pow(1 + monthlyRate, totalPayments) - 1)
        : 0;
      
      const remainingBalance = loanAmount > 0 && monthlyRate > 0
        ? loanAmount * (Math.pow(1 + monthlyRate, totalPayments) - Math.pow(1 + monthlyRate, yearIndex * 12)) /
          (Math.pow(1 + monthlyRate, totalPayments) - 1)
        : Math.max(0, loanAmount - (yearIndex * loanAmount / 30)); // Simple linear if no interest

      const currentLoanAmount = Math.max(0, remainingBalance);
      
      // Annual principal payment
      const principalPayment = yearIndex === 0 
        ? (loanAmount - remainingBalance)
        : Math.max(0, data[yearIndex - 1].loanAmount - currentLoanAmount);
      
      cumulativePrincipalPayments += principalPayment;

      // Income calculations
      const currentGrossIncome = totalIncome * Math.pow(1 + assumptions.rentGrowth / 100, yearIndex);
      const grossYield = currentPropertyValue > 0 ? (currentGrossIncome / currentPropertyValue) * 100 : 0;

      // Expense calculations
      const currentOperatingExpenses = totalOutgoings * Math.pow(1 + assumptions.inflationRate / 100, yearIndex);
      const currentInterestExpense = currentLoanAmount * (interestRate / 100);
      const totalCashOutflows = currentOperatingExpenses + currentInterestExpense;

      // Net cashflow
      const netCashflow = currentGrossIncome - totalCashOutflows;
      cumulativeCashflow += netCashflow;
      
      const netYield = currentPropertyValue > 0 ? (netCashflow / currentPropertyValue) * 100 : 0;
      const incomePerMonth = netCashflow / 12;

      // Capital growth
      const annualCapitalGrowth = yearIndex === 0 
        ? 0 
        : currentPropertyValue - (propertyValue * Math.pow(1 + assumptions.capitalGrowth / 100, yearIndex - 1));
      cumulativeCapitalGrowth += annualCapitalGrowth;

      // Total performance
      const totalPerformance = cumulativeCashflow + cumulativeCapitalGrowth;
      const totalPerformanceIncPrincipal = totalPerformance + cumulativePrincipalPayments;

      // Returns
      const cashOnCashReturn = totalCashInvested > 0 ? (cumulativeCashflow / totalCashInvested) * 100 : 0;
      const returnOnInvestedCapital = totalCashInvested > 0 ? (totalPerformanceIncPrincipal / totalCashInvested) * 100 : 0;

      data.push({
        year,
        propertyValue: currentPropertyValue,
        loanAmount: currentLoanAmount,
        equity: currentPropertyValue - currentLoanAmount,
        principalPayments: principalPayment,
        principalPaymentsCumulative: cumulativePrincipalPayments,
        estimatedInterestRate: interestRate,
        grossIncome: currentGrossIncome,
        grossYieldPercent: grossYield,
        cashOutflows: totalCashOutflows,
        interestExpense: currentInterestExpense,
        operatingExpenses: currentOperatingExpenses,
        netAnnualCashflow: netCashflow,
        netAnnualCashflowCumulative: cumulativeCashflow,
        netYieldPercent: netYield,
        incomePerMonth: incomePerMonth,
        capitalGrowthAnnual: annualCapitalGrowth,
        capitalGrowthCumulative: cumulativeCapitalGrowth,
        totalPerformance,
        totalPerformanceIncPrincipal,
        cashOnCashReturnCumulative: cashOnCashReturn,
        returnOnInvestedCapital
      });
    }

    return data;
  }, [propertyValue, totalIncome, totalOutgoings, loanAmount, interestRate, assumptions, totalCashInvested]);

  const formatCurrency = (amount: number): string => {
    if (typeof window === 'undefined') return '$0';
    const absAmount = Math.abs(amount);
    if (absAmount >= 1000000) {
      return `${amount < 0 ? '-' : ''}$${(absAmount / 1000000).toFixed(1)}M`;
    } else if (absAmount >= 1000) {
      return `${amount < 0 ? '-' : ''}$${(absAmount / 1000).toFixed(0)}K`;
    } else {
      return `${amount < 0 ? '-' : ''}$${absAmount.toFixed(0)}`;
    }
  };

  const formatPercent = (percent: number): string => {
    if (typeof window === 'undefined') return '0%';
    return `${percent.toFixed(1)}%`;
  };

  const rows = [
    { label: "Property Value", key: "propertyValue", format: formatCurrency },
    { label: "Loan Amount", key: "loanAmount", format: formatCurrency },
    { label: "Equity", key: "equity", format: formatCurrency },
    { label: "Principal Payments", key: "principalPayments", format: formatCurrency },
    { label: "Principal Payments (cumulative)", key: "principalPaymentsCumulative", format: formatCurrency },
    { label: "Estimated Interest Rate", key: "estimatedInterestRate", format: formatPercent },
    { label: "Gross Income", key: "grossIncome", format: formatCurrency },
    { label: "Gross Yield %", key: "grossYieldPercent", format: formatPercent },
    { label: "Cash Outflows", key: "cashOutflows", format: formatCurrency },
    { label: "Interest Expense", key: "interestExpense", format: formatCurrency },
    { label: "Operating Expenses", key: "operatingExpenses", format: formatCurrency },
    { label: "Net Annual Cashflow", key: "netAnnualCashflow", format: formatCurrency },
    { label: "Net Annual Cashflow (cumulative)", key: "netAnnualCashflowCumulative", format: formatCurrency },
    { label: "Net Yield %", key: "netYieldPercent", format: formatPercent },
    { label: "Income/(Cost) Per Month", key: "incomePerMonth", format: formatCurrency },
    { label: "Capital Growth (annual)", key: "capitalGrowthAnnual", format: formatCurrency },
    { label: "Capital Growth (cumulative)", key: "capitalGrowthCumulative", format: formatCurrency },
    { label: "Total Performance", key: "totalPerformance", format: formatCurrency },
    { label: "Total Performance inc Principal", key: "totalPerformanceIncPrincipal", format: formatCurrency },
    { label: "Cash on Cash Return (cumulative)", key: "cashOnCashReturnCumulative", format: formatPercent },
    { label: "Return on Invested Capital", key: "returnOnInvestedCapital", format: formatPercent }
  ];

  const summary = (
    <div className="text-sm text-[#6b7280]">
      30-year projections • {projections.length} years • Scroll horizontally →
    </div>
  );

  return (
    <CollapsibleSection 
      title="Detailed Projections" 
      summary={summary}
      defaultExpanded={false}
    >
      <div className="space-y-4">
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            <strong>30-Year Financial Projections:</strong> Scroll horizontally to view all years. 
            All calculations update automatically based on your income, outgoings, and assumptions above.
          </p>
        </div>

        {/* Table Container with Horizontal Scroll */}
        <div className="border border-[#e5e7eb] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#f9fafb] border-b border-[#e5e7eb]">
                <tr>
                  <th className="sticky left-0 bg-[#f9fafb] px-4 py-3 text-left font-medium text-[#111827] border-r border-[#e5e7eb] min-w-[200px]">
                    Metric
                  </th>
                  {projections.map((projection) => (
                    <th key={projection.year} className="px-3 py-3 text-center font-medium text-[#111827] min-w-[80px] border-r border-[#e5e7eb] last:border-r-0">
                      {projection.year}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                {rows.map((row, rowIndex) => (
                  <tr key={row.key} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-[#f9fafb]'}>
                    <td className="sticky left-0 bg-inherit px-4 py-3 font-medium text-[#111827] border-r border-[#e5e7eb] min-w-[200px]">
                      {row.label}
                    </td>
                    {projections.map((projection) => {
                      const value = projection[row.key as keyof ProjectionData] as number;
                      const isNegative = value < 0;
                      const isPositive = value > 0;
                      
                      return (
                        <td 
                          key={`${row.key}-${projection.year}`} 
                          className={`px-3 py-3 text-center text-xs border-r border-[#e5e7eb] last:border-r-0 ${
                            isNegative ? 'text-red-600' : 
                            isPositive && (row.key.includes('cashflow') || row.key.includes('Return')) ? 'text-green-600' : 
                            'text-[#111827]'
                          }`}
                        >
                          {row.format(value)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[#e5e7eb]">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-sm font-medium text-green-800">30-Year Total Return</div>
            <div className="text-xl font-bold text-green-900">
              {formatCurrency(projections[29]?.totalPerformanceIncPrincipal || 0)}
            </div>
            <div className="text-xs text-green-600">Including principal payments</div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm font-medium text-blue-800">Total Cash Generated</div>
            <div className="text-xl font-bold text-blue-900">
              {formatCurrency(projections[29]?.netAnnualCashflowCumulative || 0)}
            </div>
            <div className="text-xs text-blue-600">Cumulative cashflow over 30 years</div>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="text-sm font-medium text-purple-800">Final ROI</div>
            <div className="text-xl font-bold text-purple-900">
              {formatPercent(projections[29]?.returnOnInvestedCapital || 0)}
            </div>
            <div className="text-xs text-purple-600">Return on invested capital</div>
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
}
