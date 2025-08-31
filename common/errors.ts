const ERROR_CODE = {
  ProfileNotFound: "SNB-1001",
  CsvMissing: "SNB-1002",
  CsvSchemaInvalid: "SNB-1003",
  ComputeFailed: "SNB-2001",
  CacheReadFailed: "SNB-3001",
  CacheWriteFailed: "SNB-3002",
  SpotifyNotConfigured: "SNB-4001",
  Unknown: "SNB-9001",
} as const;

export type ErrorCodeKey = keyof typeof ERROR_CODE;
export default ERROR_CODE;