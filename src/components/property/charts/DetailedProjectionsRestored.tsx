"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProjectionData {
  year: number;
  propertyValue: number;
  loanAmount: number;
  equity: number;
  principalPayments: number;
  principalPaymentsCumulative: number;
  interestPaymentsCumulative: number;
  estimatedInterestRate: number;
  grossIncome: number;
  vacancy: number;
  effectiveRent: number;
  pmFee: number;
  grossYieldPercent: number;
  operatingExpenses: number;
  NOI: number;
  interestExpense: number;
  depreciation: number;
  taxableIncome: number;
  tax: number;
  taxBenefit: number;
  preTaxCashflow: number;
  preTaxCashflowCumulative: number;
  netAnnualCashflow: number; // After-tax cashflow
  netAnnualCashflowCumulative: number; // After-tax cumulative
  netYieldPercent: number;
  incomePerMonth: number;
  capitalGrowthAnnual: number;
  capitalGrowthCumulative: number;
  totalPerformance: number;
  totalPerformanceIncPrincipal: number;
  cashOnCashReturnCumulative: number;
  returnOnInvestedCapital: number;
}

interface DetailedProjectionsRestoredProps {
  propertyValue: number;
  totalIncome: number;
  totalOutgoings: number;
  loanAmount: number;
  interestRate: number;
  loanType?: 'interest_only' | 'principal_interest';
  ioYears?: number;
  assumptions: {
    rentGrowth: number;
    capitalGrowth: number;
    inflationRate: number;
    discountRate: number;
    taxRate: number;
    medicareLevy: number;
    vacancyRate: number;
    pmFeeRate: number;
    depreciationRate: number;
  };
  totalCashInvested: number;
}

export default function DetailedProjectionsRestored({
  propertyValue,
  totalIncome,
  totalOutgoings,
  loanAmount,
  interestRate,
  loanType = 'principal_interest',
  ioYears = 0,
  assumptions,
  totalCashInvested
}: DetailedProjectionsRestoredProps) {

  const toggleGroup = (groupTitle: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupTitle]: !prev[groupTitle]
    }));
  };

  const projections = useMemo(() => {
    const data: ProjectionData[] = [];
    const currentYear = new Date().getFullYear();
    
    let cumulativePrincipalPayments = 0;
    let cumulativeInterestPayments = 0;
    let cumulativeCashflow = 0;
    let cumulativeAfterTaxCashflow = 0;
    let cumulativeCapitalGrowth = 0;
    let previousLoanBalance = loanAmount;

    for (let i = 0; i < 30; i++) {
      const year = currentYear + i;
      const yearIndex = i;

      // Property value with capital growth
      const currentPropertyValue = propertyValue * Math.pow(1 + assumptions.capitalGrowth / 100, yearIndex);
      
      // === LOAN CALCULATIONS (SPEC-COMPLIANT) ===
      const currentRate = interestRate / 100; // Annual rate
      // === INDUSTRY-STANDARD LOAN AMORTIZATION ===
      // Pre-calculate PMT for different loan scenarios (ideally done once outside loop)
      let monthlyPMT = 0;
      let piStartYear = 0;
      
      if (loanType === 'interest_only' && ioYears > 0 && ioYears < 30) {
        // IO→P&I: Calculate PMT for P&I period
        piStartYear = ioYears;
        const piYears = 30 - ioYears;
        const monthlyRate = currentRate / 12;
        const piMonths = piYears * 12;
        if (monthlyRate > 0 && piMonths > 0) {
          monthlyPMT = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, piMonths)) / 
                      (Math.pow(1 + monthlyRate, piMonths) - 1);
        }
      } else if (loanType === 'principal_interest') {
        if (ioYears > 0) {
          // P&I with IO period
          piStartYear = ioYears;
          const piYears = 30 - ioYears;
          const monthlyRate = currentRate / 12;
          const piMonths = piYears * 12;
          if (monthlyRate > 0 && piMonths > 0) {
            monthlyPMT = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, piMonths)) / 
                        (Math.pow(1 + monthlyRate, piMonths) - 1);
          }
        } else {
          // Standard P&I
          const monthlyRate = currentRate / 12;
          const totalMonths = 30 * 12;
          if (monthlyRate > 0) {
            monthlyPMT = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / 
                        (Math.pow(1 + monthlyRate, totalMonths) - 1);
          }
        }
      }
      
      // Calculate this year's loan payments
      const openingBalance = yearIndex === 0 ? loanAmount : previousLoanBalance;
      let interestExpense = 0;
      let principalPayment = 0;
      
      if (openingBalance > 0) {
        if (loanType === 'interest_only' && (ioYears === 0 || ioYears >= 30)) {
          // Pure Interest-Only: Balloon payment in final year
          interestExpense = openingBalance * currentRate;
          if (yearIndex === 29) { // Final year
            principalPayment = openingBalance;
          } else {
            principalPayment = 0;
          }
        } else if (yearIndex < piStartYear) {
          // Interest-Only period (for both IO→P&I and P&I with IO)
          interestExpense = openingBalance * currentRate;
          principalPayment = 0;
        } else {
          // Principal & Interest period - calculate month by month for accuracy
          if (yearIndex === 29) {
            // Final year: pay all remaining principal + interest for the year
            interestExpense = openingBalance * currentRate;
            principalPayment = openingBalance;
          } else {
            // Regular P&I year: use month-by-month calculation
            let yearInterest = 0;
            let yearPrincipal = 0;
            let monthlyBalance = openingBalance;
            const monthlyRate = currentRate / 12;
            
            for (let month = 0; month < 12; month++) {
              if (monthlyBalance <= 0) break;
              
              const monthlyInterest = monthlyBalance * monthlyRate;
              const monthlyPrincipalPmt = Math.min(monthlyPMT - monthlyInterest, monthlyBalance);
              
              yearInterest += monthlyInterest;
              yearPrincipal += Math.max(0, monthlyPrincipalPmt);
              monthlyBalance -= Math.max(0, monthlyPrincipalPmt);
            }
            
            interestExpense = yearInterest;
            principalPayment = yearPrincipal;
          }
        }
      }
      
      const closingBalance = Math.max(0, openingBalance - principalPayment);
      previousLoanBalance = closingBalance;
      cumulativePrincipalPayments += principalPayment;
      cumulativeInterestPayments += interestExpense;

      // === INCOME CALCULATIONS (WITH VACANCY) ===
      const grossRent = totalIncome * Math.pow(1 + assumptions.rentGrowth / 100, yearIndex);
      const vacancy = grossRent * (assumptions.vacancyRate / 100);
      const effectiveRent = grossRent - vacancy;
      const pmFee = effectiveRent * (assumptions.pmFeeRate / 100);
      const grossYield = currentPropertyValue > 0 ? (grossRent / currentPropertyValue) * 100 : 0;

      // === EXPENSE CALCULATIONS ===
      const operatingExpenses = totalOutgoings * Math.pow(1 + assumptions.inflationRate / 100, yearIndex);
      
      // === NOI CALCULATION (SPEC-COMPLIANT) ===
      const NOI = effectiveRent - pmFee - operatingExpenses;
      
      // === TAX CALCULATIONS (NEW) ===
      const depreciation = currentPropertyValue * (assumptions.depreciationRate / 100);
      const taxableIncome = NOI - interestExpense - depreciation;
      const combinedTaxRate = (assumptions.taxRate + assumptions.medicareLevy) / 100;
      
      const tax = Math.max(taxableIncome, 0) * combinedTaxRate;
      const taxBenefit = taxableIncome < 0 ? Math.abs(taxableIncome) * combinedTaxRate : 0;
      
      // === AFTER-TAX CASHFLOW (PRIMARY KPI) ===
      const afterTaxCashflow = NOI - interestExpense - principalPayment - tax + taxBenefit;
      cumulativeAfterTaxCashflow += afterTaxCashflow;
      
      // === PRE-TAX CASHFLOW (SECONDARY METRIC) ===
      const preTaxCashflow = NOI - interestExpense;
      cumulativeCashflow += preTaxCashflow;
      
      const netYield = currentPropertyValue > 0 ? (preTaxCashflow / currentPropertyValue) * 100 : 0;
      const incomePerMonth = afterTaxCashflow / 12;

      // === CAPITAL GROWTH ===
      const annualCapitalGrowth = yearIndex === 0 
        ? 0 
        : currentPropertyValue - (propertyValue * Math.pow(1 + assumptions.capitalGrowth / 100, yearIndex - 1));
      cumulativeCapitalGrowth += annualCapitalGrowth;

      // === PERFORMANCE METRICS ===
      const totalPerformance = cumulativeAfterTaxCashflow + cumulativeCapitalGrowth;
      const totalPerformanceIncPrincipal = totalPerformance + cumulativePrincipalPayments;

      // === RETURNS ===
      const cashOnCashReturn = totalCashInvested > 0 ? (cumulativeAfterTaxCashflow / totalCashInvested) * 100 : 0;
      const returnOnInvestedCapital = totalCashInvested > 0 ? (totalPerformanceIncPrincipal / totalCashInvested) * 100 : 0;

      data.push({
        year,
        propertyValue: currentPropertyValue,
        loanAmount: closingBalance,
        equity: currentPropertyValue - closingBalance,
        principalPayments: principalPayment,
        principalPaymentsCumulative: cumulativePrincipalPayments,
        interestPaymentsCumulative: cumulativeInterestPayments,
        estimatedInterestRate: interestRate,
        grossIncome: grossRent,
        vacancy: vacancy,
        effectiveRent: effectiveRent,
        pmFee: pmFee,
        grossYieldPercent: grossYield,
        operatingExpenses: operatingExpenses,
        NOI: NOI,
        interestExpense: interestExpense,
        depreciation: depreciation,
        taxableIncome: taxableIncome,
        tax: tax,
        taxBenefit: taxBenefit,
        preTaxCashflow: preTaxCashflow,
        preTaxCashflowCumulative: cumulativeCashflow,
        netAnnualCashflow: afterTaxCashflow, // After-tax cashflow (PRIMARY KPI)
        netAnnualCashflowCumulative: cumulativeAfterTaxCashflow, // After-tax cumulative (PRIMARY KPI)
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
  }, [propertyValue, totalIncome, totalOutgoings, loanAmount, interestRate, ioYears, assumptions, totalCashInvested]);

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

  const metricGroups = useMemo(() => [
    {
      title: "Property & Financing",
      defaultExpanded: true,
      metrics: [
        { 
          label: "Property Value", 
          key: "propertyValue", 
          format: formatCurrency,
          tooltip: "Current property value = Purchase Price × (1 + Capital Growth Rate)^Years"
        },
        { 
          label: "Loan Balance", 
          key: "loanAmount", 
          format: formatCurrency,
          tooltip: "Remaining loan balance after principal payments (IO periods have no principal reduction)"
        },
        { 
          label: "Equity", 
          key: "equity", 
          format: formatCurrency,
          tooltip: "Property Value - Loan Balance (your ownership stake in the property)"
        }
      ]
    },
    {
      title: "Income & Expenses",
      defaultExpanded: true,
      metrics: [
        { 
          label: "Gross Rent", 
          key: "grossIncome", 
          format: formatCurrency,
          tooltip: "Total rental income = Initial Rent × (1 + Rent Growth Rate)^Years"
        },
        { 
          label: "Vacancy Loss", 
          key: "vacancy", 
          format: formatCurrency,
          tooltip: "Lost income from vacant periods = Gross Rent × Vacancy Rate %"
        },
        { 
          label: "Effective Rent", 
          key: "effectiveRent", 
          format: formatCurrency,
          tooltip: "Actual rent collected = Gross Rent - Vacancy Loss"
        },
        { 
          label: "Property Management Fee", 
          key: "pmFee", 
          format: formatCurrency,
          tooltip: "PM fees charged on collected rent = Effective Rent × PM Fee Rate %"
        },
        { 
          label: "Operating Expenses", 
          key: "operatingExpenses", 
          format: formatCurrency,
          tooltip: "Property expenses (rates, insurance, maintenance) = Base Expenses × (1 + Inflation)^Years"
        },
        { 
          label: "Net Operating Income (NOI)", 
          key: "NOI", 
          format: formatCurrency,
          tooltip: "Property's operating profit = Effective Rent - PM Fee - Operating Expenses"
        }
      ]
    },
    {
      title: "Loan Payments",
      defaultExpanded: true,
      metrics: [
        { 
          label: "Interest Expense", 
          key: "interestExpense", 
          format: formatCurrency,
          tooltip: "Annual interest cost = Loan Balance × Interest Rate"
        },
        { 
          label: "Principal Payment", 
          key: "principalPayments", 
          format: formatCurrency,
          tooltip: "Loan balance reduction (IO periods = $0, P&I periods = PMT formula based on remaining term)"
        },
        { 
          label: "Principal Payments (Cumulative)", 
          key: "principalPaymentsCumulative", 
          format: formatCurrency,
          tooltip: "Total principal paid to date (builds equity through debt reduction)"
        },
        { 
          label: "Interest Payments (Cumulative)", 
          key: "interestPaymentsCumulative", 
          format: formatCurrency,
          tooltip: "Total interest paid to date (non-recoverable cost of borrowing)"
        }
      ]
    },
    {
      title: "Tax Calculations",
      defaultExpanded: true,
      metrics: [
        { 
          label: "Depreciation", 
          key: "depreciation", 
          format: formatCurrency,
          tooltip: "Annual tax depreciation = Property Value × Depreciation Rate % (reduces taxable income)"
        },
        { 
          label: "Taxable Income", 
          key: "taxableIncome", 
          format: formatCurrency,
          tooltip: "Income subject to tax = NOI - Interest - Depreciation (can be negative for tax benefits)"
        },
        { 
          label: "Tax Paid", 
          key: "tax", 
          format: formatCurrency,
          tooltip: "Tax on positive income = max(Taxable Income, 0) × (Tax Rate + Medicare Levy)"
        },
        { 
          label: "Tax Benefit (Negative Gearing)", 
          key: "taxBenefit", 
          format: formatCurrency,
          tooltip: "Tax refund from losses = |min(Taxable Income, 0)| × (Tax Rate + Medicare Levy)"
        }
      ]
    },
    {
      title: "Cashflow Metrics ⭐",
      defaultExpanded: true,
      metrics: [
        { 
          label: "Operating Cashflow (Pre-tax)", 
          key: "preTaxCashflow", 
          format: formatCurrency,
          tooltip: "Cash before tax = NOI - Interest (excludes principal payments and tax effects)"
        },
        { 
          label: "Operating Cashflow (Pre-tax, Cumulative)", 
          key: "preTaxCashflowCumulative", 
          format: formatCurrency,
          tooltip: "Total pre-tax cashflow accumulated over all years"
        },
        { 
          label: "After-tax Cashflow ⭐ PRIMARY KPI", 
          key: "netAnnualCashflow", 
          format: formatCurrency,
          tooltip: "True cash in pocket = NOI - Interest - Principal - Tax + Tax Benefit (the most important metric)"
        },
        { 
          label: "After-tax Cashflow (Cumulative) ⭐ PRIMARY KPI", 
          key: "netAnnualCashflowCumulative", 
          format: formatCurrency,
          tooltip: "Total after-tax cash generated over all years (primary performance indicator)"
        }
      ]
    },
    {
      title: "Income & Yields",
      defaultExpanded: false,
      metrics: [
        { 
          label: "Gross Yield %", 
          key: "grossYieldPercent", 
          format: formatPercent,
          tooltip: "Annual rent return = (Gross Rent ÷ Property Value) × 100"
        },
        { 
          label: "Net Yield % (Pre-tax)", 
          key: "netYieldPercent", 
          format: formatPercent,
          tooltip: "Pre-tax cash return = (Pre-tax Cashflow ÷ Property Value) × 100"
        },
        { 
          label: "Monthly After-tax Income", 
          key: "incomePerMonth", 
          format: formatCurrency,
          tooltip: "Monthly cash in pocket = After-tax Cashflow ÷ 12"
        }
      ]
    },
    {
      title: "Capital Growth",
      defaultExpanded: false,
      metrics: [
        { 
          label: "Capital Growth (Annual)", 
          key: "capitalGrowthAnnual", 
          format: formatCurrency,
          tooltip: "Property value increase this year = This Year Value - Last Year Value"
        },
        { 
          label: "Capital Growth (Cumulative)", 
          key: "capitalGrowthCumulative", 
          format: formatCurrency,
          tooltip: "Total property value increase = Current Value - Purchase Price"
        }
      ]
    },
    {
      title: "Total Performance",
      defaultExpanded: false,
      metrics: [
        { 
          label: "Total Performance (After-tax + Capital)", 
          key: "totalPerformance", 
          format: formatCurrency,
          tooltip: "Combined return = Cumulative After-tax Cashflow + Cumulative Capital Growth"
        },
        { 
          label: "Total Performance (Including Principal)", 
          key: "totalPerformanceIncPrincipal", 
          format: formatCurrency,
          tooltip: "Total wealth creation = Total Performance + Principal Payments (includes debt reduction)"
        }
      ]
    },
    {
      title: "Investment Returns",
      defaultExpanded: false,
      metrics: [
        { 
          label: "Cash on Cash Return (Cumulative)", 
          key: "cashOnCashReturnCumulative", 
          format: formatPercent,
          tooltip: "Cash return on initial investment = (Cumulative After-tax Cashflow ÷ Cash Invested) × 100"
        },
        { 
          label: "Return on Invested Capital", 
          key: "returnOnInvestedCapital", 
          format: formatPercent,
          tooltip: "Total return including equity = (Total Performance + Principal ÷ Cash Invested) × 100"
        }
      ]
    }
  ], []);

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    metricGroups.forEach(group => {
      initialState[group.title] = group.defaultExpanded;
    });
    return initialState;
  });

  if (projections.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No projection data available
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <div className="space-y-4 h-full flex flex-col">

        {/* Grouped Table Container with Horizontal Scroll */}
        <div className="border border-[#e5e7eb] rounded-lg overflow-hidden flex-1 min-h-0">
          <div className="overflow-x-auto h-full overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#f9fafb] border-b border-[#e5e7eb]">
                <tr>
                  <th className="sticky left-0 bg-[#f9fafb] px-4 py-3 text-left font-medium text-[#111827] border-r border-[#e5e7eb] min-w-[280px]">
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
                {metricGroups.map((group, groupIndex) => (
                  <React.Fragment key={group.title}>
                    {/* Group Header Row */}
                    <tr className="bg-[#f8fafc] border-t-2 border-[#e2e8f0]">
                      <td 
                        className="sticky left-0 bg-[#f8fafc] px-4 py-3 font-semibold text-[#1e293b] border-r border-[#e5e7eb] min-w-[280px] cursor-pointer hover:bg-[#f1f5f9] transition-colors"
                        onClick={() => toggleGroup(group.title)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{group.title}</span>
                          <div className="flex items-center space-x-3">
                            <span className="text-xs text-[#64748b] bg-[#e2e8f0] px-3 py-1 rounded-full min-w-[85px] text-center whitespace-nowrap">
                              {group.metrics.length} metrics
                            </span>
                            <svg 
                              className={`w-4 h-4 text-[#64748b] transition-transform ${
                                expandedGroups[group.title] ? 'rotate-180' : ''
                              }`}
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </td>
                      <td 
                        colSpan={projections.length} 
                        className="px-3 py-3 text-center text-xs text-[#64748b] cursor-pointer hover:bg-[#f1f5f9] transition-colors"
                        onClick={() => toggleGroup(group.title)}
                      >
                        Click to {expandedGroups[group.title] ? 'collapse' : 'expand'} {group.title.toLowerCase()}
                      </td>
                    </tr>
                    
                    {/* Group Metrics Rows */}
                    {expandedGroups[group.title] && group.metrics.map((metric, metricIndex) => (
                      <tr key={metric.key} className={metricIndex % 2 === 0 ? 'bg-white' : 'bg-[#f9fafb]'}>
                        <td className="sticky left-0 bg-inherit px-6 py-3 text-[#374151] border-r border-[#e5e7eb] min-w-[280px]">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm">{metric.label}</span>
                            <div className="relative group">
                              <svg 
                                className="w-4 h-4 text-[#9ca3af] hover:text-[#6b7280] cursor-help" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round" 
                                  strokeWidth={2} 
                                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                                />
                              </svg>
                              {/* Tooltip */}
                              <div className="absolute left-6 bottom-0 hidden group-hover:block z-50 w-80 p-3 bg-[#1f2937] text-white text-xs rounded-lg shadow-lg border border-[#374151]">
                                <div className="font-medium mb-1">Formula:</div>
                                <div className="text-[#d1d5db]">{metric.tooltip}</div>
                                {/* Arrow */}
                                <div className="absolute left-[-6px] top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-[6px] border-b-[6px] border-r-[6px] border-transparent border-r-[#1f2937]"></div>
                              </div>
                            </div>
                          </div>
                        </td>
                        {projections.map((projection) => {
                          const value = projection[metric.key as keyof ProjectionData] as number;
                          const isNegative = value < 0;
                          const isPositive = value > 0;
                          
                          return (
                            <td 
                              key={`${metric.key}-${projection.year}`} 
                              className={`px-3 py-3 text-center text-xs border-r border-[#e5e7eb] last:border-r-0 ${
                                isNegative ? 'text-red-600' : 
                                isPositive && (metric.key.includes('cashflow') || metric.key.includes('Return')) ? 'text-green-600' : 
                                'text-[#111827]'
                              }`}
                            >
                              {metric.format(value)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table summary */}
        <div className="mt-3 text-xs text-muted-foreground text-center flex-shrink-0">
          Showing 30 years of projections • Scroll horizontally and vertically to view all data
        </div>
      </div>
    </div>
  );
}