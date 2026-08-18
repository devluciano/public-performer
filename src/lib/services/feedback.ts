import type { FeedbackItem, SessionMetrics, TrainingSession } from "@/lib/domain/types";
import { formatDuration } from "@/lib/domain/text";

/**
 * Feedback heurístico local. A assinatura é assíncrona de propósito para que
 * uma análise por IA (Lovable AI) possa substituir esta implementação sem
 * alterar as telas.
 */
export async function generateFeedback(
  metrics: SessionMetrics,
  previous: TrainingSession | undefined,
): Promise<FeedbackItem[]> {
  const items: FeedbackItem[] = [];

  if (metrics.wpm >= 120 && metrics.wpm <= 160) {
    items.push({ kind: "forte", text: `Ritmo dentro da faixa ideal (${metrics.wpm} WPM) durante a maior parte da apresentação.` });
  } else if (metrics.wpm > 160) {
    items.push({ kind: "melhoria", text: `Velocidade média alta (${metrics.wpm} WPM). Trechos rápidos comprometem a clareza.` });
    items.push({ kind: "recomendacao", text: "Reduza a velocidade do teleprompter em 10% e articule as sílabas finais das frases." });
  } else if (metrics.wpm > 0) {
    items.push({ kind: "melhoria", text: `Velocidade média baixa (${metrics.wpm} WPM). A fala pode soar arrastada.` });
    items.push({ kind: "recomendacao", text: "Aumente levemente a velocidade e evite prolongar as vogais." });
  }

  if (metrics.rhythmVariation > 25) {
    items.push({ kind: "melhoria", text: "Variação significativa de ritmo entre os blocos do discurso." });
    items.push({ kind: "recomendacao", text: "Marque [PAUSA] no fim de cada bloco para reencontrar o ritmo." });
  } else if (metrics.rhythmVariation > 0) {
    items.push({ kind: "forte", text: "Ritmo consistente entre os blocos do roteiro." });
  }

  if (metrics.pauses === 0) {
    items.push({ kind: "melhoria", text: "Nenhuma pausa relevante foi identificada — a fala ficou contínua demais." });
    items.push({ kind: "recomendacao", text: "Faça uma pausa de 1–2 segundos após frases conclusivas." });
  } else if (metrics.avgPauseMs > 4000) {
    items.push({ kind: "melhoria", text: `Pausas longas demais (média de ${(metrics.avgPauseMs / 1000).toFixed(1)}s).` });
  } else {
    items.push({ kind: "forte", text: `Uso equilibrado de pausas (${metrics.pauses} pausas, média de ${(metrics.avgPauseMs / 1000).toFixed(1)}s).` });
  }

  if (metrics.completion >= 0.98) {
    items.push({ kind: "forte", text: "Roteiro concluído integralmente, sem interrupções finais." });
  } else {
    items.push({ kind: "melhoria", text: `Você concluiu ${Math.round(metrics.completion * 100)}% do roteiro.` });
  }

  if (previous) {
    const delta = metrics.score - previous.metrics.score;
    items.push({
      kind: delta >= 0 ? "forte" : "melhoria",
      text:
        delta >= 0
          ? `Evolução de ${delta} pontos em relação ao treino anterior (${formatDuration(previous.metrics.durationMs)}).`
          : `Queda de ${Math.abs(delta)} pontos em relação ao treino anterior. Repita o mesmo roteiro para consolidar.`,
    });
  }

  return items;
}
