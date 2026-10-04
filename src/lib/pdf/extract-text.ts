import "server-only";

// Mirrors the offline app's browser-side extraction (pdfjsLib.getDocument +
// getTextContent, items joined with a space per page) so the token-based
// parser in lib/import/team-report-pdf.ts sees the exact same text shape it
// was built and verified against. Must run with disableWorker — pdfjs-dist's
// worker thread isn't available in a Next.js server runtime.
export async function extractPdfText(buffer: Buffer): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
  }).promise;

  let text = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((it) => ("str" in it ? it.str : "")).join(" ") + "\n";
  }
  return text;
}
