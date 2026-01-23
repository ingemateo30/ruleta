import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import StatusBar from "./StatusBar";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Spacer for mobile header */}
        <div className="lg:hidden h-14" />
        <main className="flex-1 overflow-auto p-4 lg:p-6 animate-fade-in">
          {children}
        </main>
        <StatusBar />
      </div>
    </div>
  );
};

export default DashboardLayout;