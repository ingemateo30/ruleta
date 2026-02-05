import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Eye, CreditCard, LogOut, Gamepad2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { USER_TYPES } from "@/api/types";

const QuickActions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Determinar el tipo de usuario
  const isOperario = String(user?.tipo) === USER_TYPES.OPERARIO;

  const allActions = [
    {
      title: "Realizar Jugadas",
      description: "Registrar nuevas apuestas",
      icon: <Play className="h-6 w-6 sm:h-8 sm:w-8" />,
      href: "/operativo/jugadas",
      variant: "default" as const,
      showForOperario: true,
    },
    {
      title: "Ver Resultados",
      description: "Consultar ganadores",
      icon: <Eye className="h-6 w-6 sm:h-8 sm:w-8" />,
      href: "/operativo/resultados",
      variant: "success" as const,
      showForOperario: true,
    },
    {
      title: "Realizar Pagos",
      description: "Procesar premios",
      icon: <CreditCard className="h-6 w-6 sm:h-8 sm:w-8" />,
      href: "/operativo/pagos",
      variant: "info" as const,
      showForOperario: true,
    },
    {
      title: "Cerrar Juego",
      description: "Finalizar apuestas",
      icon: <LogOut className="h-6 w-6 sm:h-8 sm:w-8" />,
      href: "/operativo/cerrar-juego",
      variant: "danger" as const,
      showForOperario: false, // Solo Admin y SuperAdmin
    },
  ];

  // Filtrar acciones segun el rol del usuario
  const actions = isOperario
    ? allActions.filter(action => action.showForOperario)
    : allActions;

  return (
    <Card className="animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Gamepad2 className="h-5 w-5 text-primary" />
          Acciones Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {actions.map((action, idx) => (
            <Button
              key={action.title}
              variant={action.variant}
              className="h-auto flex-col py-4 sm:py-6 gap-2 sm:gap-3 transition-all duration-300 hover:scale-[1.02] animate-scale-in"
              style={{ animationDelay: `${0.3 + idx * 0.1}s` }}
              onClick={() => navigate(action.href)}
            >
              {action.icon}
              <div className="text-center">
                <p className="font-bold text-xs sm:text-sm">{action.title}</p>
                <p className="text-[10px] sm:text-xs opacity-80 hidden sm:block">{action.description}</p>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;