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

export async function readCsv(file: string): Promise<TrackRow[]> {
  if(!fs.existsSync(file)) throw new Error("CSV not found at " + file);
  const out: TrackRow[] = [];
  const required = ["Track URI"];
  const raw = fs.createReadStream(file).pipe(parse({ columns: true, skip_empty_lines: true }));
  for await (const rec of raw as any){
    const obj = RowSchema.parse(rec);
    for(const col of required){ if(!(col in rec) || String(rec[col]).trim()==="") throw new Error(`CSV missing required column: '${col}'`); }
    out.push(obj);
  }
  return out;
}
