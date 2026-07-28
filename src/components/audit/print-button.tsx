"use client";

import { Button } from "@/components/ui";
import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <Button type="button" variant="secondary" onClick={() => window.print()}>
      <Printer className="h-4 w-4" /> Cetak
    </Button>
  );
}
