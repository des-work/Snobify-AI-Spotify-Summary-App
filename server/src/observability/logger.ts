import pino from "pino";
export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: process.env.NO_PRETTY ? undefined : { target: "pino-pretty", options: { translateTime: "HH:MM:ss", colorize: true } }
});
