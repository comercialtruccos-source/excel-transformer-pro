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
  const [excelData, setExcelData] = useState<string[][] | null>(null);
  const [pdfPages, setPdfPages] = useState<PdfPageData[]>([]);
  const [pdfFileName, setPdfFileName] = useState<string>("");
  const [excelFileName, setExcelFileName] = useState<string>("");

  const [isLoadingExcel, setIsLoadingExcel] = useState(false);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);

  const [mergedProducts, setMergedProducts] = useState<MergedProductData[]>([]);
  const [copiesMap, setCopiesMap] = useState<Map<string, ReferenceMultichannelCopy>>(new Map());
  const [selectedRef, setSelectedRef] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Handle Excel Upload
  const handleExcelUpload = async (file: File) => {
    setIsLoadingExcel(true);
    try {
      const rawData = await readExcelFile(file);
      const transformed = transformExcelData(rawData);
      setExcelData(transformed);
      setExcelFileName(file.name);

      // Extract unique references from transformed data
      const refs = Array.from(new Set(transformed.slice(1).map((r) => r[1]).filter(Boolean)));

      // Re-match with current PDF data if any
      const pdfMap = pdfPages.length ? matchPdfDesignData(pdfPages, refs) : new Map<string, PdfDesignData>();
      const products = buildMergedProducts(transformed, pdfMap);
      setMergedProducts(products);

      // Generate copies
      const copies = new Map<string, ReferenceMultichannelCopy>();
      products.forEach((p) => copies.set(p.referencia, generateMultichannelCopy(p)));
      setCopiesMap(copies);

      if (products.length > 0) {
        setSelectedRef(products[0].referencia);
      }

      toast.success(`Base de datos cargada: ${products.length} referencias procesadas.`);
    } catch (error) {
      console.error(error);
      toast.error("Error al procesar la base de datos Excel.");
    } finally {
      setIsLoadingExcel(false);
    }
  };

  // Handle PDF Upload
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoadingPdf(true);
    try {
      const pages = await extractPdfPages(file);
      setPdfPages(pages);
      setPdfFileName(file.name);

      if (excelData) {
        const refs = Array.from(new Set(excelData.slice(1).map((r) => r[1]).filter(Boolean)));
        const pdfMap = matchPdfDesignData(pages, refs);
        const products = buildMergedProducts(excelData, pdfMap);
        setMergedProducts(products);

        const copies = new Map<string, ReferenceMultichannelCopy>();
        products.forEach((p) => copies.set(p.referencia, generateMultichannelCopy(p)));
        setCopiesMap(copies);

        toast.success(`PDF procesado: ${pages.length} páginas analizadas y combinadas.`);
      } else {
        toast.success(`PDF de diseño cargado (${pages.length} páginas). Sube el Excel para vincular.`);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al leer el archivo PDF de la presentación de diseño.");
    } finally {
      setIsLoadingPdf(false);
    }
  };

  // Copy to clipboard helper
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
      {/* Top Header & Navigation */}
      <div className="max-w-7xl mx-auto space-y-6">
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
              Generador Multicanal de Comunicación
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Fusión inteligente de Base de Datos Excel + Presentaciones PDF de Diseño con generación AIDA para TikTok, Instagram, Facebook, Email y Ads.
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

        {/* Dual Upload Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Excel Upload */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" /> 1. Base de Datos Excel (Obligatorio)
              </CardTitle>
              <CardDescription>
                Sube el archivo Excel con referencias, tallas, colores y nombres.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload
                onFileSelect={handleExcelUpload}
                isLoading={isLoadingExcel}
                acceptedFormats=".xlsx, .xls, .csv"
              />
              {excelFileName && (
                <div className="mt-3 text-xs flex items-center justify-between text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-200 dark:bg-emerald-950 dark:border-emerald-900 dark:text-emerald-300">
                  <span className="flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-4 h-4" /> {excelFileName}
                  </span>
                  <Badge variant="outline">{mergedProducts.length} referencias</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card 2: PDF Design Presentation Upload */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" /> 2. Presentación de Diseño PDF (Opcional)
              </CardTitle>
              <CardDescription>
                Sube el PDF con conceptos de colección, estilo, roturas y notas de diseño.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-900 transition cursor-pointer relative">
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
                    <span className="text-xs font-medium">Procesando y extrayendo páginas PDF…</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-500">
                    <Upload className="w-8 h-8 text-indigo-500" />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Haz clic o arrastra aquí tu presentación PDF de diseño
                    </span>
                    <span className="text-[11px] text-slate-400">PDF (.pdf)</span>
                  </div>
                )}
              </div>

              {pdfFileName && (
                <div className="text-xs flex items-center justify-between text-indigo-700 bg-indigo-50 p-2 rounded border border-indigo-200 dark:bg-indigo-950 dark:border-indigo-900 dark:text-indigo-300">
                  <span className="flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-4 h-4" /> {pdfFileName}
                  </span>
                  <Badge variant="outline">{pdfPages.length} páginas</Badge>
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
                        <div className="flex items-center gap-2">
                          <h2 className="text-2xl font-bold tracking-tight text-white">{activeCopy.referencia}</h2>
                          <Badge className="bg-indigo-500/30 text-indigo-200 border-indigo-400/40">
                            {activeCopy.productData.nombre}
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
                        <div className="text-xs bg-indigo-900/40 p-2.5 rounded border border-indigo-700/50 text-indigo-200 mt-2 space-y-1">
                          <div><strong>Ocasión de uso (PDF):</strong> {activeCopy.productData.pdfDesign.occasion}</div>
                          <div><strong>Detalles clave:</strong> {activeCopy.productData.pdfDesign.details.join(" • ")}</div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Channel Tabs */}
                  <Tabs defaultValue="tiktok" className="w-full">
                    <TabsList className="grid grid-cols-5 w-full bg-slate-200 dark:bg-slate-900">
                      <TabsTrigger value="tiktok" className="text-xs flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5 text-pink-500" /> TikTok & Reels
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

                    {/* Tab 1: TikTok & Reels */}
                    <TabsContent value="tiktok" className="space-y-4 pt-3">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-pink-500" /> Ganchos Cortos de 3 Segundos
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

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-semibold">Ideas para Stories Interactivas</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-xs">
                          {activeCopy.instagram.storyIdeas.map((story, idx) => (
                            <div key={idx} className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 rounded font-medium">
                              💡 {story}
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
                          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-200 rounded text-xs">
                            <strong>Llamado a la Acción Sugerido:</strong> {activeCopy.facebook.callToAction}
                          </div>
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
                          <div className="text-xs p-2 bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200 rounded">
                            <strong>Preview Text:</strong> {activeCopy.email.previewText}
                          </div>
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
                          <p className="text-xs bg-slate-50 dark:bg-slate-900 p-3 rounded border border-slate-200 dark:border-slate-800 leading-relaxed">
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
