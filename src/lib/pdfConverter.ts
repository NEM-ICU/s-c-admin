
import type { ConversionProgress } from "@/features/menus/types/menu";

export type ConvertedPage = {
  pageNumber: number;
  file: File;
};

export type ConversionResult = {
  pageCount: number;
  pages: ConvertedPage[];
};

const RENDER_DPI = 300;
const PDF_POINTS_PER_INCH = 72;
const RENDER_SCALE = RENDER_DPI / PDF_POINTS_PER_INCH;

export async function convertPdfToPngPages(
  pdfFile: File,
  onProgress?: (progress: ConversionProgress) => void,
): Promise<ConversionResult> {
  if (typeof window === "undefined") {
    throw new Error("PDF conversion must run in the browser.");
  }

  if (
    pdfFile.type !== "application/pdf" &&
    !pdfFile.name.toLowerCase().endsWith(".pdf")
  ) {
    throw new Error("Please select a valid PDF file.");
  }

  const pdfjsLib = await import("pdfjs-dist");

  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  }

  let arrayBuffer: ArrayBuffer;

  try {
    arrayBuffer = await pdfFile.arrayBuffer();
  } catch (error) {
    throw new Error(
      `Could not read PDF file: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }

  const loadingTask = pdfjsLib.getDocument({
    data: arrayBuffer,
  });

  try {
    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;

    if (!numPages || numPages < 1) {
      throw new Error("The selected PDF has no pages.");
    }

    const convertedPages: ConvertedPage[] = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      onProgress?.({
        stage: "converting",
        current: pageNum,
        total: numPages,
        message: `Converting page ${pageNum} of ${numPages} to PNG...`,
      });

      const page = await pdfDoc.getPage(pageNum);

      try {
        // Render at 300 DPI.
        const viewport = page.getViewport({
          scale: RENDER_SCALE,
        });

        const canvas = document.createElement("canvas");

        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);

        const ctx = canvas.getContext("2d", {
          alpha: false,
        });

        if (!ctx) {
          throw new Error(
            `Could not initialize canvas for page ${pageNum}.`,
          );
        }

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({
          canvas,
          canvasContext: ctx,
          viewport,
          background: "#ffffff",
        }).promise;

        // PNG preserves every rendered pixel.
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (result) => {
              if (result) {
                resolve(result);
              } else {
                reject(
                  new Error(`Failed to encode page ${pageNum} as PNG.`),
                );
              }
            },
            "image/png",
          );
        });

        const pageFile = new File(
          [blob],
          `page-${pageNum}.png`,
          {
            type: "image/png",
          },
        );

        convertedPages.push({
          pageNumber: pageNum,
          file: pageFile,
        });

        // Release canvas memory.
        canvas.width = 0;
        canvas.height = 0;
      } finally {
        page.cleanup();
      }
    }

    return {
      pageCount: numPages,
      pages: convertedPages,
    };
  } finally {
    // Destroy the PDF.js loading task, not the browser File.
    try {
      await loadingTask.destroy();
    } catch (error) {
      console.warn("PDF.js cleanup warning:", error);
    }
  }
}
