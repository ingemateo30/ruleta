import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, User, LogIn, Eye, EyeOff, Shield, AlertCircle, Fingerprint } from "lucide-react";
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

// Particle component for floating effect
const FloatingParticles = () => {
  const particles = useMemo(() =>
    [...Array(20)].map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 8}s`,
      duration: `${8 + Math.random() * 12}s`,
      size: Math.random() > 0.7 ? 'w-1 h-1' : 'w-0.5 h-0.5',
      opacity: Math.random() > 0.5 ? 'bg-orange-500/10' : 'bg-orange-400/5'
    })), []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className={`absolute ${p.size} ${p.opacity} rounded-full animate-float-particle`}
          style={{
            left: p.left,
            top: p.top,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
    </div>
  );
};

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
    <div className="min-h-screen flex items-center justify-center bg-[hsl(240,5%,6%)] p-8 relative overflow-hidden">
      {/* Background gradient layers */}
      <div className="absolute inset-0">
        {/* Primary gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(240,5%,8%)] via-[hsl(240,5%,6%)] to-[hsl(25,30%,8%)]" />

        {/* Orange glow orbs - más sutiles */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-orange-600/3 rounded-full blur-[100px] animate-pulse-slow delay-1000" />

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(hsl(25,95%,53%) 1px, transparent 1px), linear-gradient(90deg, hsl(25,95%,53%) 1px, transparent 1px)`,
            backgroundSize: '80px 80px'
          }}
        />
      </div>

      {/* Floating particles */}
      <FloatingParticles />

      {/* Main content - Layout horizontal */}
      <div className="w-full max-w-6xl relative z-10">
        <div className="relative animate-fade-in-up">
          {/* Card glow - más sutil */}
          <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/10 via-orange-600/5 to-orange-500/10 rounded-3xl blur-2xl opacity-40" />

          <div className="relative bg-gradient-to-br from-[hsl(240,5%,11%)] to-[hsl(240,5%,9%)] rounded-3xl border border-gray-800/60 shadow-2xl overflow-hidden">
            <div className="grid lg:grid-cols-2 gap-0">
              {/* Left side - Branding */}
              <div className="relative flex flex-col items-center justify-center p-12 lg:p-16 border-r border-gray-800/40">
                {/* Decorative gradient background for left side */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent" />
                
                <div className="relative z-10 text-center space-y-8">
                  {/* Logo with glow */}
                  <div className="relative inline-block animate-fade-in">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 rounded-3xl blur-3xl opacity-20 scale-150 animate-pulse-slow" />
                    <div className="relative bg-gradient-to-br from-[hsl(240,5%,14%)] to-[hsl(240,5%,10%)] p-8 rounded-3xl border border-orange-500/10 shadow-2xl">
                      <img
                        src={new URL("../logo/LOGO LOTTO ANIMAL PNG.png", import.meta.url).href}
                        alt="Lotto Animal Logo"
                        className="h-32 w-auto object-contain relative z-10 drop-shadow-2xl mx-auto"
                      />
                    </div>
                  </div>

                  {/* Title */}
                  <div className="space-y-3 animate-fade-in animation-delay-150">
                    <h1 className="text-5xl font-bold text-white tracking-tight">
                      LOTTO
                    </h1>
                    <h2 className="text-6xl font-bold bg-gradient-to-r from-orange-400 via-orange-500 to-amber-500 bg-clip-text text-transparent">
                      ANIMAL
                    </h2>
                  </div>

                  {/* Subtitle */}
                  <p className="text-gray-500 text-sm max-w-xs mx-auto animate-fade-in animation-delay-300">
                    Sistema de gestión y administración
                  </p>

                  {/* Security badges */}
                  <div className="flex items-center justify-center gap-8 pt-4 animate-fade-in animation-delay-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-3 bg-gray-800/40 rounded-xl border border-gray-700/30">
                        <Lock className="h-5 w-5 text-orange-400/70" />
                      </div>
                      <span className="text-[10px] text-gray-600 uppercase tracking-wider">SSL Seguro</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-3 bg-gray-800/40 rounded-xl border border-gray-700/30">
                        <Shield className="h-5 w-5 text-orange-400/70" />
                      </div>
                      <span className="text-[10px] text-gray-600 uppercase tracking-wider">Cifrado</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-3 bg-gray-800/40 rounded-xl border border-gray-700/30">
                        <Fingerprint className="h-5 w-5 text-orange-400/70" />
                      </div>
                      <span className="text-[10px] text-gray-600 uppercase tracking-wider">Protegido</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right side - Form */}
              <div className="flex flex-col justify-center p-12 lg:p-16 animate-fade-in-up animation-delay-200">
                <div className="max-w-md mx-auto w-full space-y-8">
                  {/* Header */}
                  <div className="space-y-2">
                    <h3 className="text-2xl font-semibold text-white">Iniciar Sesión</h3>
                    <p className="text-gray-500 text-sm">Ingresa tus credenciales para acceder</p>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-6">
                    {/* Username field */}
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-gray-400 font-medium text-xs uppercase tracking-wider flex items-center gap-2">
                        <User className="h-3 w-3" />
                        Usuario
                      </Label>
                      <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500/30 to-amber-500/30 rounded-xl opacity-0 group-focus-within:opacity-100 blur transition-opacity duration-300" />
                        <div className="relative">
                          <Input
                            id="username"
                            type="text"
                            placeholder="Ingrese su usuario"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="h-11 bg-[hsl(240,5%,8%)] border-gray-700/40 text-white placeholder:text-gray-600 rounded-xl focus:border-orange-500/40 focus:ring-orange-500/10 transition-all pl-4"
                            required
                            disabled={isLocked()}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Password field */}
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-gray-400 font-medium text-xs uppercase tracking-wider flex items-center gap-2">
                        <Lock className="h-3 w-3" />
                        Contraseña
                      </Label>
                      <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500/30 to-amber-500/30 rounded-xl opacity-0 group-focus-within:opacity-100 blur transition-opacity duration-300" />
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Ingrese su contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="h-11 bg-[hsl(240,5%,8%)] border-gray-700/40 text-white placeholder:text-gray-600 rounded-xl focus:border-orange-500/40 focus:ring-orange-500/10 transition-all pl-4 pr-11"
                            required
                            disabled={isLocked()}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-orange-400 transition-colors"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Rate limiting warning */}
                    {remainingAttempts < RATE_LIMIT_ATTEMPTS && remainingAttempts > 0 && (
                      <div className="flex items-center gap-2 py-2.5 px-3 bg-amber-500/5 rounded-lg border border-amber-500/10 animate-fade-in">
                        <AlertCircle className="h-3.5 w-3.5 text-amber-400/80 flex-shrink-0" />
                        <span className="text-xs text-amber-400/90">
                          {remainingAttempts} intento{remainingAttempts !== 1 ? "s" : ""} restante{remainingAttempts !== 1 ? "s" : ""}
                        </span>
                      </div>
                    )}

                    {/* Lockout message */}
                    {isLocked() && (
                      <div className="flex items-center gap-2 py-2.5 px-3 bg-red-500/5 rounded-lg border border-red-500/10 animate-fade-in">
                        <Lock className="h-3.5 w-3.5 text-red-400/80 flex-shrink-0" />
                        <span className="text-xs text-red-400/90">
                          Cuenta bloqueada: <span className="font-mono font-semibold">{formatLockoutTime()}</span>
                        </span>
                      </div>
                    )}

                    {/* Error message */}
                    {error && !isLocked() && (
                      <div className="flex items-center gap-2 py-2.5 px-3 bg-red-500/5 rounded-lg border border-red-500/10 animate-fade-in">
                        <AlertCircle className="h-3.5 w-3.5 text-red-400/80 flex-shrink-0" />
                        <span className="text-xs text-red-400/90">{error}</span>
                      </div>
                    )}

                    {/* Login button */}
                    <Button
                      type="submit"
                      className="w-full h-11 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-400 hover:via-orange-500 hover:to-amber-500 text-white font-medium rounded-xl transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-orange-500/20"
                      size="lg"
                      disabled={isLoading || isLocked()}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                          <span className="text-sm">Verificando...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <LogIn className="h-4 w-4" />
                          <span className="text-sm">Ingresar</span>
                        </div>
                      )}
                    </Button>
                  </form>

                  {/* Footer */}
                  <div className="pt-6 border-t border-gray-800/40">
                    <p className="text-center text-gray-600 text-[11px]">
                      &copy; {new Date().getFullYear()} Lotto Animal. Todos los derechos reservados.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom animations */}
      <style>{`
        @keyframes float-particle {
          0%, 100% {
            transform: translateY(0) translateX(0) scale(1);
            opacity: 0.2;
          }
          25% {
            transform: translateY(-30px) translateX(15px) scale(1.1);
            opacity: 0.4;
          }
          50% {
            transform: translateY(-20px) translateX(-10px) scale(0.9);
            opacity: 0.3;
          }
          75% {
            transform: translateY(-40px) translateX(5px) scale(1.05);
            opacity: 0.35;
          }
        }
        .animate-float-particle {
          animation: float-particle ease-in-out infinite;
        }
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.05);
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
        .animation-delay-150 {
          animation-delay: 150ms;
        }
        .animation-delay-200 {
          animation-delay: 200ms;
        }
        .animation-delay-300 {
          animation-delay: 300ms;
        }
        .animation-delay-400 {
          animation-delay: 400ms;
        }
        .delay-500 {
          animation-delay: 500ms;
        }
        .delay-1000 {
          animation-delay: 1000ms;
        }
      `}</style>
    </div>
  );
};

export default Login;