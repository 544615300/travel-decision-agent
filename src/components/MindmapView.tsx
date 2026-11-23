import { useEffect, useRef, useState } from 'react';
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';
import { useT } from '../i18n';
import styles from './MindmapView.module.css';

interface Props {
  /** Raw markdown text inside the ```mindmap code block */
  markdown: string;
  /** True while the assistant message is still streaming — show a placeholder */
  streaming: boolean;
}

/* markmap-lib + markmap-view are bundled at build time (no CDN at runtime),
 * so the mind map renders regardless of the user's network environment. */
const transformer = new Transformer();

export default function MindmapView({ markdown, streaming }: Props) {
  const { t } = useT();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const mmRef = useRef<ReturnType<typeof Markmap.create> | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (streaming) return;

    const svg = svgRef.current;
    if (!svg) return;

    try {
      const { root } = transformer.transform(markdown || '# 思维导图');
      if (!mmRef.current) {
        mmRef.current = Markmap.create(svg, {
          duration: 300,
          maxWidth: 240,
          initialExpandLevel: -1,
        });
      }
      mmRef.current.setData(root);
      mmRef.current.fit();
    } catch {
      setFailed(true);
    }
  }, [markdown, streaming]);

  if (streaming) {
    return (
      <div className={styles.wrap}>
        <span className={styles.spinner} />
        <span className={styles.placeholder}>{t('mindmap.generating')}</span>
      </div>
    );
  }

  if (failed) {
    // Parse failure — degrade to a plain code block
    return (
      <pre className={styles.fallback}>
        <code>{markdown}</code>
      </pre>
    );
  }

  return (
    <div className={styles.wrap}>
      <svg ref={svgRef} className={styles.svg} />
    </div>
  );
}
