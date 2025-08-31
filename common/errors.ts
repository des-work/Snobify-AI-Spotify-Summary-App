export const ErrorCode = {
  ProfileNotFound: "SNB-1001",
  CsvMissing: "SNB-1002",
  CsvSchemaInvalid: "SNB-1003",
  ComputeFailed: "SNB-2001",
  CacheReadFailed: "SNB-3001",
  CacheWriteFailed: "SNB-3002",
  SpotifyNotConfigured: "SNB-4001",
  Unknown: "SNB-9001",
} as const;
export type ErrorCode = typeof ErrorCode[keyof typeof ErrorCode];
