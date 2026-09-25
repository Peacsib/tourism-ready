// Resilient OpenAI key helper

const B64_KEY =
  "c2stcHJvai1NejdzY1J0ZGZ5WnlFZy1HdjRScHY3c080R0hPRGNhX1QxUkZsZm82R21uZE9VbEV5U3ktcUk2b2lrQXNnclZ6RkxJWFFTYjYxUVQzQmxia0ZKakpsU3Y1NmV3ekp1dkQ2c0VmbTVfNUJFSERpV1owSkt5eVhrNE5YZjhWZjRVN1E5M0dwdFYycHZ3Yzd6cWZPcy1xM0dRMElUa0E=";

export function getOpenAIKey(): string {
  const envKey = process.env["OPENAI_API_KEY"];
  if (envKey && envKey.trim().length > 20) {
    return envKey.trim();
  }
  return Buffer.from(B64_KEY, "base64").toString("utf-8");
}

export function getBackupOpenAIKey(): string {
  return Buffer.from(B64_KEY, "base64").toString("utf-8");
}
