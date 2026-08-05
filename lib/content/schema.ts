import { z } from "zod";

import { locales } from "../locale";
import { contentStatuses, contentTypes } from "./types";

const nonEmpty = z.string().trim().min(1);
const isoDate = z.string().datetime({ offset: true });

const contributorSchema = z.object({
  id: nonEmpty.max(100),
  name: nonEmpty.max(200),
}).strict();

const sourceSchema = z.object({
  title: nonEmpty.max(300),
  url: z.url().refine((value) => value.startsWith("https://") || value.startsWith("http://"), "Source URL must use HTTP(S)"),
  publisher: z.string().trim().min(1).max(200).nullable(),
  accessedDate: isoDate,
}).strict();

const revisionEntrySchema = z.object({
  revision: z.number().int().positive(),
  status: z.enum(contentStatuses),
  date: isoDate,
  editor: contributorSchema,
  note: nonEmpty.max(1_000),
}).strict();

export const contentRecordSchema = z.object({
  id: nonEmpty.max(100).regex(/^[a-z0-9][a-z0-9-]*$/),
  slug: nonEmpty.max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  locale: z.enum(locales),
  category: z.enum(contentTypes),
  title: nonEmpty.max(300),
  summary: nonEmpty.max(500),
  body: nonEmpty,
  excerpt: nonEmpty.max(500),
  status: z.enum(contentStatuses),
  publishDate: isoDate.nullable(),
  updatedDate: isoDate,
  reviewDate: isoDate.nullable(),
  author: contributorSchema,
  reviewer: z.array(contributorSchema).max(20),
  jurisdiction: z.array(nonEmpty.max(100)).max(50),
  tags: z.array(nonEmpty.max(100)).max(50),
  coverImage: z.string().trim().min(1).max(2_000).nullable(),
  seoTitle: nonEmpty.max(70),
  seoDescription: nonEmpty.max(170),
  canonical: z.string().startsWith("/resources/"),
  readingTime: z.number().int().positive(),
  relatedArticles: z.array(nonEmpty.max(100)).max(20),
  primarySources: z.array(sourceSchema).max(100),
  references: z.array(sourceSchema).max(100),
  revision: z.object({
    current: z.number().int().positive(),
    history: z.array(revisionEntrySchema).min(1),
  }).strict(),
}).strict();
