"use client";

import React, { useMemo } from "react";

// ZERO‑INSTALL VERSION
// • No next/font
// • No external icon libraries
// • All icons are inline SVG components
// → Add this to your index.html once:
// <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
// <style>
//   :root { --font-plus: 'Plus Jakarta Sans', ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial; }
//   .font-plus { font-family: var(--font-plus); }
// </style>

export default function DashboardPage() {
  return (
    <div className="font-plus min-h-screen w-full bg-[#f8fafc] text-[#111827]">
      <AppHeader />
      <main className="mx-auto max-w-[1400px] aspect-[16/9] px-6 pb-8 pt-6">
        <div className="flex h-full w-full flex-col gap-6 overflow-hidden rounded-2xl">
          <TitleRow />
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KpiCard title="Total Portfolio Value" value="$2.4M" accent="blue" helper="Across 3 portfolios" />
            <KpiCard title="Average LVR" value="65.2%" accent="orange" helper="Target ≤ 70%" />
            <KpiCard title="Average DSCR" value="1.8x" accent="green" helper="> 1.25x is healthy" />
            <KpiCard title="Income Replacement Year" value="2032" accent="purple" helper="Projection based on plan" />
          </section>
          <section className="grid grid-cols-1 gap-6 xl:grid-cols-3 xl:gap-6">
            <div className="xl:col-span-2 h-[min(50vh,520px)] overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e7eb]">
                <h3 className="text-lg font-semibold">Investments</h3>
                <button className="inline-flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm font-medium text-[#111827] hover:shadow-sm focus:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(17,24,39,0.08)]">
                  <IconUpload className="h-4 w-4" /> Import
                </button>
              </div>
              <PortfolioTable />
            </div>
            <div className="grid h-[min(50vh,520px)] grid-rows-2 gap-6">
              <RecentActivity />
              <QuickActions />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function TitleRow() {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="flex gap-3">
        <button className="rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e4ed8]">Create Portfolio</button>
        <button className="rounded-lg border border-[#e5e7eb] bg-white px-4 py-2 text-sm font-medium text-[#111827] hover:shadow-sm">Add Property</button>
      </div>
    </div>
  );
}

function KpiCard({ title, value, accent, helper }: {
  title: string;
  value: string;
  accent: "blue" | "orange" | "green" | "purple";
  helper: string;
}) {
  const colors = {
    blue: "text-[#2563eb]",
    orange: "text-orange-500",
    green: "text-green-600",
    purple: "text-purple-600",
  };
  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-[#6b7280]">{title}</p>
      <p className={`mt-2 text-2xl font-bold ${colors[accent]}`}>{value}</p>
      <p className="mt-1 text-xs text-[#9ca3af]">{helper}</p>
    </div>
  );
}

function QuickActions() {
  const actions = [
    { label: "Create New Portfolio" },
    { label: "Import Portfolio Data" },
    { label: "Export All Data" },
    { label: "View Tutorial" },
  ];
  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold">Quick Actions</h3>
      <div className="flex flex-col gap-2">
        {actions.map((a) => (
          <button key={a.label} className="rounded-md border border-[#e5e7eb] px-3 py-2 text-sm hover:bg-[#f9fafb] text-left">{a.label}</button>
        ))}
      </div>
    </div>
  );
}

function RecentActivity() {
  const activities = [
    "Updated Sydney Investment",
    "Added Property to Melbourne",
    "Generated Forecast Report",
    "Updated Loan Settings",
  ];
  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold">Recent Activity</h3>
      <ul className="space-y-2 text-sm">
        {activities.map((a, i) => (
          <li key={i} className="text-[#374151]">• {a}</li>
        ))}
      </ul>
    </div>
  );
}

function AppHeader() {
  return (
    <header className="flex items-center justify-between border-b border-[#e5e7eb] bg-white px-6 py-4 shadow-sm">
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-bold">PBCo</span>
        <span className="text-sm text-[#6b7280]">Portfolio Forecaster</span>
      </div>
      <div className="flex items-center gap-4">
        <button className="relative">
          <IconBell className="h-5 w-5 text-[#6b7280]" />
          <span className="absolute -right-1 -top-1 inline-flex h-3 w-3 rounded-full bg-red-500"></span>
        </button>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-[#e5e7eb]"></div>
          <IconChevronDown className="h-4 w-4 text-[#6b7280]" />
        </div>
      </div>
    </header>
  );
}

function PortfolioTable() {
  const rows = useMemo(() => [
    { name: "Sydney Investment", value: 850000, lvr: 0.68, dscr: 1.9 },
    { name: "Melbourne Investment", value: 620000, lvr: 0.62, dscr: 2.1 },
    { name: "Brisbane Investment", value: 480000, lvr: 0.7, dscr: 1.7 },
  ], []);

  return (
    <div className="h-[calc(100%-57px)] overflow-auto">
      <table className="min-w-full divide-y divide-[#e5e7eb]">
        <thead className="bg-[#f9fafb]">
          <tr>
            {["Investment","Value","LVR","DSCR","Actions"].map((h) => (
              <th key={h} scope="col" className="sticky top-0 z-10 whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6b7280]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f1f5f9] bg-white">
          {rows.map((r) => (
            <tr key={r.name} className="hover:bg-[#f9fafb]">
              <td className="whitespace-nowrap px-5 py-3 text-sm font-medium">{r.name}</td>
              <td className="whitespace-nowrap px-5 py-3 text-sm">{formatCurrency(r.value)}</td>
              <td className="whitespace-nowrap px-5 py-3 text-sm">{(r.lvr * 100).toFixed(0)}%</td>
              <td className="whitespace-nowrap px-5 py-3 text-sm">{r.dscr.toFixed(1)}x</td>
              <td className="whitespace-nowrap px-5 py-3 text-sm">
                <div className="flex items-center gap-2">
                  <button className="inline-flex items-center gap-1 rounded-md border border-[#e5e7eb] bg-white px-2.5 py-1.5 text-xs font-medium hover:shadow-sm focus:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(17,24,39,0.08)]"><IconEdit3 className="h-4 w-4" /> Edit</button>
                  <button className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#e5e7eb] bg-white hover:shadow-sm focus:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(17,24,39,0.08)]" aria-label="More actions"><IconMoreVertical className="h-4 w-4" /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Inline SVG Icons
function IconBell({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
  );
}

function IconChevronDown({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
  );
}

function IconUpload({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 9l5-5 5 5M12 4v12" /></svg>
  );
}

function IconEdit3({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5h2m-1 0v14m9-7H4" /></svg>
  );
}

function IconMoreVertical({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" /></svg>
  );
}

// Dummy helpers
function formatCurrency(num: number) {
  return `$${num.toLocaleString()}`;
}
