export const CUES = ["[PAUSA]", "[ÊNFASE]", "[RESPIRAR]", "[OLHAR PARA A PLATEIA]"] as const;
export const CUE_REGEX = /\[(PAUSA|ÊNFASE|ENFASE|RESPIRAR|OLHAR PARA A PLATEIA)\]/gi;
const SECTION_REGEX = /^##\s+(.*)$/gm;

/** Remove marcações e títulos de seção, deixando apenas o texto falado. */
export function spokenText(content: string): string {
  return content.replace(CUE_REGEX, " ").replace(/^##\s+/gm, "").replace(/\*\*/g, "");
}

export function countWords(content: string): number {
  const t = spokenText(content).trim();
  return t ? t.split(/\s+/).length : 0;
}

export function estimateDurationMs(content: string, wpm: number): number {
  const words = countWords(content);
  const pauses = (content.match(/\[(PAUSA|RESPIRAR)\]/gi) ?? []).length;
  return (words / Math.max(wpm, 1)) * 60_000 + pauses * 1200;
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export interface ScriptSection {
  title: string;
  body: string;
}

export function parseSections(content: string): ScriptSection[] {
  const matches = [...content.matchAll(SECTION_REGEX)];
  if (matches.length === 0) return [{ title: "Roteiro", body: content }];
  return matches.map((m, i) => {
    const start = (m.index ?? 0) + m[0].length;
    const end = i + 1 < matches.length ? (matches[i + 1]!.index ?? content.length) : content.length;
    return { title: (m[1] ?? "").trim(), body: content.slice(start, end).trim() };
  });
}

/** Palavras-chave para o modo treino (destaques **assim** ou termos mais relevantes). */
export function extractKeywords(text: string): string[] {
  const marked = [...text.matchAll(/\*\*(.+?)\*\*/g)].map((m) => m[1].trim());
  if (marked.length) return marked;
  const stop = new Set(
    "a o e de da do das dos que para com uma um em no na os as por se ao mais como mas não nós você sua seu isso este esta".split(
      " ",
    ),
  );
  const freq = new Map<string, number>();
  for (const w of spokenText(text).toLowerCase().match(/[\p{L}]{4,}/gu) ?? []) {
    if (stop.has(w)) continue;
    freq.set(w, (freq.get(w) ?? 0) + 1);
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([w]) => w);
}
