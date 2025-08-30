"use client";

import { useMemo } from "react";

interface YearlyProjection {
  year: number;
  rentIncome: number;
  expenses: number;
  loanPayment: number;
  taxLiability: number;
  netCashflow: number;
  cumulativeCashflow: number;
  propertyValue: number;
  loanBalance: number;
}

interface DetailedProjectionsTableProps {
  projections: YearlyProjection[];
  yearsToShow?: number;
}

const formatCurrency = (amount: number): string => {
  const absAmount = Math.abs(amount);
  if (absAmount >= 1000000) {
    return `${amount < 0 ? '-' : ''}$${(absAmount / 1000000).toFixed(1)}M`;
  } else if (absAmount >= 1000) {
    return `${amount < 0 ? '-' : ''}$${(absAmount / 1000).toFixed(0)}K`;
  } else {
    return `${amount < 0 ? '-' : ''}$${absAmount.toFixed(0)}`;
  }
};

export default function DetailedProjectionsTable({ projections, yearsToShow = 30 }: DetailedProjectionsTableProps) {
  const tableData = useMemo(() => {
    return projections.slice(0, yearsToShow);
  }, [projections, yearsToShow]);

  if (tableData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No projection data available
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <div className="overflow-auto h-full rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted sticky top-0">
            <tr>
              <th className="p-2 text-left font-medium">Year</th>
              <th className="p-2 text-right font-medium">Rent Income</th>
              <th className="p-2 text-right font-medium">Expenses</th>
              <th className="p-2 text-right font-medium">Loan Payment</th>
              <th className="p-2 text-right font-medium">Tax Liability</th>
              <th className="p-2 text-right font-medium">Net Cashflow</th>
              <th className="p-2 text-right font-medium">Cumulative CF</th>
              <th className="p-2 text-right font-medium">Property Value</th>
              <th className="p-2 text-right font-medium">Loan Balance</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((projection, index) => (
              <tr 
                key={projection.year} 
                className={`border-b hover:bg-muted/50 ${
                  index % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                }`}
              >
                <td className="p-2 font-medium">{projection.year}</td>
                <td className="p-2 text-right text-green-600">
                  {formatCurrency(projection.rentIncome)}
                </td>
                <td className="p-2 text-right text-red-600">
                  {formatCurrency(projection.expenses)}
                </td>
                <td className="p-2 text-right text-orange-600">
                  {formatCurrency(projection.loanPayment)}
                </td>
                <td className="p-2 text-right text-purple-600">
                  {formatCurrency(projection.taxLiability)}
                </td>
                <td className={`p-2 text-right font-medium ${
                  projection.netCashflow >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(projection.netCashflow)}
                </td>
                <td className={`p-2 text-right font-medium ${
                  projection.cumulativeCashflow >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(projection.cumulativeCashflow)}
                </td>
                <td className="p-2 text-right text-blue-600">
                  {formatCurrency(projection.propertyValue)}
                </td>
                <td className="p-2 text-right text-slate-600">
                  {formatCurrency(projection.loanBalance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Table summary */}
      <div className="mt-3 text-xs text-muted-foreground text-center">
        Showing {tableData.length} years of projections • Scroll horizontally and vertically to view all data
      </div>
    </div>
  );
}