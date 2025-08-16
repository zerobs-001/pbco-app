# Page 2: Dashboard (Single Portfolio Overview) - UPDATED

## 📋 **Updated Page Overview**
The main dashboard showing the investor's single portfolio with all their properties, individual property cashflow modeling, and aggregated portfolio-level metrics.

## 🎯 **Updated Design Goals**
- **Portfolio Focus**: Single portfolio overview, not multiple portfolios
- **Property Management**: Easy access to add/edit properties within the portfolio
- **Property-Level Modeling**: Individual cashflow projections for each property
- **Aggregated Metrics**: Portfolio-level KPIs calculated from all properties
- **Investor-Centric**: Clear view of their complete investment portfolio

## 📱 **Updated Page Structure**

### Main Dashboard Layout
```
┌─────────────────────────────────────────────────────────────────┐
│  Header Navigation                                              │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │   Logo/Brand    │ │   User Menu     │ │   Notifications │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  Portfolio Title & Actions                                      │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ My Investment Portfolio              [Add Property] [Settings] │ │
│  └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  Portfolio-Level KPI Summary Cards                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│  │ Total Value │ │ Avg LVR     │ │ Avg DSCR    │ │ Income Year │ │
│  │ $2.4M       │ │ 65.2%       │ │ 1.8x        │ │ 2032        │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  Property Assets List with Cashflow Status                      │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Property Name    Type        Value    LVR    DSCR   Status │ │
│  │ ┌─────────────────────────────────────────────────────────┐ │ │
│  │ │ Sydney House    Residential  $850K   68%    1.9x   ✅ Modeled│ │ │
│  │ │                                                         │ │ │
│  │ │ Cashflow: +$12K/yr | Break-even: 2028 | Strategy: Buy&Hold│ │ │
│  │ └─────────────────────────────────────────────────────────┘ │ │
│  │ ┌─────────────────────────────────────────────────────────┐ │ │
│  │ │ Melbourne Unit   Residential  $620K   62%    2.1x   ✅ Modeled│ │ │
│  │ │                                                         │ │ │
│  │ │ Cashflow: +$8K/yr | Break-even: 2030 | Strategy: Buy&Hold│ │ │
│  │ └─────────────────────────────────────────────────────────┘ │ │
│  │ ┌─────────────────────────────────────────────────────────┐ │ │
│  │ │ Brisbane Office  Commercial   $480K   70%    1.7x   ⚠️ Needs Modeling│ │ │
│  │ │                                                         │ │ │
│  │ │ Cashflow: Not modeled | Click to model cashflows        │ │ │
│  │ └─────────────────────────────────────────────────────────┘ │ │
│  │                                                             │ │
│  │ [Add New Property]                                          │ │
│  └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  Portfolio Actions & Recent Activity                            │
│  ┌─────────────────────────────┐ ┌─────────────────────────────┐ │
│  │ Portfolio Actions           │ │ Recent Activity             │ │
│  │ • Generate Portfolio Report │ │ • Modeled Sydney House      │ │
│  │ • Export Portfolio Data     │ │ • Updated Melbourne Unit    │ │
│  │ • View Income Timeline      │ │ • Added Brisbane Office     │ │
│  │ • Portfolio Settings        │ │ • Generated Forecast        │ │
│  │ • Compare Properties        │ │ • Updated Loan Settings     │ │
│  └─────────────────────────────┘ └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## 🎨 **Updated Visual Design**

### Portfolio Title Section
- **Title**: "My Investment Portfolio" (personal ownership)
- **Actions**: "Add Property" (primary), "Settings" (secondary)
- **Layout**: Clear portfolio ownership, not generic "Dashboard"

### KPI Summary Cards (Portfolio-Level)
- **Total Portfolio Value**: Sum of all property values
- **Average LVR**: Weighted average across all properties
- **Average DSCR**: Portfolio-level debt service coverage
- **Income Replacement Year**: When portfolio income replaces salary

### Property Assets List with Cashflow Status
- **Table Headers**: Property Name, Type, Value, LVR, DSCR, Status
- **Property Types**: Residential House, Unit, Commercial, etc.
- **Cashflow Status**: 
  - ✅ **Modeled** - Cashflows calculated
  - ⚠️ **Needs Modeling** - Property added but not modeled
  - ❌ **Error** - Modeling failed
- **Property Details**: 
  - Annual cashflow amount
  - Break-even year
  - Investment strategy
  - Quick modeling action

### Portfolio Actions
- **Generate Portfolio Report**: Run 30-year projections on entire portfolio
- **Export Portfolio Data**: Download portfolio information
- **View Income Timeline**: See income replacement progression
- **Portfolio Settings**: Global assumptions and preferences
- **Compare Properties**: Side-by-side property analysis

## 🔄 **Updated User Flow**

### Initial Setup
1. **Sign Up** → Create investor account
2. **Create Portfolio** → One-time portfolio setup (name, global settings)
3. **Add First Property** → Start building their portfolio
4. **Model Property Cashflows** → Run projections for the property
5. **Add More Properties** → Continue building portfolio
6. **Model Each Property** → Run individual property projections

### Ongoing Usage
1. **Dashboard** → View portfolio overview and all properties
2. **Add Property** → Add new property to existing portfolio
3. **Model Property** → Run cashflow projections for individual property
4. **View Property Results** → See individual property KPIs and timeline
5. **Edit Property** → Modify individual property details
6. **Generate Portfolio Report** → Run analysis on entire portfolio
7. **Compare Properties** → Analyze performance across properties

## 🎯 **Property-Level Modeling Features**

### Individual Property Analysis
- **30-Year Cashflow Projections**: Year-by-year cashflow for each property
- **Property-Specific KPIs**: 
  - Individual LVR and DSCR
  - Cash-on-cash return
  - Break-even year
  - Net present value
- **Strategy Analysis**: 
  - Buy & Hold projections
  - Manufacture Equity calculations
  - Value-Add Commercial modeling
- **Property Timeline**: When property becomes cashflow positive

### Property Modeling Actions
- **Model Cashflows**: Run projections for individual property
- **View Property Report**: Detailed property analysis
- **Edit Property Details**: Modify property information
- **Compare with Portfolio**: See property vs portfolio performance

### Property Status Indicators
- **✅ Modeled**: Cashflows calculated, green checkmark
- **⚠️ Needs Modeling**: Property added but projections not run
- **🔄 Modeling**: Currently calculating projections
- **❌ Error**: Modeling failed, needs attention

## 📊 **Updated Data Structure**

### Portfolio Level
```typescript
interface Portfolio {
  id: string;
  userId: string;
  name: string;
  globalSettings: GlobalSettings;
  properties: Property[];
  portfolioMetrics: PortfolioMetrics;
  portfolioCashflow: PortfolioCashflow;
}
```

### Property Level
```typescript
interface Property {
  id: string;
  portfolioId: string;
  name: string;
  type: PropertyType; // Residential, Commercial, etc.
  value: number;
  loan: Loan;
  strategy: InvestmentStrategy; // Buy&Hold, ManufactureEquity, ValueAdd
  cashflowStatus: CashflowStatus; // Modeled, NeedsModeling, Error
  propertyMetrics: PropertyMetrics;
  cashflowProjection: PropertyCashflowProjection;
}
```

### Property Cashflow Projection
```typescript
interface PropertyCashflowProjection {
  propertyId: string;
  annualCashflow: number;
  breakEvenYear: number;
  netPresentValue: number;
  internalRateOfReturn: number;
  yearByYearProjection: YearlyProjection[];
  strategy: InvestmentStrategy;
}
```

### Portfolio Metrics (Calculated)
```typescript
interface PortfolioMetrics {
  totalValue: number;
  averageLVR: number;
  averageDSCR: number;
  incomeReplacementYear: number;
  totalProperties: number;
  modeledProperties: number;
  totalAnnualCashflow: number;
  portfolioBreakEvenYear: number;
}
```

## 🎨 **Updated Component Structure**

### Dashboard Components
- **PortfolioHeader**: Portfolio title and main actions
- **PortfolioKPIs**: Portfolio-level metric cards
- **PropertyTable**: List of all properties with cashflow status
- **PropertyCard**: Individual property with modeling status
- **PortfolioActions**: Portfolio-level actions
- **RecentActivity**: Activity feed for portfolio

### Property Modeling Components
- **PropertyModelingButton**: Quick modeling action
- **PropertyStatusIndicator**: Visual status (modeled, needs modeling, error)
- **PropertyMetricsDisplay**: Individual property KPIs
- **PropertyCashflowPreview**: Quick cashflow summary
- **PropertyModelingModal**: Detailed modeling interface

### Cashflow Analysis Components
- **PropertyCashflowChart**: 30-year projection chart
- **PropertyTimeline**: Break-even and milestone timeline
- **PropertyStrategyAnalysis**: Strategy-specific calculations
- **PropertyComparison**: Side-by-side property analysis

## 🔧 **Updated Interactions**

### Primary Actions
- **Add Property**: Add new property to portfolio
- **Model Property**: Run cashflow projections for individual property
- **View Property Report**: Detailed property analysis
- **Edit Property**: Modify existing property
- **Generate Portfolio Report**: Run portfolio analysis
- **Portfolio Settings**: Configure global assumptions

### Secondary Actions
- **Export Data**: Download portfolio information
- **View Timeline**: See income replacement progression
- **Compare Properties**: Side-by-side property analysis
- **Property Details**: Drill down into individual properties

### Property Modeling Flow
1. **Add Property** → Basic property information
2. **Model Cashflows** → Run 30-year projections
3. **Review Results** → See property KPIs and timeline
4. **Adjust Parameters** → Modify assumptions if needed
5. **Save Model** → Store projections for portfolio aggregation

## 📱 **Updated Responsive Design**

### Desktop
- **Full Property Table**: All columns visible including cashflow status
- **Property Details**: Expanded property information
- **Side-by-side Actions**: Portfolio actions and activity
- **Large KPI Cards**: 4-column layout

### Mobile
- **Property Cards**: Card-based property list with status
- **Modeling Actions**: Touch-friendly modeling buttons
- **Stacked Actions**: Actions and activity stacked
- **Single Column KPIs**: KPI cards in single column

## 🎯 **Success Metrics**

### User Engagement
- **Property Addition Rate**: How often users add properties
- **Modeling Completion Rate**: Percentage of properties with cashflows modeled
- **Report Generation**: Frequency of cashflow analysis
- **Property Comparison**: Usage of comparison features

### User Experience
- **Time to Add Property**: Speed of property addition
- **Time to Model Cashflows**: Speed of cashflow calculation
- **Portfolio Understanding**: Clarity of portfolio overview
- **Action Completion**: Success rate of portfolio actions

### Modeling Performance
- **Modeling Accuracy**: Quality of cashflow projections
- **Modeling Speed**: Time to calculate projections
- **Error Rate**: Frequency of modeling failures
- **User Satisfaction**: Feedback on modeling results
