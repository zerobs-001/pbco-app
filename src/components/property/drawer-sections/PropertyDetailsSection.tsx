"use client";

import React from 'react';
import CompactInput from '../../ui/CompactInput';
import CompactSelect from '../../ui/CompactSelect';
import CompactFormRow from '../../ui/CompactFormRow';

interface PropertyData {
  id: string;
  name: string;
  type: string;
  address: string;
  strategy: string;
  status?: 'modelling' | 'shortlisted' | 'bought' | 'sold';
}

interface PropertyDetailsSectionProps {
  data: PropertyData;
  onChange: (data: Partial<PropertyData>) => void;
}

const propertyTypes = [
  { value: 'residential_house', label: 'Residential House' },
  { value: 'residential_unit', label: 'Residential Unit' },
  { value: 'commercial_office', label: 'Commercial Office' },
  { value: 'commercial_retail', label: 'Commercial Retail' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'land', label: 'Land' }
];

const strategies = [
  { value: 'buy_hold', label: 'Buy & Hold' },
  { value: 'manufacture_equity', label: 'Manufacture Equity' },
  { value: 'value_add_commercial', label: 'Value-Add Commercial' },
  { value: 'fix_flip', label: 'Fix & Flip' },
  { value: 'development', label: 'Development' }
];

const statuses = [
  { value: 'modelling', label: 'Modelling' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'bought', label: 'Bought' },
  { value: 'sold', label: 'Sold' }
];

const PropertyDetailsSection: React.FC<PropertyDetailsSectionProps> = ({
  data,
  onChange
}) => {
  const handleInputChange = (field: keyof PropertyData, value: string) => {
    onChange({ [field]: value });
  };

  return (
    <div className="space-y-1">
      {/* Property Name */}
      <CompactFormRow label="Property Name" required>
        <CompactInput
          id="property-name"
          value={data.name}
          onChange={(value) => handleInputChange('name', value)}
          placeholder="e.g., Sydney Investment Property"
        />
      </CompactFormRow>

      {/* Address */}
      <CompactFormRow label="Address">
        <CompactInput
          id="property-address"
          value={data.address}
          onChange={(value) => handleInputChange('address', value)}
          placeholder="e.g., 123 Main Street, Sydney NSW 2000"
        />
      </CompactFormRow>

      {/* Property Type */}
      <CompactFormRow label="Property Type" required>
        <CompactSelect
          id="property-type"
          value={data.type}
          onChange={(value) => handleInputChange('type', value)}
          options={propertyTypes}
          placeholder="Select property type"
        />
      </CompactFormRow>

      {/* Investment Strategy */}
      <CompactFormRow label="Investment Strategy" required>
        <CompactSelect
          id="property-strategy"
          value={data.strategy}
          onChange={(value) => handleInputChange('strategy', value)}
          options={strategies}
          placeholder="Select strategy"
        />
      </CompactFormRow>

      {/* Status */}
      <CompactFormRow label="Status">
        <CompactSelect
          id="property-status"
          value={data.status || ''}
          onChange={(value) => handleInputChange('status', value as PropertyData['status'])}
          options={statuses}
          placeholder="Select status"
        />
      </CompactFormRow>

      {/* Strategy Description */}
      {data.strategy && (
        <div className="bg-blue-50 border-l-2 border-blue-400 p-3 mt-3">
          <h4 className="text-xs font-semibold text-blue-900 mb-1">
            {strategies.find(s => s.value === data.strategy)?.label} Strategy
          </h4>
          <p className="text-xs text-blue-800 leading-relaxed">
            {data.strategy === 'buy_hold' && 
              'Long-term investment strategy focused on rental income and capital appreciation over time.'
            }
            {data.strategy === 'manufacture_equity' && 
              'Strategy focused on adding value through renovations, subdivisions, or improvements to increase property equity.'
            }
            {data.strategy === 'value_add_commercial' && 
              'Commercial property investment with focus on improving NOI through tenant improvements, lease optimization, or repositioning.'
            }
            {data.strategy === 'fix_flip' && 
              'Short-term strategy involving property renovation and quick resale for profit.'
            }
            {data.strategy === 'development' && 
              'Property development strategy involving construction or major redevelopment projects.'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default PropertyDetailsSection;
