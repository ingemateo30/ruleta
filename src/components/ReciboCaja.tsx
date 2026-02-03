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
        const qrData = `${radicado.padStart(8, "0")}-${sucursal}-${fecha}-${hora}`;

        const qrDataUrl = await QRCode.toDataURL(qrData, {
          width: 120,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });

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

    const timeoutId = setTimeout(() => {
      if (!canvasRef.current) return;

      if (!radicado || !fecha || !hora || !sucursal || !jugadas || jugadas.length === 0) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Terminos y condiciones (sin guiones)
      const tyc = [
        "Ticket ganador tiene 3 dias habiles",
        "para ser redimido.",
        "Ticket ganador sera cancelado 10 min",
        "despues del ultimo resultado.",
        "Ticket ganador debe ser presentado en",
        "fisico y en perfecto estado, de lo",
        "contrario sera anulado.",
        "Prohibida la venta a menores de",
        "18 anos.",
      ];
      const tycLineHeight = 12;
      const tycHeight = tyc.length * tycLineHeight + 25;

      // Calcular dimensiones del logo
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
      const qrHeight = qrImage ? 120 + 15 : 0;
      // Title "Lotto Animal / Una hora para ganar" below logo
      const titleHeight = 35;
      const headerHeight = logoHeight + titleHeight + 10 + 65 + 15 + 40 + 12;
      const jugadasHeight = jugadas.length * 20;
      const footerHeight = 5 + 15 + 15 + 25 + qrHeight + tycHeight;
      const paddingTotal = 20;
      const totalHeight = headerHeight + jugadasHeight + footerHeight + paddingTotal;

      // 80mm thermal paper = ~302px
      const width = 302;
      canvas.width = width;
      canvas.height = totalHeight;

      const padding = 10;
      let y = padding;

      // Fondo blanco
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#000000";
      ctx.textAlign = "center";

      // Logo
      if (logoImage) {
        const logoX = (width - logoDisplayWidth) / 2;
        ctx.drawImage(logoImage, logoX, y, logoDisplayWidth, logoDisplayHeight);
        y += logoDisplayHeight + 4;
      }

      // Titulo: "LOTTO ANIMAL" y subtitulo "Una hora para ganar"
      ctx.font = "bold 16px monospace";
      ctx.fillText("LOTTO ANIMAL", width / 2, y + 14);
      y += 18;
      ctx.font = "bold 11px monospace";
      ctx.fillText("Una hora para ganar", width / 2, y + 10);
      y += 18;

      // Linea doble
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(padding, y); ctx.lineTo(width - padding, y); ctx.stroke();
      y += 2;
      ctx.beginPath(); ctx.moveTo(padding, y); ctx.lineTo(width - padding, y); ctx.stroke();
      y += 15;

      // Info del juego
      ctx.textAlign = "left";
      ctx.font = "12px monospace";

      // Radicado
      ctx.fillText("Radicado:", padding, y);
      ctx.textAlign = "right";
      ctx.fillText(radicado.padStart(8, "0"), width - padding, y);
      ctx.textAlign = "left";
      y += 16;

      // Sucursal
      ctx.fillText("Sucursal:", padding, y);
      ctx.textAlign = "right";
      ctx.fillText(sucursal, width - padding, y);
      ctx.textAlign = "left";
      y += 16;

      // Fecha
      const fechaFormateada = fecha.replace(/-/g, "/");
      ctx.fillText("Fecha:", padding, y);
      ctx.textAlign = "right";
      ctx.fillText(fechaFormateada, width - padding, y);
      ctx.textAlign = "left";
      y += 16;

      // Hora (primero la hora, luego el valor va abajo en el total)
      const horaFormateada = formatearHora(hora);
      ctx.fillText("Hora:", padding, y);
      ctx.textAlign = "right";
      ctx.fillText(horaFormateada, width - padding, y);
      ctx.textAlign = "left";
      y += 15;

      // Linea separadora
      ctx.beginPath(); ctx.moveTo(padding, y); ctx.lineTo(width - padding, y); ctx.stroke();
      y += 12;

      // Encabezado de tabla: Hora J. | Cod | Animal | Valor
      ctx.font = "bold 10px monospace";
      ctx.fillText("Hora", padding, y);
      ctx.fillText("Cod", padding + 55, y);
      ctx.fillText("Animal", padding + 90, y);
      ctx.textAlign = "right";
      ctx.fillText("Valor $", width - padding, y);
      ctx.textAlign = "left";
      y += 5;

      // Linea separadora
      ctx.beginPath(); ctx.moveTo(padding, y); ctx.lineTo(width - padding, y); ctx.stroke();
      y += 14;

      // Datos de las jugadas (hora primero, luego el resto con espaciado)
      ctx.font = "11px monospace";
      jugadas.forEach((jugada) => {
        ctx.textAlign = "left";
        const horaJuegoFormateada = formatearHoraJuego(jugada.horaJuego || "");
        ctx.fillText(horaJuegoFormateada, padding, y);
        ctx.fillText(jugada.codigo || "", padding + 55, y);
        ctx.fillText((jugada.animal || "").toUpperCase().substring(0, 10), padding + 90, y);
        ctx.textAlign = "right";
        const valorFormateado = (jugada.valor || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        ctx.fillText("$" + valorFormateado, width - padding, y);
        ctx.textAlign = "left";
        y += 20;
      });

      y += 5;

      // Linea antes del total
      ctx.beginPath(); ctx.moveTo(padding, y); ctx.lineTo(width - padding, y); ctx.stroke();
      y += 14;

      // Valor Total
      ctx.font = "bold 14px monospace";
      ctx.fillText("TOTAL:", padding, y);
      ctx.textAlign = "right";
      const totalFormateado = valorTotal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      ctx.fillText("$" + totalFormateado, width - padding, y);
      ctx.textAlign = "left";
      y += 15;

      // Linea separadora
      ctx.beginPath(); ctx.moveTo(padding, y); ctx.lineTo(width - padding, y); ctx.stroke();
      y += 15;

      // Pie de pagina
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText("*** CONSERVE SU TICKET ***", width / 2, y);
      y += 12;
      ctx.fillText("Este es su comprobante de juego", width / 2, y);
      y += 15;

      // QR Code centrado
      if (qrImage) {
        const qrSize = 120;
        const qrX = (width - qrSize) / 2;
        ctx.drawImage(qrImage, qrX, y, qrSize, qrSize);
        y += qrSize + 15;
      }

      // Linea separadora antes de TyC
      ctx.beginPath(); ctx.moveTo(padding, y); ctx.lineTo(width - padding, y); ctx.stroke();
      y += 12;

      // Terminos y condiciones (sin guiones, fuente mas grande)
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "center";
      ctx.fillText("TERMINOS Y CONDICIONES", width / 2, y);
      y += 12;
      ctx.font = "8px monospace";
      ctx.textAlign = "center";
      tyc.forEach((linea) => {
        ctx.fillText(linea, width / 2, y);
        y += tycLineHeight;
      });
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [open, radicado, fecha, hora, sucursal, jugadas, valorTotal, logoImage, qrImage]);

  const formatearHora = (hora: string): string => {
    if (!hora) return "";
    try {
      const partes = hora.split(":");
      if (partes.length < 2) return hora;

      const horas = parseInt(partes[0] || "0", 10);
      const minutos = partes[1] || "00";
      const segundos = partes[2] || "00";
      const ampm = horas >= 12 ? "PM" : "AM";
      const horas12 = horas % 12 || 12;
      return `${horas12.toString().padStart(2, "0")}:${minutos}:${segundos} ${ampm}`;
    } catch (error) {
      return hora;
    }
  };

  const formatearHoraJuego = (horaJuego: string): string => {
    if (!horaJuego) return "";
    try {
      if (horaJuego.includes("AM") || horaJuego.includes("PM")) {
        return horaJuego;
      }
      if (horaJuego.includes(":")) {
        const partes = horaJuego.split(":");
        if (partes.length < 2) return horaJuego;

        const horas = parseInt(partes[0] || "0", 10);
        const minutos = partes[1] || "00";
        const ampm = horas >= 12 ? "PM" : "AM";
        const horas12 = horas % 12 || 12;
        return `${horas12}:${minutos}${ampm}`;
      }
      return horaJuego;
    } catch (error) {
      return horaJuego;
    }
  };

  const handleImprimir = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL("image/png");

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Ticket ${radicado}</title>
          <style>
            @media print {
              @page {
                size: 80mm auto;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 0;
                background: white;
              }
              img {
                width: 80mm;
                height: auto;
                display: block;
              }
            }
            body {
              margin: 0;
              padding: 10px;
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
      <DialogContent className="max-w-[95vw] sm:max-w-[380px] p-0">
        <DialogHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
          <DialogTitle className="text-sm sm:text-base">Recibo de Caja</DialogTitle>
        </DialogHeader>
        <div className="p-4 sm:p-6 pt-0 space-y-3 sm:space-y-4">
          {/* Previsualizacion del canvas */}
          <div className="flex justify-center bg-gray-100 p-2 sm:p-4 rounded-lg overflow-auto max-h-[60vh]">
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

          {/* Botones de accion */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1" size="sm">
              <X className="h-4 w-4 mr-2" />
              Cerrar
            </Button>
            <Button onClick={handleImprimir} className="flex-1" size="sm">
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
