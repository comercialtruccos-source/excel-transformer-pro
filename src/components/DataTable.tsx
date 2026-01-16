import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DataTableProps {
  data: string[][];
  maxRows?: number;
  title: string;
  variant?: "original" | "transformed";
}

const DataTable = ({ data, maxRows = 10, title, variant = "original" }: DataTableProps) => {
  if (!data || data.length === 0) return null;

  const headers = data[0];
  const rows = data.slice(1, maxRows + 1);
  const hasMoreRows = data.length - 1 > maxRows;

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className={`px-4 py-3 border-b ${variant === "transformed" ? "bg-accent/10" : "bg-muted/50"}`}>
        <h3 className="font-semibold text-sm text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {data.length - 1} filas × {headers.length} columnas
        </p>
      </div>
      <ScrollArea className="max-h-[300px]">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              {headers.map((header, i) => (
                <TableHead key={i} className="font-semibold text-xs whitespace-nowrap">
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, i) => (
              <TableRow key={i}>
                {row.map((cell, j) => (
                  <TableCell key={j} className="text-sm whitespace-nowrap">
                    {cell || "-"}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
      {hasMoreRows && (
        <div className="px-4 py-2 bg-muted/30 text-center">
          <p className="text-xs text-muted-foreground">
            +{data.length - 1 - maxRows} filas más...
          </p>
        </div>
      )}
    </div>
  );
};

export default DataTable;
