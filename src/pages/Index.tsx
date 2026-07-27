import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Download, RefreshCw, FileSpreadsheet, Sparkles, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import FileUpload from "@/components/FileUpload";
import DataTable from "@/components/DataTable";
import { 
  readExcelFile, 
  transformExcelData, 
  exportToExcel, 
  loadColorCatalog,
  transformToShopifyCSV,
  exportToShopifyCSV,
  ShopifyConfig
} from "@/lib/excelTransform";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [originalData, setOriginalData] = useState<string[][] | null>(null);
  const [transformedData, setTransformedData] = useState<string[][] | null>(null);
  const [shopifyData, setShopifyData] = useState<string[][] | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const { toast } = useToast();

  // Shopify config
  const [shopifyConfig, setShopifyConfig] = useState<ShopifyConfig>({
    vendor: "Trucco's",
    productCategory: "Apparel & Accessories > Clothing",
    type: "Jeans",
    tags: "",
    price: "0",
    published: false,
    description: "<p>100% ALGODÓN</p>",
  });

  // Cargar catálogo de colores al iniciar
  useEffect(() => {
    loadColorCatalog().then(() => {
      setCatalogLoaded(true);
    });
  }, []);

  const handleFileSelect = async (file: File) => {
    setIsLoading(true);
    try {
      const data = await readExcelFile(file);
      setOriginalData(data);
      setFileName(file.name);
      setTransformedData(null);
      setShopifyData(null);
      toast({
        title: "Archivo cargado",
        description: `${data.length - 1} filas encontradas`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo leer el archivo Excel",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransform = () => {
    if (!originalData) return;

    setIsLoading(true);
    setTimeout(() => {
      const result = transformExcelData(originalData);
      setTransformedData(result);
      
      // También generar datos de Shopify
      const shopifyResult = transformToShopifyCSV(result, shopifyConfig);
      setShopifyData(shopifyResult);
      
      setIsLoading(false);
      toast({
        title: "¡Transformación completada!",
        description: `${result.length - 1} variantes generadas`,
      });
    }, 500);
  };

  const handleDownloadExcel = () => {
    if (!transformedData) return;
    const newFileName = fileName.replace(/\.(xlsx|xls)$/i, "_transformado.xlsx");
    exportToExcel(transformedData, newFileName);
    toast({
      title: "Descarga Excel iniciada",
      description: newFileName,
    });
  };

  const handleDownloadShopify = () => {
    if (!shopifyData) return;
    const newFileName = fileName.replace(/\.(xlsx|xls)$/i, "_shopify.csv");
    exportToShopifyCSV(shopifyData, newFileName);
    toast({
      title: "Descarga CSV Shopify iniciada",
      description: newFileName,
    });
  };

  const handleReset = () => {
    setOriginalData(null);
    setTransformedData(null);
    setShopifyData(null);
    setFileName("");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-foreground">Trucco's Jeans - Rappaz</h1>
              <p className="text-xs text-muted-foreground">Convierte formato horizontal a vertical + CSV Shopify</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/shopify">
              <Button variant="outline" size="sm" className="gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-600" /> Crear Shopify
              </Button>
            </Link>
            <Link to="/marketing">
              <Button variant="outline" size="sm" className="gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-none hover:opacity-90">
                <Sparkles className="w-4 h-4" /> Generador Marketing
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        {!originalData && (
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              Transformación automática + Shopify
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-3">
              Transforma tu Excel en segundos
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Convierte datos de formato horizontal a vertical y genera el CSV listo para importar en Shopify.
            </p>
          </div>
        )}

        {/* Upload Section */}
        <div className="max-w-xl mx-auto mb-8">
          <FileUpload
            onFileSelect={handleFileSelect}
            fileName={fileName}
            isLoading={isLoading}
          />
        </div>

        {/* Data Preview */}
        {originalData && (
          <div className="space-y-6">
            {/* Shopify Config */}
            {!transformedData && (
              <div className="max-w-2xl mx-auto rounded-xl border bg-card p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  Configuración para Shopify
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vendor">Vendor</Label>
                    <Input
                      id="vendor"
                      value={shopifyConfig.vendor}
                      onChange={(e) => setShopifyConfig(prev => ({ ...prev, vendor: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo de producto</Label>
                    <Input
                      id="type"
                      value={shopifyConfig.type}
                      onChange={(e) => setShopifyConfig(prev => ({ ...prev, type: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Precio</Label>
                    <Input
                      id="price"
                      type="number"
                      value={shopifyConfig.price}
                      onChange={(e) => setShopifyConfig(prev => ({ ...prev, price: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags (separados por coma)</Label>
                    <Input
                      id="tags"
                      value={shopifyConfig.tags}
                      onChange={(e) => setShopifyConfig(prev => ({ ...prev, tags: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="category">Categoría de producto</Label>
                    <Input
                      id="category"
                      value={shopifyConfig.productCategory}
                      onChange={(e) => setShopifyConfig(prev => ({ ...prev, productCategory: e.target.value }))}
                    />
                  </div>
                  <div className="flex items-center gap-2 sm:col-span-2">
                    <Switch
                      id="published"
                      checked={shopifyConfig.published}
                      onCheckedChange={(checked) => setShopifyConfig(prev => ({ ...prev, published: checked }))}
                    />
                    <Label htmlFor="published">Publicar productos automáticamente</Label>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-center gap-3 flex-wrap">
              {!transformedData ? (
                <Button
                  onClick={handleTransform}
                  disabled={isLoading}
                  size="lg"
                  className="gap-2"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  Transformar datos
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleDownloadExcel}
                    size="lg"
                    variant="outline"
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Descargar Excel
                  </Button>
                  <Button
                    onClick={handleDownloadShopify}
                    size="lg"
                    className="gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Descargar CSV Shopify
                  </Button>
                  <Button
                    onClick={handleReset}
                    variant="ghost"
                    size="lg"
                    className="gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Nuevo archivo
                  </Button>
                </>
              )}
            </div>

            {/* Tables */}
            <div className="grid lg:grid-cols-2 gap-6">
              <DataTable
                data={originalData}
                title="📄 Datos originales"
                variant="original"
              />

              {transformedData ? (
                <DataTable
                  data={transformedData}
                  title="✨ Vista previa - Datos transformados"
                  variant="transformed"
                  maxRows={20}
                />
              ) : (
                <div className="rounded-xl border-2 border-dashed border-border bg-muted/30 flex flex-col items-center justify-center p-8 text-center">
                  <ArrowRight className="w-12 h-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground font-medium">
                    Los datos transformados aparecerán aquí
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Haz clic en "Transformar datos" para comenzar
                  </p>
                </div>
              )}
            </div>

            {/* Shopify Preview */}
            {shopifyData && (
              <DataTable
                data={shopifyData}
                title="🛒 Vista previa - CSV Shopify"
                variant="transformed"
                maxRows={10}
              />
            )}
          </div>
        )}

        {/* Instructions */}
        {!originalData && (
          <div className="max-w-2xl mx-auto mt-12">
            <h3 className="font-semibold text-center mb-6 text-foreground">¿Cómo funciona?</h3>
            <div className="grid sm:grid-cols-4 gap-4">
              {[
                { step: "1", title: "Sube tu archivo", desc: "Excel con colores en columnas" },
                { step: "2", title: "Configura", desc: "Precio, vendor y opciones Shopify" },
                { step: "3", title: "Transforma", desc: "Genera ambos formatos" },
                { step: "4", title: "Descarga", desc: "Excel + CSV Shopify" },
              ].map((item) => (
                <div key={item.step} className="text-center p-4 rounded-xl bg-card border">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center mx-auto mb-3">
                    {item.step}
                  </div>
                  <h4 className="font-semibold text-foreground">{item.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
