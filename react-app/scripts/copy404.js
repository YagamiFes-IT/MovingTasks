// scripts/copy404.js
import fs from "fs";
import path from "path";

const distPath = path.resolve("dist");
const indexPath = path.join(distPath, "index.html");
const notFoundPath = path.join(distPath, "404.html");

if (fs.existsSync(indexPath)) {
  fs.copyFileSync(indexPath, notFoundPath);
  console.log("Copied index.html to 404.html for GitHub Pages SPA support.");
} else {
  console.error("Error: dist/index.html not found. Build must run before this script.");
  process.exit(1);
}
