import { useState, useEffect } from "react";
import { ArrowRight, Download, RefreshCw, FileSpreadsheet, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import FileUpload from "@/components/FileUpload";
import DataTable from "@/components/DataTable";
import { readExcelFile, transformExcelData, exportToExcel, loadColorCatalog } from "@/lib/excelTransform";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [originalData, setOriginalData] = useState<string[][] | null>(null);
  const [transformedData, setTransformedData] = useState<string[][] | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const { toast } = useToast();

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
      setIsLoading(false);
      toast({
        title: "¡Transformación completada!",
        description: `${result.length - 1} filas generadas`,
      });
    }, 500);
  };

  const handleDownload = () => {
    if (!transformedData) return;
    const newFileName = fileName.replace(/\.(xlsx|xls)$/i, "_transformado.xlsx");
    exportToExcel(transformedData, newFileName);
    toast({
      title: "Descarga iniciada",
      description: newFileName,
    });
  };

  const handleReset = () => {
    setOriginalData(null);
    setTransformedData(null);
    setFileName("");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-foreground">Trucco's Jeans - Rappaz</h1>
            <p className="text-xs text-muted-foreground">Convierte formato horizontal a vertical</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        {!originalData && (
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              Transformación automática
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-3">
              Transforma tu Excel en segundos
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Convierte datos de formato horizontal (colores en columnas) a formato vertical 
              (una fila por cada combinación de referencia, talla y color).
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
            {/* Action Buttons */}
            <div className="flex justify-center gap-3">
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
                    onClick={handleTransform}
                    variant="outline"
                    size="lg"
                    className="gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Re-transformar
                  </Button>
                  <Button 
                    onClick={handleDownload}
                    size="lg"
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Descargar Excel
                  </Button>
                  <Button 
                    onClick={handleReset}
                    variant="outline"
                    size="lg"
                    className="gap-2"
                  >
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
          </div>
        )}

        {/* Instructions */}
        {!originalData && (
          <div className="max-w-2xl mx-auto mt-12">
            <h3 className="font-semibold text-center mb-6 text-foreground">¿Cómo funciona?</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { step: "1", title: "Sube tu archivo", desc: "Excel con colores en columnas" },
                { step: "2", title: "Transforma", desc: "Expande tallas y colores automáticamente" },
                { step: "3", title: "Descarga", desc: "Obtén tu archivo en formato vertical" },
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
