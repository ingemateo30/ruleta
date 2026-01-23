import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import RealizarJugadas from "./pages/operativo/RealizarJugadas";
import VerResultados from "./pages/operativo/VerResultados";
import AnularJugada from "./pages/operativo/AnularJugada";
import ListarJugadas from "./pages/operativo/ListarJugadas";
import IngresarResultado from "./pages/admin/IngresarResultado";
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
            <Route path="/" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/operativo/jugadas" element={<RealizarJugadas />} />
            <Route path="/operativo/anular" element={<AnularJugada />} />
            <Route path="/operativo/listar-jugadas" element={<ListarJugadas />} />
            <Route path="/operativo/resultados" element={<VerResultados />} />
            <Route path="/admin/ingresar-resultados" element={<IngresarResultado />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;