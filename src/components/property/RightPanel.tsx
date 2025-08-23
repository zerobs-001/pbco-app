"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { NavigationSectionId } from './NavigationPanel';

interface RightPanelProps {
  isOpen: boolean;
  activeSection: NavigationSectionId | null;
  width: number;
  onClose: () => void;
  onWidthChange: (width: number) => void;
  children: React.ReactNode;
  className?: string;
}

const sectionTitles: Record<NavigationSectionId, string> = {
  'property-details': 'Property Details',
  'the-purchase': 'The Purchase',
  'loan-details': 'Loan Details',
  'growth-assumptions': 'Growth & Cashflow Assumptions',
  'income-modeling': 'Income Modeling',
  'outgoings-modeling': 'Outgoings Modeling'
};

const RightPanel: React.FC<RightPanelProps> = ({
  isOpen,
  activeSection,
  width,
  onClose,
  onWidthChange,
  children,
  className = ''
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartWidth, setDragStartWidth] = useState(0);

  // Handle resize drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragStartWidth(width);
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  }, [width]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStartX;
    // Invert the delta so dragging left expands the panel and dragging right shrinks it
    const newWidth = Math.max(300, Math.min(window.innerWidth * 0.6, dragStartWidth - deltaX));
    onWidthChange(newWidth);
  }, [isDragging, dragStartX, dragStartWidth, onWidthChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  // Attach global mouse events for resize
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus management
  useEffect(() => {
    if (isOpen && panelRef.current) {
      const firstFocusableElement = panelRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;
      
      if (firstFocusableElement) {
        setTimeout(() => firstFocusableElement.focus(), 100);
      }
    }
  }, [isOpen, activeSection]);

  if (!activeSection) {
    return null;
  }

  return (
    <div
      ref={panelRef}
      className={`
        bg-white border-l border-gray-200 shadow-lg
        transform transition-transform duration-300 ease-out relative
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        ${className}
      `}
      style={{ 
        width: `${width}px`,
        height: '100vh'
      }}
    >
      {/* Resize Handle - Left Edge */}
      <div
        ref={resizeHandleRef}
        onMouseDown={handleMouseDown}
        className={`
          absolute left-0 top-0 bottom-0 w-6 cursor-ew-resize
          flex items-center justify-center group z-10
          ${isDragging ? 'bg-blue-50' : 'hover:bg-gray-50'}
          transition-colors duration-150
        `}
        title="Drag to resize"
      >
        {/* Visual Handle */}
        <div className={`
          w-1 h-12 rounded-full transition-colors duration-150
          ${isDragging ? 'bg-blue-400' : 'bg-gray-300 group-hover:bg-gray-400'}
        `} />
      </div>

      {/* Close Handle - Right Edge */}
      <div
        className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10"
      >
        <button
          onClick={onClose}
          className="
            bg-white border border-gray-300 rounded-l-lg px-2 py-3
            hover:bg-gray-50 transition-colors duration-150 shadow-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          "
          title="Close panel"
        >
          <ChevronLeftIcon className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-3 border-b border-gray-100 ml-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {sectionTitles[activeSection]}
          </h2>
          <p className="text-xs text-gray-600 mt-1">
            Configure your property settings
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 pl-10" style={{ maxHeight: 'calc(100vh - 140px)' }}>
        <div className="max-w-4xl">
          {children}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 p-3 bg-gray-50 ml-6">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Auto-saving changes
          </div>
          <div className="flex items-center gap-4">
            <kbd className="px-2 py-1 bg-white border border-gray-200 rounded text-xs">
              Esc
            </kbd>
            <span>to close</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RightPanel;
