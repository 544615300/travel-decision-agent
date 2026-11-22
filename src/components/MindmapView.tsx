import { useEffect, useRef, useState } from 'react';
import { useT } from '../i18n';
import styles from './MindmapView.module.css';

interface Props {
  /** Raw markdown text inside the ```mindmap code block */
  markdown: string;
  /** True while the assistant message is still streaming — show a placeholder */
  streaming: boolean;
}

/* markmap is loaded from CDN at runtime (not bundled), exposing
 * `window.markmap.Transformer` (parses markdown → tree) and
 * `window.markmap.Markmap` (renders the tree into an <svg>).
 * Multiple CDN sources for resilience — jsDelivr is occasionally
 * unreachable from mainland China, so we fall back to unpkg / npmmirror. */
const MARKMAP_SOURCES = [
  'https://cdn.jsdelivr.net/npm/markmap-autoloader@0.18/dist/index.js',
  'https://unpkg.com/markmap-autoloader@0.18/dist/index.js',
  'https://registry.npmmirror.com/markmap-autoloader/0.18.12/files/dist/index.js',
];

declare global {
  interface Window {
    markmap?: {
      autoLoader?: { manual?: boolean };
      Transformer: new () => { transform: (md: string) => { root: unknown } };
      Markmap: {
        create: (svg: SVGSVGElement, opts?: Record<string, unknown>) => {
          setData: (root: unknown) => void;
          fit: () => void;
        };
      };
    };
  }
}

/* Module-level cache so the script is fetched once per page load */
let markmapLoadPromise: Promise<void> | null = null;

function loadMarkmap(): Promise<void> {
  if (window.markmap?.Transformer && window.markmap?.Markmap) {
    return Promise.resolve();
  }
  if (!markmapLoadPromise) {
    // manual: true — stop the autoloader from DOM-scanning; we drive the API ourselves
    const mm = (window.markmap ?? {}) as NonNullable<Window['markmap']>;
    mm.autoLoader = { manual: true };
    window.markmap = mm;
    markmapLoadPromise = new Promise((resolve, reject) => {
      let index = 0;
      const tryNext = () => {
        if (index >= MARKMAP_SOURCES.length) {
          reject(new Error('All markmap CDN sources failed'));
          return;
        }
        const script = document.createElement('script');
        script.src = MARKMAP_SOURCES[index++];
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => {
          script.remove();
          tryNext();
        };
        document.head.appendChild(script);
      };
      tryNext();
    });
  }
  return markmapLoadPromise;
}

export default function MindmapView({ markdown, streaming }: Props) {
  const { t } = useT();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const mmRef = useRef<{ setData: (root: unknown) => void; fit: () => void } | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (streaming) return;

    let cancelled = false;
    loadMarkmap()
      .then(() => {
        if (cancelled) return;
        const markmap = window.markmap;
        const svg = svgRef.current;
        if (!markmap || !svg) {
          setFailed(true);
          return;
        }
        try {
          const transformer = new markmap.Transformer();
          const { root } = transformer.transform(markdown || '# 思维导图');
          if (cancelled) return;
          if (!mmRef.current) {
            mmRef.current = markmap.Markmap.create(svg, {
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
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
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
    // CDN unreachable or parse failure — degrade to a plain code block
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
