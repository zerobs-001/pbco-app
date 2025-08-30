"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import ResizablePanelLayout from "./ResizablePanelLayout";
import { 
  ChevronLeft, 
  ChevronRight,
  DollarSign,
  Calculator,
  TrendingUp,
  FileText,
  PieChart,
  AlertTriangle
} from "lucide-react";

export type NavigationSectionId = 
  | 'purchase-details'
  | 'loan-details' 
  | 'growth-assumptions'
  | 'income-modeling'
  | 'outgoings-modeling';

interface NavigationItem {
  id: NavigationSectionId;
  label: string;
  icon: ReactNode;
  description: string;
  isComplete?: boolean;
  hasErrors?: boolean;
}

interface PropertyLayoutProps {
  children: ReactNode;
  activeDrawerSection: NavigationSectionId | null;
  isNavigationCollapsed: boolean;
  drawerContent: ReactNode;
  drawerTitle: string;
  validationErrors: Record<string, string[]>;
  onSectionSelect: (section: NavigationSectionId) => void;
  onNavigationToggle: () => void;
  onDrawerClose: () => void;
  onPanelWidthChange?: (width: number) => void;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'purchase-details',
    label: 'Purchase Details',
    icon: <DollarSign className="h-4 w-4" />,
    description: 'Property details and purchase costs'
  },
  {
    id: 'loan-details',
    label: 'Loan Details',
    icon: <Calculator className="h-4 w-4" />,
    description: 'Financing and loan parameters'
  },
  {
    id: 'growth-assumptions',
    label: 'Growth Assumptions',
    icon: <TrendingUp className="h-4 w-4" />,
    description: 'Market growth and economic assumptions'
  },
  {
    id: 'income-modeling',
    label: 'Income Modeling',
    icon: <FileText className="h-4 w-4" />,
    description: 'Rental income and revenue streams'
  },
  {
    id: 'outgoings-modeling',
    label: 'Outgoings Modeling',
    icon: <PieChart className="h-4 w-4" />,
    description: 'Operating expenses and costs'
  }
];

export default function PropertyLayout({
  children,
  activeDrawerSection,
  isNavigationCollapsed,
  drawerContent,
  drawerTitle,
  validationErrors,
  onSectionSelect,
  onNavigationToggle,
  onDrawerClose,
  onPanelWidthChange
}: PropertyLayoutProps) {
  const getNavigationItemStatus = (itemId: NavigationSectionId) => {
    const hasErrors = validationErrors[itemId]?.length > 0;
    return {
      hasErrors,
      isComplete: false // You can implement completion logic here
    };
  };

  const navigationPanel = (
    <div className={`${
      isNavigationCollapsed ? 'w-16' : 'w-64'
    } transition-all duration-300 border-r bg-background flex flex-col`}>
      
      {/* Navigation Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          {!isNavigationCollapsed && (
            <h2 className="font-semibold">Navigation</h2>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onNavigationToggle}
            className="ml-auto"
          >
            {isNavigationCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Navigation Items */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {navigationItems.map((item, index) => {
          const { hasErrors, isComplete } = getNavigationItemStatus(item.id);
          const isActive = activeDrawerSection === item.id;

            return (
              <div key={item.id}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={`w-full justify-start h-auto p-3 hover:bg-secondary/10 hover:text-secondary ${
                    isNavigationCollapsed ? 'min-h-[48px]' : 'min-h-[52px]'
                  }`}
                  onClick={() => onSectionSelect(item.id)}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="flex-shrink-0 relative">
                      {item.icon}
                      {hasErrors && (
                        <div className="absolute -top-1 -right-1">
                          <AlertTriangle className="h-3 w-3 text-red-500" />
                        </div>
                      )}
                    </div>
                    
                    {!isNavigationCollapsed && (
                      <>
                        <div className="flex-1 text-left">
                          <div className="font-medium text-base">{item.label}</div>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {hasErrors && (
                            <Badge variant="destructive" className="text-[10px] h-4 px-1.5">
                              {validationErrors[item.id]?.length || 0}
                            </Badge>
                          )}
                          {isComplete && (
                            <Badge variant="default" className="text-[10px] h-4 px-1.5">
                              Complete
                            </Badge>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </Button>
                {index < navigationItems.length - 1 && (
                  <Separator className="my-1 opacity-30" />
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );

  const mainContent = (
    <div className="flex h-full">
      {navigationPanel}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );

  return (
    <ResizablePanelLayout
      panelContent={drawerContent}
      panelTitle={drawerTitle}
      isOpen={!!activeDrawerSection}
      onClose={onDrawerClose}
      onWidthChange={onPanelWidthChange}
      defaultWidth={450}
      minWidth={350}
      maxWidth={800}
      className="h-full"
    >
      {mainContent}
    </ResizablePanelLayout>
  );
}