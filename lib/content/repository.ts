import { contentRecords } from "../../data/content/records";
import { validateContentRecords } from "./validation";
import type { ContentQuery, ContentRecord, ContentSearchQuery, ContentType } from "./types";

export interface ContentRepository {
  getAll(query?: ContentQuery): Promise<readonly ContentRecord[]>;
  getBySlug(slug: string, query?: ContentQuery): Promise<ContentRecord | null>;
  getByCategory(category: ContentType, query?: ContentQuery): Promise<readonly ContentRecord[]>;
  getRelated(recordId: string, query?: ContentQuery & { limit?: number }): Promise<readonly ContentRecord[]>;
  getLatest(query?: ContentQuery & { limit?: number }): Promise<readonly ContentRecord[]>;
  searchStatic(query: ContentSearchQuery): Promise<readonly ContentRecord[]>;
}

function matches(record: ContentRecord, query: ContentQuery): boolean {
  return (!query.locale || record.locale === query.locale) && (!query.status || record.status === query.status);
}

function newestFirst(left: ContentRecord, right: ContentRecord): number {
  return new Date(right.publishDate ?? right.updatedDate).getTime() - new Date(left.publishDate ?? left.updatedDate).getTime();
}

export class FileSystemContentRepository implements ContentRepository {
  readonly #records: readonly ContentRecord[];

  constructor(records: readonly unknown[] = contentRecords) {
    this.#records = Object.freeze(validateContentRecords(records).map((record) => Object.freeze(record)));
  }

  async getAll(query: ContentQuery = { status: "published" }): Promise<readonly ContentRecord[]> {
    return this.#records.filter((record) => matches(record, query));
  }

  async getBySlug(slug: string, query: ContentQuery = { status: "published" }): Promise<ContentRecord | null> {
    return this.#records.find((record) => record.slug === slug && matches(record, query)) ?? null;
  }

  async getByCategory(category: ContentType, query: ContentQuery = { status: "published" }): Promise<readonly ContentRecord[]> {
    return (await this.getAll(query)).filter((record) => record.category === category).sort(newestFirst);
  }

  async getRelated(recordId: string, query: ContentQuery & { limit?: number } = { status: "published" }): Promise<readonly ContentRecord[]> {
    const source = this.#records.find((record) => record.id === recordId);
    if (!source) return [];
    const explicitIds = new Set(source.relatedArticles);
    const candidates = (await this.getAll(query)).filter((record) => record.id !== source.id);
    return candidates
      .map((record) => ({ record, score: (explicitIds.has(record.id) ? 100 : 0) + (record.category === source.category ? 10 : 0) + record.tags.filter((tag) => source.tags.includes(tag)).length }))
      .filter(({ score }) => score > 0)
      .sort((left, right) => right.score - left.score || newestFirst(left.record, right.record))
      .slice(0, query.limit ?? 4)
      .map(({ record }) => record);
  }

  async getLatest(query: ContentQuery & { limit?: number } = { status: "published" }): Promise<readonly ContentRecord[]> {
    return [...await this.getAll(query)].sort(newestFirst).slice(0, query.limit ?? 10);
  }

  async searchStatic(query: ContentSearchQuery): Promise<readonly ContentRecord[]> {
    const term = query.query.trim().toLocaleLowerCase(query.locale);
    if (!term) return [];
    return (await this.getAll(query))
      .filter((record) => !query.category || record.category === query.category)
      .filter((record) => [record.title, record.summary, record.excerpt, record.body, ...record.tags, ...record.jurisdiction].some((value) => value.toLocaleLowerCase(record.locale).includes(term)))
      .slice(0, query.limit ?? 20);
  }
}

export const contentRepository: ContentRepository = new FileSystemContentRepository();
