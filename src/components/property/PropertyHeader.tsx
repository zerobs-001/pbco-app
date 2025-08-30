"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";
import Image from "next/image";

interface PropertyHeaderProps {
  propertyName: string;
  address: string;
  status: string;
}

export default function PropertyHeader({ 
  propertyName, 
  address, 
  status 
}: PropertyHeaderProps) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'modelling': return 'secondary';
      case 'shortlisted': return 'outline';
      case 'bought': return 'default';
      case 'sold': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <header className="border-b bg-background">
      <div className="w-full px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 flex items-center justify-center">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 100 100"
                  className="h-10 w-10"
                >
                  {/* Blue circle */}
                  <circle cx="25" cy="25" r="12" fill="#00A8FF" />
                  {/* Navy blue checkmark/arrow shape */}
                  <path
                    d="M15 45 Q15 40 20 40 L70 40 Q85 40 85 55 L85 75 Q85 90 70 90 L30 90 Q15 90 15 75 Z"
                    fill="#013553"
                  />
                </svg>
              </div>
              <div className="text-xl font-bold">Property Portfolio CF</div>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <a href="/dashboard" className="text-muted-foreground hover:text-foreground">
                Dashboard
              </a>
              <a href="#" className="text-foreground font-medium">
                Model Property
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground">
                Reports
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground">
                Settings
              </a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-sm font-medium text-primary-foreground">U</span>
              </div>
              <span className="hidden md:block text-sm font-medium">User</span>
            </div>
          </div>
        </div>
        
        {/* Property Info - Centered */}
        <div className="mt-4 flex items-center justify-center relative">
          <h1 className="text-2xl font-bold text-center">
            Property Analysis: {address}
          </h1>
          <div className="absolute right-0">
            <Badge variant={getStatusVariant(status)}>
              {getStatusLabel(status)}
            </Badge>
          </div>
        </div>
      </div>
    </header>
  );
}