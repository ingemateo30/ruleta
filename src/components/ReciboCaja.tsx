import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [animalImages, setAnimalImages] = useState<Map<string, HTMLImageElement>>(new Map());

  // Cargar imágenes de animales para el encabezado
  useEffect(() => {
    const loadAnimalImages = async () => {
      const images = new Map<string, HTMLImageElement>();
      // Cargar algunos animales para el encabezado (tortuga, gato, tucán, mono)
      const animalNames = ["11gato.png", "13mono.png"];
      
      for (const name of animalNames) {
        try {
          const img = new Image();
          img.crossOrigin = "anonymous";
          const imageUrl = new URL(`../animalitos/${name}`, import.meta.url).href;
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = imageUrl;
          });
          images.set(name, img);
        } catch (error) {
          console.warn(`No se pudo cargar la imagen ${name}:`, error);
        }
      }
      setAnimalImages(images);
    };

    if (open) {
      loadAnimalImages();
    }
  }, [open]);

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

      // 1. Calcular altura necesaria antes de establecer el tamaño
      const headerHeight = 40 + 10 + 54 + 15 + 32 + 12; // Logo, líneas, info, tabla header
      const jugadasHeight = jugadas.length * 18;
      const footerHeight = 5 + 15 + 15 + 15 + 20; // Total, líneas, pie
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

      // Dibujar iconos de animales o logo (simplificado)
      y += 20;

      // Título LOTTO ANIMAL
      ctx.font = "bold 16px monospace";
      ctx.fillText("LOTTO ANIMAL", width / 2, y);
      y += 20;

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
      ctx.fillText("Condiciones....", padding, y);

      console.log('Canvas renderizado correctamente:', {
        width: canvas.width,
        height: canvas.height,
        radicado
      });
    }, 100); // Delay de 100ms para asegurar que el DOM esté listo
    
    return () => clearTimeout(timeoutId);
  }, [open, radicado, fecha, hora, sucursal, jugadas, valorTotal]);

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
