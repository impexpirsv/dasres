import { z } from "zod";

const serverEnvSchema = z.object({
  NODE_ENV: z
    .enum([
      "development",
      "test",
      "production",
    ])
    .default("development"),

  DATABASE_URL: z
    .string()
    .trim()
    .min(
      1,
      "DATABASE_URL is required.",
    ),

  NEXT_PUBLIC_SITE_URL: z
    .string()
    .trim()
    .url(
      "NEXT_PUBLIC_SITE_URL must be a valid URL.",
    )
    .optional(),
});

const parsedEnv =
  serverEnvSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,

    DATABASE_URL:
      process.env.DATABASE_URL,

    NEXT_PUBLIC_SITE_URL:
      process.env
        .NEXT_PUBLIC_SITE_URL,
  });

if (!parsedEnv.success) {
  const formattedErrors =
    parsedEnv.error.flatten()
      .fieldErrors;

  console.error(
    "Invalid environment variables:",
    formattedErrors,
  );

  throw new Error(
    "Invalid environment variables. Check the server logs for details.",
  );
}

const validatedEnv =
  parsedEnv.data;

const siteUrl =
  validatedEnv.NEXT_PUBLIC_SITE_URL ??
  (validatedEnv.NODE_ENV ===
  "production"
    ? undefined
    : "http://localhost:3000");

if (!siteUrl) {
  throw new Error(
    "NEXT_PUBLIC_SITE_URL is required in production.",
  );
}

export const env = {
  NODE_ENV:
    validatedEnv.NODE_ENV,

  DATABASE_URL:
    validatedEnv.DATABASE_URL,

  NEXT_PUBLIC_SITE_URL:
    siteUrl,

  IS_DEVELOPMENT:
    validatedEnv.NODE_ENV ===
    "development",

  IS_TEST:
    validatedEnv.NODE_ENV ===
    "test",

  IS_PRODUCTION:
    validatedEnv.NODE_ENV ===
    "production",
} as const;