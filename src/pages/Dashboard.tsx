import DashboardLayout from "@/components/layout/DashboardLayout";
import QuickActions from "@/components/dashboard/QuickActions";
import StatsCards from "@/components/dashboard/StatsCards";
import WinnersTable from "@/components/dashboard/WinnersTable";
import ScheduleTable from "@/components/dashboard/ScheduleTable";
import AnimalRoulette from "@/components/dashboard/AnimalRoulette";
import { useAuth } from "@/hooks/use-auth";

const Dashboard = () => {
  const { user } = useAuth();
  const esOperario = String(user?.tipo) === '2';

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground truncate">
            Lotto Animal
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
            Una hora para ganar
          </p>
        </div>

        {/* Stats Cards */}
        <StatsCards />

        {/* Quick Actions */}
        <QuickActions />

        {esOperario ? (
          /* Layout para operarios: Schedule y Animales lado a lado */
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Schedule Table */}
              <div className="animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
                <ScheduleTable />
              </div>

              {/* Animal Roulette al lado del horario */}
              <div className="animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
                <AnimalRoulette />
              </div>
            </div>
          </>
        ) : (
          /* Layout para admin: Winners + Schedule, luego Animales */
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Winners Table */}
              <div className="animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
                <WinnersTable />
              </div>

              {/* Schedule Table */}
              <div className="animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
                <ScheduleTable />
              </div>
            </div>

            {/* Animal Roulette */}
            <div className="animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
              <AnimalRoulette />
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
