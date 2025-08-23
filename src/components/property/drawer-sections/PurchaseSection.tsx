"use client";

import React, { useState, useEffect } from 'react';
import CompactInput from '../../ui/CompactInput';
import CompactFormRow from '../../ui/CompactFormRow';
import CompactSelect from '../../ui/CompactSelect';

interface PurchaseInputs {
  // Property Details
  propertyAddress: string;
  state: string;
  purchasePrice: number;
  valuationAtPurchase: number;
  rentPerWeek: number;
  numberOfUnits: number;
  
  // Contract Details
  contractDate: string;
  daysToUnconditional: number;
  daysForSettlement: number;
  
  // Loan Details
  lvr: number;
  loanProduct: string;
  interestRate: number;
  loanTermYears: number;
  loanPreApproval: number;
  fundsAvailable: number;
}

interface PurchaseItem {
  id: string;
  name: string;
  amount: number;
  paid: number;
  category: 'property' | 'transaction' | 'deposit' | 'other';
  isCustom: boolean;
}

interface PurchaseData {
  purchasePrice: number;
  purchaseDate: string;
  items: PurchaseItem[];
  inputs?: PurchaseInputs;
}

interface PurchaseSectionProps {
  data: PurchaseData;
  onChange: (data: Partial<PurchaseData>) => void;
}

const DEFAULT_PURCHASE_ITEMS: PurchaseItem[] = [
  // Property Purchase
  {
    id: 'property_purchase_price',
    name: 'Property Purchase Price',
    amount: 0,
    paid: 0,
    category: 'property',
    isCustom: false
  },
  {
    id: 'property_valuation_at_purchase',
    name: 'Property Valuation At Purchase',
    amount: 0,
    paid: 0,
    category: 'property',
    isCustom: false
  },
  
  // Transaction Costs
  {
    id: 'stamp_duty',
    name: 'Stamp Duty',
    amount: 0,
    paid: 0,
    category: 'transaction',
    isCustom: false
  },
  {
    id: 'legal_fees',
    name: 'Legal Fees',
    amount: 0,
    paid: 0,
    category: 'transaction',
    isCustom: false
  },
  {
    id: 'building_inspection',
    name: 'Building & Pest Inspection',
    amount: 0,
    paid: 0,
    category: 'transaction',
    isCustom: false
  },
  {
    id: 'bank_valuation',
    name: 'Bank Valuation',
    amount: 0,
    paid: 0,
    category: 'transaction',
    isCustom: false
  },
  {
    id: 'loan_establishment',
    name: 'Loan Establishment Fees',
    amount: 0,
    paid: 0,
    category: 'transaction',
    isCustom: false
  },
  
  // Deposits
  {
    id: 'total_deposit_percent',
    name: 'Total Deposit %',
    amount: 0,
    paid: 0,
    category: 'deposit',
    isCustom: false
  },
  {
    id: 'deposit_paid_conditional',
    name: 'Deposit Paid at Conditional %',
    amount: 0,
    paid: 0,
    category: 'deposit',
    isCustom: false
  },
  {
    id: 'deposit_paid_unconditional',
    name: 'Deposit Paid at Unconditional %',
    amount: 0,
    paid: 0,
    category: 'deposit',
    isCustom: false
  }
];

const formatCurrency = (amount: number): string => {
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`;
  } else {
    return `$${amount.toFixed(0)}`;
  }
};

const PurchaseSection: React.FC<PurchaseSectionProps> = ({
  data,
  onChange
}) => {
  const [inputs, setInputs] = useState<PurchaseInputs>(() => ({
    // Property Details
    propertyAddress: data.inputs?.propertyAddress || '',
    state: data.inputs?.state || '',
    purchasePrice: data.inputs?.purchasePrice || data.purchasePrice || 0,
    valuationAtPurchase: data.inputs?.valuationAtPurchase || data.purchasePrice || 0,
    rentPerWeek: data.inputs?.rentPerWeek || 0,
    numberOfUnits: data.inputs?.numberOfUnits || 1,
    
    // Contract Details
    contractDate: data.inputs?.contractDate || data.purchaseDate || '',
    daysToUnconditional: data.inputs?.daysToUnconditional || 14,
    daysForSettlement: data.inputs?.daysForSettlement || 42,
    
    // Loan Details
    lvr: data.inputs?.lvr || 80,
    loanProduct: data.inputs?.loanProduct || 'principal_interest',
    interestRate: data.inputs?.interestRate || 5.5,
    loanTermYears: data.inputs?.loanTermYears || 30,
    loanPreApproval: data.inputs?.loanPreApproval || 0,
    fundsAvailable: data.inputs?.fundsAvailable || 0
  }));

  const [items, setItems] = useState<PurchaseItem[]>(() => {
    return data.items && data.items.length > 0 ? data.items : DEFAULT_PURCHASE_ITEMS;
  });

  // Update items when inputs change
  useEffect(() => {
    const updatedItems = items.map(item => {
      switch (item.id) {
        case 'property_purchase_price':
          return { ...item, amount: inputs.purchasePrice };
        case 'property_valuation_at_purchase':
          return { ...item, amount: inputs.valuationAtPurchase };
        case 'total_deposit_percent':
          return { ...item, amount: (inputs.purchasePrice * inputs.totalDepositPercent) / 100 };
        case 'deposit_paid_conditional':
          return { ...item, amount: (inputs.purchasePrice * inputs.depositConditionalPercent) / 100 };
        case 'deposit_paid_unconditional':
          return { ...item, amount: (inputs.purchasePrice * inputs.depositUnconditionalPercent) / 100 };
        default:
          return item;
      }
    });
    
    setItems(updatedItems);
    onChange({ 
      items: updatedItems, 
      inputs: inputs,
      purchasePrice: inputs.purchasePrice
    });
  }, [inputs]);

  const updateInput = (field: keyof PurchaseInputs, value: string | number) => {
    const finalValue = typeof value === 'string' 
      ? (field === 'propertyAddress' || field === 'state' || field === 'contractDate' || field === 'loanProduct' 
         ? value 
         : parseFloat(value) || 0)
      : value;
    setInputs(prev => ({ ...prev, [field]: finalValue }));
  };

  // Calculated fields
  const percentMV = inputs.valuationAtPurchase > 0 
    ? ((inputs.valuationAtPurchase - inputs.purchasePrice) / inputs.valuationAtPurchase) * 100 
    : 0;
  
  const loanAmount = (inputs.purchasePrice * inputs.lvr) / 100;
  
  const bcRemaining = inputs.loanPreApproval - loanAmount;

  // Australian states
  const australianStates = [
    { value: '', label: 'Select State' },
    { value: 'NSW', label: 'New South Wales' },
    { value: 'VIC', label: 'Victoria' },
    { value: 'QLD', label: 'Queensland' },
    { value: 'WA', label: 'Western Australia' },
    { value: 'SA', label: 'South Australia' },
    { value: 'TAS', label: 'Tasmania' },
    { value: 'ACT', label: 'Australian Capital Territory' },
    { value: 'NT', label: 'Northern Territory' }
  ];

  const loanProductOptions = [
    { value: 'interest_only', label: 'Interest Only' },
    { value: 'principal_interest', label: 'Principal & Interest' }
  ];

  const unitOptions = Array.from({ length: 10 }, (_, i) => ({
    value: (i + 1).toString(),
    label: (i + 1).toString()
  }));

  const updateItem = (id: string, field: keyof PurchaseItem, value: string | number) => {
    const updatedItems = items.map(item => 
      item.id === id 
        ? { ...item, [field]: field === 'name' ? value : parseFloat(value.toString()) || 0 }
        : item
    );
    setItems(updatedItems);
    onChange({ items: updatedItems });
  };

  const addCustomItem = (category: string) => {
    const newItem: PurchaseItem = {
      id: `custom_${Date.now()}`,
      name: 'Custom Item',
      amount: 0,
      paid: 0,
      category: category as any,
      isCustom: true
    };
    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    onChange({ items: updatedItems });
  };

  const removeItem = (id: string) => {
    const updatedItems = items.filter(item => item.id !== id);
    setItems(updatedItems);
    onChange({ items: updatedItems });
  };

  const getItemsByCategory = (category: string) => {
    return items.filter(item => item.category === category);
  };

  const getCategoryTotal = (category: string) => {
    return items
      .filter(item => item.category === category)
      .reduce((total, item) => total + item.amount, 0);
  };

  const getCategoryPaid = (category: string) => {
    return items
      .filter(item => item.category === category)
      .reduce((total, item) => total + item.paid, 0);
  };

  const getCategoryRemaining = (category: string) => {
    return getCategoryTotal(category) - getCategoryPaid(category);
  };

  const grandTotal = items.reduce((total, item) => total + item.amount, 0);
  const totalPaid = items.reduce((total, item) => total + item.paid, 0);
  const totalRemaining = grandTotal - totalPaid;

  const categories = [
    { id: 'property', name: 'Property Purchase', color: 'blue' },
    { id: 'transaction', name: 'Transaction Costs', color: 'purple' },
    { id: 'deposit', name: 'Deposits', color: 'green' },
    { id: 'other', name: 'Other Costs', color: 'gray' }
  ];

  const renderCategory = (category: any) => {
    const categoryItems = getItemsByCategory(category.id);
    const total = getCategoryTotal(category.id);
    const paid = getCategoryPaid(category.id);
    const remaining = getCategoryRemaining(category.id);

    if (categoryItems.length === 0 && category.id === 'other') return null;

    return (
      <div key={category.id} className="space-y-3">
        {/* Category Header */}
        <div className={
          category.color === 'blue' ? 'bg-blue-50 border-l-2 border-blue-400 p-3' :
          category.color === 'purple' ? 'bg-purple-50 border-l-2 border-purple-400 p-3' :
          category.color === 'green' ? 'bg-green-50 border-l-2 border-green-400 p-3' :
          'bg-gray-50 border-l-2 border-gray-400 p-3'
        }>
          <div className="flex justify-between items-center">
            <h3 className={
              category.color === 'blue' ? 'text-sm font-semibold text-blue-800' :
              category.color === 'purple' ? 'text-sm font-semibold text-purple-800' :
              category.color === 'green' ? 'text-sm font-semibold text-green-800' :
              'text-sm font-semibold text-gray-800'
            }>
              {category.name}
            </h3>
            <div className="flex gap-4 text-xs">
              <span className={
                category.color === 'blue' ? 'text-blue-700' :
                category.color === 'purple' ? 'text-purple-700' :
                category.color === 'green' ? 'text-green-700' :
                'text-gray-700'
              }>
                Total: {formatCurrency(total)}
              </span>
              <span className="text-green-700">
                Paid: {formatCurrency(paid)}
              </span>
              <span className="text-red-700">
                Remaining: {formatCurrency(remaining)}
              </span>
            </div>
          </div>
        </div>

        {/* Category Items */}
        <div className="space-y-1">
          {categoryItems.map((item) => (
            <div key={item.id} className="grid grid-cols-12 gap-2 items-center py-1 hover:bg-gray-50 rounded">
              {/* Item Name */}
              <div className="col-span-5">
                {item.isCustom ? (
                  <CompactInput
                    value={item.name}
                    onChange={(value) => updateItem(item.id, 'name', value)}
                    placeholder="Item name"
                    className="text-xs"
                  />
                ) : (
                  <div className="text-xs font-medium text-gray-900 py-1">
                    {item.name}
                  </div>
                )}
              </div>

              {/* Amount */}
              <div className="col-span-2">
                <CompactInput
                  type="number"
                  value={item.amount ? item.amount.toString() : ''}
                  onChange={(value) => updateItem(item.id, 'amount', value)}
                  placeholder="0"
                  className="text-xs"
                />
              </div>

              {/* Paid */}
              <div className="col-span-2">
                <CompactInput
                  type="number"
                  value={item.paid ? item.paid.toString() : ''}
                  onChange={(value) => updateItem(item.id, 'paid', value)}
                  placeholder="0"
                  className="text-xs"
                />
              </div>

              {/* Remaining (Display) */}
              <div className="col-span-2">
                <div className="text-xs text-gray-600 py-1 text-right">
                  {formatCurrency(item.amount - item.paid)}
                </div>
              </div>

              {/* Remove Button (for custom items) */}
              <div className="col-span-1 flex justify-end">
                {item.isCustom && (
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                    title="Remove item"
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add Custom Item Button */}
        <button
          onClick={() => addCustomItem(category.id)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 border-dashed rounded hover:bg-gray-100 hover:border-gray-300 transition-colors"
        >
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add {category.name} Item
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="space-y-4">
        <div className="bg-gray-50 border-l-2 border-gray-400 p-3">
          <h3 className="text-sm font-semibold text-gray-800">Inputs</h3>
        </div>
        
        <div className="space-y-1">
          {/* Property Details */}
          <CompactFormRow label="Property Address" required>
            <CompactInput
              value={inputs.propertyAddress}
              onChange={(value) => updateInput('propertyAddress', value)}
              placeholder="Enter property address"
            />
          </CompactFormRow>

          <CompactFormRow label="State" required>
            <CompactSelect
              value={inputs.state}
              onChange={(value) => updateInput('state', value)}
              options={australianStates}
              placeholder="Select State"
            />
          </CompactFormRow>

          <CompactFormRow label="Purchase Price" required>
            <CompactInput
              type="number"
              value={inputs.purchasePrice ? inputs.purchasePrice.toString() : ''}
              onChange={(value) => updateInput('purchasePrice', value)}
              placeholder="0"
            />
          </CompactFormRow>

          <CompactFormRow label="Valuation at Purchase">
            <CompactInput
              type="number"
              value={inputs.valuationAtPurchase ? inputs.valuationAtPurchase.toString() : ''}
              onChange={(value) => updateInput('valuationAtPurchase', value)}
              placeholder="0"
            />
          </CompactFormRow>

          <CompactFormRow label="%MV">
            <div className="text-xs text-gray-600 py-1 border-b border-gray-300">
              {percentMV.toFixed(2)}%
            </div>
          </CompactFormRow>

          <CompactFormRow label="Rent Per Week">
            <CompactInput
              type="number"
              value={inputs.rentPerWeek ? inputs.rentPerWeek.toString() : ''}
              onChange={(value) => updateInput('rentPerWeek', value)}
              placeholder="0"
            />
          </CompactFormRow>

          <CompactFormRow label="No. of Units">
            <CompactSelect
              value={inputs.numberOfUnits.toString()}
              onChange={(value) => updateInput('numberOfUnits', parseInt(value))}
              options={unitOptions}
            />
          </CompactFormRow>

          {/* Contract Details */}
          <CompactFormRow label="Contract Date">
            <CompactInput
              type="date"
              value={inputs.contractDate}
              onChange={(value) => updateInput('contractDate', value)}
            />
          </CompactFormRow>

          <CompactFormRow label="Days to Unconditional">
            <CompactInput
              type="number"
              value={inputs.daysToUnconditional ? inputs.daysToUnconditional.toString() : ''}
              onChange={(value) => updateInput('daysToUnconditional', value)}
              placeholder="14"
            />
          </CompactFormRow>

          <CompactFormRow label="Days for Settlement">
            <CompactInput
              type="number"
              value={inputs.daysForSettlement ? inputs.daysForSettlement.toString() : ''}
              onChange={(value) => updateInput('daysForSettlement', value)}
              placeholder="42"
            />
          </CompactFormRow>

          {/* Loan Details */}
          <CompactFormRow label="LVR">
            <CompactInput
              type="number"
              step={0.1}
              value={inputs.lvr ? inputs.lvr.toString() : ''}
              onChange={(value) => updateInput('lvr', value)}
              placeholder="80"
            />
          </CompactFormRow>

          <CompactFormRow label="Loan Product">
            <CompactSelect
              value={inputs.loanProduct}
              onChange={(value) => updateInput('loanProduct', value)}
              options={loanProductOptions}
            />
          </CompactFormRow>

          <CompactFormRow label="Interest Rate">
            <CompactInput
              type="number"
              step={0.01}
              value={inputs.interestRate ? inputs.interestRate.toString() : ''}
              onChange={(value) => updateInput('interestRate', value)}
              placeholder="5.50"
            />
          </CompactFormRow>

          <CompactFormRow label="Loan Term (Years)">
            <CompactInput
              type="number"
              value={inputs.loanTermYears ? inputs.loanTermYears.toString() : ''}
              onChange={(value) => updateInput('loanTermYears', value)}
              placeholder="30"
            />
          </CompactFormRow>

          <CompactFormRow label="Loan amount (LVR*PP)">
            <div className="text-xs text-gray-600 py-1 border-b border-gray-300">
              {formatCurrency(loanAmount)}
            </div>
          </CompactFormRow>

          <CompactFormRow label="Loan pre-approval">
            <CompactInput
              type="number"
              value={inputs.loanPreApproval ? inputs.loanPreApproval.toString() : ''}
              onChange={(value) => updateInput('loanPreApproval', value)}
              placeholder="0"
            />
          </CompactFormRow>

          <CompactFormRow label="BC Remaining">
            <div className="text-xs text-gray-600 py-1 border-b border-gray-300">
              {formatCurrency(bcRemaining)}
            </div>
          </CompactFormRow>

          <CompactFormRow label="Funds Available">
            <CompactInput
              type="number"
              value={inputs.fundsAvailable ? inputs.fundsAvailable.toString() : ''}
              onChange={(value) => updateInput('fundsAvailable', value)}
              placeholder="0"
            />
          </CompactFormRow>
        </div>
      </div>

      {/* Grand Total Summary */}
      <div className="bg-gray-100 border-2 border-gray-300 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-sm font-bold text-gray-900">Purchase Summary</h2>
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900">
              {formatCurrency(totalRemaining)}
            </div>
            <div className="text-xs text-gray-600">Capital Required</div>
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-700">
          <span>Total: {formatCurrency(grandTotal)}</span>
          <span>Paid: {formatCurrency(totalPaid)}</span>
        </div>
      </div>

      {/* Table Header */}
      <div className="border-b border-gray-200 pb-2">
        <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-700">
          <div className="col-span-5">Purchase Item</div>
          <div className="col-span-2">Amount</div>
          <div className="col-span-2">Paid</div>
          <div className="col-span-2 text-right">Remaining</div>
          <div className="col-span-1"></div>
        </div>
      </div>

      {/* Categories */}
      {categories.map(category => renderCategory(category))}
    </div>
  );
};

export default PurchaseSection;