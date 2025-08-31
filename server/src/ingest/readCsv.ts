import fs from "fs";
import path from "path";
import { parse } from "csv-parse";
import { z } from "zod";

const RowSchema = z.object({
  "Track URI": z.string().min(1),
  "Track Name": z.string().optional().default(""),
  "Album Name": z.string().optional().default(""),
  "Artist Name(s)": z.string().optional().default(""),
  "Release Date": z.string().optional().default(""),
  "Duration (ms)": z.coerce.number().optional().default(0),
  "Popularity": z.coerce.number().optional().default(0),
  "Explicit": z.string().optional(),
  "Added By": z.string().optional(),
  "Added At": z.string().optional(),
  "Genres": z.string().optional().default(""),
  "Record Label": z.string().optional(),
  "Danceability": z.coerce.number().optional().default(0),
  "Energy": z.coerce.number().optional().default(0),
  "Key": z.string().optional(),
  "Loudness": z.coerce.number().optional().default(0),
  "Mode": z.string().optional(),
  "Speechiness": z.coerce.number().optional().default(0),
  "Acousticness": z.coerce.number().optional().default(0),
  "Instrumentalness": z.coerce.number().optional().default(0),
  "Liveness": z.coerce.number().optional().default(0),
  "Valence": z.coerce.number().optional().default(0),
  "Tempo": z.coerce.number().optional().default(0),
  "Time Signature": z.string().optional(),
  "Played At": z.string().optional()
});
export type TrackRow = z.infer<typeof RowSchema>;
export type IngestMeta = { files:number; skipped:number; totalRows:number };

async function readCsvFile(file: string): Promise<{ rows: TrackRow[]; skipped: number }> {
  const out: TrackRow[] = [];
  let skipped = 0;
  const raw = fs.createReadStream(file).pipe(parse({ columns: true, skip_empty_lines: true }));
  for await (const rec of raw as any) {
    // URI aliases + trim
    let uri = (rec["Track URI"] ?? rec["Spotify URI"] ?? rec["URI"] ?? rec["track_uri"] ?? "").toString().trim();
    if (!uri) { skipped++; continue; }
    rec["Track URI"] = uri;
    try { out.push(RowSchema.parse(rec)); }
    catch { skipped++; }
  }
  return { rows: out, skipped };
}

/** Reads either a single CSV file or a directory of CSV files. */
export async function readCsvAny(csvOrDir: string, opts?: { maxMb?: number }): Promise<{ rows: TrackRow[]; meta: IngestMeta }> {
  const maxMb = opts?.maxMb ?? 15;
  if (!fs.existsSync(csvOrDir)) throw new Error("Path not found: " + csvOrDir);
  const stat = fs.statSync(csvOrDir);

  if (stat.isFile()) {
    if (!csvOrDir.toLowerCase().endsWith(".csv")) throw new Error("Expected a .csv file: " + csvOrDir);
    const { rows, skipped } = await readCsvFile(csvOrDir);
    return { rows, meta: { files: 1, skipped, totalRows: rows.length } };
  }

  if (!stat.isDirectory()) throw new Error("Path is neither file nor directory: " + csvOrDir);

  const files = fs.readdirSync(csvOrDir).filter(f => f.toLowerCase().endsWith(".csv")).map(f => path.join(csvOrDir, f));
  const chunks: TrackRow[][] = [];
  let skipped = 0, total = 0, usedFiles = 0;

  for (const f of files) {
    const mb = fs.statSync(f).size / (1024*1024);
    if (mb > maxMb) { skipped++; continue; } // count as skipped file
    const { rows, skipped: s } = await readCsvFile(f);
    chunks.push(rows);
    total += rows.length;
    skipped += s;
    usedFiles++;
  }
  return { rows: chunks.flat(), meta: { files: usedFiles, skipped, totalRows: total } };
}