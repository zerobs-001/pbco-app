"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CashflowChart from "./charts/CashflowChart";
import DebtPaydownChart from "./charts/DebtPaydownChart";
import GrowthAnalysisChart from "./charts/GrowthAnalysisChart";
import DetailedProjectionsRestored from "./charts/DetailedProjectionsRestored";

interface YearlyProjection {
  year: number;
  netCashflow: number;
  loanBalance: number;
  propertyValue: number;
  cumulativeCashflow: number;
  // Add other projection properties as needed
}

interface PropertyAnalysisProps {
  projections: YearlyProjection[];
  loans: any[];
  initialInvestment: number;
  // Additional props for DetailedProjections
  propertyValue?: number;
  totalIncome?: number;
  totalOutgoings?: number;
  loanAmount?: number;
  interestRate?: number;
  loanType?: 'interest_only' | 'principal_interest';
  ioYears?: number;
  assumptions?: {
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
}

export default function PropertyAnalysis({ 
  projections, 
  loans, 
  initialInvestment,
  propertyValue,
  totalIncome,
  totalOutgoings,
  loanAmount,
  interestRate,
  loanType,
  ioYears,
  assumptions
}: PropertyAnalysisProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Chart Tabs - ready for expansion */}
      <Tabs defaultValue="cashflow" className="flex flex-col h-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-4">
          <TabsTrigger value="cashflow">Cashflow Analysis</TabsTrigger>
          <TabsTrigger value="debt">Debt Paydown</TabsTrigger>
          <TabsTrigger value="growth">Growth Analysis</TabsTrigger>
          <TabsTrigger value="projections">Detailed Projections</TabsTrigger>
        </TabsList>

        <TabsContent value="cashflow" className="flex-1 h-0">
          <CashflowChart projections={projections} yearsToShow={20} />
        </TabsContent>

        <TabsContent value="debt" className="flex-1 h-0">
          <DebtPaydownChart projections={projections} loans={loans} yearsToShow={20} />
        </TabsContent>

        <TabsContent value="growth" className="flex-1 h-0">
          <GrowthAnalysisChart 
            projections={projections} 
            initialInvestment={initialInvestment} 
            yearsToShow={20} 
          />
        </TabsContent>

        <TabsContent value="projections" className="flex-1 h-0">
          <Card className="h-full">
            <CardContent className="h-full p-3 max-h-[calc(100vh-320px)] overflow-hidden">
              <DetailedProjectionsRestored 
                propertyValue={propertyValue || projections[0]?.propertyValue || 500000}
                totalIncome={totalIncome || 50000}
                totalOutgoings={totalOutgoings || 15000}
                loanAmount={loanAmount || loans[0]?.principal_amount || 400000}
                interestRate={interestRate || loans[0]?.interest_rate || 6}
                loanType={loanType || loans[0]?.type || 'principal_interest'}
                ioYears={ioYears || loans[0]?.io_years || 0}
                assumptions={assumptions || {
                  rentGrowth: 3,
                  capitalGrowth: 4,
                  inflationRate: 2.5,
                  discountRate: 7,
                  taxRate: 30,
                  medicareLevy: 2,
                  vacancyRate: 2,
                  pmFeeRate: 8,
                  depreciationRate: 2.5
                }}
                totalCashInvested={initialInvestment}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}