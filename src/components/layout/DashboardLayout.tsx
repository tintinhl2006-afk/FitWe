"use client";

import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { PendingAttendanceModal } from "./PendingAttendanceModal";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-[100dvh] w-full bg-slate-50 dark:bg-slate-950 transition-colors overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col h-[100dvh] min-w-0 max-w-full overflow-hidden">
        <div className="flex-1 overflow-y-auto overflow-x-hidden pt-20 md:pt-0">
          <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8 pb-32 md:pb-8">
            {children}
          </div>
        </div>
      </main>
      <PendingAttendanceModal />
    </div>
  );
}
