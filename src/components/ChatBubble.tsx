import { memo, isValidElement } from 'react';
import type { ReactNode } from 'react';
import type { Message } from '../types';
import Markdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useT } from '../i18n';
import MindmapView from './MindmapView';
import styles from './ChatBubble.module.css';

interface Props {
  message: Message;
}

/**
 * Some LLMs (especially fast/streaming tiers) emit Markdown tables as a
 * single squashed line — the `|` row boundaries arrive without the line
 * breaks GFM needs to recognise the block as a table. Result: react-markdown
 * just renders pipes as plain text.
 *
 * The two helpers below split a "| ... | | --- | --- | | a | b |" line back
 * into one row per line — but only when the second logical row is the
 * `| --- | --- |` separator (so this can't fire on prose that happens to
 * contain a pipe). Code fences are passed through verbatim so we don't
 * mangle inline shell snippets like `ls | grep foo`.
 */
const TABLE_ROW_BOUNDARY = /\|\s+\|/g;
const TABLE_SEPARATOR_ROW = /^\|\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/;

function normalizeCompactTableLine(line: string): string {
  if (!line.includes('| |')) return line;

  const pipeIndexes = [...line.matchAll(/\|/g)]
    .map((match) => match.index ?? -1)
    .filter((index) => index >= 0);

  for (const index of pipeIndexes) {
    const table = line.slice(index);
    const normalizedTable = table.replace(TABLE_ROW_BOUNDARY, '|\n|');
    const rows = normalizedTable
      .split('\n')
      .map((row) => row.trim())
      .filter(Boolean);

    if (rows.length >= 2 && TABLE_SEPARATOR_ROW.test(rows[1])) {
      const prefix = line.slice(0, index).trimEnd();
      return prefix ? `${prefix}\n${normalizedTable}` : normalizedTable;
    }
  }

  return line;
}

function normalizeMarkdown(content: string): string {
  let inCodeFence = false;

  return content
    .split('\n')
    .map((line) => {
      if (/^\s*(```|~~~)/.test(line)) {
        inCodeFence = !inCodeFence;
        return line;
      }

      return inCodeFence ? line : normalizeCompactTableLine(line);
    })
    .join('\n');
}

export default memo(function ChatBubble({ message }: Props) {
  const { lang } = useT();
  const isUser = message.role === 'user';

  if (!isUser && !message.content) return null;

  /**
   * The tutor agent emits its mind map as a ```mindmap fenced code block.
   * We intercept it at the markdown layer: strip the surrounding <pre> and
   * hand the raw markdown to <MindmapView>, which shows a placeholder while
   * streaming and renders an interactive markmap SVG once the stream ends.
   */
  const components: Components = {
    pre: ({ children }) => {
      const nodes: ReactNode[] = Array.isArray(children) ? children : [children];
      const hasMindmap = nodes.some(
        (node) => isValidElement(node) &&
          typeof node.props.className === 'string' &&
          node.props.className.includes('language-mindmap'),
      );
      return hasMindmap ? <>{children}</> : <pre>{children}</pre>;
    },
    code: ({ className, children }) => {
      if (typeof className === 'string' && className.includes('language-mindmap')) {
        return (
          <MindmapView
            markdown={String(children).replace(/\n$/, '')}
            streaming={!!message.streaming}
          />
        );
      }
      return <code className={className}>{children}</code>;
    },
  };

  return (
    <div className={`${styles.row} ${isUser ? styles.userRow : styles.botRow}`}>
      {!isUser && <div className={styles.avatar}>⬡</div>}
      <div className={`${styles.bubble} ${isUser ? styles.userBubble : styles.botBubble}`}>
        {isUser ? (
          message.content
        ) : (
          <div className={`${styles.markdown} ${message.streaming ? styles.markdownStreaming : ''}`}>
            <Markdown remarkPlugins={[remarkGfm]} components={components}>
              {normalizeMarkdown(message.content)}
            </Markdown>
          </div>
        )}
        <span className={styles.time}>
          {new Date(message.timestamp).toLocaleTimeString(lang === 'zh' ? 'zh-CN' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      {isUser && <div className={`${styles.avatar} ${styles.userAvatar}`}>U</div>}
    </div>
  );
});
