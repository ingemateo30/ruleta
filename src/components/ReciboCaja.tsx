import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { jsPDF } from "jspdf";
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
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!open) {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl("");
      }
      return;
    }

    const generatePDF = async () => {
      if (!radicado || !fecha || !hora || !sucursal || !jugadas || jugadas.length === 0) return;
      
      setIsGenerating(true);
      
      try {
        // Crear PDF de 80mm de ancho
        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: [80, 297]
        });

        const pageWidth = 80;
        let y = 3;
        const leftMargin = 3; // Reducido de 4 a 3
        const rightMargin = 3; // Reducido de 4 a 3
        const contentWidth = pageWidth - leftMargin - rightMargin;

        // Cargar logo más pequeño
        /*
        try {
          const logoImg = await loadImageAsDataURL(logoLottoAnimal);
          const logoSize = 15; // Reducido de 18 a 15
          const logoX = (pageWidth - logoSize) / 2;
          doc.addImage(logoImg, 'PNG', logoX, y, logoSize, logoSize);
          y += logoSize + 1.5; // Reducido
        } catch (error) {
          console.warn("No se pudo cargar el logo:", error);
        }
          */
y +=  6.5;
        // Título
        doc.setFontSize(22); // Reducido de 12 a 11
        doc.setFont('helvetica', 'bold');
        doc.text('LOTTO ANIMAL', pageWidth / 2, y, { align: 'center' });
        y += 3.5; // Reducido
        
        doc.setFontSize(12); // Reducido de 8 a 7.5
        doc.setFont('helvetica', 'bold');
        doc.text('Una hora para ganar', pageWidth / 2, y, { align: 'center' });
        y += 5.5; // Reducido

        // Línea doble
        doc.setLineWidth(0.2);
        doc.line(leftMargin, y, pageWidth - rightMargin, y);
        y += 0.3;
        doc.line(leftMargin, y, pageWidth - rightMargin, y);
        y += 2.5; // Reducido

        // Información del ticket
        doc.setFontSize(7.5); // Reducido de 8 a 7.5
        doc.setFont('helvetica', 'normal');

        // Radicado
        doc.text('Radicado:', leftMargin, y);
        doc.text(radicado.padStart(8, "0"), pageWidth - rightMargin, y, { align: 'right' });
        y += 3.5; // Reducido

        // Sucursal
        doc.text('Sucursal:', leftMargin, y);
        const sucursalTexto = sucursal.length > 16 ? sucursal.substring(0, 16) : sucursal; // Reducido
        doc.text(sucursalTexto, pageWidth - rightMargin, y, { align: 'right' });
        y += 3.5;

        // Fecha
        const fechaFormateada = fecha.replace(/-/g, "/");
        doc.text('Fecha:', leftMargin, y);
        doc.text(fechaFormateada, pageWidth - rightMargin, y, { align: 'right' });
        y += 3.5;

        // Hora
        const horaFormateada = formatearHora(hora);
        doc.text('Hora:', leftMargin, y);
        doc.text(horaFormateada, pageWidth - rightMargin, y, { align: 'right' });
        y += 2.5; // Reducido

        // Línea separadora
        doc.line(leftMargin, y, pageWidth - rightMargin, y);
        y += 2.5; // Reducido

        // Encabezado de tabla
        doc.setFontSize(7); // Reducido de 7.5 a 7
        doc.setFont('helvetica', 'bold');
        doc.text('Hora', leftMargin, y);
        doc.text('Cod', leftMargin + 13, y); // Ajustado
        doc.text('Animal', leftMargin + 22, y); // Ajustado
        doc.text('Valor', pageWidth - rightMargin - 1, y, { align: 'right' }); // Ajustado
        y += 1.5;

        // Línea separadora
        doc.setLineWidth(0.2);
        doc.line(leftMargin, y, pageWidth - rightMargin, y);
        y += 3; // Reducido

        // Datos de las jugadas
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7); // Reducido de 7.5 a 7
        
        jugadas.forEach((jugada) => {
          const horaJuegoFormateada = formatearHoraJuego(jugada.horaJuego || "");
          const animalNombre = (jugada.animal || "").toUpperCase().substring(0, 6); // Reducido de 7 a 6
          const valorFormateado = "$" + (jugada.valor || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");

          doc.text(horaJuegoFormateada, leftMargin, y);
          doc.text(jugada.codigo || "", leftMargin + 13, y); // Ajustado
          doc.text(animalNombre, leftMargin + 22, y); // Ajustado
          doc.text(valorFormateado, pageWidth - rightMargin - 1, y, { align: 'right' }); // Ajustado
          y += 3.5; // Reducido
        });

        y += 0.5; // Reducido

        // Línea antes del total
        doc.setLineWidth(0.3);
        doc.line(leftMargin, y, pageWidth - rightMargin, y);
        y += 3; // Reducido

        // Total
        doc.setFontSize(9.5); // Reducido de 10 a 9.5
        doc.setFont('helvetica', 'bold');
        doc.text('TOTAL:', leftMargin, y);
        const totalFormateado = "$" + valorTotal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        doc.text(totalFormateado, pageWidth - rightMargin - 1, y, { align: 'right' }); // Ajustado
        y += 3.5; // Reducido

        // Línea separadora
        doc.line(leftMargin, y, pageWidth - rightMargin, y);
        y += 2.5; // Reducido

        // Pie de página
        doc.setFontSize(7); // Reducido de 7.5 a 7
        doc.setFont('helvetica', 'bold');
        doc.text('*** CONSERVE SU TICKET ***', pageWidth / 2, y, { align: 'center' });
        y += 2.5; // Reducido
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5); // Reducido
        doc.text('Este es su comprobante de juego', pageWidth / 2, y, { align: 'center' });
        y += 3.5; // Reducido

        // QR Code mucho más pequeño
        try {
          const qrData = `${radicado.padStart(8, "0")}-${sucursal}-${fecha}-${hora}`;
          const qrDataUrl = await QRCode.toDataURL(qrData, {
            width: 200, // Reducido de 250 a 200
            margin: 0, // Sin margen
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
          
          const qrSize = 22; // Reducido de 28 a 22
          const qrX = (pageWidth - qrSize) / 2;
          doc.addImage(qrDataUrl, 'PNG', qrX, y, qrSize, qrSize);
          y += qrSize + 2.5; // Reducido
        } catch (error) {
          console.error("Error generando QR:", error);
        }

        // Línea antes de TyC
        doc.line(leftMargin, y, pageWidth - rightMargin, y);
        y += 2.5; // Reducido

        // Términos y condiciones
        doc.setFontSize(6); // Reducido de 6.5 a 6
        doc.setFont('helvetica', 'bold');
        doc.text('TERMINOS Y CONDICIONES', pageWidth / 2, y, { align: 'center' });
        y += 3.5; // Reducido

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5); // Reducido de 6 a 5.5
        const tyc = [
          "Ticket ganador tiene 3 dias habiles",
          "para ser redimido.",
          "Ticket ganador sera cancelado 10 min",
          "despues del ultimo resultado.",
          "Ticket ganador debe ser presentado en",
          "fisico y en perfecto estado, de lo",
          "contrario sera anulado.",
          "Prohibida la venta a menores de",
          "18 años.",
        ];

        tyc.forEach((linea) => {
          doc.text(linea, pageWidth / 2, y, { align: 'center' });
          y += 2.4; // Reducido de 2.5 a 2.2
        });

        // Generar blob del PDF
        const pdfBlob = doc.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        setPdfUrl(url);
        
      } catch (error) {
        console.error("Error generando PDF:", error);
      } finally {
        setIsGenerating(false);
      }
    };

    generatePDF();
  }, [open, radicado, fecha, hora, sucursal, jugadas, valorTotal]);

  const loadImageAsDataURL = (src: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo obtener contexto del canvas'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = src;
    });
  };

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
    if (!pdfUrl) return;

    const printWindow = window.open(pdfUrl, '_blank');
    if (!printWindow) return;

    printWindow.onload = () => {
      printWindow.print();
    };
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-[450px] p-0">
        <DialogHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
          <DialogTitle className="text-sm sm:text-base">Recibo de Caja</DialogTitle>
        </DialogHeader>
        <div className="p-4 sm:p-6 pt-0 space-y-3 sm:space-y-4">
          {/* Previsualización del PDF */}
          <div className="flex justify-center bg-gray-100 p-2 sm:p-4 rounded-lg overflow-auto" style={{ maxHeight: '70vh' }}>
            {isGenerating ? (
              <div className="flex items-center justify-center p-8">
                <p className="text-sm text-gray-500">Generando ticket...</p>
              </div>
            ) : pdfUrl ? (
              <iframe
                src={pdfUrl}
                className="bg-white shadow-lg"
                style={{
                  width: '100%',
                  height: '600px',
                  border: 'none'
                }}
                title="Vista previa del ticket"
              />
            ) : (
              <div className="flex items-center justify-center p-8">
                <p className="text-sm text-gray-500">No se pudo generar el ticket</p>
              </div>
            )}
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1" size="sm">
              <X className="h-4 w-4 mr-2" />
              Cerrar
            </Button>
            <Button onClick={handleImprimir} className="flex-1" size="sm" disabled={!pdfUrl}>
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