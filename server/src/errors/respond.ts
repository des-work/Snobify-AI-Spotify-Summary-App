import { FastifyReply } from "fastify";
import { ErrorCode } from "../../../common/errors.js";
export function sendError(
  reply: FastifyReply,
  code: keyof typeof ErrorCode,
  message: string,
  reqId: string,
  hint?: string,
  details?: unknown
){
  reply.code(httpCode(code)).send({ error: { code: ErrorCode[code], message, reqId, hint, details } });
}
function httpCode(code: keyof typeof ErrorCode): number {
  switch(code){
    case "ProfileNotFound": return 404;
    case "CsvMissing": return 400;
    case "CsvSchemaInvalid": return 422;
    case "SpotifyNotConfigured": return 400;
    default: return 500;
  }
}
