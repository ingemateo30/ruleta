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
    [...Array(30)].map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 8}s`,
      duration: `${8 + Math.random() * 12}s`,
      size: Math.random() > 0.7 ? 'w-1.5 h-1.5' : 'w-1 h-1',
      opacity: Math.random() > 0.5 ? 'bg-orange-500/20' : 'bg-orange-400/10'
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
    <div className="min-h-screen flex items-center justify-center bg-[hsl(240,5%,6%)] p-4 relative overflow-hidden">
      {/* Background gradient layers */}
      <div className="absolute inset-0">
        {/* Primary gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(240,5%,8%)] via-[hsl(240,5%,6%)] to-[hsl(25,30%,8%)]" />

        {/* Orange glow orbs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-500/8 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-orange-600/5 rounded-full blur-[100px] animate-pulse-slow delay-1000" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[80px] animate-pulse-slow delay-500" />

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(hsl(25,95%,53%) 1px, transparent 1px), linear-gradient(90deg, hsl(25,95%,53%) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Floating particles */}
      <FloatingParticles />

      {/* Main content */}
      <div className="w-full max-w-md relative z-10">
        {/* Logo and branding */}
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="relative inline-block">
            {/* Logo glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 rounded-full blur-3xl opacity-30 scale-150 animate-pulse-slow" />
            <div className="relative bg-gradient-to-br from-[hsl(240,5%,12%)] to-[hsl(240,5%,8%)] p-6 rounded-2xl border border-orange-500/20 shadow-2xl shadow-orange-500/10">
              <img
                src={new URL("../logo/LOGO LOTTO ANIMAL PNG.png", import.meta.url).href}
                alt="Lotto Animal Logo"
                className="h-24 w-auto object-contain relative z-10 drop-shadow-2xl mx-auto"
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mt-6 tracking-tight">
            LOTTO <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-amber-500 bg-clip-text text-transparent">ANIMAL</span>
          </h1>
          <p className="text-gray-500 mt-2 text-sm tracking-widest uppercase font-medium">
            Sistema de Gestion Empresarial
          </p>
        </div>

        {/* Login form card */}
        <div className="relative animate-fade-in-up animation-delay-150">
          {/* Card glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/20 via-orange-600/10 to-orange-500/20 rounded-2xl blur-xl opacity-50" />

          <div className="relative bg-gradient-to-br from-[hsl(240,5%,12%)] to-[hsl(240,5%,10%)] rounded-2xl border border-gray-800/80 shadow-2xl p-8">
            {/* Security badge */}
            <div className="flex items-center justify-center gap-2 mb-6 py-2.5 px-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20 w-fit mx-auto">
              <div className="relative">
                <Shield className="h-4 w-4 text-emerald-400" />
                <div className="absolute inset-0 bg-emerald-400 blur-sm opacity-50 animate-pulse" />
              </div>
              <span className="text-xs text-emerald-400 font-semibold tracking-wide">CONEXION SEGURA SSL</span>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {/* Username field */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-400 font-medium text-sm flex items-center gap-2">
                  <User className="h-3.5 w-3.5" />
                  Usuario
                </Label>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500/50 to-amber-500/50 rounded-xl opacity-0 group-focus-within:opacity-100 blur transition-opacity duration-300" />
                  <div className="relative">
                    <Input
                      id="username"
                      type="text"
                      placeholder="Ingrese su usuario"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="h-12 bg-[hsl(240,5%,8%)] border-gray-700/50 text-white placeholder:text-gray-600 rounded-xl focus:border-orange-500/50 focus:ring-orange-500/20 transition-all pl-4"
                      required
                      disabled={isLocked()}
                    />
                  </div>
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-400 font-medium text-sm flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5" />
                  Contrasena
                </Label>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500/50 to-amber-500/50 rounded-xl opacity-0 group-focus-within:opacity-100 blur transition-opacity duration-300" />
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Ingrese su contrasena"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 bg-[hsl(240,5%,8%)] border-gray-700/50 text-white placeholder:text-gray-600 rounded-xl focus:border-orange-500/50 focus:ring-orange-500/20 transition-all pl-4 pr-12"
                      required
                      disabled={isLocked()}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-orange-400 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Rate limiting warning */}
              {remainingAttempts < RATE_LIMIT_ATTEMPTS && remainingAttempts > 0 && (
                <div className="flex items-center gap-3 py-3 px-4 bg-amber-500/10 rounded-xl border border-amber-500/20 animate-fade-in">
                  <AlertCircle className="h-4 w-4 text-amber-400 flex-shrink-0" />
                  <span className="text-sm text-amber-400">
                    {remainingAttempts} intento{remainingAttempts !== 1 ? "s" : ""} restante{remainingAttempts !== 1 ? "s" : ""}
                  </span>
                </div>
              )}

              {/* Lockout message */}
              {isLocked() && (
                <div className="flex items-center gap-3 py-3 px-4 bg-red-500/10 rounded-xl border border-red-500/20 animate-fade-in">
                  <Lock className="h-4 w-4 text-red-400 flex-shrink-0" />
                  <span className="text-sm text-red-400">
                    Cuenta bloqueada. Tiempo restante: <span className="font-mono font-bold">{formatLockoutTime()}</span>
                  </span>
                </div>
              )}

              {/* Error message */}
              {error && !isLocked() && (
                <div className="flex items-center gap-3 py-3 px-4 bg-red-500/10 rounded-xl border border-red-500/20 animate-fade-in">
                  <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                  <span className="text-sm text-red-400">{error}</span>
                </div>
              )}

              {/* Login button */}
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-400 hover:via-orange-500 hover:to-amber-500 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] mt-2"
                size="lg"
                disabled={isLoading || isLocked()}
              >
                {isLoading ? (
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    <span>Verificando credenciales...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <LogIn className="h-5 w-5" />
                    <span>Ingresar al Sistema</span>
                  </div>
                )}
              </Button>
            </form>

            {/* Security info footer */}
            <div className="mt-8 pt-6 border-t border-gray-800/50">
              <div className="flex items-center justify-center gap-6 text-gray-600 text-xs">
                <div className="flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5" />
                  <span>SSL Seguro</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-gray-700" />
                <div className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5" />
                  <span>Cifrado AES-256</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-gray-700" />
                <div className="flex items-center gap-1.5">
                  <Fingerprint className="h-3.5 w-3.5" />
                  <span>Protegido</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 text-xs mt-8 animate-fade-in animation-delay-300">
          &copy; {new Date().getFullYear()} Lotto Animal - Sistema de Gestion Empresarial
        </p>
      </div>

      {/* Custom animations */}
      <style>{`
        @keyframes float-particle {
          0%, 100% {
            transform: translateY(0) translateX(0) scale(1);
            opacity: 0.3;
          }
          25% {
            transform: translateY(-30px) translateX(15px) scale(1.2);
            opacity: 0.6;
          }
          50% {
            transform: translateY(-20px) translateX(-10px) scale(0.8);
            opacity: 0.4;
          }
          75% {
            transform: translateY(-40px) translateX(5px) scale(1.1);
            opacity: 0.5;
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
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }
        .animation-delay-150 {
          animation-delay: 150ms;
        }
        .animation-delay-300 {
          animation-delay: 300ms;
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
