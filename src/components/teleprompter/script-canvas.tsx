import { forwardRef, useMemo } from "react";
import type { TeleprompterSettings, TrainingLevel } from "@/lib/domain/types";
import { CUE_REGEX, extractKeywords, parseSections } from "@/lib/domain/text";
import { cn } from "@/lib/utils";

interface Props {
  content: string;
  settings: TeleprompterSettings;
  level: TrainingLevel;
}

/** Renderiza o roteiro conforme o nível de treino escolhido. */
export const ScriptCanvas = forwardRef<HTMLDivElement, Props>(function ScriptCanvas(
  { content, settings, level },
  ref,
) {
  const sections = useMemo(() => parseSections(content), [content]);

  return (
    <div
      ref={ref}
      style={{
        fontSize: `${settings.fontSize}px`,
        lineHeight: settings.lineHeight,
        maxWidth: `${settings.readingWidth}%`,
        textAlign: settings.align,
      }}
      className="mx-auto w-full font-display font-medium"
    >
      {sections.map((section, i) => (
        <section key={i} className="mb-[1.4em]">
          {sections.length > 1 ? (
            <p className="mb-[0.4em] text-[0.42em] font-semibold uppercase tracking-[0.2em] opacity-50">
              {section.title}
            </p>
          ) : null}
          {level === "avancado" ? (
            <TopicsView body={section.body} />
          ) : (
            <ParagraphView body={section.body} blurred={level === "intermediario"} />
          )}
        </section>
      ))}
    </div>
  );
});

function TopicsView({ body }: { body: string }) {
  const keywords = extractKeywords(body);
  return (
    <ul className="space-y-[0.35em]">
      {keywords.map((k) => (
        <li key={k} className="before:mr-[0.4em] before:content-['•']">
          {k}
        </li>
      ))}
    </ul>
  );
}

function ParagraphView({ body, blurred }: { body: string; blurred: boolean }) {
  return (
    <>
      {body
        .split(/\n{2,}/)
        .filter(Boolean)
        .map((para, i) => (
          <p key={i} className="mb-[0.6em]">
            {tokenize(para).map((token, j) => {
              if (token.type === "cue")
                return (
                  <span
                    key={j}
                    className="mx-[0.2em] inline-block rounded-md border border-current/30 px-[0.3em] text-[0.45em] uppercase tracking-widest opacity-60 align-middle"
                  >
                    {token.value}
                  </span>
                );
              if (token.type === "strong")
                return (
                  <strong key={j} className="font-bold text-[var(--tp-guide)]">
                    {token.value}
                  </strong>
                );
              return (
                <span key={j} className={cn(blurred && "opacity-45 blur-[2.5px]")}>
                  {token.value}
                </span>
              );
            })}
          </p>
        ))}
    </>
  );
}

type Token = { type: "text" | "cue" | "strong"; value: string };

function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  const regex = new RegExp(`${CUE_REGEX.source}|\\*\\*(.+?)\\*\\*`, "gi");
  let last = 0;
  for (const match of text.matchAll(regex)) {
    const index = match.index ?? 0;
    if (index > last) tokens.push({ type: "text", value: text.slice(last, index) });
    if (match[2] !== undefined) tokens.push({ type: "strong", value: match[2] });
    else tokens.push({ type: "cue", value: match[0].replace(/[[\]]/g, "") });
    last = index + match[0].length;
  }
  if (last < text.length) tokens.push({ type: "text", value: text.slice(last) });
  return tokens;
}
