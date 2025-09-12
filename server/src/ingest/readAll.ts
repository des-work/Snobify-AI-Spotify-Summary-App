import fs from "fs";
import path from "path";
import readCsv, { type TrackRow } from "./readCsv.js";

export type RowEx = TrackRow & { __playlist?: string };

export async function readAllCsvs(dir: string): Promise<RowEx[]> {
  const files = fs.readdirSync(dir).filter(f => f.toLowerCase().endsWith(".csv"));
  const out: RowEx[] = [];
  for (const f of files) {
    const p = path.join(dir, f);
    try {
      const rows = await readCsv(p);
      const playlistName = path.basename(f, path.extname(f));
      for (const r of rows) {
        (r as any).__playlist = playlistName;
        out.push(r as RowEx);
      }
    } catch (err) {
      // swallow bad CSVs but continue
    }
  }
  return out;
}

/** Returns Map<playlistName, rows[]> where name = CSV base filename */
export async function readPlaylistsAsMap(dir: string): Promise<Map<string, any[]>> {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const out = new Map<string, any[]>();
  for (const e of entries) {
    if (e.isFile() && /\.csv$/i.test(e.name)) {
      const fp = path.join(dir, e.name);
      const base = e.name.replace(/\.csv$/i, "");
      const rows = await readCsv(fp);
      const tagged = rows.map((r: any) => ({ ...r, _srcFile: base, _srcPath: fp }));
      out.set(base, tagged);
    }
  }
  return out;
}

/** --- Tolerant CSV parsing (ignores blank/invalid rows) ------------------ */

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; } else { q = false; }
      } else { cur += ch; }
    } else {
      if (ch === ',') { out.push(cur); cur = ""; }
      else if (ch === '"') { q = true; }
      else { cur += ch; }
    }
  }
  out.push(cur);
  return out;
}

function parseCsvLoose(text: string): any[] {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/);
  // Find first non-empty header line
  let headerLine = "";
  let start = 0;
  for (; start < lines.length; start++) {
    const l = lines[start].trim();
    if (l.length) { headerLine = l; break; }
  }
  if (!headerLine) return [];
  const headers = splitCsvLine(headerLine).map(h => h.trim());

  const rows: any[] = [];
  for (let i = start + 1; i < lines.length; i++) {
    const raw = lines[i];
    if (!raw || !raw.trim()) continue;
    const cols = splitCsvLine(raw);
    // Pad/trunc to headers length
    while (cols.length < headers.length) cols.push("");
    const obj: any = {};
    for (let k = 0; k < headers.length; k++) {
      obj[headers[k]] = (cols[k] ?? "").trim();
    }
    // Skip rows with no data at all
    const anyVal = headers.some(h => String(obj[h] || "").length > 0);
    if (!anyVal) continue;
    // If Track URI exists and is empty, drop row (avoids strict validators later)
    if ("Track URI" in obj && String(obj["Track URI"]).length === 0) continue;
    rows.push(obj);
  }
  return rows;
}

/** Returns Map<playlistName, rows[]> using tolerant parser.
    playlistName = CSV base filename. */
export async function readPlaylistsAsMapLoose(dir: string): Promise<Map<string, any[]>> {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const out = new Map<string, any[]>();
  for (const e of entries) {
    if (e.isFile() && /\.csv$/i.test(e.name)) {
      const fp = path.join(dir, e.name);
      const base = e.name.replace(/\.csv$/i, "");
      const text = fs.readFileSync(fp, "utf8");
      const rows = parseCsvLoose(text).map((r: any) => ({ ...r, _srcFile: base, _srcPath: fp }));
      out.set(base, rows);
    }
  }
  return out;
}