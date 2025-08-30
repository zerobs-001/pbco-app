"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";

interface YearlyProjection {
  year: number;
  propertyValue: number;
  netCashflow: number;
  cumulativeCashflow: number;
}

interface GrowthAnalysisChartProps {
  projections: YearlyProjection[];
  initialInvestment: number;
  yearsToShow?: number;
}

const chartConfig = {
  capitalGrowth: {
    label: "Capital Growth",
    color: "#f87633",
  },
  totalReturn: {
    label: "Total Return on Capital",
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

const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

export default function GrowthAnalysisChart({ projections, initialInvestment, yearsToShow = 20 }: GrowthAnalysisChartProps) {
  // Calculate growth data
  const chartData = useMemo(() => {
    if (projections.length === 0 || initialInvestment <= 0) return [];

    const initialPropertyValue = projections[0]?.propertyValue || 0;

    return projections.slice(0, yearsToShow).map((projection, index) => {
      const year = projection.year;
      
      // Capital Growth: Property value increase from initial value
      const capitalGrowth = projection.propertyValue - initialPropertyValue;
      const capitalGrowthPercent = initialPropertyValue > 0 
        ? ((projection.propertyValue - initialPropertyValue) / initialPropertyValue) * 100 
        : 0;
      
      // Total Return on Capital: (Capital growth + cumulative cashflow) / initial investment
      const totalReturn = capitalGrowth + projection.cumulativeCashflow;
      const totalReturnPercent = initialInvestment > 0 
        ? (totalReturn / initialInvestment) * 100 
        : 0;

      return {
        year: year.toString(),
        yearNum: year,
        capitalGrowth: Math.round(capitalGrowth),
        capitalGrowthPercent: capitalGrowthPercent,
        totalReturn: Math.round(totalReturn),
        totalReturnPercent: totalReturnPercent,
        propertyValue: Math.round(projection.propertyValue),
        // Formatted values for display
        formattedCapitalGrowth: formatCurrency(capitalGrowth),
        formattedTotalReturn: formatCurrency(totalReturn),
        formattedCapitalGrowthPercent: formatPercentage(capitalGrowthPercent),
        formattedTotalReturnPercent: formatPercentage(totalReturnPercent)
      };
    });
  }, [projections, initialInvestment, yearsToShow]);

  // Calculate max value for Y-axis (use the higher of the two percentage values)
  const maxValue = useMemo(() => {
    if (chartData.length === 0) return 100;
    const maxCapital = Math.max(...chartData.map(d => d.capitalGrowthPercent));
    const maxTotal = Math.max(...chartData.map(d => d.totalReturnPercent));
    return Math.max(maxCapital, maxTotal, 0) * 1.2; // 20% padding
  }, [chartData]);

  // Calculate min value for Y-axis (could be negative)
  const minValue = useMemo(() => {
    if (chartData.length === 0) return 0;
    const minCapital = Math.min(...chartData.map(d => d.capitalGrowthPercent));
    const minTotal = Math.min(...chartData.map(d => d.totalReturnPercent));
    return Math.min(minCapital, minTotal, 0) * 1.2; // 20% padding
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
            <div className="grid grid-cols-1 gap-3">
              <div className="flex flex-col">
                <span className="text-[0.70rem] uppercase text-muted-foreground">
                  Capital Growth
                </span>
                <div className="flex justify-between items-center">
                  <span className="font-bold" style={{ color: chartConfig.capitalGrowth.color }}>
                    {data.formattedCapitalGrowthPercent}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {data.formattedCapitalGrowth}
                  </span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[0.70rem] uppercase text-muted-foreground">
                  Total Return on Capital
                </span>
                <div className="flex justify-between items-center">
                  <span className="font-bold" style={{ color: chartConfig.totalReturn.color }}>
                    {data.formattedTotalReturnPercent}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {data.formattedTotalReturn}
                  </span>
                </div>
              </div>
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
          <CardTitle>Growth Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No growth data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="flex-shrink-0">
        <CardTitle>Growth Analysis ({yearsToShow} Years)</CardTitle>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-primary"></div>
            <span>Capital Growth %</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-secondary"></div>
            <span>Total Return on Capital %</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col overflow-hidden">
        <ChartContainer config={chartConfig} className="w-full h-full max-h-[40vh] sm:max-h-[45vh] lg:max-h-[50vh] xl:max-h-[55vh] min-h-[300px] overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{
                top: 10,
                right: 15,
                left: 10,
                bottom: 10,
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
              domain={[minValue, maxValue]}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `${value.toFixed(0)}%`}
              width={55}
            />
            
            {/* Capital Growth area */}
            <Area
              type="monotone"
              dataKey="capitalGrowthPercent"
              stroke="#f87633"
              strokeWidth={3}
              fill="url(#capitalGradient)"
              fillOpacity={0.3}
              dot={{
                r: 4,
                strokeWidth: 2,
                stroke: "hsl(var(--background))",
                fill: "#f87633",
              }}
              activeDot={{
                r: 6,
                strokeWidth: 2,
                stroke: "#f87633",
              }}
            />
            
            {/* Total Return area */}
            <Area
              type="monotone"
              dataKey="totalReturnPercent"
              stroke="#013553"
              strokeWidth={3}
              fill="url(#totalReturnGradient)"
              fillOpacity={0.2}
              dot={{
                r: 4,
                strokeWidth: 2,
                stroke: "hsl(var(--background))",
                fill: "#013553",
              }}
              activeDot={{
                r: 6,
                strokeWidth: 2,
                stroke: "#013553",
              }}
            />
            
            <ChartTooltip content={<CustomTooltip />} />
            
            {/* Gradient definitions */}
            <defs>
              <linearGradient id="capitalGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f87633" stopOpacity={0.6}/>
                <stop offset="95%" stopColor="#f87633" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="totalReturnGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#013553" stopOpacity={0.6}/>
                <stop offset="95%" stopColor="#013553" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}