import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { Document, Page, Text, View, StyleSheet, pdf, Svg, Path, Circle, G } from "@react-pdf/renderer";

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

// Colors
const AZUL_REY = "#002060";
const NARANJA = "#ED7D31";
const WHITE = "#FFFFFF";
const GRIS_CLARO = "#F2F2F2";
const CHART_COLORS = [
  "#002060", "#003399", "#0044CC", "#3366FF", "#668CFF",
  "#FF6D00", "#FF8C33", "#FFA666", "#FFC099", "#FFD9CC"
];

// Helper para convertir coordenadas polares a cartesianas en SVG
function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
}

// Helper para calcular el path de un segmento (slice) de pastel
function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number){
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
        "M", start.x, start.y, 
        "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
        "L", x, y,
        "Z"
    ].join(" ");
}

// Componente PdfPieChart
const PdfPieChart = ({ data, size = 110 }: { data: { name: string; value: number }[], size?: number }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return <View style={{ width: size, height: size, backgroundColor: '#eee', borderRadius: size/2 }} />;

  const center = size / 2;
  const radius = size * 0.45;

  const slices = data.filter(item => item.value > 0).reduce((acc, item, index) => {
    const start = acc.length > 0 ? acc[acc.length - 1].endAngle : 0;
    const sliceAngle = (item.value / total) * 360;
    const end = start + sliceAngle;
    
    // Calcular punto medio para el porcentaje
    const midAngle = start + (sliceAngle / 2);
    const midPoint = polarToCartesian(center, center, radius * 0.65, midAngle);
    const pctVal = Math.round((item.value / total) * 100);
    const pctText = pctVal > 5 ? `${pctVal}%` : "";

    acc.push({ 
      startAngle: start, 
      endAngle: end, 
      color: CHART_COLORS[index % CHART_COLORS.length], 
      value: item.value,
      pct: pctText,
      textPos: midPoint
    });
    return acc;
  }, [] as any[]);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices.map((slice, index) => {
          if (slice.value === total) {
            return (
              <G key={index}>
                <Circle cx={center} cy={center} r={radius} fill={slice.color} />
                <Text x={center} y={center - 3} fill="white" style={{ fontSize: 7 }} textAnchor="middle">{slice.pct}</Text>
              </G>
            );
          }

          const path = describeArc(center, center, radius, slice.startAngle, slice.endAngle);
          return (
            <G key={index}>
              <Path d={path} fill={slice.color} />
              {slice.pct && (
                <Text 
                  x={slice.textPos.x} 
                  y={slice.textPos.y} 
                  fill="white" 
                  style={{ fontSize: 4, fontWeight: 'bold' }}
                  textAnchor="middle"
                >
                  {slice.pct}
                </Text>
              )}
            </G>
          );
        })}
      </Svg>
    </View>
  );
};

// Componente Leyenda de Grafico de Pastel
const PdfLegend = ({ data }: { data: { name: string; value: number; color?: string }[] }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  return (
    <View style={{ marginLeft: 15, flex: 1, justifyContent: 'center' }}>
      {data.slice(0, 10).map((item, index) => {
        const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0.0";
        return (
          <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
            <View style={{ width: 8, height: 8, backgroundColor: item.color || CHART_COLORS[index % CHART_COLORS.length], marginRight: 4 }} />
            <Text style={{ fontSize: 5, color: '#333', flexShrink: 1 }}>
              {item.name.length > 35 ? item.name.substring(0, 35) + '...' : item.name} ({pct}%)
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// Header de Sección
const SectionHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <View style={{ marginBottom: 15, borderBottom: 2, borderBottomColor: AZUL_REY, paddingBottom: 5 }}>
    <Text style={{ fontSize: 18, fontWeight: 'bold', color: AZUL_REY, textTransform: 'uppercase' }}>{title}</Text>
    {subtitle && <Text style={{ fontSize: 8, color: '#666', marginTop: 2 }}>{subtitle}</Text>}
  </View>
);

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: WHITE,
    padding: 15,
    fontFamily: "Helvetica",
    fontSize: 8,
  },
  header: {
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    padding: 8,
    backgroundColor: AZUL_REY,
    color: WHITE,
  },
  headerInfo: {
    fontSize: 7,
    color: "#666666",
    textAlign: "center",
    marginTop: 3,
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: WHITE,
    backgroundColor: AZUL_REY,
    padding: 5,
    marginBottom: 3,
  },
  orangeHeader: {
    backgroundColor: NARANJA,
    color: WHITE,
  },
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#CCCCCC",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: NARANJA,
  },
  tableHeaderCell: {
    color: WHITE,
    fontSize: 7,
    fontWeight: "bold",
    padding: 4,
    textAlign: "center",
    borderRightWidth: 1,
    borderRightColor: "#CCCCCC",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#CCCCCC",
  },
  tableRowAlt: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#CCCCCC",
    backgroundColor: GRIS_CLARO,
  },
  tableCell: {
    fontSize: 6,
    padding: 3,
    textAlign: "center",
    borderRightWidth: 1,
    borderRightColor: "#CCCCCC",
  },
  tableCellLeft: {
    fontSize: 6,
    padding: 3,
    textAlign: "left",
    borderRightWidth: 1,
    borderRightColor: "#CCCCCC",
  },
  totalRow: {
    flexDirection: "row",
    backgroundColor: AZUL_REY,
  },
  totalCell: {
    color: WHITE,
    fontSize: 7,
    fontWeight: "bold",
    padding: 4,
    textAlign: "center",
    borderRightWidth: 1,
    borderRightColor: "#CCCCCC",
  },
  col1: { width: "50%" },
  col2: { width: "25%" },
  col3: { width: "25%" },
  row: {
    flexDirection: "row",
  },
  colHalf: {
    width: "50%",
    paddingHorizontal: 3,
  },
  colThird: {
    width: "33.33%",
    paddingHorizontal: 3,
  },
  footer: {
    position: "absolute",
    bottom: 10,
    left: 15,
    right: 15,
    borderTopWidth: 1,
    borderTopColor: "#CCCCCC",
    paddingTop: 5,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 7,
    color: "#666666",
    fontWeight: "bold",
  },
  supportText: {
    fontSize: 6,
    color: "#999999",
  },
});

// Resumen Page
function ResumenPage({ data, macroId }: { data: ProcessedData; macroId: string }) {
  return (
    <Page size="A4" orientation="landscape" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reportes y arboles de efectividad RRSS - INFORME CORPORATIVO</Text>
        <Text style={styles.headerInfo}>
          Fecha de Emisión: {new Date().toLocaleDateString("es-ES")}
        </Text>
      </View>

      <SectionHeader title="RESUMEN" subtitle="Consolidado general de tipificaciones y volúmenes por categoría" />

      <View style={styles.row}>
        {/* Resumen */}
        <View style={styles.colHalf}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DATOS GENERALES TIPIFICACION</Text>
            
            {/* Seccion de Grafico y Leyenda (PDF Safe) */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8, paddingHorizontal: 10 }}>
              <PdfPieChart data={data.resumen.categorias.map(c => ({ name: c.nombre, value: c.cantidad }))} size={100} />
              <PdfLegend data={data.resumen.categorias.map(c => ({ name: c.nombre, value: c.cantidad }))} />
            </View>

            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.col1]}>Categoria</Text>
                <Text style={[styles.tableHeaderCell, styles.col2]}>Cantidad</Text>
                <Text style={[styles.tableHeaderCell, styles.col3]}>Porcentaje</Text>
              </View>
              {data.resumen.categorias.map((cat, idx) => (
                <View key={idx} style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                  <Text style={[styles.tableCellLeft, styles.col1]}>{cat.nombre}</Text>
                  <Text style={[styles.tableCell, styles.col2]}>{cat.cantidad.toLocaleString()}</Text>
                  <Text style={[styles.tableCell, styles.col3]}>{(cat.porcentaje * 100).toFixed(1)}%</Text>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={[styles.totalCell, styles.col1, { textAlign: 'left', paddingLeft: 10 }]}>TOTAL REGISTROS</Text>
                <Text style={[styles.totalCell, styles.col2, { borderRightWidth: 1 }]}>{data.resumen.total.toLocaleString()}</Text>
                <Text style={[styles.totalCell, styles.col3]}>100%</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Señales */}
        <View style={styles.colHalf}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DETALLE DE TIPIFICACION {macroId.toUpperCase()}</Text>

            {/* Grafico Señales */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8, paddingHorizontal: 10 }}>
               <PdfPieChart data={data.arbolEfectividad.señales.slice(0, 7).map(s => ({ name: s.nombre, value: s.cantidad }))} size={100} />
               <PdfLegend data={data.arbolEfectividad.señales.slice(0, 7).map(s => ({ name: s.nombre, value: s.cantidad }))} />
            </View>

            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.col1]}>Senal</Text>
                <Text style={[styles.tableHeaderCell, styles.col2]}>Cantidad</Text>
                <Text style={[styles.tableHeaderCell, styles.col3]}>%</Text>
              </View>
              {data.arbolEfectividad.señales.slice(0, 10).map((s, idx) => (
                <View key={idx} style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                  <Text style={[styles.tableCellLeft, styles.col1]}>{s.nombre}</Text>
                  <Text style={[styles.tableCell, styles.col2]}>{s.cantidad.toLocaleString()}</Text>
                  <Text style={[styles.tableCell, styles.col3]}>{(s.porcentaje * 100).toFixed(1)}%</Text>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={[styles.totalCell, styles.col1, { textAlign: 'left', paddingLeft: 10 }]}>TOTALES</Text>
                <Text style={[styles.totalCell, styles.col2, { borderRightWidth: 1 }]}>{data.resumen.total.toLocaleString()}</Text>
                <Text style={[styles.totalCell, styles.col3]}>100%</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Top Tramites & Interacciones */}
      <View style={styles.row}>
        <View style={styles.colHalf}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>TOP TRAMITES</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { width: "60%" }]}>Tramite</Text>
                <Text style={[styles.tableHeaderCell, { width: "40%" }]}>Cantidad</Text>
              </View>
              {data.arbolEfectividad.topTramites.map((t, idx) => (
                <View key={idx} style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                  <Text style={[styles.tableCellLeft, { width: "60%" }]}>{t.nombre}</Text>
                  <Text style={[styles.tableCell, { width: "40%" }]}>{t.cantidad.toLocaleString()}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.colHalf}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>INTERACCIONES POR DIA</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { width: "50%" }]}>Dia</Text>
                <Text style={[styles.tableHeaderCell, { width: "50%" }]}>Cantidad</Text>
              </View>
              {data.arbolEfectividad.interaccionesDia.map((d, idx) => (
                <View key={idx} style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                  <Text style={[styles.tableCellLeft, { width: "50%" }]}>{d.dia}</Text>
                  <Text style={[styles.tableCell, { width: "50%" }]}>{d.cantidad.toLocaleString()}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Reportes y arboles de efectividad RRSS</Text>
        <Text style={styles.supportText}>Para soporte escribir a acascantem@netcom.com.pa</Text>
        <Text style={styles.footerText}>Pagina 1</Text>
      </View>
    </Page>
  );
}

// Graficos Page (as tables)
function GraficosPage({ data, macroId }: { data: ProcessedData; macroId: string }) {
  return (
    <Page size="A4" orientation="landscape" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reportes y arboles de efectividad RRSS - ANALISIS DE PERFORMANCE</Text>
        <Text style={styles.headerInfo}>Canal: {macroId.toUpperCase()} | Métricas de efectividad y horarios</Text>
      </View>

      <SectionHeader title="ARBOL EFECTIVIDAD" subtitle="Detalle cuantitativo de interacciones, señales y desempeño por franja horaria" />

      <View style={styles.row}>
        {/* Horas Prime */}
        <View style={styles.colThird}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>HORAS PRIME (Top 10)</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { width: "50%" }]}>Hora</Text>
                <Text style={[styles.tableHeaderCell, { width: "50%" }]}>Cantidad</Text>
              </View>
              {data.arbolEfectividad.horasPrime.slice(0, 10).map((h, idx) => (
                <View key={idx} style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                  <Text style={[styles.tableCellLeft, { width: "50%" }]}>{h.hora}</Text>
                  <Text style={[styles.tableCell, { width: "50%" }]}>{h.cantidad.toLocaleString()}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Calificacion */}
        <View style={styles.colThird}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CALIFICACION DE SERVICIO</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { width: "60%" }]}>Calificacion</Text>
                <Text style={[styles.tableHeaderCell, { width: "40%" }]}>Cantidad</Text>
              </View>
              {data.arbolEfectividad.calificacion.map((c, idx) => (
                <View key={idx} style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                  <Text style={[styles.tableCellLeft, { width: "60%" }]}>{c.nombre}</Text>
                  <Text style={[styles.tableCell, { width: "40%" }]}>{c.cantidad.toLocaleString()}</Text>
                </View>
              ))}
              {data.arbolEfectividad.calificacion.length === 0 && (
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, { width: "100%" }]}>Sin datos</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Solicitudes */}
        <View style={styles.colThird}>
          {data.arbolEfectividad.solicitudes && data.arbolEfectividad.solicitudes.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>TOP SOLICITUDES</Text>

              {/* Grafico Solicitudes */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8, paddingHorizontal: 5 }}>
                 <PdfPieChart data={data.arbolEfectividad.solicitudes.slice(0, 5).map(s => ({ name: s.nombre, value: s.cantidad }))} size={90} />
                 <PdfLegend data={data.arbolEfectividad.solicitudes.slice(0, 5).map(s => ({ name: s.nombre, value: s.cantidad }))} />
              </View>

              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, { width: "60%" }]}>Solicitud</Text>
                  <Text style={[styles.tableHeaderCell, { width: "40%" }]}>Cantidad</Text>
                </View>
                {data.arbolEfectividad.solicitudes.map((s, idx) => (
                  <View key={idx} style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                    <Text style={[styles.tableCellLeft, { width: "60%" }]}>{s.nombre}</Text>
                    <Text style={[styles.tableCell, { width: "40%" }]}>{s.cantidad.toLocaleString()}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>TOP SOLICITUDES</Text>
              <View style={styles.table}>
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, { width: "100%" }]}>Sin datos de solicitudes</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Reportes y arboles de efectividad RRSS</Text>
        <Text style={styles.supportText}>Para soporte escribir a acascantem@netcom.com.pa</Text>
        <Text style={styles.footerText}>Pagina 2</Text>
      </View>
    </Page>
  );
}

// Sub Tramites Page
function SubTramitesPage({ data, macroId }: { data: ProcessedData; macroId: string }) {
  return (
    <Page size="A4" orientation="landscape" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reportes y arboles de efectividad RRSS - DETALLE TECNICO</Text>
        <Text style={styles.headerInfo}>Desglose cualitativo por sub-tramites y temas específicos</Text>
      </View>

      <SectionHeader title="SUB TRAMITES" subtitle="Distribución detallada por temas críticos en los trámites prioritarios" />

      {data.subTramites.map((tramite, idx) => (
        <View key={idx} wrap={false} style={{ marginBottom: 20, borderBottom: 1, borderBottomColor: '#eee', paddingBottom: 10 }}>
           <View style={{ backgroundColor: AZUL_REY, padding: 4, marginBottom: 5 }}>
              <Text style={{ color: WHITE, fontSize: 10, fontWeight: 'bold' }}>Tramite: {tramite.nombre}</Text>
           </View>
           
           <View style={{ flexDirection: 'row', minHeight: 180 }}>
              {/* Tabla Izquierda */}
              <View style={{ width: '40%' }}>
                 <View style={styles.table}>
                    <View style={styles.tableHeader}>
                       <Text style={[styles.tableHeaderCell, { width: '80%', textAlign: 'left', paddingLeft: 5 }]}>Tema / Servicio</Text>
                       <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Cant.</Text>
                    </View>
                    {tramite.temas.slice(0, 15).map((t, i) => (
                       <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
                          <Text style={[styles.tableCellLeft, { width: '80%', fontSize: 5 }]}>{t.tema}</Text>
                          <Text style={[styles.tableCell, { width: '20%', fontSize: 5 }]}>{t.cantidad.toLocaleString()}</Text>
                       </View>
                    ))}
                    <View style={styles.totalRow}>
                       <Text style={[styles.totalCell, { width: '80%', textAlign: 'left', paddingLeft: 5, fontSize: 6 }]}>Subtotal {tramite.nombre}</Text>
                       <Text style={[styles.totalCell, { width: '20%', fontSize: 6 }]}>{tramite.total.toLocaleString()}</Text>
                    </View>
                 </View>
              </View>

              {/* Gráfico Derecha */}
              <View style={{ width: '60%', paddingLeft: 10, flexDirection: 'row', alignItems: 'center' }}>
                 <View style={{ width: 140, height: 140, justifyContent: 'center', alignItems: 'center' }}>
                    <PdfPieChart data={tramite.temas.map(t => ({ name: t.tema, value: t.cantidad }))} size={130} />
                 </View>
                 <PdfLegend data={tramite.temas.map(t => ({ name: t.tema, value: t.cantidad }))} />
              </View>
           </View>
        </View>
      ))}

      {data.subTramites.length === 0 && (
        <View style={styles.section}>
          <Text style={{ textAlign: "center", color: "#666666", marginTop: 20 }}>No hay sub tramites para mostrar</Text>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>Reportes y arboles de efectividad RRSS</Text>
        <Text style={styles.supportText}>Para soporte escribir a acascantem@netcom.com.pa</Text>
        <Text style={styles.footerText}>Pagina 3</Text>
      </View>
    </Page>
  );
}

function ReportDocument({ data, macroId }: { data: ProcessedData; macroId: string }) {
  return (
    <Document>
      <ResumenPage data={data} macroId={macroId} />
      <GraficosPage data={data} macroId={macroId} />
      <SubTramitesPage data={data} macroId={macroId} />
    </Document>
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, macroId }: { data: ProcessedData; macroId: string } = body;

    if (!data) {
      return NextResponse.json({ error: "No hay datos para exportar" }, { status: 400 });
    }

    // eslint-disable-next-line react-hooks/error-boundaries
    const pdfDoc = <ReportDocument data={data} macroId={macroId} />;
    const pdfBuffer = await pdf(pdfDoc).toBuffer();

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Reporte_${macroId}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error exporting PDF:", error);
    return NextResponse.json(
      { error: "Error al exportar PDF" },
      { status: 500 }
    );
  }
}
