import { useMemo, useState } from 'react';
import Markdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { useT } from '../i18n';
import MindmapView from './MindmapView';
import {
  SECTION_DEFS,
  parseAnswerSections,
  findMindmapBlock,
  buildKnowledgeMindmap,
  normalizeMarkdown,
  type SectionId,
} from '../lib/answerSections';
import styles from './SectionedAnswer.module.css';

interface Props {
  /** Full assistant reply (with @@@ section markers). */
  content: string;
  /** Shared react-markdown component overrides (mindmap fence interception). */
  components: Components;
  /** ChatBubble's markdown class so panels reuse the existing typography. */
  markdownClassName: string;
}

/** Remove a stray ```mindmap fence from a text section (the map lives in its own tab). */
function stripMindmapFence(text: string): string {
  return text.replace(/```mindmap[\s\S]*?```/gi, '').trim();
}

export default function SectionedAnswer({ content, components, markdownClassName }: Props) {
  const { lang } = useT();
  const sections = useMemo(() => parseAnswerSections(content) ?? [], [content]);
  const [active, setActive] = useState<SectionId>('knowledge');

  /**
   * The mind map belongs to the KNOWLEDGE part only. Prefer the model's
   * ```mindmap block (the backend already constrains it to knowledge); if the
   * model forgot it, rebuild one from the knowledge section's own headings.
   * Exam points / past papers / difficult points never feed the map.
   */
  const mindmapMarkdown = useMemo(() => {
    const block = findMindmapBlock(sections);
    if (block) return block;
    const knowledge = sections.find(s => s.id === 'knowledge');
    return knowledge ? buildKnowledgeMindmap(knowledge.body) : '';
  }, [sections]);

  const bodyById = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of sections) map.set(s.id, stripMindmapFence(s.body));
    return map;
  }, [sections]);

  const emptyText = lang === 'zh' ? '本板块暂无内容' : 'No content in this section';
  const mapEmptyText = lang === 'zh' ? '思维导图生成中…' : 'Generating mind map…';

  return (
    <div className={styles.wrap}>
      <div className={styles.tabs} role="tablist">
        {SECTION_DEFS.map(def => (
          <button
            key={def.id}
            type="button"
            role="tab"
            aria-selected={active === def.id}
            className={`${styles.tab} ${active === def.id ? styles.tabActive : ''}`}
            onClick={() => setActive(def.id)}
          >
            <span className={styles.tabIcon}>{def.icon}</span>
            <span>{def.title[lang]}</span>
          </button>
        ))}
      </div>

      <div className={`${markdownClassName} ${styles.panel}`} role="tabpanel">
        {active === 'mindmap' ? (
          mindmapMarkdown
            ? <MindmapView markdown={mindmapMarkdown} streaming={false} />
            : <p className={styles.emptyHint}>{mapEmptyText}</p>
        ) : (
          (() => {
            const body = bodyById.get(active) ?? '';
            return body
              ? <Markdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={components}
                >
                  {normalizeMarkdown(body)}
                </Markdown>
              : <p className={styles.emptyHint}>{emptyText}</p>;
          })()
        )}
      </div>
    </div>
  );
}
