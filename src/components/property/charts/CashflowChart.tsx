"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, ReferenceLine, CartesianGrid } from "recharts";

interface YearlyProjection {
  year: number;
  netCashflow: number;
}

interface CashflowChartProps {
  projections: YearlyProjection[];
  yearsToShow?: number;
}

const chartConfig = {
  netCashflow: {
    label: "Net Cashflow",
    color: "hsl(var(--chart-1))",
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

export default function CashflowChart({ projections, yearsToShow = 20 }: CashflowChartProps) {
  // Get the data for the specified number of years
  const chartData = useMemo(() => {
    return projections.slice(0, yearsToShow).map(projection => ({
      year: projection.year.toString(),
      yearNum: projection.year,
      netCashflow: projection.netCashflow,
      // Format for display
      formattedCashflow: formatCurrency(projection.netCashflow)
    }));
  }, [projections, yearsToShow]);

  // Calculate min/max for dynamic Y-axis
  const { minValue, maxValue } = useMemo(() => {
    if (chartData.length === 0) return { minValue: 0, maxValue: 0 };
    
    const cashflows = chartData.map(d => d.netCashflow);
    const min = Math.min(...cashflows);
    const max = Math.max(...cashflows);
    const range = max - min;
    const padding = range * 0.1; // 10% padding
    
    return {
      minValue: min - padding,
      maxValue: max + padding
    };
  }, [chartData]);

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col">
              <span className="text-[0.70rem] uppercase text-muted-foreground">
                Year
              </span>
              <span className="font-bold text-muted-foreground">
                {label}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[0.70rem] uppercase text-muted-foreground">
                Cashflow
              </span>
              <span className={`font-bold ${data.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(data.value)}
              </span>
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
          <CardTitle>Annual Cashflow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No cashflow data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle>Annual Cashflow ({yearsToShow} Years)</CardTitle>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-secondary"></div>
            <span>Net Cashflow</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <ChartContainer config={chartConfig} className="min-h-[300px] max-h-[450px] w-full">
          <ResponsiveContainer width="99%" height="100%">
            <AreaChart
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
              domain={[minValue, maxValue]}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
              tickFormatter={formatCurrency}
              width={80}
            />
            
            {/* Zero reference line */}
            <ReferenceLine 
              y={0} 
              stroke="hsl(var(--muted-foreground))" 
              strokeDasharray="5 5" 
              opacity={0.7}
            />
            
            {/* Single area chart with orange gradient */}
            <Area
              type="monotone"
              dataKey="netCashflow"
              stroke="#013553"
              strokeWidth={3}
              fill="url(#secondaryGradient)"
              fillOpacity={0.3}
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
                fill: "#013553",
              }}
            />
            
            <ChartTooltip content={<CustomTooltip />} />
            
            {/* Gradient definition */}
            <defs>
              <linearGradient id="secondaryGradient" x1="0" y1="0" x2="0" y2="1">
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