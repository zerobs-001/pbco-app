"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, TrendingDown, DollarSign, Calendar, Info, CheckCircle, Circle } from "lucide-react";

interface Milestone {
  year: number;
  label: string;
  achieved: boolean;
  target: number;
}

interface PropertyMetricsProps {
  breakEvenYear: number;
  netPresentValue: number;
  currentYear: number;
  milestones: Milestone[];
  totalCashOutlay: number;
  keyMetrics: {
    monthlyRent: number;
    weeklyRent: number;
    grossYield: number;
    netYield: number;
  };
  currentYearCashflow?: number;
  annualRent?: number;
}

const formatCurrency = (amount: number, showDecimals: boolean = false): string => {
  const decimals = showDecimals ? 1 : 0;
  const value = Math.round((amount / 1000) * Math.pow(10, decimals)) / Math.pow(10, decimals);
  return `$${value.toFixed(decimals)}K`;
};

export default function PropertyMetrics({
  breakEvenYear,
  netPresentValue,
  currentYear,
  milestones,
  totalCashOutlay,
  keyMetrics,
  currentYearCashflow = 0,
  annualRent = 0
}: PropertyMetricsProps) {
  const yearsToBreakEven = breakEvenYear - currentYear;
  const isNpvPositive = netPresentValue > 0;
  
  const achievedMilestones = milestones.filter(m => m.achieved).length;
  const progressPercentage = (achievedMilestones / milestones.length) * 100;
  
  // Monthly cashflow calculations
  const monthlyCashflow = currentYearCashflow / 12;
  const isCashflowPositive = monthlyCashflow >= 0;

  // Milestone calculations
  const milestoneTargets = [
    { percentage: 0, label: "Break-even", icon: "🎯" },
    { percentage: 25, label: "25% of rental income", icon: "📈" },
    { percentage: 50, label: "50% of rental income", icon: "📈" },
    { percentage: 75, label: "75% of rental income", icon: "📈" },
    { percentage: 100, label: "100% of rental income", icon: "🏆" }
  ];

  // Find next unachieved milestone
  const nextMilestone = milestoneTargets.find((target, index) => 
    index >= achievedMilestones
  );
  
  const getSmartDescription = () => {
    if (achievedMilestones === milestones.length) {
      return "All milestones achieved!";
    } else if (nextMilestone) {
      const targetAmount = (annualRent * nextMilestone.percentage) / 100;
      return `Next: ${nextMilestone.label} (${formatCurrency(targetAmount, true)})`;
    } else {
      return "Milestones achieved";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
      {/* Cashflow This Year */}
      <Card className="p-2">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className={`h-4 w-4 ${isCashflowPositive ? 'text-primary' : 'text-destructive'}`} />
          <span className="text-xs font-medium text-muted-foreground">Cashflow This Year</span>
        </div>
        <div className={`text-xl font-bold ${isCashflowPositive ? 'text-primary' : 'text-destructive'}`}>
          ${Math.abs(monthlyCashflow).toFixed(0)}/mo
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {isCashflowPositive ? 'Surplus' : 'Shortfall'}
        </p>
      </Card>

      {/* Net Present Value */}
      <Card className="p-2">
        <div className="flex items-center gap-2 mb-2">
          {isNpvPositive ? (
            <TrendingUp className="h-4 w-4 text-primary" />
          ) : (
            <TrendingDown className="h-4 w-4 text-destructive" />
          )}
          <span className="text-xs font-medium text-muted-foreground">Net Present Value</span>
        </div>
        <div className={`text-xl font-bold ${
          isNpvPositive ? 'text-primary' : 'text-destructive'
        }`}>
          {formatCurrency(netPresentValue)}
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          30-year projection
        </p>
      </Card>

      {/* Investment Progress */}
      <Card className="p-2">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-muted-foreground">Investment Progress</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3 w-3 text-muted-foreground hover:text-secondary cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-sm bg-background border border-border shadow-lg">
              <div className="space-y-3 p-2">
                <p className="font-semibold text-secondary text-sm">Milestone Progress</p>
                <div className="space-y-2">
                  {milestoneTargets.map((target, index) => {
                    const isAchieved = index < achievedMilestones;
                    const targetAmount = (annualRent * target.percentage) / 100;
                    return (
                      <div key={index} className="flex items-center gap-3 text-sm min-w-0">
                        <div className="flex-shrink-0">
                          {isAchieved ? (
                            <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-white"></div>
                            </div>
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-muted-foreground"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-sm ${isAchieved ? "text-secondary font-medium" : "text-foreground"} truncate`}>
                              {target.label}
                            </span>
                            <span className="text-muted-foreground text-xs flex-shrink-0">
                              {formatCurrency(targetAmount, true)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-secondary">
              {achievedMilestones}/{milestones.length}
            </span>
            <Badge 
              variant={achievedMilestones === milestones.length ? "default" : "secondary"} 
              className="text-[10px] px-1.5 py-0.5"
              style={{ 
                backgroundColor: achievedMilestones === milestones.length ? "#f87633" : undefined,
                color: achievedMilestones === milestones.length ? "white" : undefined
              }}
            >
              {progressPercentage.toFixed(0)}%
            </Badge>
          </div>
          <Progress 
            value={progressPercentage} 
            className="h-1" 
            style={{ 
              '--progress-foreground': achievedMilestones === milestones.length ? '#f87633' : '#013553' 
            } as React.CSSProperties}
          />
          <p className="text-[10px] text-muted-foreground">
            {getSmartDescription()}
          </p>
        </div>
      </Card>

      {/* Total Investment */}
      <Card className="p-2">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium text-muted-foreground">Total Cash Outlay</span>
        </div>
        <div className="text-xl font-bold">
          {formatCurrency(totalCashOutlay)}
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          Initial investment
        </p>
      </Card>

    </div>
  );
}