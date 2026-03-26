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

const readCsv = async (file: string): Promise<TrackRow[]> => {
  if (!fs.existsSync(file)) throw new Error("CSV not found at " + file);
  const out: TrackRow[] = [];
  let skipped = 0;
  let hasTrackUriColumn = false;

  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(file);
    const parser = parse({ columns: true, skip_empty_lines: true, relax_column_count: true });

    stream.on("error", (err) => reject(new Error("Failed to read file: " + err.message)));
    parser.on("error", (err) => {
      // Non-fatal parse errors: log and resolve with what we have
      console.warn(`[readCsv] Parse warning in ${file}: ${err.message} (${out.length} rows kept, ${skipped} skipped)`);
      resolve(out);
    });

    parser.on("readable", () => {
      let rec: any;
      while ((rec = parser.read()) !== null) {
        // Detect Track URI column on first record
        if (!hasTrackUriColumn && typeof rec === "object" && rec !== null) {
          hasTrackUriColumn = "Track URI" in rec;
          if (!hasTrackUriColumn) {
            // Fatal: wrong CSV format — reject immediately
            parser.destroy();
            stream.destroy();
            reject(new Error("CSV missing required column: 'Track URI'"));
            return;
          }
        }
        // Skip rows with empty Track URI
        if (!rec["Track URI"] || String(rec["Track URI"]).trim() === "") {
          skipped++;
          continue;
        }
        try {
          const obj = RowSchema.parse(rec);
          out.push(obj);
        } catch {
          // Skip malformed rows silently
          skipped++;
        }
      }
    });

    parser.on("end", () => {
      if (skipped > 0) {
        console.warn(`[readCsv] ${file}: ${out.length} valid rows, ${skipped} skipped`);
      }
      resolve(out);
    });

    stream.pipe(parser);
  });
};

/**
 * Read a path that may be a single CSV file OR a directory of CSVs.
 * Bad files are skipped; good ones are concatenated.
 */
async function readCsvAny(p: string): Promise<TrackRow[]> {
  if (!fs.existsSync(p)) throw new Error("Path not found: " + p);
  const stat = fs.statSync(p);
  if (stat.isDirectory()) {
    const files = fs.readdirSync(p).filter(f => f.toLowerCase().endsWith(".csv"));
    const out: TrackRow[] = [];
    for (const f of files) {
      const fp = path.join(p, f);
      try {
        const rows = await readCsv(fp);
        out.push(...rows);
      } catch { /* skip bad CSV */ }
    }
    return out;
  }
  return await readCsv(p);
}

export { readCsv, readCsvAny };
export default readCsv;