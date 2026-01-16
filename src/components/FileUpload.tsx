import { useCallback } from "react";
import { Upload, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  fileName?: string;
  isLoading?: boolean;
}

const FileUpload = ({ onFileSelect, fileName, isLoading }: FileUploadProps) => {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && (file.name.endsWith(".xlsx") || file.name.endsWith(".xls"))) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className={cn(
        "relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 cursor-pointer group",
        "hover:border-primary hover:bg-primary/5",
        fileName ? "border-accent bg-accent/5" : "border-border"
      )}
    >
      <input
        type="file"
        accept=".xlsx,.xls"
        onChange={handleChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={isLoading}
      />
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        {fileName ? (
          <>
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
              <FileSpreadsheet className="w-8 h-8 text-accent" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{fileName}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Archivo cargado correctamente
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">
                Arrastra tu archivo Excel aquí
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                o haz clic para seleccionar (.xlsx, .xls)
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
