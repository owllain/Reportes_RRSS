// Script para generar archivo Excel de ejemplo
import * as XLSX from "xlsx";

// Datos de ejemplo para diferentes canales
const generateSampleData = () => {
  const canales = [
    "Chat", "Instagram", "Telegram", "Facebook", "WhatsApp",
    "Consultas_Chat", "Solicitudes_Chat",
    "Consultas_Instagram", "Comentarios_Instagram", "Solicitudes_Instagram",
    "Consultas_Telegram", "Solicitudes_Telegram",
    "Consultas_Facebook", "Solicitudes_Facebook", "Comentarios_Facebook",
    "Consultas_WhatsApp", "Solicitud_WhatsApp", "Solicitudes_WhatsApp"
  ];
  
  const tiposTramite = [
    "Servicios Web", "App Banca Móvil", "Crédito Personal", 
    "Ahorros/ Productos de captación", "Pensiones", "Tarjetas de crédito",
    "Cuentas", "Inversiones", "Seguros"
  ];
  
  const subTramites: Record<string, string[]> = {
    "Servicios Web": ["Login Web", "Consulta Saldos", "Transferencias Web", "Pago Servicios Web"],
    "App Banca Móvil": ["Login App", "Transferencias App", "Pago Servicios App", "Consulta Movimientos"],
    "Crédito Personal": ["Solicitud Crédito", "Estado Crédito", "Simulador Crédito", "Pago Crédito"],
    "Ahorros/ Productos de captación": ["Apertura Cuenta", "Depósitos", "Retiros", "Certificados"],
    "Pensiones": ["Consulta Pensión", "Actualización Datos", "Certificados Pensión"],
    "Tarjetas de crédito": ["Estado Tarjeta", "Pago Tarjeta", "Aumento Línea", "Bloqueo Tarjeta"],
    "Cuentas": ["Apertura Cuenta", "Estado Cuenta", "Cierre Cuenta"],
    "Inversiones": ["Consulta Inversiones", "Nueva Inversión", "Retiro Inversión"],
    "Seguros": ["Cotización Seguro", "Estado Póliza", "Reclamo Seguro"]
  };
  
  const calificaciones = ["Excelente", "Bueno", "Regular", "Malo"];
  const nombres = [
    "Juan Pérez", "María García", "Carlos López", "Ana Martínez", "Pedro Sánchez",
    "Laura Rodríguez", "Miguel Fernández", "Sofia González", "Diego Torres", "Carmen Ruiz",
    "José Hernández", "Isabel Díaz", "Francisco Moreno", "Lucía Jiménez", "Antonio Álvarez"
  ];
  
  const data = [];
  
  // Generar 500 registros de ejemplo
  for (let i = 0; i < 500; i++) {
    const canal = canales[Math.floor(Math.random() * canales.length)];
    const tipoTramite = tiposTramite[Math.floor(Math.random() * tiposTramite.length)];
    const subTramiteList = subTramites[tipoTramite] || ["General"];
    const subTramite = subTramiteList[Math.floor(Math.random() * subTramiteList.length)];
    
    // Fecha aleatoria en los últimos 30 días
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - Math.floor(Math.random() * 30));
    fecha.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
    
    data.push({
      "ID": i + 1,
      "Cédula": `V-${Math.floor(Math.random() * 30000000) + 10000000}`,
      "Nombre": nombres[Math.floor(Math.random() * nombres.length)],
      "Teléfono": `0414-${Math.floor(Math.random() * 9000000) + 1000000}`,
      "Correo": `usuario${i + 1}@email.com`,
      "Tipo de Trámite": tipoTramite,
      "Sub Trámite": subTramite,
      "Calificación": calificaciones[Math.floor(Math.random() * calificaciones.length)],
      "Categoría": canal,
      "Mensaje": `Mensaje de ejemplo para ${tipoTramite} - ${subTramite}`,
      "Canal": canal.includes("_") ? canal.split("_")[1] : canal,
      "Fecha": fecha.toISOString(),
      "Hora": fecha.getHours()
    });
  }
  
  return data;
};

// Crear workbook y guardar
const data = generateSampleData();
const worksheet = XLSX.utils.json_to_sheet(data);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, "Datos");

// Guardar archivo
XLSX.writeFile(workbook, "./upload/datos_ejemplo.xlsx");

console.log("Archivo de ejemplo creado: ./upload/datos_ejemplo.xlsx");
console.log(`Total de registros generados: ${data.length}`);
