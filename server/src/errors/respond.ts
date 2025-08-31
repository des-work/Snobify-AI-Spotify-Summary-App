import { FastifyReply } from "fastify";
import ERROR_CODE from "../../../common/errors.ts";

export function sendError(
  reply: FastifyReply,
  code: keyof typeof ERROR_CODE,
  message: string,
  reqId: string,
  hint?: string,
  details?: unknown
){
  reply.code(httpCode(code)).send({ error: { code: ERROR_CODE[code], message, reqId, hint, details } });
}
function httpCode(code: keyof typeof ERROR_CODE): number {
  switch(code){
    case "ProfileNotFound": return 404;
    case "CsvMissing": return 400;
    case "CsvSchemaInvalid": return 422;
    case "SpotifyNotConfigured": return 400;
    default: return 500;
  }
}