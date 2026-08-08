import { contentRecordSchema } from "./schema";
import { contentTypeCategories } from "./catalog";
import { calculateReadingTime } from "./reading-time";
import type { ContentRecord, ContentStatus } from "./types";

export type ContentValidationIssue = {
  code: string;
  message: string;
  recordId?: string;
};

export class ContentValidationError extends Error {
  constructor(readonly issues: readonly ContentValidationIssue[]) {
    super(`Content repository validation failed with ${issues.length} issue(s).`);
    this.name = "ContentValidationError";
  }
}

const allowedTransitions: Readonly<Record<ContentStatus, readonly ContentStatus[]>> = {
  draft: ["draft", "published", "archived"],
  published: ["published", "archived", "superseded"],
  archived: ["archived", "draft"],
  superseded: ["superseded", "archived"],
};

function issue(code: string, message: string, recordId?: string): ContentValidationIssue {
  return { code, message, ...(recordId ? { recordId } : {}) };
}

export function collectContentValidationIssues(input: readonly unknown[], now = new Date()): ContentValidationIssue[] {
  const issues: ContentValidationIssue[] = [];
  const records: ContentRecord[] = [];

  input.forEach((candidate, index) => {
    const result = contentRecordSchema.safeParse(candidate);
    if (!result.success) {
      for (const problem of result.error.issues) {
        issues.push(issue("INVALID_RECORD", `Record ${index}: ${problem.path.join(".") || "record"}: ${problem.message}`));
      }
      return;
    }
    records.push(result.data);
  });

  const ids = new Set<string>();
  const paths = new Set<string>();
  const knownIds = new Set(records.map((record) => record.id));

  for (const record of records) {
    if (ids.has(record.id)) issues.push(issue("DUPLICATE_ID", `Duplicate content id '${record.id}'.`, record.id));
    ids.add(record.id);
    const localePath = `${record.locale}:${record.category}:${record.slug}`;
    if (paths.has(localePath)) issues.push(issue("DUPLICATE_PATH", `Duplicate category and slug '${record.category}/${record.slug}' for locale '${record.locale}'.`, record.id));
    paths.add(localePath);

    const publishDate = record.publishDate ? new Date(record.publishDate) : null;
    const updatedDate = new Date(record.updatedDate);
    const reviewDate = record.reviewDate ? new Date(record.reviewDate) : null;
    if (record.status === "published" && (!publishDate || publishDate > now)) issues.push(issue("INVALID_PUBLISH_DATE", "Published content requires a publishDate that is not in the future.", record.id));
    if (publishDate && updatedDate < publishDate) issues.push(issue("INVALID_DATE_ORDER", "updatedDate cannot precede publishDate.", record.id));
    if (record.status === "published" && (!reviewDate || reviewDate <= now)) issues.push(issue("INVALID_REVIEW_DATE", "Published content requires a future reviewDate.", record.id));
    if (record.canonical !== `/resources/${contentTypeCategories[record.category]}/${record.slug}`) issues.push(issue("INVALID_CANONICAL", "canonical must match the category and slug route.", record.id));
    if (record.readingTime !== calculateReadingTime(record.body)) issues.push(issue("INVALID_READING_TIME", "readingTime does not match the generated value.", record.id));

    const related = new Set<string>();
    for (const relatedId of record.relatedArticles) {
      if (relatedId === record.id || related.has(relatedId) || !knownIds.has(relatedId)) issues.push(issue("BROKEN_RELATED_ARTICLE", `Invalid related article reference '${relatedId}'.`, record.id));
      related.add(relatedId);
    }

    const history = record.revision.history;
    if (history.at(-1)?.revision !== record.revision.current || history.at(-1)?.status !== record.status) issues.push(issue("INVALID_REVISION", "Current revision and status must match the final history entry.", record.id));
    for (let index = 0; index < history.length; index += 1) {
      if (history[index].revision !== index + 1) issues.push(issue("INVALID_REVISION", "Revision history must be sequential and start at 1.", record.id));
      const previous = history[index - 1];
      if (previous && !allowedTransitions[previous.status].includes(history[index].status)) issues.push(issue("INVALID_STATUS_TRANSITION", `Status cannot transition from '${previous.status}' to '${history[index].status}'.`, record.id));
    }
  }

  return issues;
}

export function validateContentRecords(input: readonly unknown[], now = new Date()): readonly ContentRecord[] {
  const issues = collectContentValidationIssues(input, now);
  if (issues.length > 0) throw new ContentValidationError(issues);
  return input.map((record) => contentRecordSchema.parse(record));
}
