"use client";

import React from 'react';
import { 
  HomeIcon, 
  CurrencyDollarIcon, 
  BanknotesIcon, 
  ChartBarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusCircleIcon,
  MinusCircleIcon
} from '@heroicons/react/24/outline';

export type NavigationSectionId = 'property-details' | 'the-purchase' | 'loan-details' | 'growth-assumptions' | 'income-modeling' | 'outgoings-modeling';

interface NavigationItem {
  id: NavigationSectionId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

interface NavigationPanelProps {
  isCollapsed: boolean;
  activeSection: NavigationSectionId | null;
  onSectionSelect: (sectionId: NavigationSectionId) => void;
  onToggleCollapse: () => void;
  validationErrors?: Record<string, string[]>;
  className?: string;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'property-details',
    label: 'Property Details',
    icon: HomeIcon,
    description: 'Basic property information, address, type, strategy'
  },
  {
    id: 'the-purchase',
    label: 'The Purchase', 
    icon: CurrencyDollarIcon,
    description: 'Purchase price, date, current value'
  },
  {
    id: 'loan-details',
    label: 'Loan Details',
    icon: BanknotesIcon,
    description: 'Loan management and financing details'
  },
  {
    id: 'growth-assumptions',
    label: 'Growth & Cashflow Assumptions',
    icon: ChartBarIcon,
    description: 'Growth rates, assumptions, and projections'
  },
  {
    id: 'income-modeling',
    label: 'Income Modeling',
    icon: PlusCircleIcon,
    description: 'Rental income, vacancy rates, and income streams'
  },
  {
    id: 'outgoings-modeling',
    label: 'Outgoings Modeling',
    icon: MinusCircleIcon,
    description: 'Operating expenses, maintenance, and costs'
  }
];

const NavigationPanel: React.FC<NavigationPanelProps> = ({
  isCollapsed,
  activeSection,
  onSectionSelect,
  onToggleCollapse,
  validationErrors = {},
  className = ''
}) => {
  const hasErrors = (sectionId: string) => {
    return validationErrors[sectionId] && validationErrors[sectionId].length > 0;
  };

  const getErrorTooltip = (sectionId: string) => {
    const errors = validationErrors[sectionId];
    if (!errors || errors.length === 0) return '';
    return errors.join(', ');
  };

  return (
    <div 
      className={`
        bg-gray-50 border-r border-gray-200 flex flex-col h-full
        transition-all duration-300 ease-out relative
        ${isCollapsed ? 'w-16' : 'w-80'}
        ${className}
      `}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        {!isCollapsed && (
          <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-150"
          title={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
        >
          {isCollapsed ? (
            <ChevronRightIcon className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
          )}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            const hasError = hasErrors(item.id);
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onSectionSelect(item.id)}
                  className={`
                    w-full flex items-center gap-3 p-3 rounded-lg text-left
                    transition-all duration-150 ease-out
                    min-h-[44px] relative group
                    ${isActive 
                      ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                    ${isCollapsed ? 'justify-center' : 'justify-start'}
                  `}
                  title={isCollapsed ? item.label : item.description}
                >
                  {/* Icon */}
                  <div className="relative">
                    <Icon 
                      className={`
                        w-5 h-5 flex-shrink-0
                        ${isActive ? 'text-blue-600' : 'text-gray-600'}
                      `} 
                    />
                    
                    {/* Error Indicator */}
                    {hasError && (
                      <div 
                        className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"
                        title={getErrorTooltip(item.id)}
                      >
                        <div className="w-full h-full bg-red-500 rounded-full animate-pulse" />
                      </div>
                    )}
                  </div>

                  {/* Label */}
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <div className={`
                        font-medium text-sm leading-tight
                        ${isActive ? 'text-blue-700' : 'text-gray-900'}
                      `}>
                        {item.label}
                      </div>
                      {!isActive && (
                        <div className="text-xs text-gray-500 mt-1 leading-tight">
                          {item.description}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Active Indicator */}
                  {isActive && !isCollapsed && (
                    <div className="w-1 h-6 bg-blue-600 rounded-full" />
                  )}
                </button>

                {/* Collapsed Mode Tooltip */}
                {isCollapsed && (
                  <div className="
                    absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm
                    rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible
                    transition-all duration-200 ease-out z-50 whitespace-nowrap
                    pointer-events-none
                  ">
                    <div className="font-medium">{item.label}</div>
                    <div className="text-gray-300 text-xs mt-1">{item.description}</div>
                    
                    {/* Tooltip Arrow */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 
                                  w-2 h-2 bg-gray-900 rotate-45" />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer Info */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            Click sections to edit property details
          </div>
        </div>
      )}
    </div>
  );
};

export default NavigationPanel;
