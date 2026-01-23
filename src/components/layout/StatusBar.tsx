import { useState, useEffect } from "react";
import { Building, Calendar, Clock, User as UserIcon } from "lucide-react";
import { authService } from "@/api";

const StatusBar = () => {
  const [time, setTime] = useState(new Date());
  const [user, setUser] = useState(authService.getCurrentUser());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Actualizar usuario cuando cambie el localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      setUser(authService.getCurrentUser());
    };

    // Escuchar cambios en localStorage (de otras ventanas/pestañas)
    window.addEventListener('storage', handleStorageChange);
    
    // También verificar periódicamente (por si el cambio fue en la misma ventana)
    // El evento 'storage' solo se dispara en otras ventanas, no en la misma
    const checkInterval = setInterval(() => {
      const currentUser = authService.getCurrentUser();
      const currentUserStr = JSON.stringify(currentUser);
      const userStr = JSON.stringify(user);
      if (currentUserStr !== userStr) {
        setUser(currentUser);
      }
    }, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(checkInterval);
    };
  }, [user]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    
    return {
      hours: hours12.toString().padStart(2, '0'),
      minutes: minutes.toString().padStart(2, '0'),
      seconds: seconds.toString().padStart(2, '0'),
      ampm
    };
  };

  const timeDisplay = formatTime(time);

  return (
    <footer className="h-auto min-h-12 border border-border/50 bg-card/95 backdrop-blur-md px-6 py-2 flex flex-col sm:flex-row items-start sm:items-center justify-between text-sm gap-2 rounded-t-2xl mx-4 mb-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Building className="h-4 w-4" />
          <span className="font-medium text-foreground">
            {user?.sucursal || "Sin sucursal asignada"}
          </span>
          {user?.caja && (
            <span className="text-muted-foreground">
              - Punto de Venta {user.caja.toString().padStart(3, "0")}
            </span>
          )}
        </div>
        {user && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground ml-6">
            <UserIcon className="h-3 w-3" />
            <span>{user.nombre} ({user.nick})</span>
            {user.tipo && <span className="text-muted-foreground/70">- Tipo: {user.tipo}</span>}
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span className="capitalize">{formatDate(time)}</span>
        </div>
        
        <div className="flex items-center gap-3 bg-gradient-to-r from-primary/15 via-primary/10 to-primary/5 px-4 py-2 rounded-lg border border-primary/20">
          <Clock className="h-5 w-5 text-primary animate-pulse" />
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-xl font-bold text-primary tabular-nums">
              {timeDisplay.hours}
            </span>
            <span className="font-mono text-lg font-semibold text-primary/70">:</span>
            <span className="font-mono text-xl font-bold text-primary tabular-nums">
              {timeDisplay.minutes}
            </span>
            <span className="font-mono text-lg font-semibold text-primary/70">:</span>
            <span className="font-mono text-lg font-bold text-primary/80 tabular-nums">
              {timeDisplay.seconds}
            </span>
            <span className="ml-2 font-semibold text-xs text-primary/90 uppercase tracking-wider">
              {timeDisplay.ampm}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default StatusBar;
