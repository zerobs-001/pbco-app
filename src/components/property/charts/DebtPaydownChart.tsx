"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";

interface YearlyProjection {
  year: number;
  loanBalance: number;
  // We'll need to calculate interest balance from loan data
}

interface DebtPaydownChartProps {
  projections: YearlyProjection[];
  loans: any[];
  yearsToShow?: number;
}

const chartConfig = {
  principalBalance: {
    label: "Principal Balance",
    color: "#f87633",
  },
  interestBalance: {
    label: "Interest Balance", 
    color: "#013553",
  },
} satisfies ChartConfig;

// Helper function outside component to avoid re-creation
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

export default function DebtPaydownChart({ projections, loans, yearsToShow = 20 }: DebtPaydownChartProps) {
  // Calculate debt data with principal and interest balances
  const chartData = useMemo(() => {
    if (projections.length === 0 || loans.length === 0) return [];

    const loan = loans[0]; // Use first loan
    const originalAmount = loan.principal_amount || 0;
    const annualRate = (loan.interest_rate || 0) / 100;
    const termYears = loan.term_years || 30;
    const loanType = loan.type || 'principal_interest';
    const ioYears = loan.io_years || 0;

    return projections.slice(0, yearsToShow).map((projection, index) => {
      const year = projection.year;
      const yearsElapsed = index;
      
      let principalBalance = projection.loanBalance || 0;
      let interestBalance = 0;

      // Calculate remaining interest to be paid over the life of the loan
      if (principalBalance > 0 && annualRate > 0) {
        const monthlyRate = annualRate / 12;
        const remainingMonths = (termYears - yearsElapsed) * 12;
        
        if (loanType === 'interest_only' && yearsElapsed < ioYears) {
          // Interest-only period: all remaining payments are interest
          const ioRemainingMonths = (ioYears - yearsElapsed) * 12;
          const piRemainingMonths = Math.max(0, (termYears - ioYears) * 12);
          
          // Interest for remaining IO period
          interestBalance += principalBalance * annualRate * (ioRemainingMonths / 12);
          
          // Interest for P&I period (estimated)
          if (piRemainingMonths > 0 && monthlyRate > 0) {
            const monthlyPI = (principalBalance * monthlyRate * Math.pow(1 + monthlyRate, piRemainingMonths)) / 
                             (Math.pow(1 + monthlyRate, piRemainingMonths) - 1);
            const totalPIPayments = monthlyPI * piRemainingMonths;
            interestBalance += Math.max(0, totalPIPayments - principalBalance);
          }
        } else if (remainingMonths > 0 && monthlyRate > 0) {
          // Principal & Interest: calculate remaining interest
          const monthlyPayment = (principalBalance * monthlyRate * Math.pow(1 + monthlyRate, remainingMonths)) / 
                               (Math.pow(1 + monthlyRate, remainingMonths) - 1);
          const totalRemainingPayments = monthlyPayment * remainingMonths;
          interestBalance = Math.max(0, totalRemainingPayments - principalBalance);
        }
      }

      return {
        year: year.toString(),
        yearNum: year,
        principalBalance: Math.round(principalBalance),
        interestBalance: Math.round(interestBalance),
        totalDebt: Math.round(principalBalance + interestBalance),
        // Formatted values for display
        formattedPrincipal: formatCurrency(principalBalance),
        formattedInterest: formatCurrency(interestBalance),
        formattedTotal: formatCurrency(principalBalance + interestBalance)
      };
    });
  }, [projections, loans, yearsToShow]);

  // Calculate max value for Y-axis
  const maxValue = useMemo(() => {
    if (chartData.length === 0) return 0;
    return Math.max(...chartData.map(d => d.totalDebt)) * 1.1; // 10% padding
  }, [chartData]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg border bg-background p-3 shadow-sm">
          <div className="grid gap-2">
            <div className="flex justify-between items-center">
              <span className="text-[0.70rem] uppercase text-muted-foreground">Year</span>
              <span className="font-bold text-muted-foreground">{label}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <span className="text-[0.70rem] uppercase text-muted-foreground">
                  Principal Balance
                </span>
                <span className="font-bold" style={{ color: chartConfig.principalBalance.color }}>
                  {data.formattedPrincipal}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[0.70rem] uppercase text-muted-foreground">
                  Interest Balance
                </span>
                <span className="font-bold" style={{ color: chartConfig.interestBalance.color }}>
                  {data.formattedInterest}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center pt-1 border-t">
              <span className="text-[0.70rem] uppercase text-muted-foreground">Total Debt</span>
              <span className="font-bold">{data.formattedTotal}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Debt Paydown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No debt data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle>Debt Paydown ({yearsToShow} Years)</CardTitle>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-primary"></div>
            <span>Principal Balance</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-secondary"></div>
            <span>Interest Balance</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <ChartContainer config={chartConfig} className="min-h-[300px] max-h-[450px] w-full">
          <ResponsiveContainer width="99%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 20,
              }}
            >
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis 
              dataKey="year" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              domain={[0, maxValue]}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
              tickFormatter={formatCurrency}
              width={80}
            />
            
            {/* Stacked bars */}
            <Bar
              dataKey="principalBalance"
              stackId="debt"
              fill={chartConfig.principalBalance.color}
              name="Principal Balance"
              radius={[0, 0, 4, 4]} // Rounded bottom corners
            />
            <Bar
              dataKey="interestBalance"
              stackId="debt"
              fill={chartConfig.interestBalance.color}
              name="Interest Balance"
              radius={[4, 4, 0, 0]} // Rounded top corners
            />
            
            <ChartTooltip content={<CustomTooltip />} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}