const WORDS_PER_MINUTE = 225;

export function calculateReadingTime(body: string): number {
  const wordCount = body.trim().split(/\s+/u).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
}
