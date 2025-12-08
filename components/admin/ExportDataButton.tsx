"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

export default function ExportDataButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async () => {
    setIsLoading(true);
    const supabase = createClient();

    try {
      const { data, error } = await supabase.functions.invoke('export-data', {
        method: 'POST',
        headers: {
          Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      });

      if (error) throw error;

      // The data returned from invoke might be a Blob if the response type is handled correctly,
      // but supabase-js invoke sometimes tries to parse JSON.
      // If data is not a Blob, we might need to handle it. 
      // However, let's try to force it or check.
      // Actually, supabase-js invoke doesn't have a simple 'responseType' option in all versions.
      // If the response header is correct, it might work.
      // But to be safe, let's use the direct fetch fallback as the primary method for file downloads
      // because it gives us full control over the Blob handling.
      
      // Let's switch to using the direct fetch method as primary for reliability with binary files.
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("กรุณาเข้าสู่ระบบก่อน");
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/export-data`, {
          method: 'POST',
          headers: {
              Authorization: `Bearer ${session.access_token}`
          }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Download failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `daycare_data_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("ดาวน์โหลดข้อมูลสำเร็จ");

    } catch (error) {
      console.error("Export error:", error);
      toast.error("ไม่สามารถดาวน์โหลดข้อมูลได้");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleExport} 
      disabled={isLoading}
      variant="outline"
      className="gap-2"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      Export Data (.xlsx)
    </Button>
  );
}
