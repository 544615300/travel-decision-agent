import { memo, isValidElement } from 'react';
import type { ReactNode } from 'react';
import type { Message } from '../types';
import Markdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { useT } from '../i18n';
import MindmapView from './MindmapView';
import SectionedAnswer from './SectionedAnswer';
import {
  parseAnswerSections,
  buildKnowledgeMindmap,
  normalizeMarkdown,
} from '../lib/answerSections';
import styles from './ChatBubble.module.css';

interface Props {
  message: Message;
}

export default memo(function ChatBubble({ message }: Props) {
  const { lang } = useT();
  const isUser = message.role === 'user';

  if (!isUser && !message.content) return null;

  /**
   * The tutor emits four `@@@` sections. When present, render the tabbed
   * four-panel view. While streaming, markers may be incomplete, so keep the
   * plain single-block renderer (with markers hidden) until the stream ends.
   * Anything without markers (casual chat, follow-ups, old-format history)
   * falls back to the original renderer — no blank screen, ever.
   */
  let sectioned = false;
  let fallbackMindmap = '';
  if (!isUser && !message.streaming && message.content) {
    const sections = parseAnswerSections(message.content);
    if (sections) {
      sectioned = true;
    } else {
      // Legacy / casual structured replies: keep the old auto-mindmap fallback.
      const hasMindmapBlock = /```mindmap/i.test(message.content);
      const isStructured = /^#{2,6}\s/m.test(message.content);
      if (!hasMindmapBlock && isStructured) {
        fallbackMindmap = buildKnowledgeMindmap(message.content);
      }
    }
  }

  /**
   * The tutor emits its mind map as a ```mindmap fenced code block. Intercept
   * it at the markdown layer so it becomes an interactive markmap SVG instead
   * of a raw code block.
   */
  const components: Components = {
    pre: ({ children }) => {
      const nodes: ReactNode[] = Array.isArray(children) ? children : [children];
      const hasMindmap = nodes.some(
        (node) => isValidElement(node) &&
          typeof node.props.className === 'string' &&
          node.props.className.toLowerCase().includes('language-mindmap'),
      );
      return hasMindmap ? <>{children}</> : <pre>{children}</pre>;
    },
    code: ({ className, children }) => {
      if (typeof className === 'string' && className.toLowerCase().includes('language-mindmap')) {
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
        ) : sectioned ? (
          <SectionedAnswer
            content={message.content}
            components={components}
            markdownClassName={styles.markdown}
          />
        ) : (
          <div className={`${styles.markdown} ${message.streaming ? styles.markdownStreaming : ''}`}>
            <Markdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={components}
            >
              {normalizeMarkdown(message.content)}
            </Markdown>
            {fallbackMindmap && (
              <MindmapView markdown={fallbackMindmap} streaming={false} />
            )}
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
