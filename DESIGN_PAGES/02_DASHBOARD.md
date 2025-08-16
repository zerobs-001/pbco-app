# Page 2: Dashboard (Portfolio Overview)

## 📋 **Page Overview**
The main dashboard that users see after logging in, providing an overview of their property portfolios, key metrics, and quick actions.

## 🎯 **Design Goals**
- **Overview**: Clear summary of all portfolios and key metrics
- **Actionable**: Easy access to create new portfolios and properties
- **Informative**: Key KPIs and financial indicators at a glance
- **Professional**: Suitable for property investors and financial professionals

## 📱 **Page Structure**

### Main Dashboard Layout
```
┌─────────────────────────────────────────────────────────────────┐
│  Header Navigation                                              │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │   Logo/Brand    │ │   User Menu     │ │   Notifications │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  Page Title & Actions                                           │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Dashboard                    [Create Portfolio] [Add Property] │ │
│  └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  KPI Summary Cards                                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ │
│  │ Total Value │ │ Avg LVR     │ │ Avg DSCR    │ │ Income Year │ │
│  │ $2.4M       │ │ 65.2%       │ │ 1.8x        │ │ 2032        │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  Portfolio List & Quick Actions                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Portfolio Name    Properties  Value    LVR    DSCR   Actions│ │
│  │ ┌─────────────────────────────────────────────────────────┐ │ │
│  │ │ Sydney Portfolio    3        $850K   68%    1.9x   [Edit]│ │ │
│  │ └─────────────────────────────────────────────────────────┘ │ │
│  │ ┌─────────────────────────────────────────────────────────┐ │ │
│  │ │ Melbourne Portfolio  2        $620K   62%    2.1x   [Edit]│ │ │
│  │ └─────────────────────────────────────────────────────────┘ │ │
│  │ ┌─────────────────────────────────────────────────────────┐ │ │
│  │ │ Brisbane Portfolio   1        $480K   70%    1.7x   [Edit]│ │ │
│  │ └─────────────────────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  Recent Activity & Quick Actions                                │
│  ┌─────────────────────────────┐ ┌─────────────────────────────┐ │
│  │ Recent Activity             │ │ Quick Actions               │ │
│  │ • Updated Sydney Portfolio  │ │ • Create New Portfolio      │ │
│  │ • Added Property to Melb    │ │ • Import Portfolio Data     │ │
│  │ • Generated Forecast Report │ │ • Export All Data           │ │
│  │ • Updated Loan Settings     │ │ • View Tutorial             │ │
│  └─────────────────────────────┘ └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## 🎨 **Visual Design**

### Header Navigation
- **Background**: White (`#ffffff`) with subtle border
- **Logo**: Left-aligned "PBCo" with "Portfolio Forecaster" subtitle
- **User Menu**: Right-aligned with avatar, name, and dropdown
- **Notifications**: Bell icon with badge for new notifications
- **Height**: 64px with proper spacing

### Page Title Section
- **Title**: "Dashboard" in large, bold text
- **Actions**: Primary blue button "Create Portfolio", secondary "Add Property"
- **Layout**: Flex layout with title on left, actions on right
- **Spacing**: Generous padding and margins

### KPI Summary Cards
- **Layout**: 4-column grid (responsive: 2x2 on tablet, 1x4 on mobile)
- **Background**: White cards with subtle shadow
- **Metrics**: Large, bold numbers with descriptive labels
- **Colors**: 
  - **Total Value**: Blue accent
  - **LVR**: Orange for attention
  - **DSCR**: Green for positive
  - **Income Year**: Purple for future focus

### Portfolio List
- **Table Design**: Clean, professional table with hover effects
- **Columns**: Name, Properties count, Value, LVR, DSCR, Actions
- **Actions**: Edit button for each portfolio
- **Hover**: Subtle background color change
- **Empty State**: Friendly message with "Create Portfolio" CTA

### Recent Activity & Quick Actions
- **Layout**: 2-column grid (side by side)
- **Activity**: Timeline-style list of recent actions
- **Quick Actions**: Card-based action buttons
- **Icons**: Lucide React icons for visual clarity

## 🧩 **Component Library**

### Header Components
- **Logo**: Brand logo with subtitle
- **UserMenu**: Avatar, name, dropdown with profile/logout
- **Notifications**: Bell icon with notification count
- **Navigation**: Breadcrumbs for page hierarchy

### KPI Cards
- **MetricCard**: Reusable card for displaying KPIs
- **TrendIndicator**: Small arrow showing trend (up/down)
- **ValueDisplay**: Formatted number display with currency/percentage

### Portfolio Table
- **PortfolioRow**: Individual portfolio row with data
- **ActionButton**: Edit/View/Delete actions
- **StatusBadge**: Visual indicator for portfolio status
- **EmptyState**: Message when no portfolios exist

### Activity Feed
- **ActivityItem**: Individual activity with timestamp
- **QuickActionCard**: Card-based action button
- **Timeline**: Visual timeline for recent activities

## 📊 **Data Visualization**

### Charts (Future Enhancement)
- **Portfolio Value Chart**: Line chart showing portfolio growth
- **LVR Distribution**: Bar chart showing loan-to-value ratios
- **DSCR Heatmap**: Color-coded matrix of debt service coverage
- **Income Timeline**: Gantt-style chart showing income replacement

### Metrics Display
- **Currency Formatting**: Proper formatting for dollar amounts
- **Percentage Display**: Clear percentage indicators
- **Trend Arrows**: Visual indicators for metric changes
- **Color Coding**: Consistent color scheme for different metrics

## 🔧 **Interactive Elements**

### Buttons & Actions
- **Primary Button**: "Create Portfolio" - Blue background
- **Secondary Button**: "Add Property" - White with border
- **Action Buttons**: Small, contextual buttons for edit/view/delete
- **Quick Actions**: Card-based action buttons with icons

### Navigation
- **Breadcrumbs**: Clear page hierarchy
- **User Menu**: Dropdown with profile, settings, logout
- **Notifications**: Clickable notification center
- **Portfolio Links**: Click to view/edit portfolios

### Table Interactions
- **Row Hover**: Subtle background change
- **Sortable Columns**: Click to sort by different metrics
- **Search/Filter**: Filter portfolios by name or criteria
- **Pagination**: For large numbers of portfolios

## 📱 **Responsive Design**

### Desktop (> 1024px)
- **4-column KPI grid**: All metrics visible
- **Full table**: All columns visible
- **Side-by-side layout**: Activity and actions side by side
- **Large buttons**: Full-size action buttons

### Tablet (640px - 1024px)
- **2x2 KPI grid**: Metrics in 2x2 layout
- **Condensed table**: Essential columns only
- **Stacked layout**: Activity and actions stacked
- **Medium buttons**: Slightly smaller action buttons

### Mobile (< 640px)
- **1x4 KPI grid**: Metrics in single column
- **Card layout**: Portfolios as cards instead of table
- **Full-width layout**: All sections full width
- **Touch-friendly**: Larger touch targets

## 🎭 **Micro-interactions**

### Page Load
- **Staggered Animation**: KPI cards animate in sequence
- **Fade In**: Content fades in smoothly
- **Loading States**: Skeleton screens while data loads

### Hover Effects
- **Card Hover**: Subtle shadow increase
- **Button Hover**: Scale and color transitions
- **Table Row Hover**: Background color change
- **Action Hover**: Button state changes

### Click Interactions
- **Button Clicks**: Ripple effect or scale animation
- **Table Row Clicks**: Smooth navigation transitions
- **Menu Interactions**: Smooth dropdown animations
- **Form Submissions**: Loading states and success feedback

## 📈 **Performance Considerations**

### Data Loading
- **Skeleton Screens**: Show while data loads
- **Progressive Loading**: Load critical data first
- **Caching**: Cache portfolio data for quick access
- **Optimistic Updates**: Update UI immediately, sync later

### User Experience
- **Quick Actions**: Most common actions easily accessible
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader**: Proper ARIA labels and descriptions
- **Error Handling**: Graceful error states and recovery

## 🎨 **Brand Elements**

### Color Usage
- **Primary Blue**: Main actions and branding
- **Success Green**: Positive metrics and actions
- **Warning Orange**: Attention-grabbing metrics
- **Neutral Grays**: Text and borders
- **Accent Purple**: Future-focused metrics

### Typography
- **Headings**: Bold, large text for hierarchy
- **Body Text**: Clean, readable font
- **Metrics**: Large, bold numbers for impact
- **Labels**: Small, descriptive text

### Icons
- **Lucide React**: Consistent icon library
- **Financial Icons**: Property, money, chart icons
- **Action Icons**: Edit, delete, add, view icons
- **Status Icons**: Success, warning, error indicators

## 🔄 **User Flow**

### Dashboard Entry
1. User logs in successfully
2. Redirected to dashboard
3. Data loads with skeleton screens
4. KPI cards animate in
5. Portfolio list displays
6. Recent activity populates

### Portfolio Management
1. User clicks "Create Portfolio"
2. Modal or new page opens
3. Form for portfolio details
4. Validation and submission
5. Success feedback
6. Dashboard updates

### Quick Actions
1. User clicks quick action
2. Immediate feedback (loading state)
3. Action completes
4. Success notification
5. Dashboard updates
6. Activity log updated

## 📊 **Success Metrics**
- **Time to Action**: How quickly users can perform common tasks
- **Engagement**: How often users interact with different sections
- **Completion Rate**: How many users create portfolios
- **Error Rate**: How often users encounter issues
- **Performance**: Page load times and responsiveness
