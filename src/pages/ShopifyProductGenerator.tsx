import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, RefreshCw, ShoppingBag, Sparkles, FileSpreadsheet, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import FileUpload from "@/components/FileUpload";
import DataTable from "@/components/DataTable";
import ShopifyConfigForm from "@/components/ShopifyConfigForm";
import {
    readExcelFileForShopify,
    loadShopifyColorCatalog,
    extractVariants,
    transformToShopifyFormat,
    exportToShopifyCSV,
    exportToShopifyExcel,
    ShopifyConfig,
    ProductVariant,
} from "@/lib/shopifyTransform";
import { useToast } from "@/hooks/use-toast";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ShopifyProductGenerator = () => {
    const [originalData, setOriginalData] = useState<string[][] | null>(null);
    const [variants, setVariants] = useState<ProductVariant[]>([]);
    const [shopifyData, setShopifyData] = useState<string[][] | null>(null);
    const [fileName, setFileName] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [catalogLoaded, setCatalogLoaded] = useState(false);
    const { toast } = useToast();

    // Cargar catálogo de colores al iniciar
    useEffect(() => {
        loadShopifyColorCatalog().then(() => {
            setCatalogLoaded(true);
        });
    }, []);

    const handleFileSelect = async (file: File) => {
        setIsLoading(true);
        try {
            const data = await readExcelFileForShopify(file);
            setOriginalData(data);
            setFileName(file.name);

            // Extraer variantes inmediatamente
            const extractedVariants = extractVariants(data);
            setVariants(extractedVariants);
            setShopifyData(null);

            toast({
                title: "Archivo cargado",
                description: `${data.length - 1} filas encontradas, ${extractedVariants.length} variantes generadas`,
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

    const handleConfigSubmit = (config: ShopifyConfig) => {
        if (!variants.length) return;

        setIsLoading(true);
        setTimeout(() => {
            const result = transformToShopifyFormat(variants, config);
            setShopifyData(result);
            setIsLoading(false);
            toast({
                title: "¡CSV generado!",
                description: `${result.length - 1} filas listas para Shopify`,
            });
        }, 500);
    };

    const handleDownloadCSV = () => {
        if (!shopifyData) return;
        const newFileName = fileName.replace(/\.(xlsx|xls)$/i, "_shopify.csv");
        exportToShopifyCSV(shopifyData, newFileName);
        toast({
            title: "Descarga CSV iniciada",
            description: newFileName,
        });
    };

    const handleDownloadExcel = () => {
        if (!shopifyData) return;
        const newFileName = fileName.replace(/\.(xlsx|xls)$/i, "_shopify.xlsx");
        exportToShopifyExcel(shopifyData, newFileName);
        toast({
            title: "Descarga Excel iniciada",
            description: newFileName,
        });
    };

    const handleReset = () => {
        setOriginalData(null);
        setVariants([]);
        setShopifyData(null);
        setFileName("");
    };

    // Convertir variantes a formato de tabla para vista previa
    const variantsTableData = variants.length > 0
        ? [
            ["SKU", "Referencia", "Talla", "Color", "Código Color"],
            ...variants.slice(0, 50).map(v => [v.sku, v.referencia, v.talla, v.color, v.colorCode])
        ]
        : null;

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link to="/" className="mr-2">
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <ArrowLeft className="w-4 h-4" />
                            </Button>
                        </Link>
                        <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center">
                            <ShoppingBag className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg text-foreground">Generador CSV Shopify</h1>
                            <p className="text-xs text-muted-foreground">Crea archivos de importación de productos</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
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
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-600/10 text-green-600 text-sm font-medium mb-4">
                            <Sparkles className="w-4 h-4" />
                            Compatible con Shopify
                        </div>
                        <h2 className="text-3xl font-bold text-foreground mb-3">
                            Genera tu archivo de productos
                        </h2>
                        <p className="text-muted-foreground max-w-lg mx-auto">
                            Sube tu Excel con referencias y colores, configura los detalles del producto
                            y descarga un CSV listo para importar en Shopify.
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

                {/* Main Content */}
                {originalData && (
                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Config Panel */}
                        <div className="lg:col-span-1">
                            <div className="rounded-xl border bg-card p-4">
                                <h3 className="font-semibold mb-4 flex items-center gap-2">
                                    <FileSpreadsheet className="w-4 h-4" />
                                    Configuración del Producto
                                </h3>
                                <ShopifyConfigForm
                                    onSubmit={handleConfigSubmit}
                                    isLoading={isLoading}
                                />
                            </div>
                        </div>

                        {/* Preview Panel */}
                        <div className="lg:col-span-2 space-y-4">
                            {/* Action Buttons */}
                            {shopifyData && (
                                <div className="flex justify-end gap-3">
                                    <Button
                                        onClick={handleReset}
                                        variant="outline"
                                        className="gap-2"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Nuevo archivo
                                    </Button>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button className="gap-2">
                                                <Download className="w-4 h-4" />
                                                Descargar
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem onClick={handleDownloadCSV}>
                                                <FileDown className="w-4 h-4 mr-2" />
                                                Descargar CSV (recomendado)
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={handleDownloadExcel}>
                                                <FileSpreadsheet className="w-4 h-4 mr-2" />
                                                Descargar Excel
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            )}

                            {/* Variants Preview */}
                            {variantsTableData && !shopifyData && (
                                <DataTable
                                    data={variantsTableData}
                                    title={`📦 Vista previa - ${variants.length} variantes extraídas`}
                                    variant="original"
                                    maxRows={20}
                                />
                            )}

                            {/* Shopify Data Preview */}
                            {shopifyData && (
                                <DataTable
                                    data={shopifyData}
                                    title={`✅ CSV Shopify - ${shopifyData.length - 1} filas`}
                                    variant="transformed"
                                    maxRows={20}
                                />
                            )}

                            {/* Empty State */}
                            {!variantsTableData && !shopifyData && (
                                <div className="rounded-xl border-2 border-dashed border-border bg-muted/30 flex flex-col items-center justify-center p-12 text-center">
                                    <ShoppingBag className="w-12 h-12 text-muted-foreground/50 mb-4" />
                                    <p className="text-muted-foreground font-medium">
                                        Los datos de Shopify aparecerán aquí
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Configura los parámetros y genera el CSV
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
                        <div className="grid sm:grid-cols-4 gap-4">
                            {[
                                { step: "1", title: "Sube tu Excel", desc: "Con referencias, tallas y colores" },
                                { step: "2", title: "Configura", desc: "Precios, vendor, descripción, etc." },
                                { step: "3", title: "Genera", desc: "Crea el archivo CSV de Shopify" },
                                { step: "4", title: "Importa", desc: "Sube el CSV a tu tienda Shopify" },
                            ].map((item) => (
                                <div key={item.step} className="text-center p-4 rounded-xl bg-card border">
                                    <div className="w-8 h-8 rounded-full bg-green-600 text-white font-bold flex items-center justify-center mx-auto mb-3">
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

export default ShopifyProductGenerator;
