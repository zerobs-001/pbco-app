# Property Portfolio Cashflow Forecaster - Design System

## 🎨 **Color Palette**

### Primary Colors
- **Primary Blue**: `#2563eb` (Blue-600) - Main brand color, buttons, links
- **Primary Blue Dark**: `#1d4ed8` (Blue-700) - Hover states
- **Primary Blue Light**: `#dbeafe` (Blue-100) - Backgrounds, highlights

### Secondary Colors
- **Success Green**: `#059669` (Emerald-600) - Positive actions, success states
- **Warning Orange**: `#d97706` (Amber-600) - Warnings, alerts
- **Error Red**: `#dc2626` (Red-600) - Errors, destructive actions

### Neutral Colors
- **Text Primary**: `#111827` (Gray-900) - Main text
- **Text Secondary**: `#6b7280` (Gray-500) - Secondary text
- **Text Muted**: `#9ca3af` (Gray-400) - Disabled text
- **Background**: `#ffffff` (White) - Main backgrounds
- **Background Secondary**: `#f9fafb` (Gray-50) - Secondary backgrounds
- **Border**: `#e5e7eb` (Gray-200) - Borders, dividers

### Accent Colors
- **Financial Green**: `#10b981` (Emerald-500) - Positive financial indicators
- **Financial Red**: `#ef4444` (Red-500) - Negative financial indicators
- **Chart Blue**: `#3b82f6` (Blue-500) - Charts and graphs

## 🎯 **Typography**

### Font Family
- **Primary**: Inter (Google Fonts)
- **Monospace**: JetBrains Mono (for financial data)

### Font Sizes
- **Heading 1**: `text-4xl font-bold` (36px)
- **Heading 2**: `text-3xl font-semibold` (30px)
- **Heading 3**: `text-2xl font-semibold` (24px)
- **Heading 4**: `text-xl font-semibold` (20px)
- **Body Large**: `text-lg` (18px)
- **Body**: `text-base` (16px)
- **Body Small**: `text-sm` (14px)
- **Caption**: `text-xs` (12px)

## 🧩 **Component Library**

### Buttons
- **Primary**: Blue background, white text, rounded-lg
- **Secondary**: White background, blue text, blue border
- **Ghost**: Transparent background, blue text
- **Danger**: Red background, white text

### Cards
- **Standard**: White background, subtle shadow, rounded-lg
- **Interactive**: Hover effects, border on focus
- **Highlighted**: Blue-50 background, blue border

### Forms - Compact Styling (NEW)
- **CompactInput**: Underline-only styling with gray border, green focus
  - `border-b border-gray-300` - Default state
  - `focus:border-b-2 focus:border-green-500` - Focus state
  - `py-1 px-0` - Minimal padding
  - `bg-transparent` - Transparent background
- **CompactSelect**: Consistent with CompactInput styling
- **CompactFormRow**: 40/60 label-to-input ratio layout
  - `w-2/5` for labels (40% width)
  - `w-3/5` for inputs (60% width)
  - `py-2` for compact vertical spacing
- **Form Layout**: Tabular feel with left-aligned labels

### Navigation - Updated Layout
- **Left Navigation Panel**: 25% width on desktop, slide-out on mobile
  - Full vertical height (excluding global header)
  - Collapsible to icons only
  - Mobile: overlay slide-out
- **Right Panel**: Sliding panel from left navigation
  - Resizable width (300px to 60% of screen)
  - Handle with left arrow for closing
  - Internal scrolling for content
  - Main content adjusts width when open
- **Global Header**: Fixed height, contains main navigation

### Panel Components
- **RightPanel**: Sliding panel with resize functionality
  - Smooth slide-in/out animation
  - Resize handle with drag functionality
  - Constrained to viewport height
  - Internal scrolling for content
- **NavigationPanel**: Left navigation with collapsible state
  - Full height layout
  - Icon-only collapsed state
  - Mobile-responsive overlay

## 📱 **Layout & Spacing**

### Grid System
- **Container**: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
- **Columns**: 12-column grid system
- **Gutters**: 1rem (16px) default

### Spacing Scale
- **xs**: 0.25rem (4px)
- **sm**: 0.5rem (8px)
- **md**: 1rem (16px)
- **lg**: 1.5rem (24px)
- **xl**: 2rem (32px)
- **2xl**: 3rem (48px)

### Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### Layout Patterns - Updated
- **Main Content Area**: `h-[calc(100vh-80px)]` for full viewport height
- **Panel Integration**: Dynamic margin adjustment based on right panel state
- **Mobile Responsiveness**: Slide-out navigation overlay
- **Compact Forms**: Reduced spacing with `space-y-1` for tight layouts

## 🎭 **Interactive States**

### Hover Effects
- **Buttons**: Slight scale (transform scale-105)
- **Cards**: Shadow increase
- **Links**: Color change

### Focus States
- **All interactive elements**: Blue ring outline
- **CompactInput**: Green border with 2px thickness
- **CompactSelect**: Consistent green focus state

### Loading States
- **Spinners**: Blue color, consistent sizing
- **Skeletons**: Gray-200 background

## 📊 **Data Visualization**

### Charts
- **Line Charts**: Blue primary, gray secondary
- **Bar Charts**: Blue bars, gray axis
- **Pie Charts**: Consistent color palette
- **Tables**: Alternating row colors, hover effects

### Financial Indicators
- **Positive**: Green text and icons
- **Negative**: Red text and icons
- **Neutral**: Gray text

### Chart Enhancements - NEW
- **Dual Y-Axes**: Separate scales for different data types
- **Dynamic Scaling**: Y-axis adjusts to prevent overflow
- **Chart Toggling**: Switch between different chart types
- **Stacked Bar Charts**: Multiple series in single chart
- **Collapsible Data Tables**: Raw data display under charts

## 🔄 **Animation & Transitions**

### Duration
- **Fast**: 150ms
- **Normal**: 300ms
- **Slow**: 500ms

### Easing
- **Standard**: ease-in-out
- **Bounce**: cubic-bezier(0.68, -0.55, 0.265, 1.55)

### Panel Animations - NEW
- **Slide Transitions**: `transform transition-transform duration-300 ease-out`
- **Resize Animations**: Smooth width adjustments
- **Overlay Transitions**: Mobile navigation slide-in/out

## 📄 **Page Templates**

### Property Modeling Page - Updated Structure
```
Global Header (Fixed)
├── Left Navigation Panel (25% width, collapsible)
│   ├── Navigation Items
│   └── Collapse Toggle
├── Main Content Area (Dynamic width)
│   ├── Charts Section
│   ├── Detailed Projections
│   └── Milestones Timeline
└── Right Panel (Sliding, resizable)
    ├── Panel Header with Close Handle
    ├── Section Content (Scrollable)
    └── Panel Footer
```

### Form Page Structure - Updated
```
Header
├── Form Title
├── Progress Indicator (if multi-step)
└── Form Content
    ├── CompactFormRow Layout
    ├── Validation Messages
    └── Action Buttons
```

## 🎨 **Icon System**

### Icon Library
- **Primary**: Lucide React (consistent with current setup)
- **Financial**: Custom financial icons where needed
- **Size**: 16px, 20px, 24px variants

### Icon Colors
- **Default**: Gray-500
- **Interactive**: Blue-600
- **Success**: Green-600
- **Warning**: Orange-600
- **Error**: Red-600

### Navigation Icons - NEW
- **ChevronLeftIcon**: Right panel close handle
- **ChevronRightIcon**: Navigation expand/collapse
- **PlusCircleIcon**: Add items
- **MinusCircleIcon**: Remove items

## 🎯 **Form Patterns - NEW**

### Compact Form Styling
- **Underline Inputs**: Only bottom border visible
- **Tabular Layout**: Labels left, inputs right
- **Minimal Spacing**: `space-y-1` for tight layouts
- **Calculated Fields**: Read-only with gray text and underline

### Purchase Section Pattern
- **Input Groups**: Logical grouping with colored headers
- **Timing Groups**: Color-coded payment timing categories
- **Summary Bars**: Compact financial summaries
- **Status Indicators**: Paid/To Pay status tracking

### Table Patterns
- **Grid Layout**: 12-column grid for consistent alignment
- **Right Alignment**: Monetary values right-aligned
- **Hover States**: Subtle background changes on hover
- **Status Colors**: Green for paid, red for outstanding

## 📱 **Mobile Responsiveness - Updated**

### Navigation
- **Left Panel**: Overlay slide-out on mobile
- **Right Panel**: Full-width on mobile with close handle
- **Touch Targets**: Minimum 44px for mobile interaction

### Forms
- **Compact Styling**: Maintained on mobile
- **Responsive Grid**: Adapts to smaller screens
- **Touch-Friendly**: Appropriate input sizes for mobile

### Charts
- **Responsive Charts**: Scale appropriately on mobile
- **Touch Interaction**: Chart interactions work on touch devices
- **Mobile-Optimized**: Simplified layouts for small screens
