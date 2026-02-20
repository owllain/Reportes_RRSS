import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

// Types
interface DataRow {
  fecha: Date | null;
  hora: number | null;
  diaSemana: string;
  cedula: string;
  nombre: string;
  telefono: string;
  correo: string;
  categoria: string;
  tipoTramite: string;
  subTramite: string;
  mensaje: string;
  calificacion: string;
}

interface ProcessedData {
  resumen: {
    categorias: { nombre: string; cantidad: number; porcentaje: number }[];
    total: number;
  };
  arbolEfectividad: {
    señales: { nombre: string; cantidad: number; porcentaje: number }[];
    topTramites: { nombre: string; cantidad: number }[];
    interaccionesDia: { dia: string; cantidad: number }[];
    horasPrime: { hora: string; cantidad: number }[];
    calificacion: { nombre: string; cantidad: number }[];
    solicitudes?: { nombre: string; cantidad: number }[];
  };
  subTramites: {
    nombre: string;
    temas: { tema: string; cantidad: number }[];
    total: number;
  }[];
}

// Macro configurations
const MACRO_CONFIGS: Record<string, {
  filterPattern: RegExp;
  categorias: { key: string; display: string }[];
  canalNombre: string;
}> = {
  chat: {
    filterPattern: /chat/i,
    categorias: [
      { key: "Consultas_Chat", display: "Consultas" },
      { key: "Solicitudes_Chat", display: "Solicitudes" },
    ],
    canalNombre: "Chat",
  },
  instagram: {
    filterPattern: /instagram/i,
    categorias: [
      { key: "Consultas_Instagram", display: "Consultas" },
      { key: "Comentarios_Instagram", display: "Comentarios" },
      { key: "Solicitudes_Instagram", display: "Solicitudes" },
    ],
    canalNombre: "Instagram",
  },
  telegram: {
    filterPattern: /telegram/i,
    categorias: [
      { key: "Consultas_Telegram", display: "Consultas" },
      { key: "Solicitudes_Telegram", display: "Solicitudes" },
    ],
    canalNombre: "Telegram",
  },
  facebook: {
    filterPattern: /facebook/i,
    categorias: [
      { key: "Consultas_Facebook", display: "Consultas" },
      { key: "Solicitud_Facebook", display: "Solicitudes" },
      { key: "Solicitudes_Facebook", display: "Solicitudes" },
      { key: "Comentarios_Facebook", display: "Comentarios" },
    ],
    canalNombre: "Facebook",
  },
  whatsapp: {
    filterPattern: /whatsapp/i,
    categorias: [
      { key: "Consultas_WhatsApp", display: "Consultas" },
      { key: "Solicitud_WhatsApp", display: "Solicitudes" },
      { key: "Solicitudes_WhatsApp", display: "Solicitudes" },
    ],
    canalNombre: "WhatsApp",
  },
};

// Decode HTML entities and normalize text
function normalizeText(text: string): string {
  if (!text) return "";
  
  let normalized = String(text).trim();
  
  // First decode HTML entities like &#241; &#225; etc.
  normalized = normalized.replace(/&#(\d+);/g, (match, dec) => {
    return String.fromCharCode(parseInt(dec, 10));
  });
  
  // Decode hex entities like &#x00F1;
  normalized = normalized.replace(/&#x([0-9A-Fa-f]+);/g, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });
  
  // Common HTML entities
  const htmlEntities: Record<string, string> = {
    '&ntilde;': 'n', '&Ntilde;': 'N',
    '&aacute;': 'a', '&Aacute;': 'A',
    '&eacute;': 'e', '&Eacute;': 'E',
    '&iacute;': 'i', '&Iacute;': 'I',
    '&oacute;': 'o', '&Oacute;': 'O',
    '&uacute;': 'u', '&Uacute;': 'U',
    '&amp;': '&', '&lt;': '<', '&gt;': '>',
    '&quot;': '"', '&apos;': "'",
  };
  
  for (const [entity, char] of Object.entries(htmlEntities)) {
    normalized = normalized.split(entity).join(char);
  }
  
  // Now remove all accents/diacritics (convert to ASCII)
  normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  // Remove any remaining non-ASCII characters except common ones
  normalized = normalized.replace(/[^\x00-\x7F]/g, (char) => {
    // Map remaining special chars to ASCII equivalents
    const specialChars: Record<string, string> = {
      'ñ': 'n', 'Ñ': 'N',
      'ç': 'c', 'Ç': 'C',
      'ß': 'ss',
    };
    return specialChars[char] || '';
  });
  
  return normalized;
}

function findColumn(headers: string[], searchTerms: string[]): number {
  for (const term of searchTerms) {
    const normalizedTerm = term.toLowerCase();
    for (let i = 0; i < headers.length; i++) {
      const header = normalizeText(String(headers[i] || "")).toLowerCase();
      if (header.includes(normalizedTerm)) {
        return i;
      }
    }
  }
  return -1;
}

function getDiaSemana(fecha: Date | null): string {
  if (!fecha) return "";
  const dias = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
  return dias[fecha.getDay()];
}

function formatHora(hora: number | null): string {
  if (hora === null || hora === undefined || isNaN(hora)) return "";
  return hora.toString().padStart(2, "0") + ":00";
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const macroId = formData.get("macroId") as string;

    if (!file || !macroId) {
      return NextResponse.json({ error: "Faltan parametros" }, { status: 400 });
    }

    const config = MACRO_CONFIGS[macroId];
    if (!config) {
      return NextResponse.json({ error: "Macro no valido" }, { status: 400 });
    }

    // Read Excel file
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { 
      type: "array", 
      cellDates: true,
    });
    
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData: Record<string, unknown>[] = XLSX.utils.sheet_to_json(worksheet, { 
      defval: "",
      raw: false,
    });

    if (rawData.length === 0) {
      return NextResponse.json({ error: "El archivo esta vacio" }, { status: 400 });
    }

    // Get headers
    const headers = Object.keys(rawData[0]);
    
    // Find column indices
    const canalCol = findColumn(headers, ["canal"]);
    const tramiteCol = findColumn(headers, ["tramite", "tramites"]);
    const subTramiteCol = findColumn(headers, ["sub tramite", "subtramite"]);
    const fechaCol = findColumn(headers, ["fecha", "fecha de gestion"]);
    const cedulaCol = findColumn(headers, ["cedula"]);
    const clienteCol = findColumn(headers, ["cliente", "nombre"]);
    const telefonoCol = findColumn(headers, ["telefono"]);
    const correoCol = findColumn(headers, ["correo", "email"]);
    const evaluacionCol = findColumn(headers, ["evaluacion", "calificacion"]);
    const comentarioCol = findColumn(headers, ["comentario", "mensaje"]);
    
    // Process data
    const data: DataRow[] = [];
    
    for (const row of rawData) {
      const values = Object.values(row).map(v => normalizeText(String(v || "")));
      const canalValue = canalCol >= 0 ? normalizeText(String(values[canalCol] || "")) : "";
      
      if (config.filterPattern.test(canalValue)) {
        let fecha: Date | null = null;
        let hora: number | null = null;
        
        const fechaRaw = fechaCol >= 0 ? Object.values(row)[fechaCol] : null;
        if (fechaRaw instanceof Date) {
          fecha = fechaRaw;
          hora = fecha.getHours();
        } else if (typeof fechaRaw === "string" && fechaRaw) {
          try {
            fecha = new Date(fechaRaw);
            if (!isNaN(fecha.getTime())) {
              hora = fecha.getHours();
            } else {
              fecha = null;
            }
          } catch {
            fecha = null;
          }
        }
        
        data.push({
          fecha,
          hora,
          diaSemana: getDiaSemana(fecha),
          cedula: cedulaCol >= 0 ? normalizeText(String(values[cedulaCol] || "")) : "",
          nombre: clienteCol >= 0 ? normalizeText(String(values[clienteCol] || "")) : "",
          telefono: telefonoCol >= 0 ? normalizeText(String(values[telefonoCol] || "")) : "",
          correo: correoCol >= 0 ? normalizeText(String(values[correoCol] || "")) : "",
          categoria: canalCol >= 0 ? normalizeText(String(values[canalCol] || "")) : "",
          tipoTramite: tramiteCol >= 0 ? normalizeText(String(values[tramiteCol] || "")) : "",
          subTramite: subTramiteCol >= 0 ? normalizeText(String(values[subTramiteCol] || "")) : "",
          mensaje: comentarioCol >= 0 ? normalizeText(String(values[comentarioCol] || "")) : "",
          calificacion: evaluacionCol >= 0 ? normalizeText(String(values[evaluacionCol] || "")) : "",
        });
      }
    }

    const total = data.length;

    // 1. Resumen
    const categoriaCounts: Record<string, number> = {};
    const categoriaMap: Record<string, string> = {};
    
    config.categorias.forEach(c => {
      categoriaMap[c.key] = c.display;
    });

    data.forEach(row => {
      const cat = row.categoria;
      if (cat) {
        const display = categoriaMap[cat] || cat;
        categoriaCounts[display] = (categoriaCounts[display] || 0) + 1;
      }
    });

    const categorias = Object.entries(categoriaCounts)
      .map(([nombre, cantidad]) => ({
        nombre,
        cantidad,
        porcentaje: total > 0 ? cantidad / total : 0,
      }))
      .sort((a, b) => b.cantidad - a.cantidad);

    // 2. Arbol de Efectividad
    const tramitesCount: Record<string, number> = {};
    const diasCount: Record<string, number> = {};
    const horasCount: Record<string, number> = {};
    const calificacionCount: Record<string, number> = {};
    const subTramitesByTramite: Record<string, Record<string, number>> = {};
    const solicitudesCount: Record<string, number> = {};

    data.forEach(row => {
      const tramite = row.tipoTramite?.trim();
      if (tramite && tramite !== "0" && tramite.toLowerCase() !== "canal inactivo") {
        tramitesCount[tramite] = (tramitesCount[tramite] || 0) + 1;
        
        const subT = row.subTramite?.trim();
        if (subT && subT !== "0") {
          if (!subTramitesByTramite[tramite]) {
            subTramitesByTramite[tramite] = {};
          }
          subTramitesByTramite[tramite][subT] = (subTramitesByTramite[tramite][subT] || 0) + 1;
        }
      }

      const dia = row.diaSemana;
      if (dia) {
        diasCount[dia] = (diasCount[dia] || 0) + 1;
      }

      if (row.hora !== null && row.hora !== undefined && !isNaN(row.hora)) {
        const horaStr = formatHora(row.hora);
        if (horaStr) {
          horasCount[horaStr] = (horasCount[horaStr] || 0) + 1;
        }
      }

      const cal = row.calificacion?.trim();
      if (cal && cal !== "0") {
        calificacionCount[cal] = (calificacionCount[cal] || 0) + 1;
      }

      const catLower = row.categoria?.toLowerCase();
      if (catLower?.includes("solicitud")) {
        const tramiteSol = row.tipoTramite?.trim();
        if (tramiteSol && tramiteSol !== "0") {
          solicitudesCount[tramiteSol] = (solicitudesCount[tramiteSol] || 0) + 1;
        }
      }
    });

    const señales = Object.entries(tramitesCount)
      .map(([nombre, cantidad]) => ({
        nombre,
        cantidad,
        porcentaje: total > 0 ? cantidad / total : 0,
      }))
      .sort((a, b) => b.cantidad - a.cantidad);

    const topTramites = señales
      .filter(s => s.nombre.toLowerCase() !== "otros" && s.nombre.toLowerCase() !== "canal inactivo")
      .slice(0, 5)
      .map(s => ({ nombre: s.nombre, cantidad: s.cantidad }));

    const diasOrdenados = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
    const interaccionesDia = diasOrdenados.map(dia => ({
      dia: dia.charAt(0).toUpperCase() + dia.slice(1),
      cantidad: diasCount[dia] || 0,
    }));

    const horasPrime = Object.entries(horasCount)
      .filter(([hora]) => hora && hora !== "NaN:00")
      .map(([hora, cantidad]) => ({ hora, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);

    const calificacion = Object.entries(calificacionCount)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);

    const solicitudes = Object.entries(solicitudesCount)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 3);

    // 3. Sub Tramites
    const subTramitesList: ProcessedData["subTramites"] = [];
    
    const prioritarios = [
      "Servicios Web", "App Banca Movil", "Ahorros/ Productos de captacion", 
      "Pensiones", "Credito Personal", "Tarjetas de credito", "Tarjetas de debitooo"
    ];
    
    prioritarios.forEach(nombreBusqueda => {
      const nombreNormalizado = normalizeText(nombreBusqueda);
      const matchingKey = Object.keys(subTramitesByTramite).find(
        key => normalizeText(key).toLowerCase() === nombreNormalizado.toLowerCase()
      );
      
      if (matchingKey && subTramitesByTramite[matchingKey]) {
        const temas = Object.entries(subTramitesByTramite[matchingKey])
          .map(([tema, cantidad]) => ({ tema, cantidad }))
          .sort((a, b) => b.cantidad - a.cantidad);
        
        if (temas.length > 0) {
          subTramitesList.push({
            nombre: matchingKey,
            temas,
            total: temas.reduce((sum, t) => sum + t.cantidad, 0),
          });
        }
      }
    });

    const addedNames = new Set(subTramitesList.map(s => s.nombre.toLowerCase()));
    Object.entries(subTramitesByTramite)
      .filter(([nombre]) => !addedNames.has(nombre.toLowerCase()))
      .slice(0, 4)
      .forEach(([nombre, subT]) => {
        const temas = Object.entries(subT)
          .map(([tema, cantidad]) => ({ tema, cantidad }))
          .sort((a, b) => b.cantidad - a.cantidad);
        
        if (temas.length > 0) {
          subTramitesList.push({
            nombre,
            temas,
            total: temas.reduce((sum, t) => sum + t.cantidad, 0),
          });
        }
      });

    const result: ProcessedData = {
      resumen: { categorias, total },
      arbolEfectividad: {
        señales,
        topTramites,
        interaccionesDia,
        horasPrime,
        calificacion,
        solicitudes: solicitudes.length > 0 ? solicitudes : undefined,
      },
      subTramites: subTramitesList,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error processing macro:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al procesar el archivo" },
      { status: 500 }
    );
  }
}
