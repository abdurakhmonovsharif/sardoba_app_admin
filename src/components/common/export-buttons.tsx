import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExportButtonsProps {
  onExportCsv?: () => void;
  onExportXlsx?: () => void;
}

export function ExportButtons({ onExportCsv, onExportXlsx }: ExportButtonsProps) {
  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={onExportCsv} leftIcon={<Download className="h-4 w-4" />}>
        Export CSV
      </Button>
      <Button variant="outline" onClick={onExportXlsx} leftIcon={<Download className="h-4 w-4" />}>
        Export Excel
      </Button>
    </div>
  );
}
