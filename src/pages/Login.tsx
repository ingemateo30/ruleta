import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, User, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/api";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await authService.login({
        username,
        password,
      });

      if (response.success && response.user) {
        toast({
          title: "Login exitoso",
          description: `Bienvenido, ${response.user.nombre}`,
        });
        navigate("/dashboard");
      } else {
        setError(response.message || "Error al iniciar sesión");
        toast({
          title: "Error de autenticación",
          description: response.message || "Usuario o contraseña incorrectos",
          variant: "destructive",
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error de conexión";
      setError("Error al conectar con el servidor");
      toast({
        title: "Error de conexión",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/30 p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMjIiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
      
      <Card className="w-full max-w-md relative border-primary/20 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex items-center justify-center">
            <img 
              src={new URL("../logo/LOGO LOTTO ANIMAL PNG.png", import.meta.url).href}
              alt="Lotto Animal Logo"
              className="h-20 w-auto object-contain"
            />
          </div>
          <CardTitle className="text-3xl font-bold text-foreground">Lotto Animal</CardTitle>
          <CardDescription className="text-muted-foreground">
            Sistema de Gestión de Apuestas
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-foreground font-medium">
                Usuario
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Ingrese su usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-medium">
                Contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Ingrese su contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md border border-destructive/20">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full gap-2"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <LogIn className="h-4 w-4" />
              )}
              {isLoading ? "Ingresando..." : "Ingresar"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            © 2024 Lotto Animal - Todos los derechos reservados
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
