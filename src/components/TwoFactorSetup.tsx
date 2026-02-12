import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, QrCode, AlertCircle, Check, X, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/api";
import DashboardLayout from "@/components/layout/DashboardLayout";
import QRCode from "qrcode";

interface TwoFactorSetupProps {
    onClose?: () => void;
}

const TwoFactorSetup = ({ onClose }: TwoFactorSetupProps) => {
    const [step, setStep] = useState<'initial' | 'setup' | 'verify' | 'disable'>('initial');
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
    const [secret, setSecret] = useState<string>('');
    const [verificationCode, setVerificationCode] = useState('');
    const [passwordForDisable, setPasswordForDisable] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [has2FA, setHas2FA] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        // Check if user already has 2FA enabled
        const user = authService.getCurrentUser();
        if (user?.has2FA) {
            setHas2FA(true);
        }
    }, []);

    const handleSetup2FA = async () => {
        setIsLoading(true);
        try {
            const user = authService.getCurrentUser();
            const response = await fetch('/api/setup_2fa.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Id': user?.id.toString() || '',
                    'X-Auth-Token': user?.id.toString() || '',
                    'X-Auth-User': user?.id.toString() || '',
                },
            });

            const data = await response.json();

            if (data.success) {
                setSecret(data.secret);

                // Generate QR code from the otpauth URL
                const qrDataUrl = await QRCode.toDataURL(data.qrUrl);
                setQrCodeUrl(qrDataUrl);

                setStep('setup');
                toast({
                    title: "Configuración iniciada",
                    description: "Escanea el código QR con tu aplicación de autenticación",
                });
            } else {
                toast({
                    title: "Error",
                    description: data.message,
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudo iniciar la configuración",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyCode = async () => {
        if (verificationCode.length !== 6) {
            toast({
                title: "Código inválido",
                description: "El código debe tener 6 dígitos",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);
        try {
            const user = authService.getCurrentUser();
            const response = await fetch('/api/activate_2fa.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Id': user?.id.toString() || '',
                    'X-Auth-Token': user?.id.toString() || '',
                    'X-Auth-User': user?.id.toString() || '',
                },
                body: JSON.stringify({ code: verificationCode }),
            });

            const data = await response.json();

            if (data.success) {
                setHas2FA(true);
                setStep('initial');
                toast({
                    title: "2FA activado",
                    description: "La autenticación de dos factores ha sido activada exitosamente",
                });

                // Update user in localStorage
                const user = authService.getCurrentUser();
                if (user) {
                    user.has2FA = true;
                    localStorage.setItem('user', JSON.stringify(user));
                }

                if (onClose) onClose();
            } else {
                toast({
                    title: "Error",
                    description: data.message || "Código incorrecto",
                    variant: "destructive",
                });
                setVerificationCode('');
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudo verificar el código",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDisable2FA = async () => {
        if (!passwordForDisable) {
            toast({
                title: "Contraseña requerida",
                description: "Ingresa tu contraseña para desactivar 2FA",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);
        try {
            const user = authService.getCurrentUser();
            const response = await fetch('/api/disable_2fa.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Id': user?.id.toString() || '',
                    'X-Auth-Token': user?.id.toString() || '',
                    'X-Auth-User': user?.id.toString() || '',
                },
                body: JSON.stringify({ password: passwordForDisable }),
            });

            const data = await response.json();

            if (data.success) {
                setHas2FA(false);
                setStep('initial');
                setPasswordForDisable('');
                toast({
                    title: "2FA desactivado",
                    description: "La autenticación de dos factores ha sido desactivada",
                });

                // Update user in localStorage
                const user = authService.getCurrentUser();
                if (user) {
                    user.has2FA = false;
                    localStorage.setItem('user', JSON.stringify(user));
                }

                if (onClose) onClose();
            } else {
                toast({
                    title: "Error",
                    description: data.message || "Contraseña incorrecta",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudo desactivar 2FA",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <Card className="w-full max-w-2xl mx-auto bg-gradient-to-br from-[hsl(240,5%,11%)] to-[hsl(240,5%,9%)] border-gray-800/60">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-500/10 rounded-lg">
                            <Shield className="h-6 w-6 text-orange-400" />
                        </div>
                        <div>
                            <CardTitle className="text-white">Autenticación de Dos Factores (2FA)</CardTitle>
                            <CardDescription className="text-gray-400">
                                {has2FA
                                    ? "2FA está actualmente activado en tu cuenta"
                                    : "Aumenta la seguridad de tu cuenta con 2FA"
                                }
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    {step === 'initial' && (
                        <>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3 p-4 bg-blue-500/5 rounded-lg border border-blue-500/10">
                                    <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                                    <div className="space-y-2">
                                        <p className="text-sm text-blue-400 font-medium">¿Qué es 2FA?</p>
                                        <p className="text-xs text-gray-400">
                                            La autenticación de dos factores añade una capa extra de seguridad a tu cuenta.
                                            Necesitarás tu contraseña y un código generado por una aplicación de autenticación
                                            para iniciar sesión.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-sm text-gray-300 font-medium">Aplicaciones recomendadas:</p>
                                    <div className="grid grid-cols-1 gap-2">
                                        {[
                                            'Google Authenticator',
                                            'Microsoft Authenticator',
                                            'Authy',
                                            '1Password',
                                        ].map((app) => (
                                            <div key={app} className="flex items-center gap-2 p-2 bg-gray-800/40 rounded-lg">
                                                <Smartphone className="h-4 w-4 text-gray-400" />
                                                <span className="text-sm text-gray-300">{app}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                {!has2FA ? (
                                    <Button
                                        onClick={handleSetup2FA}
                                        disabled={isLoading}
                                        className="flex-1 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500"
                                    >
                                        {isLoading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                                                Configurando...
                                            </>
                                        ) : (
                                            <>
                                                <Shield className="h-4 w-4 mr-2" />
                                                Activar 2FA
                                            </>
                                        )}
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={() => setStep('disable')}
                                        variant="destructive"
                                        className="flex-1"
                                    >
                                        <X className="h-4 w-4 mr-2" />
                                        Desactivar 2FA
                                    </Button>
                                )}

                                {onClose && (
                                    <Button onClick={onClose} variant="outline" className="border-gray-700 text-gray-300">
                                        Cerrar
                                    </Button>
                                )}
                            </div>
                        </>
                    )}

                    {step === 'setup' && (
                        <>
                            <div className="space-y-4">
                                <div className="bg-white p-6 rounded-lg mx-auto w-fit">
                                    {qrCodeUrl && (
                                        <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-gray-400 text-sm">Código secreto manual</Label>
                                    <div className="p-3 bg-gray-800/40 rounded-lg border border-gray-700/40">
                                        <code className="text-orange-400 font-mono text-sm break-all">{secret}</code>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        Si no puedes escanear el QR, ingresa este código manualmente en tu app
                                    </p>
                                </div>

                                <div className="flex items-start gap-3 p-4 bg-amber-500/5 rounded-lg border border-amber-500/10">
                                    <QrCode className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
                                    <div className="space-y-1">
                                        <p className="text-sm text-amber-400 font-medium">Instrucciones</p>
                                        <ol className="text-xs text-gray-400 space-y-1 list-decimal list-inside">
                                            <li>Abre tu aplicación de autenticación</li>
                                            <li>Escanea el código QR o ingresa el código manual</li>
                                            <li>Ingresa el código de 6 dígitos generado para verificar</li>
                                        </ol>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    onClick={() => setStep('verify')}
                                    className="flex-1 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500"
                                >
                                    Continuar
                                </Button>
                                <Button
                                    onClick={() => {
                                        setStep('initial');
                                        setQrCodeUrl('');
                                        setSecret('');
                                    }}
                                    variant="outline"
                                    className="border-gray-700 text-gray-300"
                                >
                                    Cancelar
                                </Button>
                            </div>
                        </>
                    )}

                    {step === 'verify' && (
                        <>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="verificationCode" className="text-gray-400 text-sm mb-2 block">
                                        Código de verificación
                                    </Label>
                                    <Input
                                        id="verificationCode"
                                        type="text"
                                        placeholder="000000"
                                        value={verificationCode}
                                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        className="h-12 bg-[hsl(240,5%,8%)] border-gray-700/40 text-white text-center text-2xl tracking-[0.5em] font-mono"
                                        maxLength={6}
                                        autoFocus
                                    />
                                    <p className="text-xs text-gray-500 mt-2 text-center">
                                        Ingresa el código de 6 dígitos de tu aplicación
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    onClick={handleVerifyCode}
                                    disabled={isLoading || verificationCode.length !== 6}
                                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                                            Verificando...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="h-4 w-4 mr-2" />
                                            Activar 2FA
                                        </>
                                    )}
                                </Button>
                                <Button
                                    onClick={() => {
                                        setStep('setup');
                                        setVerificationCode('');
                                    }}
                                    variant="outline"
                                    className="border-gray-700 text-gray-300"
                                >
                                    Volver
                                </Button>
                            </div>
                        </>
                    )}

                    {step === 'disable' && (
                        <>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3 p-4 bg-red-500/5 rounded-lg border border-red-500/10">
                                    <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                                    <div className="space-y-1">
                                        <p className="text-sm text-red-400 font-medium">Advertencia</p>
                                        <p className="text-xs text-gray-400">
                                            Desactivar 2FA reducirá la seguridad de tu cuenta. Solo podrás iniciar sesión
                                            con tu usuario y contraseña.
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="passwordDisable" className="text-gray-400 text-sm mb-2 block">
                                        Confirma tu contraseña
                                    </Label>
                                    <Input
                                        id="passwordDisable"
                                        type="password"
                                        placeholder="Ingresa tu contraseña"
                                        value={passwordForDisable}
                                        onChange={(e) => setPasswordForDisable(e.target.value)}
                                        className="h-11 bg-[hsl(240,5%,8%)] border-gray-700/40 text-white"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    onClick={handleDisable2FA}
                                    disabled={isLoading || !passwordForDisable}
                                    variant="destructive"
                                    className="flex-1"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                                            Desactivando...
                                        </>
                                    ) : (
                                        <>
                                            <X className="h-4 w-4 mr-2" />
                                            Desactivar 2FA
                                        </>
                                    )}
                                </Button>
                                <Button
                                    onClick={() => {
                                        setStep('initial');
                                        setPasswordForDisable('');
                                    }}
                                    variant="outline"
                                    className="border-gray-700 text-gray-300"
                                >
                                    Cancelar
                                </Button>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </DashboardLayout>
    );
};

export default TwoFactorSetup;