#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const sourceArg = process.argv[2];

if (!sourceArg) {
  console.error("Usage: node scripts/build_daily_report_pdf.js data/daily-reports/YYYY-MM-DD-product-daily-report.md");
  process.exit(1);
}

const sourcePath = path.resolve(repoRoot, sourceArg);
const outputDir = path.join(repoRoot, "exports", "daily-reports");
const outputPath = path.join(outputDir, `${path.basename(sourcePath, ".md")}.pdf`);

function escapePdfText(value) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrapLine(line, width = 88) {
  if (line.length <= width) return [line];
  const words = line.split(/\s+/);
  const lines = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > width) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function markdownToLines(markdown) {
  const lines = [];
  for (const raw of markdown.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) {
      lines.push("");
    } else if (line.startsWith("# ")) {
      lines.push(line.slice(2).toUpperCase());
      lines.push("");
    } else if (line.startsWith("## ")) {
      lines.push(line.slice(3));
    } else {
      lines.push(...wrapLine(line));
    }
  }
  return lines;
}

function paginate(lines, perPage = 48) {
  const pages = [];
  for (let index = 0; index < lines.length; index += perPage) {
    pages.push(lines.slice(index, index + perPage));
  }
  return pages.length ? pages : [[""]];
}

function pageStream(lines) {
  const stream = ["BT", "/F1 10 Tf", "50 760 Td", "14 TL"];
  lines.forEach((line, index) => {
    if (index > 0) stream.push("T*");
    if (line) stream.push(`(${escapePdfText(line)}) Tj`);
  });
  stream.push("ET");
  return stream.join("\n");
}

function buildPdf(markdown) {
  const objects = [];
  const add = (body) => {
    objects.push(Buffer.from(body, "latin1"));
    return objects.length;
  };

  const pages = paginate(markdownToLines(markdown));
  const catalogId = add("<< /Type /Catalog /Pages 2 0 R >>");
  const pagesId = add("<< /Type /Pages /Kids [] /Count 0 >>");
  const fontId = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  const pageIds = [];

  for (const page of pages) {
    const stream = pageStream(page);
    const contentId = add(`<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}\nendstream`);
    pageIds.push(add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`));
  }

  objects[pagesId - 1] = Buffer.from(`<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`, "latin1");

  const chunks = [Buffer.from("%PDF-1.4\n", "latin1")];
  const offsets = [0];
  for (let index = 0; index < objects.length; index += 1) {
    offsets.push(Buffer.concat(chunks).length);
    chunks.push(Buffer.from(`${index + 1} 0 obj\n`, "latin1"), objects[index], Buffer.from("\nendobj\n", "latin1"));
  }
  const beforeXref = Buffer.concat(chunks);
  const xrefStart = beforeXref.length;
  const xref = [
    `xref\n0 ${objects.length + 1}\n`,
    "0000000000 65535 f \n",
    ...offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`),
    `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`,
  ].join("");
  return Buffer.concat([beforeXref, Buffer.from(xref, "latin1")]);
}

await mkdir(outputDir, { recursive: true });
await writeFile(outputPath, buildPdf(await readFile(sourcePath, "utf8")));
console.log(outputPath);
