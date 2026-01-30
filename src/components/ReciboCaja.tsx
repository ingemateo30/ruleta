import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import QRCode from "qrcode";

// Importar el logo
import logoLottoAnimal from "@/logo/LOGO LOTTO ANIMAL PNG.png";

interface JugadaRecibo {
  codigo: string;
  animal: string;
  valor: number;
  horaJuego: string;
}

interface ReciboCajaProps {
  open: boolean;
  onClose: () => void;
  radicado: string;
  fecha: string;
  hora: string;
  sucursal: string;
  jugadas: JugadaRecibo[];
  valorTotal: number;
}

const ReciboCaja = ({
  open,
  onClose,
  radicado,
  fecha,
  hora,
  sucursal,
  jugadas,
  valorTotal,
}: ReciboCajaProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null);
  const [qrImage, setQrImage] = useState<HTMLImageElement | null>(null);

  // Cargar el logo
  useEffect(() => {
    const loadLogo = async () => {
      try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = logoLottoAnimal;
        });
        setLogoImage(img);
      } catch (error) {
        console.warn("No se pudo cargar el logo:", error);
      }
    };

    if (open) {
      loadLogo();
    }
  }, [open]);

  // Generar QR Code
  useEffect(() => {
    const generateQR = async () => {
      if (!radicado || !sucursal || !fecha || !hora) return;
      
      try {
        // Formato del QR: radicado-sucursal-fecha-hora
        const qrData = `${radicado.padStart(8, "0")}-${sucursal}-${fecha}-${hora}`;
        
        // Generar QR como data URL
        const qrDataUrl = await QRCode.toDataURL(qrData, {
          width: 120,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        
        // Cargar como imagen
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = qrDataUrl;
        });
        setQrImage(img);
      } catch (error) {
        console.error("Error generando QR:", error);
      }
    };

    if (open && radicado && sucursal && fecha && hora) {
      generateQR();
    }
  }, [open, radicado, sucursal, fecha, hora]);

  // Dibujar el recibo en el canvas
  useEffect(() => {
    if (!open) return;

    // Pequeño delay para asegurar que el canvas esté montado
    const timeoutId = setTimeout(() => {
      if (!canvasRef.current) {
        console.error('Canvas ref no está disponible');
        return;
      }

      // Debug: Verificar que los datos estén disponibles
      console.log('ReciboCaja - Datos recibidos:', {
        radicado,
        fecha,
        hora,
        sucursal,
        jugadas,
        valorTotal,
        open
      });

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        console.error('No se pudo obtener el contexto 2D del canvas');
        return;
      }

      // Validar que tengamos datos necesarios
      if (!radicado || !fecha || !hora || !sucursal || !jugadas || jugadas.length === 0) {
        console.error('Faltan datos necesarios para renderizar el recibo:', {
          radicado: !!radicado,
          fecha: !!fecha,
          hora: !!hora,
          sucursal: !!sucursal,
          jugadas: jugadas?.length || 0
        });
        return;
      }

      // Términos y condiciones
      const tyc = [
        "- Ticket ganador tiene 3 dias habiles",
        "  para ser redimido.",
        "- Ticket ganador sera cancelado 10 min",
        "  despues del ultimo resultado.",
        "- Ticket ganador debe ser presentado en",
        "  fisico y en perfecto estado, de lo",
        "  contrario sera anulado.",
        "- Prohibida la venta a menores de",
        "  18 anos.",
      ];
      const tycHeight = tyc.length * 10 + 20; // 10px per line + spacing
 
      // 1. Calcular altura necesaria antes de establecer el tamaño
      // Calcular dimensiones del logo manteniendo aspect ratio
      let logoDisplayWidth = 0;
      let logoDisplayHeight = 0;
      if (logoImage) {
        const maxLogoWidth = 160;
        const maxLogoHeight = 80;
        const imgRatio = logoImage.naturalWidth / logoImage.naturalHeight;
        logoDisplayWidth = maxLogoWidth;
        logoDisplayHeight = maxLogoWidth / imgRatio;
        if (logoDisplayHeight > maxLogoHeight) {
          logoDisplayHeight = maxLogoHeight;
          logoDisplayWidth = maxLogoHeight * imgRatio;
        }
      }
      const logoHeight = logoImage ? logoDisplayHeight + 8 : 0;
      const qrHeight = qrImage ? 120 + 15 : 0; // QR + espacio
      const headerHeight = logoHeight + 20 + 10 + 54 + 15 + 32 + 12; // Logo, líneas, info, tabla header
      const jugadasHeight = jugadas.length * 18;
      const footerHeight = 5 + 15 + 15 + 25 + qrHeight + tycHeight; // Total, líneas, pie, QR, T&C
      const paddingTotal = 20;
      const totalHeight = headerHeight + jugadasHeight + footerHeight + paddingTotal;

      // 2. Establecer tamaño del canvas (ESTO LIMPIA EL CANVAS)
      const width = 302;
      canvas.width = width;
      canvas.height = totalHeight;

      const padding = 10;
      let y = padding;

      // 3. Ahora sí, dibujar todo
      // Limpiar con fondo blanco
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Configurar fuente inicial
      ctx.fillStyle = "#000000";
      ctx.textAlign = "center";
      ctx.font = "bold 14px monospace";

      // Dibujar el logo si está disponible
     if (logoImage) {
        const logoX = (width - logoDisplayWidth) / 2;
        ctx.drawImage(logoImage, logoX, y, logoDisplayWidth, logoDisplayHeight);
        y += logoDisplayHeight + 8;
      } else {
        // Título LOTTO ANIMAL como fallback
        y += 15;
        ctx.font = "bold 20px monospace";
        ctx.fillText("LOTTO ANIMAL", width / 2, y);
        y += 25;
      }

      // Línea doble
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(padding, y); ctx.lineTo(width - padding, y); ctx.stroke();
      y += 2;
      ctx.beginPath(); ctx.moveTo(padding, y); ctx.lineTo(width - padding, y); ctx.stroke();
      y += 15;

      // Información del juego
      ctx.textAlign = "left";
      ctx.font = "12px monospace";
      
      // Radicado
      ctx.fillText(`Radicado Juego:`, padding, y);
      ctx.textAlign = "right";
      ctx.fillText(radicado.padStart(8, "0"), width - padding, y);
      ctx.textAlign = "left";
      y += 18;

      // Fecha y Hora
      const fechaFormateada = fecha.replace(/-/g, "/");
      const horaFormateada = formatearHora(hora);
      ctx.fillText(`Fecha:`, padding, y);
      ctx.fillText(fechaFormateada, padding + 60, y);
      ctx.textAlign = "right";
      ctx.fillText(`Hora:`, width - padding - 80, y);
      ctx.fillText(horaFormateada, width - padding, y);
      ctx.textAlign = "left";
      y += 18;

      // Sucursal
      ctx.fillText(`Sucursal:`, padding, y);
      ctx.fillText(sucursal, padding + 70, y);
      y += 15;

      // Línea separadora
      ctx.beginPath(); ctx.moveTo(padding, y); ctx.lineTo(width - padding, y); ctx.stroke();
      y += 15;

      // Encabezado de tabla
      ctx.font = "bold 11px monospace";
      ctx.fillText("Codigo", padding, y);
      ctx.fillText("Lotto Animal", padding + 50, y);
      ctx.textAlign = "right";
      ctx.fillText("Valor $", width - padding - 50, y);
      const horaJX = width - padding;
      ctx.fillText("Hora J.", horaJX, y);
      ctx.textAlign = "left";
      y += 12;

      ctx.font = "10px monospace";
      ctx.textAlign = "right";
      ctx.fillText("HORA", horaJX, y);
      y += 10;
      ctx.fillText("JUEGO", horaJX, y);
      ctx.textAlign = "left";
      y += 5;

      // Línea separadora
      ctx.beginPath(); ctx.moveTo(padding, y); ctx.lineTo(width - padding, y); ctx.stroke();
      y += 12;

      // Datos de las jugadas
      ctx.font = "11px monospace";
      jugadas.forEach((jugada) => {
        ctx.textAlign = "left";
        ctx.fillText(jugada.codigo || "", padding, y);
        ctx.fillText((jugada.animal || "").toUpperCase(), padding + 50, y);
        ctx.textAlign = "right";
        const valorFormateado = (jugada.valor || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        ctx.fillText(valorFormateado, width - padding - 50, y);
        const horaJuegoFormateada = formatearHoraJuego(jugada.horaJuego || "");
        ctx.fillText(horaJuegoFormateada, width - padding, y);
        ctx.textAlign = "left";
        y += 18;
      });

      y += 5;

      // Valor Total
      ctx.font = "bold 12px monospace";
      ctx.fillText("Valor Total: $", padding, y);
      ctx.textAlign = "right";
      const totalFormateado = valorTotal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      ctx.fillText(totalFormateado, width - padding, y);
      ctx.textAlign = "left";
      y += 15;

      // Línea separadora
      ctx.beginPath(); ctx.moveTo(padding, y); ctx.lineTo(width - padding, y); ctx.stroke();
      y += 15;

      // Pie de página
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText("*** CONSERVE SU TICKET ***", width / 2, y);
      y += 12;
      ctx.fillText("Este es su comprobante de juego", width / 2, y);
      y += 15;

      // Dibujar QR Code centrado
      if (qrImage) {
        const qrSize = 120;
        const qrX = (width - qrSize) / 2;
        ctx.drawImage(qrImage, qrX, y, qrSize, qrSize);
        y += qrSize + 15;
      }
 
      // Línea separadora antes de T&C
      ctx.beginPath(); ctx.moveTo(padding, y); ctx.lineTo(width - padding, y); ctx.stroke();
      y += 10;
 
      // Términos y condiciones (centrados)
      ctx.font = "bold 8px monospace";
      ctx.textAlign = "center";
      ctx.fillText("TERMINOS Y CONDICIONES", width / 2, y);
      y += 10;
      ctx.font = "7px monospace";
      ctx.textAlign = "center";
      tyc.forEach((linea) => {
        ctx.fillText(linea, width / 2, y);
        y += 10;
      });

      console.log('Canvas renderizado correctamente:', {
        width: canvas.width,
        height: canvas.height,
        radicado
      });
    }, 100); // Delay de 100ms para asegurar que el DOM esté listo

    return () => clearTimeout(timeoutId);
  }, [open, radicado, fecha, hora, sucursal, jugadas, valorTotal, logoImage, qrImage]);

  const formatearHora = (hora: string): string => {
    if (!hora) return "";
    try {
      // Formato HH:MM:SS -> HH.MM.SS AM/PM
      const partes = hora.split(":");
      if (partes.length < 2) return hora;
      
      const horas = parseInt(partes[0] || "0", 10);
      const minutos = partes[1] || "00";
      const segundos = partes[2] || "00";
      const ampm = horas >= 12 ? "PM" : "AM";
      const horas12 = horas % 12 || 12;
      return `${horas12.toString().padStart(2, "0")}.${minutos}.${segundos} ${ampm}`;
    } catch (error) {
      console.error("Error formateando hora:", error);
      return hora;
    }
  };

  const formatearHoraJuego = (horaJuego: string): string => {
    if (!horaJuego) return "";
    try {
      // Si ya está en formato HH:MM AM/PM, mantenerlo
      if (horaJuego.includes("AM") || horaJuego.includes("PM")) {
        return horaJuego;
      }
      // Si está en formato HH:MM:SS o HH:MM, convertir a HH:MM AM/PM
      if (horaJuego.includes(":")) {
        const partes = horaJuego.split(":");
        if (partes.length < 2) return horaJuego;
        
        const horas = parseInt(partes[0] || "0", 10);
        const minutos = partes[1] || "00";
        const ampm = horas >= 12 ? "PM" : "AM";
        const horas12 = horas % 12 || 12;
        return `${horas12.toString().padStart(2, "0")}:${minutos} ${ampm}`;
      }
      return horaJuego;
    } catch (error) {
      console.error("Error formateando hora de juego:", error);
      return horaJuego;
    }
  };

  // Se eliminó el efecto de impresión automática a petición del usuario

  const handleImprimir = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL("image/png");

    // Crear ventana de impresión
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Ticket ${radicado}</title>
          <style>
            @media print {
              @page {
                size: A4 portrait;
                margin: 20mm;
              }
              body {
                margin: 0;
                padding: 0;
                background: white;
                display: flex;
                justify-content: center;
                align-items: flex-start;
                min-height: 100vh;
              }
              img {
                width: 302px;
                height: auto;
                display: block;
                margin: 0 auto;
              }
            }
            body {
              margin: 0;
              padding: 20px;
              display: flex;
              justify-content: center;
              align-items: flex-start;
              min-height: 100vh;
              background: #f0f0f0;
            }
            img {
              width: 302px;
              height: auto;
              background: white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" alt="Ticket" />
          <script>
            // Esperar a que la imagen cargue antes de imprimir
            const img = document.querySelector('img');
            if (img.complete) {
              window.print();
              window.onafterprint = () => window.close();
            } else {
              img.onload = () => {
                window.print();
                window.onafterprint = () => window.close();
              };
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[380px] p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>Recibo de Caja</DialogTitle>
        </DialogHeader>
        <div className="p-6 pt-0 space-y-4">
          {/* Previsualización del canvas */}
          <div className="flex justify-center bg-gray-100 p-4 rounded-lg overflow-auto">
            <canvas
              ref={canvasRef}
              className="bg-white shadow-lg"
              style={{ 
                width: "302px", 
                display: "block",
                imageRendering: "crisp-edges"
              }}
            />
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              <X className="h-4 w-4 mr-2" />
              Cerrar
            </Button>
            <Button onClick={handleImprimir} className="flex-1">
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReciboCaja;