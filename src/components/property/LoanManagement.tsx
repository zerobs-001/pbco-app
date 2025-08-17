'use client';

import React, { useState } from 'react';
import { Loan, LoanType } from '@/types';
import ConfirmationModal from '../ui/ConfirmationModal';

// Icons (simplified - you can replace with your icon system)
const IconPlus = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const IconEdit = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const IconTrash = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const IconX = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

interface LoanFormData {
  name: string;
  type: LoanType;
  principal_amount: number;
  interest_rate: number;
  term_years: number;
  start_date: string;
}

interface LoanManagementProps {
  loans: Loan[];
  onLoansChange: (loans: Loan[]) => void;
  propertyId: string;
}

export default function LoanManagement({ loans, onLoansChange, propertyId }: LoanManagementProps) {
  const [isAddingLoan, setIsAddingLoan] = useState(false);
  const [editingLoanId, setEditingLoanId] = useState<string | null>(null);
  const [expandedLoanId, setExpandedLoanId] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    loanId: string;
    loanName: string;
  }>({
    isOpen: false,
    loanId: '',
    loanName: ''
  });
  const [formData, setFormData] = useState<LoanFormData>({
    name: '',
    type: 'principal_interest',
    principal_amount: 0,
    interest_rate: 0,
    term_years: 30,
    start_date: new Date().toISOString().split('T')[0]
  });

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'principal_interest',
      principal_amount: 0,
      interest_rate: 0,
      term_years: 30,
      start_date: new Date().toISOString().split('T')[0]
    });
  };

  const handleAddLoan = () => {
    setIsAddingLoan(true);
    setEditingLoanId(null);
    resetForm();
  };

  const handleEditLoan = (loan: Loan) => {
    setEditingLoanId(loan.id);
    setIsAddingLoan(false);
    setExpandedLoanId(null);
    setFormData({
      name: (loan as any).name || `Loan #${loans.findIndex(l => l.id === loan.id) + 1}`,
      type: loan.type,
      principal_amount: loan.principal_amount,
      interest_rate: loan.interest_rate,
      term_years: loan.term_years,
      start_date: loan.start_date
    });
  };

  const toggleLoanExpansion = (loanId: string) => {
    setExpandedLoanId(expandedLoanId === loanId ? null : loanId);
  };

  const handleDeleteLoan = (loanId: string) => {
    const loan = loans.find(l => l.id === loanId);
    setDeleteConfirmation({
      isOpen: true,
      loanId,
      loanName: (loan as any)?.name || 'this loan'
    });
  };

  const confirmDeleteLoan = () => {
    const updatedLoans = loans.filter(loan => loan.id !== deleteConfirmation.loanId);
    onLoansChange(updatedLoans);
    setDeleteConfirmation({ isOpen: false, loanId: '', loanName: '' });
  };

  const cancelDeleteLoan = () => {
    setDeleteConfirmation({ isOpen: false, loanId: '', loanName: '' });
  };

  const handleSaveLoan = async () => {
    try {
      console.log('🔄 Saving loan:', formData.name || `Loan #${loans.length + 1}`);
      
      // Validate form data
      if (!formData.name?.trim()) {
        alert('Please enter a loan name');
        return;
      }
      if (!formData.principal_amount || formData.principal_amount <= 0) {
        alert('Please enter a valid principal amount');
        return;
      }
      if (!formData.interest_rate || formData.interest_rate <= 0) {
        alert('Please enter a valid interest rate');
        return;
      }

      if (editingLoanId) {
        // Update existing loan
        const updatedLoans = loans.map(loan => 
          loan.id === editingLoanId 
            ? { 
                ...loan, 
                ...formData,
                updated_at: new Date().toISOString() 
              }
            : loan
        );
        await onLoansChange(updatedLoans);
      } else {
        // Add new loan
        const newLoan: Loan = {
          id: `loan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          property_id: propertyId,
          ...formData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        const updatedLoans = [...loans, newLoan];
        
        // Call the parent callback and wait for it
        await onLoansChange(updatedLoans);
      }

      // Reset form state only after successful save
      setIsAddingLoan(false);
      setEditingLoanId(null);
      resetForm();
    } catch (error) {
      console.error('❌ LoanManagement: Error in handleSaveLoan:', error);
      alert('Failed to save loan. Please try again.');
    }
  };

  const handleCancel = () => {
    setIsAddingLoan(false);
    setEditingLoanId(null);
    resetForm();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const calculateMonthlyPayment = (loan: Loan) => {
    if (loan.type === 'interest_only') {
      return (loan.principal_amount * loan.interest_rate / 100) / 12;
    } else {
      const monthlyRate = loan.interest_rate / 100 / 12;
      const totalPayments = loan.term_years * 12;
      if (monthlyRate === 0) return loan.principal_amount / totalPayments;
      return (loan.principal_amount * monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
             (Math.pow(1 + monthlyRate, totalPayments) - 1);
    }
  };

  return (
    <section className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">
          Loan Details {loans.length > 0 && (
            <span className="text-sm font-normal text-[#6b7280] ml-2">
              ({loans.length} loan{loans.length !== 1 ? 's' : ''})
            </span>
          )}
        </h2>
      </div>

      {/* Loan List */}
      {loans.length === 0 && !isAddingLoan && (
        <div className="text-center py-8 text-[#6b7280]">
          <p className="text-sm">No loans added yet</p>
          <p className="text-xs mt-1">Click "Add Loan" to get started</p>
        </div>
      )}

      {loans.map((loan, index) => (
        <div key={loan.id} className={`border border-[#e5e7eb] rounded-lg ${index > 0 ? 'mt-3' : ''}`}>
          {editingLoanId === loan.id ? (
            <div className="p-4">
              <LoanForm 
                formData={formData}
                setFormData={setFormData}
                onSave={handleSaveLoan}
                onCancel={handleCancel}
                isEditing={true}
              />
            </div>
          ) : (
            <div>
              {/* Collapsed View - Loan name and summary */}
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#f9fafb]"
                onClick={() => toggleLoanExpansion(loan.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 bg-[#2563eb] rounded-full"></div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#111827]">
                      {(loan as any).name || `Loan #${index + 1}`}
                    </h3>
                    <p className="text-xs text-[#6b7280] mt-0.5">
                      {formatCurrency(loan.principal_amount)} @ {loan.interest_rate}%
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <svg 
                    className={`h-4 w-4 text-[#6b7280] transition-transform ${expandedLoanId === loan.id ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Expanded View - Full details */}
              {expandedLoanId === loan.id && (
                <div className="px-4 pb-4 border-t border-[#f3f4f6]">
                  <div className="pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-[#111827]">Loan Details</span>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditLoan(loan);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-[#2563eb] hover:bg-[#eff6ff] rounded"
                        >
                          <IconEdit className="h-3 w-3" />
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteLoan(loan.id);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-[#dc2626] hover:bg-[#fef2f2] rounded"
                        >
                          <IconTrash className="h-3 w-3" />
                          Delete
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[#6b7280]">Type:</span>
                        <span className="font-medium">{loan.type === 'interest_only' ? 'Interest Only' : 'Principal & Interest'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6b7280]">Principal Amount:</span>
                        <span className="font-medium">{formatCurrency(loan.principal_amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6b7280]">Interest Rate:</span>
                        <span className="font-medium">{loan.interest_rate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6b7280]">Term:</span>
                        <span className="font-medium">{loan.term_years} years</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6b7280]">Start Date:</span>
                        <span className="font-medium">{new Date(loan.start_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-[#f3f4f6]">
                        <span className="text-[#6b7280] font-medium">Monthly Payment:</span>
                        <span className="font-semibold text-[#111827]">{formatCurrency(calculateMonthlyPayment(loan))}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Add New Loan Form */}
      {isAddingLoan && (
        <div className={`border border-[#e5e7eb] rounded-lg p-4 ${loans.length > 0 ? 'mt-3' : ''}`}>
          <LoanForm 
            formData={formData}
            setFormData={setFormData}
            onSave={handleSaveLoan}
            onCancel={handleCancel}
            isEditing={false}
          />
        </div>
      )}

      {/* Add New Loan Button at Bottom */}
      {!isAddingLoan && (
        <div className={`${loans.length > 0 ? 'mt-4' : ''}`}>
          <button
            onClick={handleAddLoan}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-[#2563eb] bg-[#f8fafc] border border-[#e5e7eb] border-dashed rounded-lg hover:bg-[#eff6ff] hover:border-[#2563eb] transition-colors"
          >
            <IconPlus className="h-4 w-4" />
            New Loan
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={cancelDeleteLoan}
        onConfirm={confirmDeleteLoan}
        title="Delete Loan"
        message={`Are you sure you want to delete "${deleteConfirmation.loanName}"? This action cannot be undone.`}
        confirmText="Delete Loan"
        cancelText="Cancel"
        variant="danger"
      />
    </section>
  );
}

interface LoanFormProps {
  formData: LoanFormData;
  setFormData: React.Dispatch<React.SetStateAction<LoanFormData>>;
  onSave: () => void;
  onCancel: () => void;
  isEditing: boolean;
}

function LoanForm({ formData, setFormData, onSave, onCancel, isEditing }: LoanFormProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-[#111827]">
          {isEditing ? 'Edit Loan' : 'Add New Loan'}
        </h3>
        <button
          onClick={onCancel}
          className="p-1 text-[#6b7280] hover:text-[#111827] rounded"
        >
          <IconX className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-[#6b7280] mb-1">Loan Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
            placeholder="e.g., Primary Mortgage, Construction Loan, etc."
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#6b7280] mb-1">Loan Type</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as LoanType }))}
            className="w-full px-3 py-2 text-sm border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
          >
            <option value="principal_interest">Principal & Interest</option>
            <option value="interest_only">Interest Only</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#6b7280] mb-1">Principal Amount</label>
            <input
              type="number"
              value={formData.principal_amount || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, principal_amount: parseFloat(e.target.value) || 0 }))}
              className="w-full px-3 py-2 text-sm border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6b7280] mb-1">Interest Rate (%)</label>
            <input
              type="number"
              step="0.01"
              value={formData.interest_rate || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, interest_rate: parseFloat(e.target.value) || 0 }))}
              className="w-full px-3 py-2 text-sm border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#6b7280] mb-1">Term (Years)</label>
            <input
              type="number"
              value={formData.term_years || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, term_years: parseInt(e.target.value) || 30 }))}
              className="w-full px-3 py-2 text-sm border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
              placeholder="30"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#6b7280] mb-1">Start Date</label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
              className="w-full px-3 py-2 text-sm border border-[#e5e7eb] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onSave}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-[#2563eb] rounded-lg hover:bg-[#1d4ed8]"
          >
            {isEditing ? 'Update Loan' : 'Add Loan'}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-sm font-medium text-[#6b7280] bg-white border border-[#e5e7eb] rounded-lg hover:bg-[#f9fafb]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
