import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, User, LogIn, Eye, EyeOff, Shield, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/api";
import CryptoJS from "crypto-js";

// Rate limiting configuration
const RATE_LIMIT_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes

interface RateLimitData {
  attempts: number;
  firstAttempt: number;
  lockedUntil: number | null;
}

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [remainingAttempts, setRemainingAttempts] = useState(RATE_LIMIT_ATTEMPTS);
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check rate limiting on mount
  useEffect(() => {
    const checkRateLimit = () => {
      const rateLimitData = getRateLimitData();
      if (rateLimitData.lockedUntil && rateLimitData.lockedUntil > Date.now()) {
        setLockoutTime(rateLimitData.lockedUntil);
        setRemainingAttempts(0);
      } else if (rateLimitData.lockedUntil && rateLimitData.lockedUntil <= Date.now()) {
        // Reset if lockout has expired
        clearRateLimitData();
        setRemainingAttempts(RATE_LIMIT_ATTEMPTS);
      } else {
        const remaining = RATE_LIMIT_ATTEMPTS - rateLimitData.attempts;
        setRemainingAttempts(remaining > 0 ? remaining : 0);
      }
    };

    checkRateLimit();
    const interval = setInterval(checkRateLimit, 1000);
    return () => clearInterval(interval);
  }, []);

  const getRateLimitData = (): RateLimitData => {
    try {
      const data = localStorage.getItem("rate_limit");
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // Ignore parse errors
    }
    return { attempts: 0, firstAttempt: 0, lockedUntil: null };
  };

  const setRateLimitData = (data: RateLimitData) => {
    localStorage.setItem("rate_limit", JSON.stringify(data));
  };

  const clearRateLimitData = () => {
    localStorage.removeItem("rate_limit");
  };

  const recordAttempt = (success: boolean) => {
    if (success) {
      clearRateLimitData();
      setRemainingAttempts(RATE_LIMIT_ATTEMPTS);
      return true;
    }

    const data = getRateLimitData();
    const now = Date.now();

    // Reset window if expired
    if (data.firstAttempt && now - data.firstAttempt > RATE_LIMIT_WINDOW) {
      data.attempts = 0;
      data.firstAttempt = 0;
      data.lockedUntil = null;
    }

    data.attempts += 1;
    if (!data.firstAttempt) {
      data.firstAttempt = now;
    }

    if (data.attempts >= RATE_LIMIT_ATTEMPTS) {
      data.lockedUntil = now + LOCKOUT_DURATION;
      setLockoutTime(data.lockedUntil);
    }

    setRateLimitData(data);
    setRemainingAttempts(Math.max(0, RATE_LIMIT_ATTEMPTS - data.attempts));
    return false;
  };

  const isLocked = () => {
    const data = getRateLimitData();
    return data.lockedUntil && data.lockedUntil > Date.now();
  };

  const formatLockoutTime = () => {
    if (!lockoutTime) return "";
    const remaining = lockoutTime - Date.now();
    if (remaining <= 0) return "";
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Encrypt password before sending
  const encryptPassword = (pwd: string): string => {
    const secretKey = "L0tt0An1m4l_S3cur3_K3y_2024!";
    const encrypted = CryptoJS.AES.encrypt(pwd, secretKey).toString();
    return encrypted;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLocked()) {
      toast({
        title: "Cuenta bloqueada",
        description: `Demasiados intentos fallidos. Espere ${formatLockoutTime()}`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Encrypt password before sending
      const encryptedPassword = encryptPassword(password);

      const response = await authService.login({
        username,
        password: encryptedPassword,
      });

      if (response.success && response.user) {
        recordAttempt(true);
        toast({
          title: "Login exitoso",
          description: `Bienvenido, ${response.user.nombre}`,
        });
        navigate("/dashboard");
      } else {
        recordAttempt(false);
        setError(response.message || "Error al iniciar sesion");
        toast({
          title: "Error de autenticacion",
          description: response.message || "Usuario o contrasena incorrectos",
          variant: "destructive",
        });
      }
    } catch (err) {
      recordAttempt(false);
      const errorMessage = err instanceof Error ? err.message : "Error de conexion";
      setError("Error al conectar con el servidor");
      toast({
        title: "Error de conexion",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/30 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white/10 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />

      {/* Login Card */}
      <div className="w-full max-w-md relative z-10">
        {/* Logo and branding */}
        <div className="text-center mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-full blur-2xl opacity-50 animate-pulse" />
            <img
              src={new URL("../logo/LOGO LOTTO ANIMAL PNG.png", import.meta.url).href}
              alt="Lotto Animal Logo"
              className="h-32 w-auto object-contain relative z-10 drop-shadow-2xl mx-auto"
            />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-200 via-yellow-400 to-orange-500 bg-clip-text text-transparent mt-4 tracking-tight">
            LOTTO ANIMAL
          </h1>
          <p className="text-white/60 mt-2 text-sm tracking-widest uppercase">
            Sistema de Gestion de Apuestas
          </p>
        </div>

        {/* Login form card */}
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 shadow-2xl p-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
          {/* Security badge */}
          <div className="flex items-center justify-center gap-2 mb-6 py-2 px-4 bg-green-500/20 rounded-full border border-green-500/30 w-fit mx-auto">
            <Shield className="h-4 w-4 text-green-400" />
            <span className="text-xs text-green-300 font-medium">Conexion Segura</span>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-white/80 font-medium text-sm">
                Usuario
              </Label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl blur opacity-25 group-focus-within:opacity-50 transition-opacity" />
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50 group-focus-within:text-white/80 transition-colors" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Ingrese su usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-12 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-xl focus:border-purple-400 focus:ring-purple-400/20 transition-all"
                    required
                    disabled={isLocked()}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/80 font-medium text-sm">
                Contrasena
              </Label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl blur opacity-25 group-focus-within:opacity-50 transition-opacity" />
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50 group-focus-within:text-white/80 transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Ingrese su contrasena"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 pr-12 h-12 bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-xl focus:border-purple-400 focus:ring-purple-400/20 transition-all"
                    required
                    disabled={isLocked()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Rate limiting warning */}
            {remainingAttempts < RATE_LIMIT_ATTEMPTS && remainingAttempts > 0 && (
              <div className="flex items-center gap-2 py-2 px-3 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
                <AlertCircle className="h-4 w-4 text-yellow-400" />
                <span className="text-xs text-yellow-300">
                  {remainingAttempts} intento{remainingAttempts !== 1 ? "s" : ""} restante{remainingAttempts !== 1 ? "s" : ""}
                </span>
              </div>
            )}

            {/* Lockout message */}
            {isLocked() && (
              <div className="flex items-center gap-2 py-3 px-4 bg-red-500/20 rounded-lg border border-red-500/30">
                <Lock className="h-4 w-4 text-red-400" />
                <span className="text-sm text-red-300">
                  Cuenta bloqueada. Tiempo restante: {formatLockoutTime()}
                </span>
              </div>
            )}

            {error && !isLocked() && (
              <div className="flex items-center gap-2 py-3 px-4 bg-red-500/20 rounded-lg border border-red-500/30 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                <span className="text-sm text-red-300">{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:from-purple-500 hover:via-pink-500 hover:to-orange-400 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 transform hover:scale-[1.02]"
              size="lg"
              disabled={isLoading || isLocked()}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  <span>Verificando...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <LogIn className="h-5 w-5" />
                  <span>Ingresar al Sistema</span>
                </div>
              )}
            </Button>
          </form>

          {/* Security info */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="flex items-center justify-center gap-4 text-white/40 text-xs">
              <div className="flex items-center gap-1">
                <Lock className="h-3 w-3" />
                <span>SSL Seguro</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-white/20" />
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                <span>Cifrado AES-256</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white/40 text-xs mt-6 animate-in fade-in duration-1000 delay-300">
          &copy; {new Date().getFullYear()} Lotto Animal - Todos los derechos reservados
        </p>
      </div>

      {/* Custom animations */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.6;
          }
        }
        .animate-float {
          animation: float ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Login;
