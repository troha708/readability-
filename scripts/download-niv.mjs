#!/usr/bin/env node
/**
 * Download NIV Bible JSON files from github.com/aruljohn/Bible-niv
 * Saves each book to data/niv/<BookName>.json
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = "https://raw.githubusercontent.com/aruljohn/Bible-niv/main";
const OUT_DIR = path.join(__dirname, "..", "data", "niv");

const booksPath = path.join(OUT_DIR, "Books.json");
const bookNames = JSON.parse(fs.readFileSync(booksPath, "utf8"));

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

for (const name of bookNames) {
  const filename = `${name}.json`;
  const url = `${BASE}/${encodeURIComponent(filename)}`;
  process.stderr.write(`Fetching ${filename}... `);
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(res.statusText);
    const text = await res.text();
    const outPath = path.join(OUT_DIR, filename);
    fs.writeFileSync(outPath, text, "utf8");
    process.stderr.write("ok\n");
  } catch (err) {
    process.stderr.write(`error: ${err.message}\n`);
  }
}

console.log("Done. NIV JSON files are in data/niv/");
