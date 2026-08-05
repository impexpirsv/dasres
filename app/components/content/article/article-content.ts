export type ArticleCalloutKind = "note" | "warning" | "tip" | "definition";

export type ArticleBlock =
  | { type: "heading"; level: 2 | 3; id: string; text: string }
  | { type: "paragraph"; text: string }
  | { type: "quote"; text: string }
  | { type: "code"; language: string | null; code: string }
  | { type: "list"; ordered: boolean; items: readonly string[] }
  | { type: "table"; headers: readonly string[]; rows: readonly (readonly string[])[] }
  | { type: "callout"; kind: ArticleCalloutKind; title: string | null; text: string };

export type ArticleHeading = { id: string; text: string; level: 2 | 3 };

function createHeadingId(text: string, index: number): string {
  const normalized = text.normalize("NFKD").toLocaleLowerCase().replace(/[^\p{Letter}\p{Number}]+/gu, "-").replace(/^-|-$/g, "");
  return `section-${normalized || index + 1}`;
}

function tableCells(line: string): string[] {
  return line.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());
}

export function parseArticleBody(body: string): readonly ArticleBlock[] {
  const lines = body.replace(/\r\n?/g, "\n").split("\n");
  const blocks: ArticleBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) { index += 1; continue; }

    if (line.startsWith("```")) {
      const language = line.slice(3).trim() || null;
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith("```")) { code.push(lines[index]); index += 1; }
      blocks.push({ type: "code", language, code: code.join("\n") });
      index += 1;
      continue;
    }

    const callout = line.match(/^:::(note|warning|tip|definition)(?:\s+(.+))?$/i);
    if (callout) {
      const content: string[] = [];
      index += 1;
      while (index < lines.length && lines[index].trim() !== ":::") { content.push(lines[index].trim()); index += 1; }
      blocks.push({ type: "callout", kind: callout[1].toLowerCase() as ArticleCalloutKind, title: callout[2]?.trim() || null, text: content.join(" ") });
      index += 1;
      continue;
    }

    const heading = line.match(/^(##|###)\s+(.+)$/);
    if (heading) {
      const text = heading[2].trim();
      const level = heading[1].length as 2 | 3;
      blocks.push({ type: "heading", level, id: createHeadingId(text, blocks.length), text });
      index += 1;
      continue;
    }

    if (line.startsWith("> ")) {
      const quote: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith("> ")) { quote.push(lines[index].trim().slice(2)); index += 1; }
      blocks.push({ type: "quote", text: quote.join(" ") });
      continue;
    }

    const listMatch = line.match(/^(?:([-*])|(\d+)\.)\s+(.+)$/);
    if (listMatch) {
      const ordered = Boolean(listMatch[2]);
      const items: string[] = [];
      while (index < lines.length) {
        const item = lines[index].trim().match(/^(?:([-*])|(\d+)\.)\s+(.+)$/);
        if (!item || Boolean(item[2]) !== ordered) break;
        items.push(item[3]);
        index += 1;
      }
      blocks.push({ type: "list", ordered, items });
      continue;
    }

    if (line.startsWith("|") && index + 1 < lines.length && /^\|?(?:\s*:?-+:?\s*\|)+\s*$/.test(lines[index + 1].trim())) {
      const headers = tableCells(line);
      const rows: string[][] = [];
      index += 2;
      while (index < lines.length && lines[index].trim().startsWith("|")) { rows.push(tableCells(lines[index])); index += 1; }
      blocks.push({ type: "table", headers, rows });
      continue;
    }

    const paragraph = [line];
    index += 1;
    while (index < lines.length && lines[index].trim() && !/^(##|###|```|:::|>\s|[-*]\s|\d+\.\s|\|)/.test(lines[index].trim())) { paragraph.push(lines[index].trim()); index += 1; }
    blocks.push({ type: "paragraph", text: paragraph.join(" ") });
  }

  return blocks;
}

export function getArticleHeadings(blocks: readonly ArticleBlock[]): readonly ArticleHeading[] {
  return blocks.filter((block): block is Extract<ArticleBlock, { type: "heading" }> => block.type === "heading").map(({ id, text, level }) => ({ id, text, level }));
}
