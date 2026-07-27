import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FileSpreadsheet,
  FileText,
  Upload,
  Copy,
  Check,
  Download,
  Share2,
  Sparkles,
  ArrowLeft,
  Video,
  Instagram,
  Facebook,
  Mail,
  Target,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import FileUpload from "@/components/FileUpload";
import { readExcelFile, transformExcelData } from "@/lib/excelTransform";
import { extractPdfPages, matchPdfDesignData, PdfPageData, PdfDesignData } from "@/lib/pdfParser";
import {
  buildMergedProducts,
  generateMultichannelCopy,
  exportMarketingGridToExcel,
  ReferenceMultichannelCopy,
  MergedProductData,
} from "@/lib/marketingCopyGenerator";

export default function MarketingPlanner() {
  const [pdfPages, setPdfPages] = useState<PdfPageData[]>([]);
  const [pdfFileName, setPdfFileName] = useState<string>("");
  const [collectionTitle, setCollectionTitle] = useState<string>("");

  const [excelData, setExcelData] = useState<string[][] | null>(null);
  const [excelFileName, setExcelFileName] = useState<string>("");

  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [isLoadingExcel, setIsLoadingExcel] = useState(false);

  const [mergedProducts, setMergedProducts] = useState<MergedProductData[]>([]);
  const [copiesMap, setCopiesMap] = useState<Map<string, ReferenceMultichannelCopy>>(new Map());
  const [selectedRef, setSelectedRef] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // STEP 1: Handle PDF Upload First
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoadingPdf(true);
    try {
      const pages = await extractPdfPages(file);
      setPdfPages(pages);
      setPdfFileName(file.name);

      // Extract collection title / mood concept from PDF pages
      const pdfMapTest = matchPdfDesignData(pages, ["TEST_REF"]);
      const extractedConcept = pdfMapTest.values().next().value?.collectionTitle || "Colección Esenciales & Tendencia Denim";
      setCollectionTitle(extractedConcept);

      // If Excel was already uploaded, re-fuse with new PDF knowledge base
      if (excelData) {
        const refs = Array.from(new Set(excelData.slice(1).map((r) => r[1]).filter(Boolean)));
        const pdfMap = matchPdfDesignData(pages, refs);
        const products = buildMergedProducts(excelData, pdfMap);
        setMergedProducts(products);

        const copies = new Map<string, ReferenceMultichannelCopy>();
        products.forEach((p) => copies.set(p.referencia, generateMultichannelCopy(p)));
        setCopiesMap(copies);

        if (products.length > 0 && !selectedRef) {
          setSelectedRef(products[0].referencia);
        }

        toast.success(`Presentación PDF analizada (${pages.length} páginas). Fusión completada con ${products.length} referencias.`);
      } else {
        toast.success(`PASO 1 COMPLETADO: Presentación PDF "${file.name}" analizada (${pages.length} páginas). Ahora sube el Excel (Paso 2).`);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al leer la presentación PDF de la colección.");
    } finally {
      setIsLoadingPdf(false);
    }
  };

  // STEP 2: Handle Excel Upload Second
  const handleExcelUpload = async (file: File) => {
    if (!pdfPages.length) {
      toast.error("¡Atención! Primero debes subir la presentación PDF de la colección (Paso 1) para analizar el concepto estético.", {
        duration: 5000,
      });
      return;
    }

    setIsLoadingExcel(true);
    try {
      const rawData = await readExcelFile(file);
      const transformed = transformExcelData(rawData);
      setExcelData(transformed);
      setExcelFileName(file.name);

      // Extract unique references from transformed Excel rows
      const refs = Array.from(new Set(transformed.slice(1).map((r) => r[1]).filter(Boolean)));

      // Step 3: Match Excel references with prior PDF knowledge base
      const pdfMap = matchPdfDesignData(pdfPages, refs);
      const products = buildMergedProducts(transformed, pdfMap);
      setMergedProducts(products);

      // Generate multichannel copies derived from PDF-enriched AIDA descriptions
      const copies = new Map<string, ReferenceMultichannelCopy>();
      products.forEach((p) => copies.set(p.referencia, generateMultichannelCopy(p)));
      setCopiesMap(copies);

      if (products.length > 0) {
        setSelectedRef(products[0].referencia);
      }

      toast.success(`PASO 2 COMPLETADO: Base de datos procesada. Se generaron copys multicanal únicos para ${products.length} referencias.`);
    } catch (error) {
      console.error(error);
      toast.error("Error al procesar la base de datos Excel.");
    } finally {
      setIsLoadingExcel(false);
    }
  };

  // Helper for clipboard copying
  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("¡Texto copiado al portapapeles!");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Export full marketing grid
  const handleExportGrid = () => {
    if (!copiesMap.size) {
      toast.error("No hay referencias para exportar.");
      return;
    }
    const copiesList = Array.from(copiesMap.values());
    exportMarketingGridToExcel(copiesList, "Parrilla_Marketing_Multicanal.xlsx");
    toast.success("Descarga de parrilla multicanal iniciada.");
  };

  const filteredProducts = mergedProducts.filter((p) =>
    p.referencia.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCopy = selectedRef ? copiesMap.get(selectedRef) : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
              <Link to="/" className="hover:underline flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" /> Inicio
              </Link>
              <span>/</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">Generador de Marketing</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Generador Multicanal de Comunicación Paso a Paso
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Proceso guiado: 1º Lectura del PDF de la Colección ➔ 2º Ingesta de Base de Datos Excel ➔ 3º Estrategia Multicanal.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/">
              <Button variant="outline" size="sm" className="gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Matriz HGI
              </Button>
            </Link>
            <Link to="/shopify">
              <Button variant="outline" size="sm" className="gap-2">
                <Share2 className="w-4 h-4 text-emerald-500" /> Crear Shopify
              </Button>
            </Link>
          </div>
        </header>

        {/* Step-by-Step Flow Instructions Banner */}
        {!pdfPages.length && (
          <div className="p-4 bg-indigo-50 border border-indigo-200 dark:bg-indigo-950/60 dark:border-indigo-900 rounded-lg flex items-start gap-3 text-indigo-900 dark:text-indigo-200 text-xs">
            <AlertCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block text-sm mb-0.5">Flujo Requerido: Lectura Previa del PDF</strong>
              Para garantizar que los textos de TikTok, Instagram, Facebook, Email y Ads tengan verdadera armonía con el concepto estético, <strong>debes subir primero el PDF de la presentación de la colección (Paso 1)</strong>. Una vez aprendido el PDF, subes la base de datos Excel (Paso 2).
            </div>
          </div>
        )}

        {/* Sequential Upload Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* STEP 1 CARD: PDF Presentation (REQUIRED FIRST) */}
          <Card className={`border-2 transition shadow-sm ${pdfPages.length ? "border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20" : "border-indigo-400 dark:border-indigo-800"}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                  <FileText className="w-5 h-5 text-indigo-600" /> PASO 1: Presentación PDF (Obligatorio Primero)
                </CardTitle>
                {pdfPages.length > 0 ? (
                  <Badge className="bg-indigo-600 text-white">Completado</Badge>
                ) : (
                  <Badge variant="outline" className="border-indigo-400 text-indigo-600">Requerido 1º</Badge>
                )}
              </div>
              <CardDescription className="text-xs">
                Sube el PDF con conceptos de colección, moodboard, roturas y notas de diseño.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="border-2 border-dashed border-indigo-300 dark:border-indigo-800 rounded-lg p-6 text-center hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 transition cursor-pointer relative">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfUpload}
                  disabled={isLoadingPdf}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                {isLoadingPdf ? (
                  <div className="flex flex-col items-center gap-2 text-indigo-600">
                    <RefreshCw className="w-8 h-8 animate-spin" />
                    <span className="text-xs font-medium">Leyendo y analizando PDF de la colección…</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Upload className="w-8 h-8 text-indigo-500" />
                    <span className="text-xs font-medium">
                      {pdfPages.length ? "Subir o reemplazar Presentación PDF de Diseño" : "Haz clic o arrastra aquí la presentación PDF de la colección"}
                    </span>
                    <span className="text-[11px] text-slate-400">Archivo PDF (.pdf)</span>
                  </div>
                )}
              </div>

              {pdfFileName && (
                <div className="text-xs space-y-2 text-indigo-900 dark:text-indigo-200 bg-indigo-50 dark:bg-indigo-950 p-3 rounded border border-indigo-200 dark:border-indigo-900">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600" /> {pdfFileName}
                    </span>
                    <Badge variant="secondary" className="text-[10px]">{pdfPages.length} páginas leídas</Badge>
                  </div>
                  {collectionTitle && (
                    <div className="text-[11px] text-indigo-700 dark:text-indigo-300 bg-indigo-100/60 dark:bg-indigo-900/60 p-2 rounded">
                      <strong>Concepto Extraído:</strong> "{collectionTitle}"
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* STEP 2 CARD: Excel Database (UNLOCKS AFTER STEP 1) */}
          <Card className={`border-2 transition shadow-sm ${!pdfPages.length ? "opacity-60 border-slate-300 dark:border-slate-800" : excelFileName ? "border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20" : "border-emerald-400 dark:border-emerald-800"}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" /> PASO 2: Base de Datos Excel
                </CardTitle>
                {excelFileName ? (
                  <Badge className="bg-emerald-600 text-white">Completado</Badge>
                ) : pdfPages.length ? (
                  <Badge variant="outline" className="border-emerald-400 text-emerald-600">Listo para subir 2º</Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px]">Bloqueado (Sube PDF primero)</Badge>
                )}
              </div>
              <CardDescription className="text-xs">
                Sube el archivo Excel con las referencias, tallas, colores y nombres.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload
                onFileSelect={handleExcelUpload}
                isLoading={isLoadingExcel}
                acceptedFormats=".xlsx, .xls, .csv"
              />
              {excelFileName && (
                <div className="mt-3 text-xs flex items-center justify-between text-emerald-700 bg-emerald-50 p-2.5 rounded border border-emerald-200 dark:bg-emerald-950 dark:border-emerald-900 dark:text-emerald-300">
                  <span className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {excelFileName}
                  </span>
                  <Badge variant="outline">{mergedProducts.length} referencias fusionadas</Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Section */}
        {mergedProducts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-4">
            {/* Reference Sidebar */}
            <div className="md:col-span-4 space-y-4">
              <Card className="border-slate-200 dark:border-slate-800">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">Referencias ({filteredProducts.length})</CardTitle>
                    <Button onClick={handleExportGrid} size="sm" className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                      <Download className="w-3.5 h-3.5" /> Exportar Excel
                    </Button>
                  </div>
                  <div className="relative mt-2">
                    <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
                    <Input
                      placeholder="Buscar por referencia o nombre…"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 h-9 text-xs"
                    />
                  </div>
                </CardHeader>
                <CardContent className="max-h-[500px] overflow-y-auto space-y-1 pr-1">
                  {filteredProducts.map((p) => {
                    const isSelected = p.referencia === selectedRef;
                    return (
                      <button
                        key={p.referencia}
                        onClick={() => setSelectedRef(p.referencia)}
                        className={`w-full text-left p-2.5 rounded-lg text-xs transition flex items-center justify-between border ${
                          isSelected
                            ? "bg-indigo-50 border-indigo-300 text-indigo-900 font-semibold dark:bg-indigo-950 dark:border-indigo-800 dark:text-indigo-200"
                            : "hover:bg-slate-100 border-transparent text-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
                        }`}
                      >
                        <div className="truncate pr-2">
                          <span className="block font-medium">{p.referencia}</span>
                          <span className="block text-[11px] text-slate-500 truncate">{p.nombre}</span>
                        </div>
                        {p.pdfDesign && (
                          <Badge variant="secondary" className="text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                            PDF
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Content Tabs Area */}
            <div className="md:col-span-8">
              {activeCopy ? (
                <div className="space-y-4">
                  {/* Reference Summary Header */}
                  <Card className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white border-none shadow-md">
                    <CardContent className="p-5 space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-2xl font-bold tracking-tight text-white">{activeCopy.referencia}</h2>
                          <Badge className="bg-indigo-500/30 text-indigo-200 border-indigo-400/40">
                            {activeCopy.productData.nombre}
                          </Badge>
                          <Badge variant="outline" className="text-[11px] border-amber-400/60 text-amber-300 bg-amber-950/40">
                            Arquetipo: {activeCopy.productData.aida.archetype}
                          </Badge>
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => copyToClipboard(JSON.stringify(activeCopy, null, 2), "all")}
                          className="gap-1 text-xs"
                        >
                          {copiedKey === "all" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          Copiar Estrategia Completa
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-indigo-100/80 pt-2 border-t border-indigo-900/60">
                        <div><strong className="text-white">Composición:</strong> {activeCopy.productData.composicion}</div>
                        <div><strong className="text-white">Colores:</strong> {activeCopy.productData.colores.join(", ") || "Varios"}</div>
                        <div><strong className="text-white">Tallas:</strong> {activeCopy.productData.tallas.join(" - ") || "Estándar"}</div>
                      </div>

                      {activeCopy.productData.pdfDesign && (
                        <div className="text-xs bg-indigo-900/40 p-3 rounded border border-indigo-700/50 text-indigo-200 mt-2 space-y-1.5">
                          <div className="flex items-center justify-between font-semibold text-indigo-100">
                            <span>🎨 Concepto PDF: {activeCopy.productData.pdfDesign.collectionTitle}</span>
                            {activeCopy.productData.pdfDesign.pageNumber && (
                              <Badge variant="outline" className="text-[10px] border-indigo-400 text-indigo-200">
                                Diapositiva {activeCopy.productData.pdfDesign.pageNumber}
                              </Badge>
                            )}
                          </div>
                          <div><strong>Inspiración de Diseño:</strong> "{activeCopy.productData.pdfDesign.designNotes}"</div>
                          <div><strong>Ocasión de Uso:</strong> {activeCopy.productData.pdfDesign.occasion}</div>
                          <div><strong>Atributos & Lavado:</strong> {activeCopy.productData.pdfDesign.details.join(" • ")} ({activeCopy.productData.pdfDesign.washOrFabricNotes})</div>
                          <div><strong>Styling Recomendado:</strong> {activeCopy.productData.pdfDesign.styling}</div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Channel Tabs */}
                  <Tabs defaultValue="shopify-aida" className="w-full">
                    <TabsList className="grid grid-cols-6 w-full bg-slate-200 dark:bg-slate-900">
                      <TabsTrigger value="shopify-aida" className="text-xs flex items-center gap-1.5 font-semibold">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Shopify (AIDA)
                      </TabsTrigger>
                      <TabsTrigger value="tiktok" className="text-xs flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5 text-pink-500" /> TikTok
                      </TabsTrigger>
                      <TabsTrigger value="instagram" className="text-xs flex items-center gap-1.5">
                        <Instagram className="w-3.5 h-3.5 text-purple-500" /> Instagram
                      </TabsTrigger>
                      <TabsTrigger value="facebook" className="text-xs flex items-center gap-1.5">
                        <Facebook className="w-3.5 h-3.5 text-blue-600" /> Facebook
                      </TabsTrigger>
                      <TabsTrigger value="email" className="text-xs flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-amber-500" /> Email
                      </TabsTrigger>
                      <TabsTrigger value="ads" className="text-xs flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-rose-500" /> Ads Digitales
                      </TabsTrigger>
                    </TabsList>

                    {/* Tab 0: Shopify AIDA Core Description */}
                    <TabsContent value="shopify-aida" className="space-y-4 pt-3">
                      <Card className="border-emerald-200 dark:border-emerald-900 shadow-sm">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                                <Sparkles className="w-4 h-4" /> Descripción AIDA Central para Shopify (Origen Unificado)
                              </CardTitle>
                              <CardDescription className="text-xs">
                                Esta es la descripción única del producto derivada del conocimiento del PDF. Todos los demás canales de comunicación se derivan de este texto.
                              </CardDescription>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(activeCopy.productData.aida.fullText, "aida-text")}
                              className="h-7 text-xs gap-1 border-emerald-300 text-emerald-800 dark:text-emerald-300"
                            >
                              {copiedKey === "aida-text" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} Copiar AIDA
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2 text-xs">
                            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 rounded">
                              <span className="font-bold text-indigo-700 dark:text-indigo-300 block mb-1">1. Atención (Hook Inicial):</span>
                              <p className="text-slate-800 dark:text-slate-200">{activeCopy.productData.aida.atencion}</p>
                            </div>
                            <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900 rounded">
                              <span className="font-bold text-purple-700 dark:text-purple-300 block mb-1">2. Interés (Tela, Confección & PDF):</span>
                              <p className="text-slate-800 dark:text-slate-200">{activeCopy.productData.aida.interes}</p>
                            </div>
                            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded">
                              <span className="font-bold text-amber-700 dark:text-amber-300 block mb-1">3. Deseo (Styling, Horma & Ocasión):</span>
                              <p className="text-slate-800 dark:text-slate-200">{activeCopy.productData.aida.deseo}</p>
                            </div>
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded">
                              <span className="font-bold text-emerald-700 dark:text-emerald-300 block mb-1">4. Acción (Llamado a la Compra):</span>
                              <p className="text-slate-800 dark:text-slate-200">{activeCopy.productData.aida.accion}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* Tab 1: TikTok & Reels */}
                    <TabsContent value="tiktok" className="space-y-4 pt-3">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-pink-500" /> Ganchos Cortos de 3 Segundos (Basados en AIDA)
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {activeCopy.tikTok.hooks.map((hook, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 text-xs">
                              <span className="font-medium text-slate-800 dark:text-slate-200">{hook}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(hook, `hook-${idx}`)}
                                className="h-7 text-xs gap-1"
                              >
                                {copiedKey === `hook-${idx}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} Copiar
                              </Button>
                            </div>
                          ))}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-semibold">Estructura Cronometrada del Video (15s)</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-xs">
                          <div className="p-2.5 bg-pink-50 dark:bg-pink-950/40 border border-pink-200 dark:border-pink-900 rounded">
                            <strong className="text-pink-700 dark:text-pink-300">0 - 3s (Gancho Visual):</strong> {activeCopy.tikTok.videoStructure.hookTime}
                          </div>
                          <div className="p-2.5 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900 rounded">
                            <strong className="text-purple-700 dark:text-purple-300">3 - 10s (Detalle & Tela):</strong> {activeCopy.tikTok.videoStructure.detailTime}
                          </div>
                          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 rounded">
                            <strong className="text-indigo-700 dark:text-indigo-300">10 - 15s (Llamado a la Acción):</strong> {activeCopy.tikTok.videoStructure.ctaTime}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-semibold">Hashtags Recomendados</CardTitle>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(activeCopy.tikTok.hashtags.join(" "), "hashtags")}
                              className="h-7 text-xs gap-1"
                            >
                              {copiedKey === "hashtags" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} Copiar Todos
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-1.5">
                            {activeCopy.tikTok.hashtags.map((tag, i) => (
                              <Badge key={i} variant="secondary" className="text-xs bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* Tab 2: Instagram */}
                    <TabsContent value="instagram" className="space-y-4 pt-3">
                      <Card>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-semibold">Caption Principal (Post)</CardTitle>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(activeCopy.instagram.mainCaption, "ig-caption")}
                              className="h-7 text-xs gap-1"
                            >
                              {copiedKey === "ig-caption" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} Copiar Caption
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <pre className="whitespace-pre-wrap font-sans text-xs bg-slate-50 dark:bg-slate-900 p-3 rounded border border-slate-200 dark:border-slate-800 leading-relaxed">
                            {activeCopy.instagram.mainCaption}
                          </pre>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-semibold">Estructura de Carrusel (4 Láminas)</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {activeCopy.instagram.carouselSlides.map((slide) => (
                            <div key={slide.slideNumber} className="p-3 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 space-y-1 text-xs">
                              <span className="font-semibold text-purple-600 dark:text-purple-400">{slide.title}</span>
                              <p className="text-slate-600 dark:text-slate-300 leading-normal whitespace-pre-wrap">{slide.content}</p>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* Tab 3: Facebook */}
                    <TabsContent value="facebook" className="space-y-4 pt-3">
                      <Card>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-semibold">Copy Conversacional y Estilo de Vida</CardTitle>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(activeCopy.facebook.conversationalCopy, "fb-copy")}
                              className="h-7 text-xs gap-1"
                            >
                              {copiedKey === "fb-copy" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} Copiar Copy
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <pre className="whitespace-pre-wrap font-sans text-xs bg-slate-50 dark:bg-slate-900 p-3 rounded border border-slate-200 dark:border-slate-800 leading-relaxed">
                            {activeCopy.facebook.conversationalCopy}
                          </pre>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* Tab 4: Email Marketing */}
                    <TabsContent value="email" className="space-y-4 pt-3">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-semibold">Líneas de Asunto (CTR)</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {activeCopy.email.subjectLines.map((subject, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 text-xs">
                              <span className="font-medium text-slate-800 dark:text-slate-200">📧 {subject}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(subject, `subj-${idx}`)}
                                className="h-7 text-xs gap-1"
                              >
                                {copiedKey === `subj-${idx}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} Copiar
                              </Button>
                            </div>
                          ))}
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-semibold">Cuerpo del Mensaje (Formato AIDA)</CardTitle>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(activeCopy.email.emailBodyText, "email-body")}
                              className="h-7 text-xs gap-1"
                            >
                              {copiedKey === "email-body" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} Copiar Texto
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <pre className="whitespace-pre-wrap font-sans text-xs bg-slate-50 dark:bg-slate-900 p-3 rounded border border-slate-200 dark:border-slate-800 leading-relaxed">
                            {activeCopy.email.emailBodyText}
                          </pre>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    {/* Tab 5: Ads Digitales */}
                    <TabsContent value="ads" className="space-y-4 pt-3">
                      <Card>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-semibold">Titular del Anuncio (Headline)</CardTitle>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(activeCopy.ads.headline, "ads-hl")}
                              className="h-7 text-xs gap-1"
                            >
                              {copiedKey === "ads-hl" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} Copiar
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 p-2.5 rounded border border-rose-200 dark:border-rose-900">
                            {activeCopy.ads.headline}
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-semibold">Texto Primario (Primary Text)</CardTitle>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(activeCopy.ads.primaryText, "ads-prim")}
                              className="h-7 text-xs gap-1"
                            >
                              {copiedKey === "ads-prim" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} Copiar
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-xs bg-slate-50 dark:bg-slate-900 p-3 rounded border border-slate-200 dark:border-slate-800 leading-relaxed font-medium">
                            {activeCopy.ads.primaryText}
                          </p>
                        </CardContent>
                      </Card>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Card className="border-rose-200 dark:border-rose-900">
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-xs font-semibold text-rose-700 dark:text-rose-300">
                                {activeCopy.ads.angleA.title}
                              </CardTitle>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(activeCopy.ads.angleA.text, "ads-angA")}
                                className="h-6 text-[11px] gap-1"
                              >
                                {copiedKey === "ads-angA" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} Copiar
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-normal">
                              {activeCopy.ads.angleA.text}
                            </p>
                          </CardContent>
                        </Card>

                        <Card className="border-indigo-200 dark:border-indigo-900">
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                                {activeCopy.ads.angleB.title}
                              </CardTitle>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(activeCopy.ads.angleB.text, "ads-angB")}
                                className="h-6 text-[11px] gap-1"
                              >
                                {copiedKey === "ads-angB" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} Copiar
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-normal">
                              {activeCopy.ads.angleB.text}
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              ) : (
                <Card className="border-dashed border-2 p-12 text-center text-slate-400">
                  <p>Selecciona una referencia de la izquierda para ver su estrategia y copys multicanal.</p>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
