# LOAN CALCULATION SPECIFICATIONS

## Industry Standard Loan Formulas

### 1. INTEREST-ONLY (IO) LOANS

#### A. Pure Interest-Only Loan
- **Structure**: Interest payments only for entire term, balloon payment at end
- **Monthly Interest Payment**: `Principal × (Annual Rate / 12)`
- **Principal Balance**: Remains constant at original amount
- **Final Payment**: Full Principal + Final Interest Payment
- **Example**: $200,000 at 5% for 30 years
  - Monthly Interest: $200,000 × (5% / 12) = $833.33
  - Principal Balance: $200,000 (constant)
  - Year 30: Pay $200,000 + $833.33

#### B. IO→P&I Transition Loan  
- **Structure**: Interest-only for X years, then P&I for remaining term
- **IO Period (Years 1-X)**: 
  - Monthly Interest: `Principal × (Annual Rate / 12)`
  - Principal Payment: $0
  - Principal Balance: Constant
- **P&I Period (Years X+1 to 30)**:
  - Calculate PMT for remaining principal over remaining years
  - Standard amortization schedule
- **Example**: $200,000 at 5%, 10-year IO + 20-year P&I
  - Years 1-10: $833.33 interest only
  - Years 11-30: PMT calculated for $200,000 over 20 years = $1,319.91

### 2. PRINCIPAL & INTEREST (P&I) LOANS

#### Standard Amortizing Loan Formula
```
PMT = P × [r(1+r)^n] / [(1+r)^n - 1]

Where:
- P = Principal amount
- r = Monthly interest rate (annual rate / 12)  
- n = Total number of payments (years × 12)
```

#### Monthly Payment Breakdown
```
Interest Payment = Remaining Balance × Monthly Rate
Principal Payment = PMT - Interest Payment  
New Balance = Previous Balance - Principal Payment
```

#### Example: $200,000 at 5% for 30 years
- Monthly Rate: 5% / 12 = 0.004167
- Total Payments: 30 × 12 = 360
- PMT = $200,000 × [0.004167(1.004167)^360] / [(1.004167)^360 - 1] = $1,073.64

**Year 1**: 
- Interest: $200,000 × 0.004167 = $833.33
- Principal: $1,073.64 - $833.33 = $240.31
- New Balance: $200,000 - $240.31 = $199,759.69

## VALIDATION TEST CASES

### Test Case 1: Pure IO Loan
- **Loan**: $200,000, 5%, 30 years, Interest-Only
- **Expected**:
  - Years 1-29: $833.33 interest, $0 principal, $200,000 balance
  - Year 30: $833.33 interest, $200,000 principal, $0 balance

### Test Case 2: IO→P&I Loan  
- **Loan**: $200,000, 5%, 10-year IO + 20-year P&I
- **Expected**:
  - Years 1-10: $833.33 interest, $0 principal, $200,000 balance
  - Years 11-30: $1,319.91 total payment, decreasing balance
  - Year 11: $833.33 interest, $486.58 principal, $199,513.42 balance
  - Year 30: ~$62.85 interest, $1,257.06 principal, $0 balance

### Test Case 3: Standard P&I Loan
- **Loan**: $200,000, 5%, 30 years, P&I
- **Expected**:
  - All years: $1,073.64 total payment
  - Year 1: $833.33 interest, $240.31 principal, $199,759.69 balance
  - Year 15: ~$574.12 interest, $499.52 principal, ~$127,000 balance  
  - Year 30: ~$4.47 interest, $1,069.17 principal, $0 balance
