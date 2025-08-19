import * as pdfjs from "pdfjs-dist/build/pdf";
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?worker";

(pdfjs as any).GlobalWorkerOptions.workerPort = new (pdfWorker as any)();

export async function extractPdfTextFromArrayBuffer(ab: ArrayBuffer) {
  const loadingTask = (pdfjs as any).getDocument({ data: ab });
  const pdf = await loadingTask.promise;
  let all = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    all += content.items.map((it: any) => it.str).join(" ") + "\n";
  }
  return all;
}