"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { propertyService, CreatePropertyData, PropertyValidationResult } from "@/lib/services/propertyService";
import { createClient } from '@/lib/supabase/client';

interface PropertyFormData {
  name: string;
  type: string;
  address: string;
  purchasePrice: number;
  currentValue: number;
  purchaseDate: string;
  strategy: string;
  // Loan details
  loanAmount: number;
  interestRate: number;
  loanTerm: number;
  loanType: string;
  // Income & expenses
  annualRent: number;
  annualExpenses: number;
  // Additional details
  description: string;
}

const PROPERTY_TYPES = [
  { id: "residential_house", name: "Residential House", description: "Single family home" },
  { id: "residential_unit", name: "Residential Unit", description: "Apartment or condo" },
  { id: "commercial_office", name: "Commercial Office", description: "Office space" },
  { id: "commercial_retail", name: "Commercial Retail", description: "Retail space" },
  { id: "commercial_industrial", name: "Commercial Industrial", description: "Industrial property" },
  { id: "mixed_use", name: "Mixed Use", description: "Combined residential/commercial" },
];

const INVESTMENT_STRATEGIES = [
  { id: "buy_hold", name: "Buy & Hold", description: "Long-term passive investment" },
  { id: "manufacture_equity", name: "Manufacture Equity", description: "Value-add improvements" },
  { id: "value_add_commercial", name: "Value-Add Commercial", description: "Commercial redevelopment" },
];

const LOAN_TYPES = [
  { id: "principal_interest", name: "Principal & Interest", description: "Standard P&I loan" },
  { id: "interest_only", name: "Interest Only", description: "IO loan with balloon payment" },
];

export default function NewPropertyPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationResult, setValidationResult] = useState<PropertyValidationResult | null>(null);
  const supabase = createClient();
  const [formData, setFormData] = useState<PropertyFormData>({
    name: "",
    type: "residential_house",
    address: "",
    purchasePrice: 0,
    currentValue: 0,
    purchaseDate: new Date().toISOString().split('T')[0],
    strategy: "buy_hold",
    loanAmount: 0,
    interestRate: 5.5,
    loanTerm: 30,
    loanType: "principal_interest",
    annualRent: 0,
    annualExpenses: 0,
    description: "",
  });

  const handleInputChange = (field: keyof PropertyFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation result when user starts typing
    if (validationResult) {
      setValidationResult(null);
    }
  };

  const validateForm = () => {
    const createData: CreatePropertyData = {
      name: formData.name,
      type: formData.type as any,
      address: formData.address,
      purchase_price: formData.purchasePrice,
      current_value: formData.currentValue,
      purchase_date: formData.purchaseDate,
      strategy: formData.strategy as any,
      annual_rent: formData.annualRent,
      annual_expenses: formData.annualExpenses,
      loan_amount: formData.loanAmount > 0 ? formData.loanAmount : undefined,
      interest_rate: formData.loanAmount > 0 ? formData.interestRate : undefined,
      loan_term: formData.loanAmount > 0 ? formData.loanTerm : undefined,
      loan_type: formData.loanAmount > 0 ? formData.loanType as any : undefined,
      description: formData.description
    };
    
    return propertyService.validatePropertyData(createData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setValidationResult(null);

    try {
      // Convert form data to service format
      const createData: CreatePropertyData = {
        name: formData.name,
        type: formData.type as any,
        address: formData.address,
        purchase_price: formData.purchasePrice,
        current_value: formData.currentValue,
        purchase_date: formData.purchaseDate,
        strategy: formData.strategy as any,
        annual_rent: formData.annualRent,
        annual_expenses: formData.annualExpenses,
        loan_amount: formData.loanAmount > 0 ? formData.loanAmount : undefined,
        interest_rate: formData.loanAmount > 0 ? formData.interestRate : undefined,
        loan_term: formData.loanAmount > 0 ? formData.loanTerm : undefined,
        loan_type: formData.loanAmount > 0 ? formData.loanType as any : undefined,
        description: formData.description
      };

      // For now, create a temporary portfolio for testing
      // In a real app, this would come from user authentication
      const portfolioId = await createTemporaryPortfolio();
      
      // Create the property
      const property = await propertyService.createProperty(portfolioId, createData);
      
      // Redirect to modeling page
      router.push(`/property/${property.id}/model`);
    } catch (error) {
      console.error("Error creating property:", error);
      
      // Show validation errors if available
      if (error instanceof Error && error.message.includes('Validation failed')) {
        const validation = propertyService.validatePropertyData({
          name: formData.name,
          type: formData.type as any,
          address: formData.address,
          purchase_price: formData.purchasePrice,
          current_value: formData.currentValue,
          purchase_date: formData.purchaseDate,
          strategy: formData.strategy as any,
          annual_rent: formData.annualRent,
          annual_expenses: formData.annualExpenses,
          loan_amount: formData.loanAmount > 0 ? formData.loanAmount : undefined,
          interest_rate: formData.loanAmount > 0 ? formData.interestRate : undefined,
          loan_term: formData.loanAmount > 0 ? formData.loanTerm : undefined,
          loan_type: formData.loanAmount > 0 ? formData.loanType as any : undefined,
          description: formData.description
        });
        setValidationResult(validation);
      }
      
      setIsSubmitting(false);
    }
  };

  const calculateLVR = () => {
    if (formData.currentValue === 0) return 0;
    return (formData.loanAmount / formData.currentValue) * 100;
  };

  const calculateDSCR = () => {
    if (formData.loanAmount === 0) return 0;
    const monthlyRate = formData.interestRate / 100 / 12;
    const totalPayments = formData.loanTerm * 12;
    const monthlyPayment = (formData.loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
                         (Math.pow(1 + monthlyRate, totalPayments) - 1);
    const annualPayment = monthlyPayment * 12;
    return formData.annualRent / annualPayment;
  };

  const createTemporaryPortfolio = async (): Promise<string> => {
    try {
      // For now, we'll use a hardcoded portfolio ID that we know exists
      // In a real app, this would come from user authentication
      return 'e20784fd-d716-431a-a857-bfba1c661b6c'; // Test portfolio ID
    } catch (error) {
      console.error('Error in createTemporaryPortfolio:', error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#111827]">
      {/* Header */}
      <header className="border-b border-[#e5e7eb] bg-white">
        <div className="mx-auto max-w-[1400px] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="text-xl font-bold text-[#111827]">Property Portfolio CF</div>
              <nav className="hidden md:flex items-center gap-6">
                <a href="/dashboard" className="text-[#6b7280] hover:text-[#111827]">Dashboard</a>
                <a href="#" className="text-[#111827] font-medium">Properties</a>
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

      <main className="mx-auto max-w-[1200px] px-6 py-6">
        {/* Breadcrumb and Title */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-[#6b7280] mb-2">
            <a href="/dashboard" className="hover:text-[#2563eb]">Dashboard</a>
            <span>/</span>
            <a href="#" className="hover:text-[#2563eb]">Properties</a>
            <span>/</span>
            <span className="text-[#111827]">Add Property</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Add New Property</h1>
              <p className="text-sm text-[#6b7280]">Create a new property in your investment portfolio</p>
            </div>
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-4 py-2 text-sm font-medium text-[#111827] hover:shadow-sm"
            >
              <IconArrowLeft className="h-4 w-4" />
              Back
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Main Form */}
          <div className="xl:col-span-2">
            {/* Validation Messages */}
            {validationResult && (
              <div className="mb-6">
                {validationResult.errors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <h3 className="text-sm font-medium text-red-800 mb-2">Please fix the following errors:</h3>
                    <ul className="text-sm text-red-700 space-y-1">
                      {validationResult.errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {validationResult.warnings.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-yellow-800 mb-2">Warnings:</h3>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      {validationResult.warnings.map((warning, index) => (
                        <li key={index}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Property Information */}
              <section className="rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-[#111827] mb-1">Property Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                      placeholder="e.g., Sydney House, Melbourne Unit"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111827] mb-1">Property Type *</label>
                    <select
                      required
                      value={formData.type}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                    >
                      {PROPERTY_TYPES.map(type => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-[#111827] mb-1">Address</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                      placeholder="123 Main Street, City, State, Postcode"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111827] mb-1">Purchase Price *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-[#6b7280]">$</span>
                      <input
                        type="number"
                        required
                        value={formData.purchasePrice}
                        onChange={(e) => handleInputChange('purchasePrice', parseFloat(e.target.value) || 0)}
                        className="w-full pl-8 pr-3 py-2 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                        placeholder="850,000"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111827] mb-1">Current Value *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-[#6b7280]">$</span>
                      <input
                        type="number"
                        required
                        value={formData.currentValue}
                        onChange={(e) => handleInputChange('currentValue', parseFloat(e.target.value) || 0)}
                        className="w-full pl-8 pr-3 py-2 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                        placeholder="920,000"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111827] mb-1">Purchase Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.purchaseDate}
                      onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
                      className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111827] mb-1">Investment Strategy *</label>
                    <select
                      required
                      value={formData.strategy}
                      onChange={(e) => handleInputChange('strategy', e.target.value)}
                      className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                    >
                      {INVESTMENT_STRATEGIES.map(strategy => (
                        <option key={strategy.id} value={strategy.id}>{strategy.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>

              {/* Financial Information */}
              <section className="rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4">Financial Details</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-[#111827] mb-1">Annual Rent *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-[#6b7280]">$</span>
                      <input
                        type="number"
                        required
                        value={formData.annualRent}
                        onChange={(e) => handleInputChange('annualRent', parseFloat(e.target.value) || 0)}
                        className="w-full pl-8 pr-3 py-2 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                        placeholder="45,000"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111827] mb-1">Annual Expenses *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-[#6b7280]">$</span>
                      <input
                        type="number"
                        required
                        value={formData.annualExpenses}
                        onChange={(e) => handleInputChange('annualExpenses', parseFloat(e.target.value) || 0)}
                        className="w-full pl-8 pr-3 py-2 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                        placeholder="12,000"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Loan Information */}
              <section className="rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4">Loan Details</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-[#111827] mb-1">Loan Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-[#6b7280]">$</span>
                      <input
                        type="number"
                        value={formData.loanAmount}
                        onChange={(e) => handleInputChange('loanAmount', parseFloat(e.target.value) || 0)}
                        className="w-full pl-8 pr-3 py-2 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                        placeholder="680,000"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111827] mb-1">Interest Rate (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.interestRate}
                      onChange={(e) => handleInputChange('interestRate', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                      placeholder="5.5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111827] mb-1">Loan Term (Years)</label>
                    <input
                      type="number"
                      value={formData.loanTerm}
                      onChange={(e) => handleInputChange('loanTerm', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                      placeholder="30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#111827] mb-1">Loan Type</label>
                    <select
                      value={formData.loanType}
                      onChange={(e) => handleInputChange('loanType', e.target.value)}
                      className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                    >
                      {LOAN_TYPES.map(type => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>

              {/* Additional Details */}
              <section className="rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4">Additional Details</h2>
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                    placeholder="Any additional notes about this property..."
                  />
                </div>
              </section>

              {/* Submit Button */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-2 text-sm font-medium text-[#111827] border border-[#e5e7eb] rounded-lg hover:bg-[#f9fafb]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 text-sm font-medium text-white bg-[#2563eb] rounded-lg hover:bg-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <IconSpinner className="h-4 w-4 animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    "Create Property"
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Sidebar - Summary */}
          <div className="xl:col-span-1">
            <section className="rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm sticky top-6">
              <h2 className="text-lg font-semibold mb-4">Property Summary</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[#6b7280]">Loan to Value Ratio</p>
                    <p className="text-lg font-semibold text-[#111827]">{calculateLVR().toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6b7280]">Debt Service Coverage</p>
                    <p className="text-lg font-semibold text-[#111827]">{calculateDSCR().toFixed(2)}x</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[#6b7280]">Annual Cashflow</p>
                    <p className={`text-lg font-semibold ${(formData.annualRent - formData.annualExpenses) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${((formData.annualRent - formData.annualExpenses) / 1000).toFixed(1)}K
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6b7280]">Capital Growth</p>
                    <p className="text-lg font-semibold text-[#111827]">
                      {formData.currentValue > formData.purchasePrice ? '+' : ''}
                      ${(((formData.currentValue - formData.purchasePrice) / formData.purchasePrice) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
                
                {/* Real-time Validation Status */}
                {(() => {
                  const validation = validateForm();
                  return (
                    <div className="pt-4 border-t border-[#e5e7eb]">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-2 h-2 rounded-full ${validation.isValid ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <p className="text-xs font-medium text-[#6b7280]">
                          {validation.isValid ? 'Form is valid' : `${validation.errors.length} error${validation.errors.length !== 1 ? 's' : ''}`}
                        </p>
                      </div>
                      {validation.warnings.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-yellow-600 font-medium mb-1">{validation.warnings.length} warning{validation.warnings.length !== 1 ? 's' : ''}</p>
                          <ul className="text-xs text-yellow-600 space-y-1">
                            {validation.warnings.slice(0, 2).map((warning, index) => (
                              <li key={index}>• {warning}</li>
                            ))}
                            {validation.warnings.length > 2 && (
                              <li>• ...and {validation.warnings.length - 2} more</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })()}
                
                <div className="pt-4 border-t border-[#e5e7eb]">
                  <p className="text-xs text-[#6b7280] mb-2">Required Fields</p>
                  <ul className="text-xs text-[#6b7280] space-y-1">
                    <li>• Property name and type</li>
                    <li>• Purchase price and current value</li>
                    <li>• Annual rent and expenses</li>
                    <li>• Investment strategy</li>
                  </ul>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

function IconBell({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
}

function IconArrowLeft({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  );
}

function IconSpinner({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
}
