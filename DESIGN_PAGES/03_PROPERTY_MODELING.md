# Page 3: Property Cashflow Modeling

## 📋 **Page Overview**
Individual property cashflow modeling interface where investors can run 30-year projections for each property, view detailed analysis, and compare different investment strategies.

## 🎯 **Design Goals**
- **Comprehensive Modeling**: Complete 30-year cashflow projections
- **Strategy Analysis**: Support for Buy & Hold, Manufacture Equity, Value-Add Commercial
- **Visual Results**: Clear charts and timelines for property performance
- **Easy Comparison**: Compare different scenarios and strategies
- **Actionable Insights**: Clear recommendations and next steps

## 📱 **Page Structure**

### Property Modeling Layout
```
┌─────────────────────────────────────────────────────────────────┐
│  Header Navigation                                              │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │   Logo/Brand    │ │   User Menu     │ │   Notifications │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  Property Header & Actions                                      │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Sydney House - Cashflow Modeling        [Save] [Export]    │ │
│  └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  Property Summary & Quick Stats                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│  │ Property    │ │ Current     │ │ Loan        │ │ Strategy    │ │
│  │ Value       │ │ Cashflow    │ │ Balance     │ │ Type        │ │
│  │ $850K       │ │ -$2.4K/yr   │ │ $578K       │ │ Buy & Hold  │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  Modeling Controls & Strategy Selection                          │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Strategy: [Buy & Hold ▼] [Manufacture Equity] [Value-Add]   │ │
│  │                                                             │ │
│  │ Assumptions:                                                │ │
│  │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│  │ │ Rent Growth │ │ Capital     │ │ Expense     │ │ Tax Rate    │ │
│  │ │ 3.0%        │ │ Growth 4.0% │ │ Inflation   │ │ 32.5%       │ │
│  │ │ [Edit]      │ │ [Edit]      │ │ 2.5%        │ │ [Edit]      │ │
│  │ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │
│  │                                                             │ │
│  │ [Run 30-Year Projection] [Reset to Defaults]               │ │
│  └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  Results & Analysis                                             │
│  ┌─────────────────────────────┐ ┌─────────────────────────────┐ │
│  │ Cashflow Projection Chart   │ │ Key Metrics & Insights      │ │
│  │ ┌─────────────────────────┐ │ │ ┌─────────────────────────┐ │ │
│  │ │ 30-Year Cashflow Line   │ │ │ │ Break-even Year: 2028   │ │
│  │ │ Chart                   │ │ │ │ Net Present Value: $45K │ │
│  │ │                         │ │ │ │ IRR: 8.2%              │ │
│  │ │                         │ │ │ │ Cash-on-Cash: 12.4%    │ │
│  │ └─────────────────────────┘ │ │ └─────────────────────────┘ │ │
│  └─────────────────────────────┘ └─────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  Year-by-Year Breakdown                                         │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Year | Rent | Expenses | Loan | Tax | Net CF | Cumulative  │ │
│  │ 2024 | 45K  | 12K      | 32K  | 2K  | -1K    | -1K         │ │
│  │ 2025 | 46K  | 12K      | 32K  | 2K  | 0K     | -1K         │ │
│  │ 2026 | 48K  | 13K      | 32K  | 3K  | 0K     | -1K         │ │
│  │ 2027 | 49K  | 13K      | 32K  | 4K  | 0K     | -1K         │ │
│  │ 2028 | 51K  | 13K      | 32K  | 6K  | 0K     | 0K          │ │
│  │ 2029 | 52K  | 14K      | 32K  | 6K  | 0K     | 0K          │ │
│  │ ...  | ...  | ...      | ...  | ... | ...    | ...         │ │
│  └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  Strategy Comparison & Actions                                  │
│  ┌─────────────────────────────┐ ┌─────────────────────────────┐ │
│  │ Strategy Comparison         │ │ Actions & Next Steps        │ │
│  │ ┌─────────────────────────┐ │ │ ┌─────────────────────────┐ │ │
│  │ │ Buy & Hold: 2028 BE     │ │ │ │ ✅ Save to Portfolio    │ │
│  │ │ Manufacture: 2026 BE    │ │ │ │ 📊 Compare Strategies   │ │
│  │ │ Value-Add: 2025 BE      │ │ │ │ 📈 View Detailed Report │ │
│  │ └─────────────────────────┘ │ │ │ 🔄 Run Sensitivity Test │ │
│  └─────────────────────────────┘ └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## 🎨 **Visual Design**

### Property Header
- **Title**: "Property Name - Cashflow Modeling"
- **Actions**: "Save to Portfolio", "Export Report"
- **Breadcrumb**: Dashboard > Property Name > Modeling

### Property Summary Cards
- **Property Value**: Current market value
- **Current Cashflow**: Annual cashflow (negative if cashflow negative)
- **Loan Balance**: Current outstanding loan amount
- **Strategy Type**: Selected investment strategy

### Modeling Controls
- **Strategy Selector**: Dropdown for Buy & Hold, Manufacture Equity, Value-Add
- **Assumption Cards**: Key modeling parameters with edit buttons
- **Action Buttons**: "Run Projection", "Reset to Defaults"

### Results Display
- **Cashflow Chart**: 30-year line chart showing cashflow progression
- **Key Metrics**: Break-even year, NPV, IRR, Cash-on-cash return
- **Year-by-Year Table**: Detailed breakdown of each year
- **Strategy Comparison**: Side-by-side comparison of different strategies

## 🧩 **Component Library**

### Modeling Controls
- **StrategySelector**: Dropdown for investment strategy selection
- **AssumptionCard**: Individual assumption with edit capability
- **ModelingButton**: Primary action to run projections
- **ResetButton**: Reset all assumptions to defaults

### Results Display
- **CashflowChart**: 30-year projection line chart
- **MetricsCard**: Individual KPI display
- **YearlyTable**: Detailed year-by-year breakdown
- **StrategyComparison**: Side-by-side strategy analysis

### Analysis Components
- **BreakEvenIndicator**: Visual indicator of break-even year
- **CashflowTimeline**: Timeline showing key milestones
- **SensitivityAnalysis**: Parameter sensitivity testing
- **RecommendationCard**: AI-powered insights and recommendations

## 📊 **Data Visualization**

### Cashflow Chart
- **X-Axis**: Years (2024-2054)
- **Y-Axis**: Annual cashflow amount
- **Line Color**: Blue for positive, red for negative
- **Break-even Point**: Highlighted with vertical line
- **Trend Line**: Show overall cashflow trend

### Key Metrics Display
- **Break-even Year**: When property becomes cashflow positive
- **Net Present Value**: Discounted value of all cashflows
- **Internal Rate of Return**: Annualized return rate
- **Cash-on-Cash Return**: Annual return on cash invested

### Year-by-Year Table
- **Columns**: Year, Rent, Expenses, Loan Payment, Tax, Net Cashflow, Cumulative
- **Color Coding**: Positive cashflow in green, negative in red
- **Break-even Row**: Highlighted when cumulative becomes positive

## 🔧 **Interactive Elements**

### Strategy Selection
- **Buy & Hold**: Standard long-term holding strategy
- **Manufacture Equity**: Focus on equity building through renovations
- **Value-Add Commercial**: Commercial property value enhancement

### Assumption Editing
- **Rent Growth**: Annual rental increase percentage
- **Capital Growth**: Annual property value appreciation
- **Expense Inflation**: Annual expense increase rate
- **Tax Rate**: Marginal tax rate for calculations

### Modeling Actions
- **Run Projection**: Calculate 30-year cashflow projections
- **Save Results**: Save modeling results to portfolio
- **Export Report**: Download detailed analysis report
- **Compare Strategies**: Side-by-side strategy comparison

## 📱 **Responsive Design**

### Desktop
- **Full Chart**: Large cashflow projection chart
- **Side-by-side Layout**: Chart and metrics side by side
- **Full Table**: Complete year-by-year breakdown
- **Strategy Comparison**: Horizontal comparison layout

### Tablet
- **Medium Chart**: Reduced size chart
- **Stacked Layout**: Chart above metrics
- **Condensed Table**: Essential columns only
- **Vertical Comparison**: Strategy comparison stacked

### Mobile
- **Small Chart**: Compact chart view
- **Single Column**: All elements stacked
- **Scrollable Table**: Horizontal scroll for table
- **Collapsible Sections**: Expandable content areas

## 🎭 **Micro-interactions**

### Loading States
- **Modeling Spinner**: Show while calculating projections
- **Progress Bar**: Show calculation progress
- **Skeleton Screens**: Show while loading data

### Interactive Elements
- **Chart Hover**: Show year details on chart hover
- **Table Row Hover**: Highlight table rows
- **Button States**: Loading, success, error states
- **Form Validation**: Real-time validation feedback

### Animations
- **Chart Animation**: Animate chart line drawing
- **Metric Counters**: Animate number counting
- **Page Transitions**: Smooth page transitions
- **Modal Animations**: Smooth modal open/close

## 📈 **Performance Considerations**

### Calculation Engine
- **Optimized Algorithms**: Fast 30-year calculations
- **Caching**: Cache calculation results
- **Progressive Loading**: Load results progressively
- **Background Processing**: Run calculations in background

### User Experience
- **Quick Feedback**: Immediate response to user actions
- **Error Handling**: Graceful error states and recovery
- **Auto-save**: Automatically save modeling progress
- **Undo/Redo**: Allow users to undo changes

## 🎯 **Success Metrics**

### User Engagement
- **Modeling Completion Rate**: Percentage of properties with completed modeling
- **Strategy Comparison Usage**: How often users compare strategies
- **Report Generation**: Frequency of report exports
- **Time Spent Modeling**: Average time spent on modeling

### User Experience
- **Time to Model**: Speed of cashflow calculation
- **Modeling Accuracy**: Quality of projections
- **User Satisfaction**: Feedback on modeling results
- **Error Rate**: Frequency of modeling failures

### Business Metrics
- **Portfolio Completion**: Time to complete portfolio modeling
- **Feature Adoption**: Usage of advanced modeling features
- **User Retention**: Return usage after initial modeling
- **Recommendation Rate**: Users recommending the tool

## 🔄 **User Flow**

### Property Modeling Process
1. **Select Property**: Choose property from portfolio
2. **Set Strategy**: Select investment strategy
3. **Adjust Assumptions**: Modify modeling parameters
4. **Run Projection**: Calculate 30-year cashflows
5. **Review Results**: Analyze projections and metrics
6. **Compare Strategies**: Test different scenarios
7. **Save Results**: Store modeling results
8. **Export Report**: Download detailed analysis

### Strategy Comparison Flow
1. **Run Base Model**: Calculate current strategy
2. **Select Alternative**: Choose different strategy
3. **Run Comparison**: Calculate alternative scenario
4. **View Comparison**: Side-by-side analysis
5. **Make Decision**: Choose preferred strategy
6. **Save Decision**: Store selected strategy
