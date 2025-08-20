import * as pdfjsLib from "pdfjs-dist";

// Tell PDF.js where to find its worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString();

export async function extractPdfTextFromArrayBuffer(ab: ArrayBuffer) {
  const loadingTask = pdfjsLib.getDocument({ data: ab });
  const pdf = await loadingTask.promise;

  let all = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    all += content.items.map((it: any) => it.str).join(" ") + "\n";
  }
  return all;
}