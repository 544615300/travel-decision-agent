import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
type MarkmapInstance = ReturnType<typeof Markmap.create>;

/**
 * The chat bubble is narrow, so a full mind map gets squashed and its labels
 * are clipped. This overlay re-renders the SAME markdown in a screen-sized
 * SVG, where markmap-view's built-in pan/zoom (mouse wheel + drag) is usable.
 * It is mounted through a portal on <body> so no ancestor overflow/clip or
 * transform can affect the fixed positioning.
 */
function MindmapModal({ markdown, onClose }: { markdown: string; onClose: () => void }) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const mmRef = useRef<MarkmapInstance | null>(null);

  const fit = useCallback(() => {
    // Wait a frame so the SVG has its final measured size before fitting.
    requestAnimationFrame(() => mmRef.current?.fit());
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    try {
      const { root } = transformer.transform(markdown || '# 思维导图');
      const mm = Markmap.create(svg, {
        duration: 300,
        maxWidth: 320,      // wider labels -> fewer awkward wraps on a big screen
        initialExpandLevel: -1,
      });
      mmRef.current = mm;
      mm.setData(root);
      fit();
    } catch {
      // The small preview already has its own failure fallback; nothing to do here.
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      (mmRef.current as unknown as { destroy?: () => void } | null)?.destroy?.();
      mmRef.current = null;
    };
  }, [markdown, onClose, fit]);

  return createPortal(
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="思维导图放大查看"
      >
        <div className={styles.modalBar}>
          <span className={styles.modalTitle}>🧠 思维导图 · 放大查看</span>
          <span className={styles.modalHint}>滚轮缩放 · 按住拖拽移动 · 点「复位」回到全图 · ESC 关闭</span>
          <div className={styles.modalActions}>
            <button type="button" className={styles.modalBtn} onClick={fit}>复位</button>
            <button type="button" className={styles.modalBtn} onClick={onClose}>关闭 ✕</button>
          </div>
        </div>
        <div className={styles.modalBody}>
          <svg ref={svgRef} className={styles.modalSvg} />
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default function MindmapView({ markdown, streaming }: Props) {
  const { t } = useT();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const mmRef = useRef<MarkmapInstance | null>(null);
  const [failed, setFailed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const close = useCallback(() => setExpanded(false), []);

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
      // Layout may still be settling when the stream ends; fit on the next frame.
      requestAnimationFrame(() => mmRef.current?.fit());
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
    <>
      <div className={styles.wrap}>
        <svg ref={svgRef} className={styles.svg} />
        <button
          type="button"
          className={styles.expandBtn}
          onClick={() => setExpanded(true)}
          title="放大查看（可滚轮缩放、拖拽）"
          aria-label="放大查看思维导图"
        >
          ⛶ 放大
        </button>
      </div>
      {expanded && <MindmapModal markdown={markdown} onClose={close} />}
    </>
  );
}
