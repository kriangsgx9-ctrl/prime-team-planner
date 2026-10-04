import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfjs-dist resolves its worker via a path relative to its OWN module file
  // at runtime (`./pdf.worker.mjs`) — bundling it into a server chunk breaks
  // that lookup, so it must stay a real, unbundled file in node_modules.
  serverExternalPackages: ["pdfjs-dist"],
};

export default nextConfig;
