"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { NavigationSectionId } from './NavigationPanel';

interface BottomDrawerProps {
  isOpen: boolean;
  activeSection: NavigationSectionId | null;
  height: number;
  onClose: () => void;
  onHeightChange: (height: number) => void;
  children: React.ReactNode;
  className?: string;
}

const sectionTitles: Record<NavigationSectionId, string> = {
  'property-details': 'Property Details',
  'the-purchase': 'The Purchase',
  'loan-details': 'Loan Details',
  'growth-assumptions': 'Growth & Cashflow Assumptions'
};

const BottomDrawer: React.FC<BottomDrawerProps> = ({
  isOpen,
  activeSection,
  height,
  onClose,
  onHeightChange,
  children,
  className = ''
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartHeight, setDragStartHeight] = useState(0);

  // Handle resize drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStartY(e.clientY);
    setDragStartHeight(height);
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
  }, [height]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const deltaY = dragStartY - e.clientY; // Inverted because we're dragging up to increase height
    const newHeight = Math.max(200, Math.min(window.innerHeight * 0.6, dragStartHeight + deltaY));
    onHeightChange(newHeight);
  }, [isDragging, dragStartY, dragStartHeight, onHeightChange]);

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
    if (isOpen && drawerRef.current) {
      const firstFocusableElement = drawerRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;
      
      if (firstFocusableElement) {
        setTimeout(() => firstFocusableElement.focus(), 100);
      }
    }
  }, [isOpen, activeSection]);

  if (!isOpen || !activeSection) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`
          fixed inset-0 bg-black transition-opacity duration-300 ease-out z-40
          ${isOpen ? 'opacity-10' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`
          fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200
          shadow-lg transform transition-transform duration-300 ease-out z-50
          ${isOpen ? 'translate-y-0' : 'translate-y-full'}
          ${className}
        `}
        style={{ 
          height: `${height}px`,
          borderRadius: '1rem 1rem 0 0'
        }}
      >
        {/* Resize Handle */}
        <div
          ref={resizeHandleRef}
          onMouseDown={handleMouseDown}
          className={`
            absolute top-0 left-0 right-0 h-6 cursor-ns-resize
            flex items-center justify-center group
            ${isDragging ? 'bg-blue-50' : 'hover:bg-gray-50'}
            transition-colors duration-150
          `}
          title="Drag to resize"
        >
          {/* Visual Handle */}
          <div className={`
            w-12 h-1 rounded-full transition-colors duration-150
            ${isDragging ? 'bg-blue-400' : 'bg-gray-300 group-hover:bg-gray-400'}
          `} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 pt-8 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {sectionTitles[activeSection]}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Configure your property settings
            </p>
          </div>
          
          <button
            onClick={onClose}
            className="
              p-2 rounded-lg hover:bg-gray-100 transition-colors duration-150
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            "
            title="Close drawer"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 pt-4">
          <div className="max-w-4xl mx-auto">
            {children}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 p-4 bg-gray-50">
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
    </>
  );
};

export default BottomDrawer;
