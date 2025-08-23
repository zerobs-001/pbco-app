// Reference data constants for Purchase calculations
// These values can be adjusted based on business requirements

export const PurchaseReferences = {
  // Default values for prefilling
  DefaultGrossYield: 0.055, // 5.5% annual gross yield
  DefaultContractLeadDays: 7, // Days from engagement to contract
  EngagementFee: 500,
  DefaultInsuranceAtExchange: 1200,
  DefaultBPIFee: 550, // Building & Pest Inspection
  DefaultPEInspectionFee: 350, // Plumbing & Electrical
  DefaultValuationFee: 450,
  DefaultMortgageFees: 850,
  DefaultConveyancingFee: 1500,
  DefaultMaintenanceAllowance: 2000,
  
  // Calculation parameters
  RatesAdjustmentRatePct: 0.003, // 0.3% of property value
  PostSettlementLagDays: 30,
  MinDepositPctNoLMI: 0.20, // 20% deposit avoids LMI
  
  // Lender classes for LMI calculation
  LenderClass: 'standard' as const,
};

// Stamp Duty rates by state (simplified - actual rates are more complex)
// Format: array of [threshold, rate, fixed] tuples
export const StampDutyRates: Record<string, Array<[number, number, number]>> = {
  NSW: [
    [0, 0.0125, 0],
    [14000, 0.015, 175],
    [30000, 0.0175, 415],
    [80000, 0.035, 1290],
    [300000, 0.045, 8990],
    [1000000, 0.055, 38490],
    [3000000, 0.07, 150490],
  ],
  VIC: [
    [0, 0.014, 0],
    [25000, 0.024, 350],
    [130000, 0.06, 2870],
    [960000, 0.055, 49070],
  ],
  QLD: [
    [0, 0.01, 0],
    [5000, 0.015, 50],
    [75000, 0.0175, 1050],
    [540000, 0.035, 8175],
    [1000000, 0.045, 28325],
  ],
  SA: [
    [0, 0.01, 0],
    [12000, 0.02, 120],
    [30000, 0.03, 480],
    [50000, 0.035, 1080],
    [100000, 0.04, 2830],
    [200000, 0.045, 6830],
    [250000, 0.05, 8955],
    [300000, 0.055, 10955],
  ],
  WA: [
    [0, 0.019, 0],
    [80000, 0.0285, 1520],
    [100000, 0.038, 2090],
    [250000, 0.0475, 7790],
    [500000, 0.0515, 14665],
  ],
  TAS: [
    [0, 0.015, 50],
    [3000, 0.0175, 50],
    [25000, 0.0225, 435],
    [75000, 0.035, 1560],
    [200000, 0.04, 5935],
    [375000, 0.0425, 12935],
    [725000, 0.045, 19810],
  ],
  ACT: [
    [0, 0.006, 0],
    [200000, 0.021, 1200],
    [300000, 0.035, 3300],
    [500000, 0.0445, 10300],
    [750000, 0.0516, 15425],
    [1000000, 0.0467, 20325],
    [1455000, 0.046, 21575],
  ],
  NT: [
    [0, 0.0295, 0],
    [525000, 0.04, 15472.50],
    [3000000, 0.0565, 42472.50],
    [5000000, 0.0495, 109472.50],
  ],
};

// LMI rates by LVR bracket (simplified)
// Format: [maxLVR, ratePercentOfLoan]
export const LMIRates: Array<[number, number]> = [
  [0.80, 0], // No LMI for 80% or less
  [0.85, 0.0132], // 1.32% of loan amount
  [0.90, 0.0274], // 2.74% of loan amount
  [0.95, 0.0452], // 4.52% of loan amount
];

// Calculate stamp duty based on state and purchase price
export function calculateStampDuty(state: string, purchasePrice: number, isInvestor: boolean = true): number {
  const rates = StampDutyRates[state];
  if (!rates) return 0;
  
  let duty = 0;
  for (let i = rates.length - 1; i >= 0; i--) {
    const [threshold, rate, fixed] = rates[i];
    if (purchasePrice > threshold) {
      duty = fixed + (purchasePrice - threshold) * rate;
      break;
    }
  }
  
  // Some states have investor surcharges (simplified)
  if (isInvestor) {
    if (state === 'NSW' || state === 'VIC') {
      duty *= 1.08; // 8% surcharge for foreign/investment properties (simplified)
    }
  }
  
  return Math.round(duty);
}

// Calculate LMI based on LVR and loan amount
export function calculateLMI(loanAmount: number, lvr: number): number {
  if (lvr <= 0.80) return 0; // No LMI for 80% LVR or less
  
  let lmiRate = 0;
  for (const [maxLVR, rate] of LMIRates) {
    if (lvr <= maxLVR) {
      lmiRate = rate;
      break;
    }
  }
  
  return Math.round(loanAmount * lmiRate);
}