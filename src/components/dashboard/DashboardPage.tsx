"use client";

import React, { useMemo } from "react";

export default function DashboardPage() {
  return (
    <div className="font-plus min-h-screen w-full bg-[#f8fafc] text-[#111827]">
      <AppHeader />
      <main className="mx-auto max-w-[1400px] px-6 pb-8 pt-6">
        <div className="flex flex-col gap-6">
          <PortfolioHeader />
                        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KpiCard title="Total Portfolio Value" value="$3.25M" accent="blue" helper="Across 5 properties" />
                <KpiCard title="Average LVR" value="68.0%" accent="orange" helper="Target ≤ 70%" />
                <KpiCard title="Average DSCR" value="1.9x" accent="green" helper="> 1.25x is healthy" />
                <KpiCard title="Modeled Properties" value="3/5" accent="purple" helper="2 need modeling" />
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
                <PropertyTable />
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

function PortfolioHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-[#111827]">My Investment Portfolio</h1>
        <p className="text-[#6b7280] mt-1">Manage your properties and track cashflow projections</p>
      </div>
      <div className="flex gap-3">
        <button className="inline-flex items-center gap-2 rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8] focus:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(37,99,235,0.2)]">
          <IconPlus className="h-4 w-4" /> Add Property
        </button>
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

    function PropertyTable() {
      const properties = [
        {
          id: "1",
          name: "Sydney House",
          type: "Residential House",
          value: "$920K",
          lvr: "68%",
          dscr: "1.9x",
          status: "modeled" as const,
          cashflow: "+$12K/yr",
          breakEven: "2028",
          strategy: "Buy & Hold",
          address: "123 Sydney Street, Sydney NSW 2000",
          purchaseDate: "2023-01-15",
        },
        {
          id: "2",
          name: "Melbourne Unit",
          type: "Residential Unit",
          value: "$680K",
          lvr: "62%",
          dscr: "2.1x",
          status: "modeled" as const,
          cashflow: "+$8K/yr",
          breakEven: "2030",
          strategy: "Buy & Hold",
          address: "456 Collins Street, Melbourne VIC 3000",
          purchaseDate: "2023-06-20",
        },
        {
          id: "3",
          name: "Brisbane Office",
          type: "Commercial Office",
          value: "$520K",
          lvr: "70%",
          dscr: "1.7x",
          status: "needs_modeling" as const,
          cashflow: "Not modeled",
          breakEven: "N/A",
          strategy: "Value-Add",
          address: "789 Queen Street, Brisbane QLD 4000",
          purchaseDate: "2024-01-10",
        },
        {
          id: "4",
          name: "Perth Retail",
          type: "Commercial Retail",
          value: "$380K",
          lvr: "65%",
          dscr: "2.3x",
          status: "modeled" as const,
          cashflow: "+$15K/yr",
          breakEven: "2026",
          strategy: "Manufacture Equity",
          address: "321 Hay Street, Perth WA 6000",
          purchaseDate: "2023-09-15",
        },
        {
          id: "5",
          name: "Adelaide Industrial",
          type: "Commercial Industrial",
          value: "$750K",
          lvr: "75%",
          dscr: "1.5x",
          status: "modeling" as const,
          cashflow: "In progress",
          breakEven: "N/A",
          strategy: "Value-Add Commercial",
          address: "147 Port Road, Adelaide SA 5000",
          purchaseDate: "2024-02-28",
        },
      ];

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
      case "needs_modeling":
        return "Needs Modeling";
      case "error":
        return "Error";
      default:
        return "Pending";
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
                        Purchased: {new Date(property.purchaseDate).toLocaleDateString()} | Strategy: {property.strategy}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-[#111827]">{property.type}</td>
                  <td className="px-5 py-4 text-sm text-[#111827]">{property.value}</td>
                  <td className="px-5 py-4 text-sm text-[#111827]">{property.lvr}</td>
                  <td className="px-5 py-4 text-sm text-[#111827]">{property.dscr}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(property.status)}
                      <span className="text-sm text-[#111827]">{getStatusText(property.status)}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      {property.status === "needs_modeling" ? (
                        <a href={`/property/${property.id}/model`} className="inline-flex items-center gap-1 rounded-md bg-[#2563eb] px-2 py-1 text-xs font-medium text-white hover:bg-[#1d4ed8]">
                          <IconPlay className="h-3 w-3" /> Model
                        </a>
                      ) : property.status === "modeling" ? (
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

function AppHeader() {
  return (
    <header className="border-b border-[#e5e7eb] bg-white">
      <div className="mx-auto max-w-[1400px] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="text-xl font-bold text-[#111827]">Property Portfolio CF</div>
            <nav className="hidden md:flex items-center gap-6">
              <a href="#" className="text-[#6b7280] hover:text-[#111827]">Dashboard</a>
              <a href="#" className="text-[#6b7280] hover:text-[#111827]">Properties</a>
              <a href="#" className="text-[#6b7280] hover:text-[#111827]">Reports</a>
              <a href="#" className="text-[#6b7280] hover:text-[#111827]">Settings</a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <button className="rounded-full p-2 text-[#6b7280] hover:bg-[#f3f4f6]">
              <IconBell className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-[#2563eb] flex items-center justify-center">
                <span className="text-sm font-medium text-white">JD</span>
              </div>
              <span className="hidden md:block text-sm font-medium text-[#111827]">John Doe</span>
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
