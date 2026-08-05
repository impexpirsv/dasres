import Callout from "./Callout";
import type { ArticleBlock } from "./article-content";

function InlineText({ text }: { text: string }) {
  return <>{text.split(/(`[^`]+`)/g).map((part, index) => part.startsWith("`") && part.endsWith("`") ? <code key={`${part}-${index}`}>{part.slice(1, -1)}</code> : part)}</>;
}

export default function ArticleBody({ blocks }: { blocks: readonly ArticleBlock[] }) {
  return (
    <article id="article-content" className="article-prose" tabIndex={-1}>
      {blocks.map((block, index) => {
        if (block.type === "heading") return block.level === 2 ? <h2 id={block.id} key={block.id}><InlineText text={block.text} /></h2> : <h3 id={block.id} key={block.id}><InlineText text={block.text} /></h3>;
        if (block.type === "paragraph") return <p key={index}><InlineText text={block.text} /></p>;
        if (block.type === "quote") return <blockquote key={index}><InlineText text={block.text} /></blockquote>;
        if (block.type === "code") return <pre key={index} dir="ltr" tabIndex={0}>{block.language && <span className="article-code-language">{block.language}</span>}<code>{block.code}</code></pre>;
        if (block.type === "list") { const List = block.ordered ? "ol" : "ul"; return <List key={index}>{block.items.map((item) => <li key={item}><InlineText text={item} /></li>)}</List>; }
        if (block.type === "table") return <div className="article-table-wrap" key={index} tabIndex={0}><table><thead><tr>{block.headers.map((header) => <th key={header} scope="col"><InlineText text={header} /></th>)}</tr></thead><tbody>{block.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={`${cell}-${cellIndex}`}><InlineText text={cell} /></td>)}</tr>)}</tbody></table></div>;
        return <Callout key={index} kind={block.kind} title={block.title}><p><InlineText text={block.text} /></p></Callout>;
      })}
    </article>
  );
}
