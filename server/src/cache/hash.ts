import crypto from "crypto";
import fs from "fs";
export function sha256File(filePath: string): string {
  const h = crypto.createHash("sha256");
  const s = fs.readFileSync(filePath);
  h.update(s);
  return h.digest("hex");
}
