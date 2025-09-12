const ERROR_CODE = {
  ProfileNotFound: "SNB-1001",
  DataNotFound: "SNB-1002",
  CsvMissing: "SNB-1003",
  CsvSchemaInvalid: "SNB-1004",
  ComputeFailed: "SNB-2001",
  CacheReadFailed: "SNB-3001",
  CacheWriteFailed: "SNB-3002",
  SpotifyNotConfigured: "SNB-4001",
  Unknown: "SNB-9001",
} as const;

export type ErrorCodeKey = keyof typeof ERROR_CODE;
export default ERROR_CODE;