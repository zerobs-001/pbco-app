# Property Portfolio Cashflow Forecaster

A SaaS application that helps property investors forecast their portfolio cashflow and identify the earliest year they can safely replace their income.

## 🚀 Features

- **Portfolio Management**: Create and manage property portfolios with up to 10 properties
- **Strategy-Aware Modeling**: Support for Buy & Hold, Manufacture Equity, and Value-Add Commercial strategies
- **Loan Management**: Interest-Only and Principal & Interest loan types with rate step-ups
- **30-Year Projections**: Comprehensive cashflow forecasting with tax calculations
- **KPI Dashboard**: LVR, DSCR, and income-replacement year analysis
- **Admin Console**: Full client management and reference data administration
- **Export Functionality**: CSV and JSON exports with disclaimers

## 🛠 Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API routes, Supabase (PostgreSQL + Auth + RLS)
- **Authentication**: Supabase Auth with optional 2FA
- **Database**: PostgreSQL with Row Level Security
- **Validation**: Zod schema validation
- **Forms**: React Hook Form

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone <repository-url>
cd pbco-app
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Create a `.env.local` file with:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Set up Supabase
- Create a new Supabase project
- Run database migrations
- Configure authentication
- Set up Row Level Security policies

### 5. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API routes
│   ├── admin/          # Admin pages
│   ├── portfolio/      # Portfolio pages
│   └── globals.css     # Global styles
├── components/         # Reusable components
├── lib/               # Utility functions
├── types/             # TypeScript type definitions
└── utils/             # Helper functions
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Code Style

- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting
- Tailwind CSS for styling

## 📊 Database Schema

The application uses the following main entities:
- `users` - User accounts and authentication
- `portfolios` - Portfolio configurations
- `properties` - Property details and strategies
- `loans` - Loan configurations
- `results` - Computed projection results
- `audit_logs` - Audit trail for admin actions

## 🔐 Security

- Row Level Security (RLS) for data access control
- JWT-based authentication
- Admin role management
- Audit logging for sensitive operations
- Input validation and sanitization

## 📈 Deployment

The application is designed to be deployed on Vercel with Supabase as the backend.

## 📄 License

Property Buyers Co. All rights reserved.

## 🤝 Contributing

This is a private project for Property Buyers Co.

---

**Disclaimer**: This is general information and not financial advice. Results are hypothetical and depend on the assumptions you enter.
