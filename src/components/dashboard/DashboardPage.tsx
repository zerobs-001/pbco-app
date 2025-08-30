"use client";

import React, { useMemo, useState, useEffect } from "react";
import { propertyService } from "@/lib/services/propertyService";
import { portfolioService } from "@/lib/services/portfolioService";
import { userService } from "@/lib/services/userService";
import { Property } from "@/types";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";

// Helper function for consistent date formatting (client-side only)
function formatDate(dateString: string): string {
  if (typeof window === 'undefined') return ''; // SSR fallback
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// Helper function to safely format numbers (client-side only)
function formatNumber(num: number, decimals: number = 1): string {
  if (typeof window === 'undefined') return '0'; // SSR fallback
  return num.toFixed(decimals);
}

// Helper function to calculate DSCR
function calculateDSCR(annualRent: number, annualExpenses: number, loan: any): string {
  if (loan.principal_amount > 0 && loan.interest_rate > 0) {
    const monthlyRate = loan.interest_rate / 100 / 12;
    const totalPayments = loan.term_years * 12;
    const monthlyPayment = (loan.principal_amount * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
                         (Math.pow(1 + monthlyRate, totalPayments) - 1);
    const annualLoanPayment = monthlyPayment * 12;
    const netOperatingIncome = annualRent - annualExpenses;
    const dscr = annualLoanPayment > 0 ? netOperatingIncome / annualLoanPayment : 0;
    return `${formatNumber(dscr, 1)}x`;
  }
  return 'N/A';
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { user, signOut } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch portfolio and properties on component mount
  useEffect(() => {
    if (!mounted || !user) return;
    
    const fetchPortfolioAndProperties = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔥 Dashboard fetching portfolio for user:', user.id, user.email);
        
        // First, get the user's primary portfolio
        const portfolioResult = await portfolioService.getUserPrimaryPortfolio(user.id);
        console.log('🔥 Dashboard portfolio result:', portfolioResult);
        
        let currentPortfolio = null;
        
        if (!portfolioResult.success) {
          console.error('🔥 Error fetching portfolio:', portfolioResult.error);
          
          // First ensure user profile exists
          console.log('🔥 Ensuring user profile exists before creating portfolio...');
          const userResult = await userService.ensureUserProfile(user);
          console.log('🔥 User profile result:', userResult);
          
          if (!userResult.success) {
            setError('Failed to set up user profile. Please try refreshing the page.');
            return;
          }
          
          // Try to create a portfolio if none exists
          console.log('🔥 No portfolio found, trying to create one...');
          const createResult = await portfolioService.createDefaultPortfolio(user.id);
          console.log('🔥 Create portfolio result:', createResult);
          
          if (createResult.success) {
            currentPortfolio = createResult.portfolio;
            setPortfolio(currentPortfolio);
          } else {
            setError('Failed to load portfolio. Please try refreshing the page.');
            return;
          }
        } else {
          currentPortfolio = portfolioResult.portfolio;
          setPortfolio(currentPortfolio);
        }
        
        // Then fetch properties for this portfolio
        if (currentPortfolio?.id) {
          console.log('🔥 Fetching properties for portfolio:', currentPortfolio.id);
          const propertiesData = await propertyService.getPropertiesByPortfolioId(currentPortfolio.id);
          console.log('🔥 Properties fetched:', propertiesData?.length || 0);
          setProperties(propertiesData);
        } else {
          console.log('🔥 No portfolio ID found, setting empty properties');
          setProperties([]);
        }
        
      } catch (err) {
        console.error('Error fetching portfolio and properties:', err);
        setError('Failed to load portfolio data');
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolioAndProperties();
  }, [user, mounted]);

  // Calculate portfolio KPIs
  const portfolioKPIs = useMemo(() => {
    if (properties.length === 0) {
      return {
        totalValue: 0,
        averageLVR: 0,
        averageDSCR: 0,
        modeledCount: 0,
        totalProperties: 0
      };
    }

    const totalValue = properties.reduce((sum, prop) => sum + (prop.current_value || 0), 0);
    const modeledProperties = properties.filter(prop => prop.cashflow_status === 'modeled');
    
    // Calculate average LVR (Loan to Value Ratio) - simplified calculation
    const totalLoans = properties.reduce((sum, prop) => {
      return sum + (prop.loan?.principal_amount || 0);
    }, 0);
    const averageLVR = totalValue > 0 ? (totalLoans / totalValue) * 100 : 0;

    // Calculate average DSCR (Debt Service Coverage Ratio) - simplified calculation
    const totalAnnualRent = properties.reduce((sum, prop) => sum + (prop.annual_rent || 0), 0);
    const totalAnnualExpenses = properties.reduce((sum, prop) => sum + (prop.annual_expenses || 0), 0);
    const totalLoanPayments = properties.reduce((sum, prop) => {
      if (prop.loan && prop.loan.principal_amount > 0 && prop.loan.interest_rate > 0) {
        const monthlyRate = prop.loan.interest_rate / 100 / 12;
        const totalPayments = prop.loan.term_years * 12;
        const monthlyPayment = (prop.loan.principal_amount * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
                             (Math.pow(1 + monthlyRate, totalPayments) - 1);
        return sum + (monthlyPayment * 12);
      }
      return sum;
    }, 0);
    const averageDSCR = totalLoanPayments > 0 ? (totalAnnualRent - totalAnnualExpenses) / totalLoanPayments : 0;

    return {
      totalValue,
      averageLVR,
      averageDSCR,
      modeledCount: modeledProperties.length,
      totalProperties: properties.length
    };
  }, [properties]);

  // Don't render until client-side mount to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="font-plus min-h-screen w-full bg-[#f8fafc] text-[#111827] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563eb]"></div>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
  };

  // Show loading state
  if (loading) {
    return (
      <div className="font-plus min-h-screen w-full bg-[#f8fafc] text-[#111827]">
        <AppHeader user={user} onSignOut={handleSignOut} />
        <main className="mx-auto max-w-[1400px] px-6 pb-8 pt-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563eb] mx-auto mb-4"></div>
              <p className="text-[#6b7280]">Loading portfolio data...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="font-plus min-h-screen w-full bg-[#f8fafc] text-[#111827]">
        <AppHeader user={user} onSignOut={handleSignOut} />
        <main className="mx-auto max-w-[1400px] px-6 pb-8 pt-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-red-500 text-2xl mb-4">⚠️</div>
              <h2 className="text-xl font-semibold text-[#111827] mb-2">Error Loading Portfolio</h2>
              <p className="text-[#6b7280] mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="inline-flex items-center px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8]"
              >
                Try Again
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="font-plus min-h-screen w-full bg-[#f8fafc] text-[#111827]">
      <AppHeader user={user} onSignOut={handleSignOut} />
      <main className="mx-auto max-w-[1400px] px-6 pb-8 pt-6">
        <div className="flex flex-col gap-6">
          <PortfolioHeader portfolio={portfolio} />
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KpiCard 
              title="Total Portfolio Value" 
              value={`$${formatNumber(portfolioKPIs.totalValue / 1000000, 1)}M`} 
              accent="blue" 
              helper={`Across ${portfolioKPIs.totalProperties} properties`} 
            />
            <KpiCard 
              title="Average LVR" 
              value={`${formatNumber(portfolioKPIs.averageLVR, 1)}%`} 
              accent="orange" 
              helper="Target ≤ 70%" 
            />
            <KpiCard 
              title="Average DSCR" 
              value={`${formatNumber(portfolioKPIs.averageDSCR, 1)}x`} 
              accent="green" 
              helper="> 1.25x is healthy" 
            />
            <KpiCard 
              title="Modeled Properties" 
              value={`${portfolioKPIs.modeledCount}/${portfolioKPIs.totalProperties}`} 
              accent="purple" 
              helper={`${portfolioKPIs.totalProperties - portfolioKPIs.modeledCount} need modeling`} 
            />
          </section>
          <section className="grid grid-cols-1 gap-6 xl:grid-cols-3 xl:gap-6">
            <div className="xl:col-span-2 rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e7eb]">
                <h3 className="text-lg font-semibold">My Investment Portfolio</h3>
                <a href="/property/new" className="inline-flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm font-medium text-[#111827] hover:shadow-sm focus:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(17,24,39,0.08)]">
                  <IconPlus className="h-4 w-4" /> Add Property
                </a>
              </div>
              <div className="max-h-[600px] overflow-auto">
                {properties.length === 0 ? (
                  <EmptyPropertiesState portfolio={portfolio} />
                ) : (
                  <PropertyTable properties={properties} />
                )}
              </div>
            </div>
            <div className="flex flex-col gap-6">
              <PortfolioActions />
              <RecentActivity />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function EmptyPropertiesState({ portfolio }: { portfolio?: any }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <IconPlus className="h-8 w-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Welcome to Your Portfolio!</h3>
        <p className="text-gray-600 mb-6 max-w-md">
          {portfolio?.name || 'Your portfolio'} is ready to go. Start by adding your first property to begin modeling your investment journey.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a 
            href="/property/new" 
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <IconPlus className="h-4 w-4" />
            Add Your First Property
          </a>
          <button className="inline-flex items-center gap-2 bg-white text-gray-700 px-6 py-2 rounded-lg border border-gray-300 font-medium hover:bg-gray-50 transition-colors">
            <IconFileText className="h-4 w-4" />
            Import Properties
          </button>
        </div>
        <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg max-w-md mx-auto">
          <p className="text-sm text-green-800">
            <strong>✅ Account Setup Complete!</strong><br />
            Your portfolio "{portfolio?.name || 'My Investment Portfolio'}" has been created with default settings. You're ready to start modeling!
          </p>
        </div>
      </div>
    </div>
  );
}

function PortfolioHeader({ portfolio }: { portfolio?: any }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-[#111827]">{portfolio?.name || 'My Investment Portfolio'}</h1>
        <p className="text-[#6b7280] mt-1">Manage your properties and track cashflow projections</p>
      </div>
      <div className="flex gap-3">
        <a href="/property/new" className="inline-flex items-center gap-2 rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8] focus:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(37,99,235,0.2)]">
          <IconPlus className="h-4 w-4" /> Add Property
        </a>
        <button className="inline-flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-4 py-2 text-sm font-medium text-[#111827] hover:shadow-sm focus:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(17,24,39,0.08)]">
          <IconSettings className="h-4 w-4" /> Settings
        </button>
      </div>
    </div>
  );
}

function KpiCard({ title, value, accent, helper }: { title: string; value: string; accent: string; helper?: string }) {
  const accentColors = {
    blue: "border-l-[#2563eb]",
    green: "border-l-[#059669]",
    orange: "border-l-[#d97706]",
    purple: "border-l-[#7c3aed]",
    red: "border-l-[#dc2626]",
  };

  return (
    <div className={`rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm border-l-4 ${accentColors[accent as keyof typeof accentColors]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[#6b7280]">{title}</p>
          <p className="text-2xl font-bold text-[#111827] mt-1">{value}</p>
          {helper && <p className="text-xs text-[#9ca3af] mt-1">{helper}</p>}
        </div>
      </div>
    </div>
  );
}

    function PropertyTable({ properties }: { properties: Property[] }) {
      const getStatusIcon = (status: string) => {
    switch (status) {
      case "modeled":
        return <IconCheck className="h-4 w-4 text-green-600" />;
      case "needs_modeling":
        return <IconAlert className="h-4 w-4 text-orange-600" />;
      case "error":
        return <IconX className="h-4 w-4 text-red-600" />;
      default:
        return <IconClock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "modeled":
        return "Modeled";
      case "not_modeled":
        return "Not Modeled";
      case "modeling":
        return "Modeling";
      case "error":
        return "Error";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-[#f9fafb]">
          <tr>
            <th className="px-5 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">Property</th>
            <th className="px-5 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">Type</th>
            <th className="px-5 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">Value</th>
            <th className="px-5 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">LVR</th>
            <th className="px-5 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">DSCR</th>
            <th className="px-5 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">Status</th>
            <th className="px-5 py-3 text-left text-xs font-medium text-[#6b7280] uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
                    <tbody className="divide-y divide-[#e5e7eb]">
              {properties.map((property) => (
                <tr key={property.id} className="hover:bg-[#f9fafb]">
                  <td className="px-5 py-4">
                    <div>
                      <div className="font-medium text-[#111827]">{property.name}</div>
                      <div className="text-sm text-[#6b7280]">
                        {property.address}
                      </div>
                      <div className="text-xs text-[#6b7280] mt-1">
                        Purchased: {formatDate(property.purchase_date)} | Strategy: {property.strategy}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-[#111827]">{property.type}</td>
                                      <td className="px-5 py-4 text-sm text-[#111827]">${formatNumber(property.current_value / 1000, 0)}K</td>
                    <td className="px-5 py-4 text-sm text-[#111827]">
                      {property.loan && property.current_value > 0 
                        ? `${formatNumber((property.loan.principal_amount / property.current_value) * 100, 1)}%` 
                        : 'N/A'}
                    </td>
                    <td className="px-5 py-4 text-sm text-[#111827]">
                      {property.cashflow_status === 'modeled' && property.annual_rent && property.annual_expenses && property.loan
                        ? calculateDSCR(property.annual_rent, property.annual_expenses, property.loan)
                        : 'N/A'}
                    </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(property.cashflow_status)}
                      <span className="text-sm text-[#111827]">{getStatusText(property.cashflow_status)}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                                          <div className="flex gap-2">
                        {property.cashflow_status === "not_modeled" ? (
                          <a href={`/property/${property.id}/model`} className="inline-flex items-center gap-1 rounded-md bg-[#2563eb] px-2 py-1 text-xs font-medium text-white hover:bg-[#1d4ed8]">
                            <IconPlay className="h-3 w-3" /> Model
                          </a>
                        ) : property.cashflow_status === "modeling" ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-[#f59e0b] px-2 py-1 text-xs font-medium text-white">
                            <IconClock className="h-3 w-3" /> In Progress
                          </span>
                        ) : (
                          <a href={`/property/${property.id}/model`} className="inline-flex items-center gap-1 rounded-md bg-[#059669] px-2 py-1 text-xs font-medium text-white hover:bg-[#047857]">
                            <IconEye className="h-3 w-3" /> View
                          </a>
                        )}
                      <button className="inline-flex items-center gap-1 rounded-md border border-[#e5e7eb] bg-white px-2 py-1 text-xs font-medium text-[#111827] hover:bg-[#f9fafb]">
                        <IconEdit className="h-3 w-3" /> Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
      </table>
    </div>
  );
}

function PortfolioActions() {
  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
      <div className="px-5 py-4 border-b border-[#e5e7eb]">
        <h3 className="text-lg font-semibold">Portfolio Actions</h3>
      </div>
      <div className="p-5 space-y-3">
        <button className="flex w-full items-center gap-3 rounded-lg border border-[#e5e7eb] bg-white p-3 text-left hover:shadow-sm transition-shadow">
          <IconChart className="h-5 w-5 text-[#2563eb] flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="font-medium text-[#111827] truncate">Generate Portfolio Report</div>
            <div className="text-sm text-[#6b7280] truncate">Run 30-year projections</div>
          </div>
        </button>
        <button className="flex w-full items-center gap-3 rounded-lg border border-[#e5e7eb] bg-white p-3 text-left hover:shadow-sm transition-shadow">
          <IconDownload className="h-5 w-5 text-[#059669] flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="font-medium text-[#111827] truncate">Export Portfolio Data</div>
            <div className="text-sm text-[#6b7280] truncate">Download CSV/JSON</div>
          </div>
        </button>
        <button className="flex w-full items-center gap-3 rounded-lg border border-[#e5e7eb] bg-white p-3 text-left hover:shadow-sm transition-shadow">
          <IconTrendingUp className="h-5 w-5 text-[#d97706] flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="font-medium text-[#111827] truncate">View Income Timeline</div>
            <div className="text-sm text-[#6b7280] truncate">See replacement progression</div>
          </div>
        </button>
        <button className="flex w-full items-center gap-3 rounded-lg border border-[#e5e7eb] bg-white p-3 text-left hover:shadow-sm transition-shadow">
          <IconCompare className="h-5 w-5 text-[#7c3aed] flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="font-medium text-[#111827] truncate">Compare Properties</div>
            <div className="text-sm text-[#6b7280] truncate">Side-by-side analysis</div>
          </div>
        </button>
      </div>
    </div>
  );
}

function RecentActivity() {
  const activities = [
    { id: "1", action: "Modeled Sydney House", time: "2 hours ago", type: "modeling" },
    { id: "2", action: "Updated Melbourne Unit", time: "1 day ago", type: "update" },
    { id: "3", action: "Added Brisbane Office", time: "2 days ago", type: "add" },
    { id: "4", action: "Generated Forecast", time: "3 days ago", type: "report" },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "modeling":
        return <IconChart className="h-4 w-4 text-[#2563eb]" />;
      case "update":
        return <IconEdit className="h-4 w-4 text-[#059669]" />;
      case "add":
        return <IconPlus className="h-4 w-4 text-[#d97706]" />;
      case "report":
        return <IconFileText className="h-4 w-4 text-[#7c3aed]" />;
      default:
        return <IconCircle className="h-4 w-4 text-[#6b7280]" />;
    }
  };

  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
      <div className="px-5 py-4 border-b border-[#e5e7eb]">
        <h3 className="text-lg font-semibold">Recent Activity</h3>
      </div>
      <div className="p-5 space-y-3">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {getActivityIcon(activity.type)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-[#111827] truncate">{activity.action}</div>
              <div className="text-xs text-[#6b7280]">{activity.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AppHeader({ user, onSignOut }: { user: any; onSignOut: () => void }) {
  const getInitials = (email: string) => {
    return email.split('@')[0].substring(0, 2).toUpperCase();
  };

  return (
    <header className="border-b border-[#e5e7eb] bg-white">
      <div className="mx-auto max-w-[1400px] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="text-xl font-bold text-[#111827]">Property Portfolio CF</div>
            <nav className="hidden md:flex items-center gap-6">
              <a href="/dashboard" className="text-[#6b7280] hover:text-[#111827]">Dashboard</a>
              <a href="#" className="text-[#6b7280] hover:text-[#111827]">Properties</a>
              <a href="#" className="text-[#6b7280] hover:text-[#111827]">Reports</a>
              <a href="#" className="text-[#6b7280] hover:text-[#111827]">Settings</a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <button className="rounded-full p-2 text-[#6b7280] hover:bg-[#f3f4f6]">
              <IconBell className="h-5 w-5" />
            </button>
            <div className="relative group">
              <div className="flex items-center gap-2 cursor-pointer">
                <div className="h-8 w-8 rounded-full bg-[#2563eb] flex items-center justify-center">
                  <span className="text-sm font-medium text-white">{getInitials(user?.email || 'U')}</span>
                </div>
                <span className="hidden md:block text-sm font-medium text-[#111827]">{user?.email}</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              
              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-2">
                  <div className="px-4 py-2 text-sm text-gray-600 border-b border-gray-100">
                    Signed in as<br />
                    <strong>{user?.email}</strong>
                  </div>
                  <button
                    onClick={onSignOut}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

// Icon components
function IconPlus({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function IconSettings({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function IconAlert({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  );
}

function IconX({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function IconClock({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconPlay({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconEye({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

  function IconEdit({ className }: { className?: string }) {
    return (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    );
  }

function IconChart({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function IconDownload({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function IconTrendingUp({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}

function IconCompare({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function IconFileText({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function IconCircle({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
    </svg>
  );
}

function IconBell({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
}
