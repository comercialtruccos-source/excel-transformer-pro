import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { ShopifyConfig } from "@/lib/shopifyTransform";
import { Settings2, DollarSign, Package, FileText, Image } from "lucide-react";

interface ShopifyConfigFormProps {
    onSubmit: (config: ShopifyConfig) => void;
    isLoading: boolean;
}

const defaultConfig: ShopifyConfig = {
    vendor: "Trucco's Jeans",
    productType: "Jeans",
    tags: "",
    bodyTemplate: "<p>Producto de alta calidad - Referencia: {referencia}</p>",
    price: "0",
    compareAtPrice: "",
    published: true,
    inventoryQty: "0",
    inventoryPolicy: "deny",
    weight: "500",
    imageBaseUrl: "",
    status: "active",
    titleTemplate: "{nombre} en {composicion} Marca Trucco's",
};

const ShopifyConfigForm = ({ onSubmit, isLoading }: ShopifyConfigFormProps) => {
    const [config, setConfig] = useState<ShopifyConfig>(defaultConfig);

    const handleChange = (field: keyof ShopifyConfig, value: string | boolean) => {
        setConfig((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(config);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Accordion type="multiple" defaultValue={["general", "pricing"]} className="w-full">
                {/* Configuración General */}
                <AccordionItem value="general">
                    <AccordionTrigger className="text-sm font-medium">
                        <div className="flex items-center gap-2">
                            <Settings2 className="w-4 h-4" />
                            Configuración General
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="vendor">Vendor / Proveedor</Label>
                                <Input
                                    id="vendor"
                                    value={config.vendor}
                                    onChange={(e) => handleChange("vendor", e.target.value)}
                                    placeholder="Nombre del proveedor"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="productType">Tipo de Producto</Label>
                                <Input
                                    id="productType"
                                    value={config.productType}
                                    onChange={(e) => handleChange("productType", e.target.value)}
                                    placeholder="Ej: Jeans, Camisa, etc."
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="tags">Tags (separadas por coma)</Label>
                            <Input
                                id="tags"
                                value={config.tags}
                                onChange={(e) => handleChange("tags", e.target.value)}
                                placeholder="Ej: jeans, moda, nuevo"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="titleTemplate">Template de Título</Label>
                            <Input
                                id="titleTemplate"
                                value={config.titleTemplate}
                                onChange={(e) => handleChange("titleTemplate", e.target.value)}
                                placeholder="Usa {referencia} para insertar la referencia"
                            />
                            <p className="text-xs text-muted-foreground">
                                Usa {"{referencia}"}, {"{nombre}"} y {"{composicion}"} para personalizar el título
                            </p>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="published">Publicar automáticamente</Label>
                                <p className="text-xs text-muted-foreground">
                                    El producto estará visible en la tienda
                                </p>
                            </div>
                            <Switch
                                id="published"
                                checked={config.published}
                                onCheckedChange={(checked) => handleChange("published", checked)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">Estado del producto</Label>
                            <Select
                                value={config.status}
                                onValueChange={(value) => handleChange("status", value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Activo</SelectItem>
                                    <SelectItem value="draft">Borrador</SelectItem>
                                    <SelectItem value="archived">Archivado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Descripción */}
                <AccordionItem value="description">
                    <AccordionTrigger className="text-sm font-medium">
                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Descripción del Producto
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="bodyTemplate">Template de Descripción (HTML)</Label>
                            <Textarea
                                id="bodyTemplate"
                                value={config.bodyTemplate}
                                onChange={(e) => handleChange("bodyTemplate", e.target.value)}
                                placeholder="Descripción del producto en HTML"
                                className="min-h-[120px] font-mono text-sm"
                            />
                            <p className="text-xs text-muted-foreground">
                                Usa {"{referencia}"} para incluir la referencia. Puedes usar HTML.
                            </p>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Precios */}
                <AccordionItem value="pricing">
                    <AccordionTrigger className="text-sm font-medium">
                        <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            Precios y Moneda
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="price">Precio</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={config.price}
                                    onChange={(e) => handleChange("price", e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="compareAtPrice">Precio Comparativo</Label>
                                <Input
                                    id="compareAtPrice"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={config.compareAtPrice}
                                    onChange={(e) => handleChange("compareAtPrice", e.target.value)}
                                    placeholder="Opcional"
                                />
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Inventario */}
                <AccordionItem value="inventory">
                    <AccordionTrigger className="text-sm font-medium">
                        <div className="flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            Inventario y Envío
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="inventoryQty">Cantidad de Inventario</Label>
                                <Input
                                    id="inventoryQty"
                                    type="number"
                                    min="0"
                                    value={config.inventoryQty}
                                    onChange={(e) => handleChange("inventoryQty", e.target.value)}
                                    placeholder="0"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="weight">Peso (gramos)</Label>
                                <Input
                                    id="weight"
                                    type="number"
                                    min="0"
                                    value={config.weight}
                                    onChange={(e) => handleChange("weight", e.target.value)}
                                    placeholder="500"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="inventoryPolicy">Política de Inventario</Label>
                            <Select
                                value={config.inventoryPolicy}
                                onValueChange={(value) => handleChange("inventoryPolicy", value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar política" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="deny">No permitir ventas sin stock</SelectItem>
                                    <SelectItem value="continue">Continuar vendiendo sin stock</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Imágenes */}
                <AccordionItem value="images">
                    <AccordionTrigger className="text-sm font-medium">
                        <div className="flex items-center gap-2">
                            <Image className="w-4 h-4" />
                            Imágenes
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="imageBaseUrl">URL Base de Imágenes</Label>
                            <Input
                                id="imageBaseUrl"
                                value={config.imageBaseUrl}
                                onChange={(e) => handleChange("imageBaseUrl", e.target.value)}
                                placeholder="https://example.com/images/"
                            />
                            <p className="text-xs text-muted-foreground">
                                Se agregará la referencia + .jpg al final. Dejar vacío si no aplica.
                            </p>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? "Generando..." : "Generar CSV para Shopify"}
            </Button>
        </form>
    );
};

export default ShopifyConfigForm;
