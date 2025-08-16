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

### Forms
- **Input**: Gray border, focus blue border, rounded-md
- **Select**: Consistent with input styling
- **Checkbox/Radio**: Custom styled with blue accent

### Navigation
- **Sidebar**: Dark background, white text
- **Top Bar**: White background, subtle border
- **Breadcrumbs**: Gray text, blue active state

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

## 🎭 **Interactive States**

### Hover Effects
- **Buttons**: Slight scale (transform scale-105)
- **Cards**: Shadow increase
- **Links**: Color change

### Focus States
- **All interactive elements**: Blue ring outline
- **Forms**: Blue border

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

## 🔄 **Animation & Transitions**

### Duration
- **Fast**: 150ms
- **Normal**: 300ms
- **Slow**: 500ms

### Easing
- **Standard**: ease-in-out
- **Bounce**: cubic-bezier(0.68, -0.55, 0.265, 1.55)

## 📄 **Page Templates**

### Standard Page Structure
```
Header (Navigation)
├── Page Title
├── Breadcrumbs (if applicable)
├── Action Buttons
└── Content Area
    ├── Main Content
    ├── Sidebar (if applicable)
    └── Footer
```

### Form Page Structure
```
Header
├── Form Title
├── Progress Indicator (if multi-step)
└── Form Content
    ├── Form Fields
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
