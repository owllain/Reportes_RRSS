"use client";

import { useState, useCallback, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Label,
  Legend,
} from "recharts";
import {
  FileSpreadsheet,
  Upload,
  Play,
  MessageCircle,
  Instagram,
  Send,
  Facebook,
  MessageSquare,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  BarChart3,
  Table2,
  LayoutGrid,
  Download,
} from "lucide-react";

// Types
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

interface MacroConfig {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
}

const MACROS: MacroConfig[] = [
  {
    id: "chat",
    name: "Chat",
    icon: <MessageCircle className="w-5 h-5" />,
    color: "text-sky-600",
    gradient: "from-sky-500 to-sky-600",
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: <Instagram className="w-5 h-5" />,
    color: "text-pink-500",
    gradient: "from-pink-500 via-purple-500 to-orange-400",
  },
  {
    id: "telegram",
    name: "Telegram",
    icon: <Send className="w-5 h-5" />,
    color: "text-cyan-500",
    gradient: "from-cyan-400 to-blue-500",
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: <Facebook className="w-5 h-5" />,
    color: "text-blue-600",
    gradient: "from-blue-600 to-blue-700",
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    icon: <MessageSquare className="w-5 h-5" />,
    color: "text-green-500",
    gradient: "from-green-500 to-green-600",
  },
];

// Corporate Color Palette
const CORPORATE_COLORS = {
  primary: "#0D4F8B",
  secondary: "#1E88E5",
  accent: "#00BFA5",
  highlight: "#FF6D00",
  dark: "#0A3D6B",
};

const CHART_COLORS = [
  CORPORATE_COLORS.primary,
  CORPORATE_COLORS.highlight,
  CORPORATE_COLORS.accent,
  CORPORATE_COLORS.secondary,
  "#7B1FA2",
  "#C2185B",
  "#00796B",
  "#F9A825",
];

export default function ExcelMacroRunner() {
  const [selectedMacro, setSelectedMacro] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [activeTab, setActiveTab] = useState("resumen");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setProcessedData(null);
      setError(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith(".xlsx")) {
      setFile(droppedFile);
      setProcessedData(null);
      setError(null);
    }
  }, []);

  const processMacro = useCallback(async () => {
    if (!file || !selectedMacro) return;

    setIsProcessing(true);
    setProgress(0);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("macroId", selectedMacro);

    try {
      setProgress(20);
      
      const response = await fetch("/api/process-macro", {
        method: "POST",
        body: formData,
      });

      setProgress(60);

      if (!response.ok) {
        throw new Error("Error al procesar el archivo");
      }

      const data = await response.json();
      setProgress(90);

      setProcessedData(data);
      setProgress(100);
      setActiveTab("resumen");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsProcessing(false);
    }
  }, [file, selectedMacro]);

  const exportToPDF = useCallback(async () => {
    if (!processedData || !selectedMacro) return;
    
    try {
      const response = await fetch("/api/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: processedData, macroId: selectedMacro }),
      });
      
      if (!response.ok) throw new Error("Error al exportar PDF");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Reporte_${selectedMacro}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Error exporting PDF:", err);
    }
  }, [processedData, selectedMacro]);

  const selectedMacroConfig = MACROS.find((m) => m.id === selectedMacro);

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: {
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    percent: number;
  }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    if (percent < 0.05) return null;
    
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="bold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b-2 border-slate-200 shadow-sm">
        <div className="px-6 py-3 flex items-center gap-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-[#0D4F8B] to-[#1E88E5]">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">Macro Runner Pro</h1>
              <p className="text-xs text-slate-500">Procesador de Reportes por Canal</p>
            </div>
          </div>
          
          {/* Export PDF button */}
          {processedData && (
            <div className="ml-auto flex items-center gap-2">
              <Button
                size="sm"
                onClick={exportToPDF}
                className="gap-2 bg-gradient-to-r from-[#00BFA5] to-[#00897B] hover:opacity-90 text-white shadow-md"
              >
                <Download className="w-4 h-4" />
                Exportar PDF
              </Button>
            </div>
          )}
        </div>
        
        {/* Toolbar */}
        <div className="px-6 py-2.5 flex items-center gap-3 bg-slate-50/80">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-slate-200 shadow-sm">
            <FileText className="w-4 h-4 text-slate-500" />
            <span className="text-sm text-slate-600 font-medium">Archivo:</span>
            {file ? (
              <Badge className="bg-[#00BFA5]/10 text-[#00BFA5] border-[#00BFA5]/20 font-medium">
                {file.name}
              </Badge>
            ) : (
              <span className="text-sm text-slate-400 italic">Sin seleccionar</span>
            )}
          </div>
          
          <div className="h-8 w-px bg-slate-200" />
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="gap-2 border-slate-300 hover:border-[#0D4F8B] hover:text-[#0D4F8B]"
          >
            <Upload className="w-4 h-4" />
            Cargar Excel
          </Button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
          
          <div className="h-8 w-px bg-slate-200" />
          
          <Button
            size="sm"
            onClick={processMacro}
            disabled={!file || !selectedMacro || isProcessing}
            className={`gap-2 bg-gradient-to-r ${selectedMacroConfig?.gradient || "from-slate-500 to-slate-600"} hover:opacity-90 shadow-md text-white`}
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Ejecutar Macro
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-6 gap-5">
        {/* Macro Selector */}
        <section>
          <h2 className="text-sm font-semibold text-slate-600 mb-3 flex items-center gap-2 px-1">
            <LayoutGrid className="w-4 h-4 text-[#0D4F8B]" />
            Seleccionar Macro a Ejecutar
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {MACROS.map((macro) => (
              <Card
                key={macro.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
                  selectedMacro === macro.id
                    ? "border-[#0D4F8B] shadow-lg ring-2 ring-[#0D4F8B]/20"
                    : "border-slate-200 hover:border-slate-300"
                }`}
                onClick={() => setSelectedMacro(macro.id)}
              >
                <CardContent className="p-5 flex flex-col items-center gap-3">
                  <div className={`p-4 rounded-xl bg-gradient-to-br ${macro.gradient} text-white shadow-md`}>
                    {macro.icon}
                  </div>
                  <span className={`font-semibold ${macro.color}`}>{macro.name}</span>
                  {selectedMacro === macro.id && (
                    <CheckCircle2 className="w-5 h-5 text-[#00BFA5]" />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Progress */}
        {isProcessing && (
          <Card className="bg-white border-slate-200 shadow-md">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <Loader2 className="w-6 h-6 animate-spin text-[#0D4F8B]" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">
                    Procesando macro {selectedMacroConfig?.name}...
                  </p>
                  <Progress value={progress} className="mt-2 h-2 bg-slate-100" />
                </div>
                <span className="text-sm font-medium text-[#0D4F8B]">{progress}%</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {error && (
          <Card className="bg-red-50 border-red-300 shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-700 font-medium">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Drop Zone */}
        {!file && (
          <Card
            className="border-2 border-dashed border-slate-300 bg-gradient-to-br from-white to-slate-50/50 flex-1 flex items-center justify-center min-h-[220px] cursor-pointer hover:border-[#0D4F8B] hover:bg-gradient-to-br hover:from-blue-50/50 hover:to-white transition-all duration-300"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
          >
            <CardContent className="flex flex-col items-center gap-4 p-10">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0D4F8B]/10 to-[#00BFA5]/10">
                <Upload className="w-12 h-12 text-[#0D4F8B]" />
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-slate-700">
                  Arrastra tu archivo Excel aqui
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  o haz clic para seleccionar (.xlsx)
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {processedData && (
          <Card className="flex-1 bg-white shadow-xl border-slate-200">
            <CardHeader className="bg-gradient-to-r from-[#0D4F8B] to-[#0A3D6B] text-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-lg">
                  {selectedMacroConfig?.icon}
                  Reporte {selectedMacroConfig?.name}
                </CardTitle>
                <Badge className="bg-[#00BFA5] text-white font-semibold px-3 py-1">
                  {processedData.resumen.total.toLocaleString()} registros procesados
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full justify-start rounded-none border-b-2 bg-slate-50 h-12 px-4">
                  <TabsTrigger 
                    value="resumen" 
                    className="gap-2 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-[#0D4F8B] data-[state=active]:text-[#0D4F8B]"
                  >
                    <FileText className="w-4 h-4" />
                    Resumen
                  </TabsTrigger>
                  <TabsTrigger 
                    value="arbol" 
                    className="gap-2 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-[#0D4F8B] data-[state=active]:text-[#0D4F8B]"
                  >
                    <BarChart3 className="w-4 h-4" />
                    Arbol Efectividad
                  </TabsTrigger>
                  <TabsTrigger 
                    value="subtramites" 
                    className="gap-2 data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-[#0D4F8B] data-[state=active]:text-[#0D4F8B]"
                  >
                    <Table2 className="w-4 h-4" />
                    Sub Tramites
                  </TabsTrigger>
                </TabsList>

                {/* Resumen Tab */}
                <TabsContent value="resumen" className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <div className="text-sm font-bold text-white mb-0 px-4 py-2.5 bg-gradient-to-r from-[#0D4F8B] to-[#0A3D6B] rounded-t-lg">
                        DATOS GENERALES TIPIFICACION
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-[#FF6D00] hover:bg-[#FF6D00]">
                            <TableHead className="text-white font-semibold">Categoria</TableHead>
                            <TableHead className="text-white font-semibold text-center">Cantidad</TableHead>
                            <TableHead className="text-white font-semibold text-center">Porcentaje</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {processedData.resumen.categorias.map((cat, idx) => (
                            <TableRow key={idx} className="hover:bg-slate-50 border-b border-slate-100">
                              <TableCell className="font-medium text-slate-700">{cat.nombre}</TableCell>
                              <TableCell className="text-center font-semibold text-slate-600">{cat.cantidad.toLocaleString()}</TableCell>
                              <TableCell className="text-center">
                                <Badge variant="secondary" className="bg-[#0D4F8B]/10 text-[#0D4F8B] font-semibold">
                                  {(cat.porcentaje * 100).toFixed(1)}%
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-[#0D4F8B] hover:bg-[#0D4F8B]">
                            <TableCell className="text-white font-bold">TOTAL REGISTROS</TableCell>
                            <TableCell className="text-white font-bold text-center bg-[#FF6D00]">
                              {processedData.resumen.total.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-white font-bold text-center">100%</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                    
                    {/* Pie Chart */}
                    <Card className="shadow-md border-slate-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-slate-700 text-center">
                          Distribucion por Categoria
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={280}>
                          <PieChart>
                            <Pie
                              data={processedData.resumen.categorias.map(c => ({ name: c.nombre, value: c.cantidad }))}
                              cx="50%"
                              cy="50%"
                              outerRadius={100}
                              dataKey="value"
                              labelLine={false}
                              label={renderCustomLabel}
                            >
                              {processedData.resumen.categorias.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="white" strokeWidth={2} />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value: number) => value.toLocaleString()}
                              contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                            />
                            <Legend verticalAlign="bottom" height={36} />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Arbol Efectividad Tab */}
                <TabsContent value="arbol" className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Tabla de Señales */}
                    <div className="lg:row-span-2">
                      <div className="text-sm font-bold text-white mb-0 px-4 py-2.5 bg-gradient-to-r from-[#0D4F8B] to-[#0A3D6B] rounded-t-lg">
                        DETALLE DE TIPIFICACION {selectedMacroConfig?.name?.toUpperCase()}
                      </div>
                      <div className="max-h-[500px] overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-[#FF6D00] hover:bg-[#FF6D00] sticky top-0">
                              <TableHead className="text-white font-semibold">Senal</TableHead>
                              <TableHead className="text-white font-semibold text-center">Cantidad</TableHead>
                              <TableHead className="text-white font-semibold text-center">%</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {processedData.arbolEfectividad.señales.slice(0, 12).map((s, idx) => (
                              <TableRow key={idx} className="hover:bg-slate-50 border-b border-slate-100">
                                <TableCell className="font-medium text-slate-700">{s.nombre}</TableCell>
                                <TableCell className="text-center font-semibold text-slate-600">{s.cantidad.toLocaleString()}</TableCell>
                                <TableCell className="text-center">{(s.porcentaje * 100).toFixed(1)}%</TableCell>
                              </TableRow>
                            ))}
                            <TableRow className="bg-[#0D4F8B] hover:bg-[#0D4F8B] sticky bottom-0">
                              <TableCell className="text-white font-bold">TOTALES</TableCell>
                              <TableCell className="text-white font-bold text-center">
                                {processedData.resumen.total.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-white font-bold text-center">100%</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    {/* Top Tramites */}
                    {processedData.arbolEfectividad.topTramites.length > 0 && (
                      <Card className="shadow-md border-slate-200">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-semibold text-slate-700">Top Tramites</CardTitle>
                        </CardHeader>
                        <CardContent className="h-52">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={processedData.arbolEfectividad.topTramites} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                              <XAxis dataKey="nombre" tick={{ fontSize: 9, fill: '#475569' }} angle={-20} textAnchor="end" height={50} />
                              <YAxis tick={{ fontSize: 10, fill: '#475569' }} />
                              <Tooltip formatter={(value: number) => [value.toLocaleString(), 'Cantidad']} contentStyle={{ borderRadius: '8px' }} />
                              <Bar dataKey="cantidad" fill={CORPORATE_COLORS.highlight} radius={[4, 4, 0, 0]}>
                                <Label dataKey="cantidad" position="top" fontSize={10} fill="#37474F" fontWeight="bold" />
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    )}

                    {/* Interacciones por Dia */}
                    <Card className="shadow-md border-slate-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-slate-700">Interacciones por Dia</CardTitle>
                      </CardHeader>
                      <CardContent className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={processedData.arbolEfectividad.interaccionesDia} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="dia" tick={{ fontSize: 10, fill: '#475569' }} />
                            <YAxis tick={{ fontSize: 10, fill: '#475569' }} />
                            <Tooltip formatter={(value: number) => [value.toLocaleString(), 'Cantidad']} contentStyle={{ borderRadius: '8px' }} />
                            <Bar dataKey="cantidad" fill={CORPORATE_COLORS.primary} radius={[4, 4, 0, 0]}>
                              <Label dataKey="cantidad" position="top" fontSize={10} fill="#37474F" fontWeight="bold" />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Horas Prime */}
                    {processedData.arbolEfectividad.horasPrime.length > 0 && (
                      <Card className="shadow-md border-slate-200">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-semibold text-slate-700">Horas Prime (Top 10)</CardTitle>
                        </CardHeader>
                        <CardContent className="h-52">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart 
                              data={processedData.arbolEfectividad.horasPrime.slice(0, 10)} 
                              layout="vertical" 
                              margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                              <XAxis type="number" tick={{ fontSize: 10, fill: '#475569' }} />
                              <YAxis dataKey="hora" type="category" width={50} tick={{ fontSize: 10, fill: '#475569' }} />
                              <Tooltip formatter={(value: number) => [value.toLocaleString(), 'Cantidad']} contentStyle={{ borderRadius: '8px' }} />
                              <Bar dataKey="cantidad" fill={CORPORATE_COLORS.accent} radius={[0, 4, 4, 0]}>
                                <Label dataKey="cantidad" position="right" fontSize={10} fill="#37474F" fontWeight="bold" />
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    )}

                    {/* Calificacion */}
                    {processedData.arbolEfectividad.calificacion.length > 0 && (
                      <Card className="shadow-md border-slate-200">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-semibold text-slate-700">Calificacion de Servicio</CardTitle>
                        </CardHeader>
                        <CardContent className="h-52">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={processedData.arbolEfectividad.calificacion} margin={{ top: 20, right: 10, left: 0, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                              <XAxis dataKey="nombre" tick={{ fontSize: 10, fill: '#475569' }} />
                              <YAxis tick={{ fontSize: 10, fill: '#475569' }} />
                              <Tooltip formatter={(value: number) => [value.toLocaleString(), 'Cantidad']} contentStyle={{ borderRadius: '8px' }} />
                              <Bar dataKey="cantidad" fill={CORPORATE_COLORS.highlight} radius={[4, 4, 0, 0]}>
                                <Label dataKey="cantidad" position="top" fontSize={10} fill="#37474F" fontWeight="bold" />
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    )}

                    {/* Solicitudes */}
                    {processedData.arbolEfectividad.solicitudes && processedData.arbolEfectividad.solicitudes.length > 0 && (
                      <Card className="shadow-md border-slate-200">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-semibold text-slate-700">Top Solicitudes</CardTitle>
                        </CardHeader>
                        <CardContent className="h-60">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={processedData.arbolEfectividad.solicitudes}
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                dataKey="cantidad"
                                nameKey="nombre"
                                labelLine={true}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              >
                                {processedData.arbolEfectividad.solicitudes.map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="white" strokeWidth={2} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value: number) => value.toLocaleString()} contentStyle={{ borderRadius: '8px' }} />
                              <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>

                {/* Sub Tramites Tab */}
                <TabsContent value="subtramites" className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {processedData.subTramites.map((tramite, idx) => (
                      <Card key={idx} className="shadow-md border-slate-200 overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-[#0D4F8B] to-[#0A3D6B] text-white py-3">
                          <CardTitle className="text-sm flex justify-between items-center">
                            <span className="font-semibold">Tramite</span>
                            <Badge className="bg-[#FF6D00] text-white">{tramite.nombre}</Badge>
                          </CardTitle>
                        </CardHeader>
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-[#FF6D00] hover:bg-[#FF6D00]">
                              <TableHead className="text-white font-semibold">Tema</TableHead>
                              <TableHead className="text-white font-semibold text-center">Cantidad</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {tramite.temas.slice(0, 5).map((t, i) => (
                              <TableRow key={i} className="hover:bg-slate-50 border-b border-slate-100">
                                <TableCell className="text-slate-700">{t.tema}</TableCell>
                                <TableCell className="text-center font-semibold text-slate-600">{t.cantidad.toLocaleString()}</TableCell>
                              </TableRow>
                            ))}
                            <TableRow className="bg-[#FF6D00] hover:bg-[#FF6D00]">
                              <TableCell className="text-white font-bold">Total General</TableCell>
                              <TableCell className="text-white font-bold text-center bg-[#0D4F8B]">
                                {tramite.total.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                        
                        {/* Pie Chart with visible labels */}
                        <CardContent className="p-4 bg-slate-50">
                          <ResponsiveContainer width="100%" height={180}>
                            <PieChart>
                              <Pie
                                data={tramite.temas.slice(0, 5).map(t => ({ name: t.tema, value: t.cantidad }))}
                                cx="50%"
                                cy="50%"
                                outerRadius={60}
                                dataKey="value"
                                labelLine={true}
                                label={({ name, percent }) => percent > 0.1 ? `${(percent * 100).toFixed(0)}%` : ''}
                              >
                                {tramite.temas.slice(0, 5).map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="white" strokeWidth={2} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value: number) => value.toLocaleString()} contentStyle={{ borderRadius: '8px' }} />
                              <Legend verticalAlign="bottom" height={36} formatter={(value: string) => value.length > 15 ? value.substring(0, 15) + '...' : value} />
                            </PieChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-[#0D4F8B] to-[#0A3D6B] text-white py-4 px-6 mt-auto">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Macro Runner Pro</span>
          <span className="text-blue-200">Procesamiento de Reportes Excel</span>
        </div>
      </footer>
    </div>
  );
}
