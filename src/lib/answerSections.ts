/* ------------------------------------------------------------------ *
 * Four-panel answer parsing
 * ------------------------------------------------------------------ *
 * The tutor is asked to emit four sections, each introduced by a line
 * like `@@@ 知识梳理`. The chat UI turns those into tabs:
 *   📚 知识梳理            (pure knowledge — also the ONLY source for the map)
 *   🎯 广东考点 · 真题解析  (Guangdong exam points + past-paper questions + solutions)
 *   ⚠️ 重难点 · 易错点
 *   🧠 思维导图            (a ```mindmap fenced block)
 *
 * Models are not perfectly reliable, so parsing is deliberately tolerant:
 *   - marker line may carry markdown decoration / emoji / extra spaces
 *   - ANY of the four known markers being present switches to panel mode
 *   - if no known marker is found, parseAnswerSections() returns null and
 *     the caller falls back to the original single-block renderer (so casual
 *     chat, follow-ups and old-format history never break)
 * ------------------------------------------------------------------ */

export type SectionId = 'knowledge' | 'exam' | 'keypoints' | 'mindmap';

export interface SectionDef {
  id: SectionId;
  icon: string;
  title: { zh: string; en: string };
}

const KNOWLEDGE: SectionDef = {
  id: 'knowledge', icon: '📚',
  title: { zh: '知识梳理', en: 'Knowledge' },
};
const EXAM: SectionDef = {
  id: 'exam', icon: '🎯',
  title: { zh: '广东考点 · 真题解析', en: 'Exam Points & Past Papers' },
};
const KEYPOINTS: SectionDef = {
  id: 'keypoints', icon: '⚠️',
  title: { zh: '重难点 · 易错点', en: 'Key & Difficult Points' },
};
const MINDMAP: SectionDef = {
  id: 'mindmap', icon: '🧠',
  title: { zh: '思维导图', en: 'Mind Map' },
};

export const SECTION_DEFS: SectionDef[] = [KNOWLEDGE, EXAM, KEYPOINTS, MINDMAP];

export interface AnswerSection {
  id: SectionId;
  def: SectionDef;
  /** Markdown text belonging to this section (marker line excluded). */
  body: string;
}

/** Map a (possibly decorated) marker line to a known section. */
function classify(marker: string): SectionDef | null {
  if (/思维导图|mind\s?map/i.test(marker)) return MINDMAP;
  if (/真题|考点|考纲|专升本.*考/i.test(marker)) return EXAM;
  if (/重难点|易错|重点|难点/i.test(marker)) return KEYPOINTS;
  if (/知识|概念|梳理/i.test(marker)) return KNOWLEDGE;
  return null;
}

/**
 * Split an assistant reply into ordered sections.
 * Returns null when no known `@@@` marker is present (=> caller falls back).
 */
export function parseAnswerSections(content: string): AnswerSection[] | null {
  const lines = content.split('\n');
  const markerRe = /^\s*@@@\s*(.+?)\s*$/;
  const found: { def: SectionDef; start: number }[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const m = lines[i].match(markerRe);
    if (!m) continue;
    const def = classify(m[1]);
    if (def && !found.some(f => f.def.id === def.id)) {
      found.push({ def, start: i });
    }
  }

  if (found.length === 0) return null;

  // Body of a section runs until the NEXT marker line in the raw text.
  const byOrder: AnswerSection[] = found.map((f, idx) => {
    const end = idx + 1 < found.length ? found[idx + 1].start : lines.length;
    return {
      id: f.def.id,
      def: f.def,
      body: lines.slice(f.start + 1, end).join('\n').trim(),
    };
  });

  // Present sections always shown in the canonical tab order.
  const byId = new Map(byOrder.map(s => [s.id, s] as const));
  return SECTION_DEFS
    .filter(d => byId.has(d.id))
    .map(d => byId.get(d.id)!);
}

/** Extract the markdown inside a ```mindmap fenced block, if any. */
export function extractMindmapBlock(body: string): string | null {
  const m = body.match(/```mindmap\s*\n([\s\S]*?)```/i);
  return m ? m[1].trim() : null;
}

/** Search every section for a mindmap block (models sometimes misplace it). */
export function findMindmapBlock(sections: AnswerSection[]): string | null {
  for (const s of sections) {
    const block = extractMindmapBlock(s.body);
    if (block) return block;
  }
  return null;
}

/* ------------------------------------------------------------------ *
 * Markdown helpers (shared by ChatBubble and SectionedAnswer)
 * ------------------------------------------------------------------ */

const TABLE_ROW_BOUNDARY = /\|\s+\|/g;
const TABLE_SEPARATOR_ROW = /^\|\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/;

/** Some fast models emit a GFM table as one squashed line. Re-split it. */
function normalizeCompactTableLine(line: string): string {
  if (!line.includes('| |')) return line;
  const pipeIndexes = [...line.matchAll(/\|/g)]
    .map(match => match.index ?? -1)
    .filter(index => index >= 0);

  for (const index of pipeIndexes) {
    const table = line.slice(index);
    const normalizedTable = table.replace(TABLE_ROW_BOUNDARY, '|\n|');
    const rows = normalizedTable.split('\n').map(r => r.trim()).filter(Boolean);
    if (rows.length >= 2 && TABLE_SEPARATOR_ROW.test(rows[1])) {
      const prefix = line.slice(0, index).trimEnd();
      return prefix ? `${prefix}\n${normalizedTable}` : normalizedTable;
    }
  }
  return line;
}

export function normalizeMarkdown(content: string): string {
  let inCodeFence = false;
  return content
    .split('\n')
    .map(line => {
      if (/^\s*(```|~~~)/.test(line)) {
        inCodeFence = !inCodeFence;
        return line;
      }
      // `@@@ 板块名` lines are layout hints for the tabbed view. When a reply
      // is rendered as a single markdown block, hide them instead of leaking
      // raw markers into the visible text.
      if (!inCodeFence && /^\s*@@@/.test(line)) return '';
      return inCodeFence ? line : normalizeCompactTableLine(line);
    })
    .join('\n');
}

/* ------------------------------------------------------------------ *
 * Fallback mind map — built from the KNOWLEDGE section ONLY
 * ------------------------------------------------------------------ */
function cleanLabel(raw: string, max = 18): string {
  let text = raw
    .replace(/\*\*|__|`/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
  text = text.split(/[（(]/)[0].trim();
  text = text.split(/[。；;，,]/)[0].trim();
  if (text.length > max) text = `${text.slice(0, max)}…`;
  return text;
}

/**
 * Rebuild a mind map from structured markdown headings/bullets.
 * Callers pass ONLY the knowledge section (or a legacy structured reply),
 * so exam points / past papers / difficult points never leak into the map.
 */
export function buildKnowledgeMindmap(content: string): string {
  const out: string[] = ['# 📚 知识结构'];
  let inFence = false;
  let leavesUnderBranch = 0;

  for (const raw of content.split('\n')) {
    const line = raw.trim();
    if (/^```/.test(line)) { inFence = !inFence; continue; }
    if (inFence || !line) continue;

    const heading = line.match(/^#{2,6}\s+(.+)$/);
    if (heading) {
      let label = cleanLabel(heading[1], 22);
      if (/思维导图|mind\s?map/i.test(label)) {
        leavesUnderBranch = 0;
        continue;
      }
      if (label) {
        label = label.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]\s*/u, '').trim() || label;
        out.push(`## ${label}`);
        leavesUnderBranch = 0;
      }
      continue;
    }

    const li = line.match(/^(?:[-*•]|\d+[.)、])\s+(.+)$/);
    if (li && leavesUnderBranch < 4) {
      const label = cleanLabel(li[1]);
      if (label) {
        out.push(`### ${label}`);
        leavesUnderBranch += 1;
      }
    }
  }

  return out.length >= 3 ? out.join('\n') : '';
}
