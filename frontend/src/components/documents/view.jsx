"use client";

import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { PDFViewer } from "@embedpdf/react-pdf-viewer";

const PDFViewerPage = () => {
  const navigate = useNavigate();
  const { state } = useLocation();

  const pdfUrl = state?.url;
  const title = state?.title || "Document Preview";

  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Allow the container to fully paint before mounting PDFViewer
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (!pdfUrl) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <p className="text-sm text-muted-foreground">No document to display</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-muted/30 flex flex-col">
      {/* Top Bar */}
      <header className="shrink-0 sticky top-0 z-20 bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <h1 className="text-sm md:text-base font-semibold truncate">
            {title}
          </h1>
        </div>
      </header>

      {/* PDF Area */}
      <main className="flex-1 min-h-0">
        {ready && (
          <PDFViewer
            config={{
              src: pdfUrl,
              zoom: { defaultZoom: "fit-width" },
              theme: { preference: "light" },
            }}
            style={{ width: "100%", height: "100%" }}
          />
        )}
      </main>
    </div>
  );
};

export default PDFViewerPage;