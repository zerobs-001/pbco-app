"use client";

import React, { useState, useRef, useCallback, useEffect, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResizablePanelLayoutProps {
  children: ReactNode;
  panelContent: ReactNode;
  panelTitle: string;
  isOpen: boolean;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  onClose: () => void;
  onWidthChange?: (width: number) => void;
  className?: string;
}

export default function ResizablePanelLayout({
  children,
  panelContent,
  panelTitle,
  isOpen,
  defaultWidth = 400,
  minWidth = 300,
  maxWidth = 600,
  onClose,
  onWidthChange,
  className
}: ResizablePanelLayoutProps) {
  const [panelWidth, setPanelWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Clamp width within constraints
  const clampWidth = useCallback((width: number) => {
    return Math.max(minWidth, Math.min(maxWidth, width));
  }, [minWidth, maxWidth]);

  // Handle mouse move during resize
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const deltaX = startX - e.clientX; // Negative because we're dragging from right edge
    const newWidth = clampWidth(startWidth + deltaX);
    setPanelWidth(newWidth);
    onWidthChange?.(newWidth);
  }, [startX, startWidth, clampWidth, onWidthChange]);

  // Handle resize end
  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  // Handle resize start
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    setStartX(e.clientX);
    setStartWidth(panelWidth);
    
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [panelWidth]);

  // Effect to handle mouse events during resize
  useEffect(() => {
    if (!isResizing) return;

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [isOpen, onClose]);

  // Calculate layout styles
  const layoutStyles = {
    display: 'grid',
    gridTemplateColumns: isOpen 
      ? `1fr ${panelWidth}px` 
      : '1fr 0px',
    transition: isResizing ? 'none' : 'grid-template-columns 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    height: '100%',
  };

  const panelStyles = {
    width: `${panelWidth}px`,
    transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
    transition: isResizing ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  return (
    <div
      ref={containerRef}
      className={cn("h-full overflow-hidden", className)}
      style={layoutStyles}
    >
      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>

      {/* Resizable Panel */}
      <div
        ref={panelRef}
        className="relative bg-background border-l border-border overflow-hidden"
        style={panelStyles}
      >
        {/* Resize Handle */}
        <div
          className={cn(
            "absolute top-0 left-0 w-1 h-full cursor-col-resize z-20",
            "hover:bg-primary/20 active:bg-primary/30 transition-colors",
            "flex items-center justify-center",
            isResizing && "bg-primary/30"
          )}
          onMouseDown={handleResizeStart}
          title="Drag to resize panel"
        >
          <div className="w-0.5 h-8 bg-border rounded-full opacity-50" />
        </div>

        {/* Panel Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-secondary">{panelTitle}</h2>
            <p className="text-sm text-muted-foreground">Configure the details for this section</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-6 w-6 hover:bg-secondary/10"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <Separator />

        {/* Panel Content */}
        <ScrollArea className="flex-1 h-[calc(100%-80px)]">
          <div className="px-6 py-4">
            {panelContent}
          </div>
        </ScrollArea>

        {/* Resize Indicator */}
        {isResizing && (
          <div className="absolute top-4 right-4 px-2 py-1 bg-primary text-primary-foreground text-xs rounded shadow-lg">
            {panelWidth}px
          </div>
        )}
      </div>

      {/* Overlay for resize cursor */}
      {isResizing && (
        <div 
          className="fixed inset-0 z-30" 
          style={{ cursor: 'col-resize' }}
        />
      )}
    </div>
  );
}