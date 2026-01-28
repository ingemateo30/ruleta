import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { USER_TYPES } from "@/api/types";
import {
  Settings,
  Gamepad2,
  ClipboardList,
  FileBarChart,
  TrendingUp,
  ChevronDown,
  Shield,
  Building,
  SlidersHorizontal,
  Clock,
  Target,
  Play,
  XCircle,
  Eye,
  CreditCard,
  StopCircle,
  Edit,
  List,
  FileText,
  DollarSign,
  PieChart,
  Wallet,
  LogOut,
  Menu,
  ShieldAlert,
  Users,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

interface MenuItem {
  title: string;
  icon: React.ReactNode;
  href?: string;
  children?: { title: string; icon: React.ReactNode; href: string }[];
  requiredRole?: string[]; // Roles que pueden ver este menu
}

const getMenuItems = (userType: string): MenuItem[] => {
  const isSuperAdmin = userType === USER_TYPES.SUPER_ADMIN;
  const isAdmin = userType === USER_TYPES.ADMIN;
  const isOperario = userType === USER_TYPES.OPERARIO;

  const allMenuItems: MenuItem[] = [
    // Menu solo para SuperAdmin
    {
      title: "Super Admin",
      icon: <ShieldAlert className="h-4 w-4 text-red-500" />,
      requiredRole: [USER_TYPES.SUPER_ADMIN],
      children: [
        { title: "Gestion de Usuarios", icon: <Users className="h-4 w-4" />, href: "/config/seguridad" },
        { title: "Sucursales", icon: <Building className="h-4 w-4" />, href: "/config/sucursales" },
        { title: "Parametros Globales", icon: <SlidersHorizontal className="h-4 w-4" />, href: "/config/parametros" },
        { title: "Estadisticas Globales", icon: <BarChart3 className="h-4 w-4" />, href: "/estadisticas" },
      ],
    },
    // Configuracion - Admin y SuperAdmin
    {
      title: "Configuracion",
      icon: <Settings className="h-4 w-4" />,
      requiredRole: [USER_TYPES.SUPER_ADMIN, USER_TYPES.ADMIN],
      children: [
        { title: "Seguridad", icon: <Shield className="h-4 w-4" />, href: "/config/seguridad" },
        { title: "Sucursales", icon: <Building className="h-4 w-4" />, href: "/config/sucursales" },
        { title: "Parametros", icon: <SlidersHorizontal className="h-4 w-4" />, href: "/config/parametros" },
        { title: "Asignar Ruleta", icon: <Target className="h-4 w-4" />, href: "/config/asignar-ruleta" },
        { title: "Horarios de Juego", icon: <Clock className="h-4 w-4" />, href: "/config/horarios" },
      ],
    },
    // Operativo - Solo para Operarios (sin Cerrar Juego)
    {
      title: "Operativo",
      icon: <Gamepad2 className="h-4 w-4" />,
      requiredRole: [USER_TYPES.OPERARIO],
      children: [
        { title: "Realizar Jugadas", icon: <Play className="h-4 w-4" />, href: "/operativo/jugadas" },
        { title: "Anular Juego", icon: <XCircle className="h-4 w-4" />, href: "/operativo/anular" },
        { title: "Listar Jugadas", icon: <List className="h-4 w-4" />, href: "/operativo/listar-jugadas" },
        { title: "Ver Resultados", icon: <Eye className="h-4 w-4" />, href: "/operativo/resultados" },
        { title: "Realizar Pagos", icon: <CreditCard className="h-4 w-4" />, href: "/operativo/pagos" },
      ],
    },
    // Operativo - Para Admin y SuperAdmin (con Cerrar Juego)
    {
      title: "Operativo",
      icon: <Gamepad2 className="h-4 w-4" />,
      requiredRole: [USER_TYPES.SUPER_ADMIN, USER_TYPES.ADMIN],
      children: [
        { title: "Realizar Jugadas", icon: <Play className="h-4 w-4" />, href: "/operativo/jugadas" },
        { title: "Anular Juego", icon: <XCircle className="h-4 w-4" />, href: "/operativo/anular" },
        { title: "Listar Jugadas", icon: <List className="h-4 w-4" />, href: "/operativo/listar-jugadas" },
        { title: "Ver Resultados", icon: <Eye className="h-4 w-4" />, href: "/operativo/resultados" },
        { title: "Realizar Pagos", icon: <CreditCard className="h-4 w-4" />, href: "/operativo/pagos" },
        { title: "Cerrar Juego", icon: <StopCircle className="h-4 w-4" />, href: "/operativo/cerrar-juego" },
      ],
    },
    // Administrativo - Admin y SuperAdmin
    {
      title: "Administrativo",
      icon: <ClipboardList className="h-4 w-4" />,
      requiredRole: [USER_TYPES.SUPER_ADMIN, USER_TYPES.ADMIN],
      children: [
        { title: "Ingresar Resultados", icon: <Edit className="h-4 w-4" />, href: "/admin/ingresar-resultados" },
      ],
    },
    // Informes - Solo SuperAdmin
    {
      title: "Informes",
      icon: <FileBarChart className="h-4 w-4" />,
      requiredRole: [USER_TYPES.SUPER_ADMIN, USER_TYPES.ADMIN],
      children: [
        { title: "Informe de Juegos", icon: <FileText className="h-4 w-4" />, href: "/informes/juegos" },
        { title: "Ventas del Dia", icon: <DollarSign className="h-4 w-4" />, href: "/informes/ventas" },
        { title: "Informe Resultados", icon: <PieChart className="h-4 w-4" />, href: "/informes/resultados" },
        { title: "Informe de Pagos", icon: <Wallet className="h-4 w-4" />, href: "/informes/pagos" },
      ],
    },
    // Estadisticas - Solo SuperAdmin
    {
      title: "Estadisticas",
      icon: <TrendingUp className="h-4 w-4" />,
      href: "/estadisticas",
      requiredRole: [USER_TYPES.SUPER_ADMIN, USER_TYPES.ADMIN],
    },
  ];

  // Filtrar menus segun el rol del usuario
  return allMenuItems.filter(item => {
    if (!item.requiredRole) return true;
    return item.requiredRole.includes(userType);
  });
};

const SidebarContent = ({
  onNavigate,
  openMenus,
  toggleMenu,
  location,
  onLogout,
  user
}: {
  onNavigate: (href: string) => void;
  openMenus: string[];
  toggleMenu: (title: string) => void;
  location: { pathname: string };
  onLogout: () => void;
  user: any;
}) => {
  const userType = String(user?.tipo || '2');
  const menuItems = getMenuItems(userType);
  const isSuperAdmin = userType === USER_TYPES.SUPER_ADMIN;

  return (
    <div className="flex flex-col gap-3 p-3 h-full">
      {/* Card 1: Logo, Nombre y Tema */}
      <Card className="rounded-2xl border-border/50">
        <CardContent className="p-4">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => onNavigate("/dashboard")}
          >
            <div className="flex items-center gap-3">
              <div>
                <h1 className="font-bold text-base text-foreground leading-tight">Lotto Animal</h1>
                {isSuperAdmin && (
                  <Badge variant="destructive" className="text-[10px] px-1 py-0">
                    Super Admin
                  </Badge>
                )}
              </div>
            </div>
            <ThemeToggle />
          </div>
        </CardContent>
      </Card>

      {/* Card de usuario */}
      {user && (
        <Card className={cn(
          "rounded-2xl border-border/50",
          isSuperAdmin && "border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-800"
        )}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              {isSuperAdmin ? (
                <ShieldAlert className="h-5 w-5 text-red-500" />
              ) : (
                <Shield className="h-5 w-5 text-primary" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.nombre || user.nick}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.nombreSucursal || user.sucursal || 'Sin sucursal'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Card 2: Menu */}
      <Card className="rounded-2xl border-border/50 flex-1 flex flex-col min-h-0">
        <CardContent className="p-3 flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1">
            <nav className="space-y-1 pr-2">
              {menuItems.map((item) => (
                item.children ? (
                  <Collapsible
                    key={item.title}
                    open={openMenus.includes(item.title)}
                    onOpenChange={() => toggleMenu(item.title)}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-between hover:bg-accent/30 text-foreground",
                          openMenus.includes(item.title) && "bg-accent/20",
                          item.title === "Super Admin" && "text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
                        )}
                      >
                        <span className="flex items-center gap-2.5">
                          {item.icon}
                          <span className="font-medium text-sm">{item.title}</span>
                        </span>
                        <ChevronDown
                          className={cn(
                            "h-3.5 w-3.5 transition-transform duration-200",
                            openMenus.includes(item.title) && "rotate-180"
                          )}
                        />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pl-3 mt-1 space-y-0.5">
                      {item.children?.map((child) => (
                        <Button
                          key={child.href}
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "w-full justify-start gap-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/20 transition-all",
                            location.pathname === child.href && "bg-primary/10 text-primary font-medium"
                          )}
                          onClick={() => onNavigate(child.href)}
                        >
                          {child.icon}
                          <span>{child.title}</span>
                        </Button>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                ) : (
                  <Button
                    key={item.title}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-2.5 hover:bg-accent/30 text-foreground font-medium text-sm",
                      location.pathname === item.href && "bg-primary/10 text-primary"
                    )}
                    onClick={() => item.href && onNavigate(item.href)}
                  >
                    {item.icon}
                    <span>{item.title}</span>
                  </Button>
                )
              ))}
            </nav>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Card 3: Logout */}
      <Card className="rounded-2xl border-border/50">
        <CardContent className="p-3">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2.5 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4" />
            <span>Cerrar Sesion</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

const Sidebar = () => {
  const [openMenus, setOpenMenus] = useState<string[]>(["Operativo"]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const toggleMenu = (title: string) => {
    setOpenMenus((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  const handleLogout = () => {
    setMobileOpen(false);
    logout();
    navigate("/");
  };

  const handleNavigate = (href: string) => {
    setMobileOpen(false);
    navigate(href);
  };

  const isSuperAdmin = String(user?.tipo) === USER_TYPES.SUPER_ADMIN;

  return (
    <>
      {/* Mobile Header */}
      <div className={cn(
        "lg:hidden fixed top-0 left-0 right-0 z-50 border-b px-4 py-3 flex items-center justify-between",
        isSuperAdmin
          ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
          : "bg-card border-border"
      )}>
        <div className="flex items-center gap-3">
          <img
            src="/src/logo/LOGO LOTTO ANIMAL PNG.png"
            alt="Lotto Animal Logo"
            className="h-8 w-auto object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = new URL("../logo/LOGO LOTTO ANIMAL PNG.png", import.meta.url).href;
            }}
          />
          <div>
            <h1 className="font-bold text-foreground">Lotto Animal</h1>
            {isSuperAdmin && (
              <Badge variant="destructive" className="text-[10px] px-1 py-0">
                Super Admin
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-3 w-72 bg-background">
              <SidebarContent
                onNavigate={handleNavigate}
                openMenus={openMenus}
                toggleMenu={toggleMenu}
                location={location}
                onLogout={handleLogout}
                user={user}
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 h-screen bg-background flex-col animate-fade-in p-3">
        <SidebarContent
          onNavigate={handleNavigate}
          openMenus={openMenus}
          toggleMenu={toggleMenu}
          location={location}
          onLogout={handleLogout}
          user={user}
        />
      </aside>
    </>
  );
};

export default Sidebar;
