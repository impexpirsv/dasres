import type { ContentRecord } from "../../lib/content/types";
import { customsArticles } from "./customs";
import { glossary } from "./glossary";
import { tutorials } from "./tutorials";

// Content remains source-controlled and is validated when the repository loads.
// Add records here (or compose category-specific files into this array).
export const contentRecords = [
  ...tutorials,
  ...glossary,
  ...customsArticles,
] satisfies readonly ContentRecord[];
