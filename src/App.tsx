import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ProtectedRoute, AdminRoute } from "@/components/auth/ProtectedRoute";
import TwoFactorSetup from "./components/TwoFactorSetup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import RealizarJugadas from "./pages/operativo/RealizarJugadas";
import VerResultados from "./pages/operativo/VerResultados";
import AnularJugada from "./pages/operativo/AnularJugada";
import ListarJugadas from "./pages/operativo/ListarJugadas";
import RealizarPagos from "./pages/operativo/RealizarPagos";
import CerrarJuego from "./pages/operativo/CerrarJuego";
import IngresarResultado from "./pages/admin/IngresarResultado";
import Usuarios from "./pages/config/Usuarios";
import Sucursales from "./pages/config/Sucursales";
import Parametros from "./pages/config/Parametros";
import Horarios from "./pages/config/Horarios";
import AsignarRuleta from "./pages/config/AsignarRuleta";
import InformeJuegos from "./pages/informes/InformeJuegos";
import InformeVentas from "./pages/informes/InformeVentas";
import InformeResultados from "./pages/informes/InformeResultados";
import InformePagos from "./pages/informes/InformePagos";
import Estadisticas from "./pages/Estadisticas";
import RuletaPublica from "./pages/RuletaPublica";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider 
      attribute="class" 
      defaultTheme="system" 
      enableSystem 
      disableTransitionOnChange={false}
    >
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Rutas publicas */}
            <Route path="/" element={<Login />} />
            <Route path="/ruleta" element={<RuletaPublica />} />

            {/* Dashboard - Requiere autenticacion */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />

            {/* Operativo - Requiere autenticacion */}
            <Route path="/operativo/jugadas" element={
              <ProtectedRoute>
                <RealizarJugadas />
              </ProtectedRoute>
            } />
            <Route path="/operativo/anular" element={
              <ProtectedRoute>
                <AnularJugada />
              </ProtectedRoute>
            } />
            <Route path="/operativo/listar-jugadas" element={
              <ProtectedRoute>
                <ListarJugadas />
              </ProtectedRoute>
            } />
            <Route path="/operativo/resultados" element={
              <ProtectedRoute>
                <VerResultados />
              </ProtectedRoute>
            } />
            <Route path="/operativo/pagos" element={
              <ProtectedRoute>
                <RealizarPagos />
              </ProtectedRoute>
            } />
            <Route path="/operativo/cerrar-juego" element={
              <ProtectedRoute>
                <CerrarJuego />
              </ProtectedRoute>
            } />

            {/* Administracion - Solo Admin y SuperAdmin */}
            <Route path="/admin/ingresar-resultados" element={
              <AdminRoute>
                <IngresarResultado />
              </AdminRoute>
            } />

            {/* Configuracion - Solo Admin y SuperAdmin */}
            <Route path="/config/seguridad" element={
              <AdminRoute>
                <Usuarios />
              </AdminRoute>
            } />
            <Route path="/config/sucursales" element={
              <AdminRoute>
                <Sucursales />
              </AdminRoute>
            } />
            <Route path="/config/parametros" element={
              <AdminRoute>
                <Parametros />
              </AdminRoute>
            } />
            <Route path="/config/horarios" element={
              <AdminRoute>
                <Horarios />
              </AdminRoute>
            } />
            <Route path="/config/asignar-ruleta" element={
              <AdminRoute>
                <AsignarRuleta />
              </AdminRoute>
            } />
            <Route path="/config/2fa-setup" element={
              <ProtectedRoute>
                <TwoFactorSetup />
              </ProtectedRoute>
            } />

            {/* Informes - Solo Admin y SuperAdmin */}
            <Route path="/informes/juegos" element={
              <AdminRoute>
                <InformeJuegos />
              </AdminRoute>
            } />
            <Route path="/informes/ventas" element={
              <AdminRoute>
                <InformeVentas />
              </AdminRoute>
            } />
            <Route path="/informes/resultados" element={
              <AdminRoute>
                <InformeResultados />
              </AdminRoute>
            } />
            <Route path="/informes/pagos" element={
              <AdminRoute>
                <InformePagos />
              </AdminRoute>
            } />

            {/* Estadisticas - Solo Admin y SuperAdmin */}
            <Route path="/estadisticas" element={
              <AdminRoute>
                <Estadisticas />
              </AdminRoute>
            } />

            {/* Ruta por defecto - 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;