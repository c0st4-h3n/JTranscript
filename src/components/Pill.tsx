/**
 * Pill — estilo Apple-like (capsule) que aparece no canto inferior direito
 * durante a sessão de ditação.
 *
 * - Forma: capsule full (border-radius = height/2)
 * - Fundo: gradient escuro + backdrop-filter blur
 * - Borda: 0.5px branca super sutil
 * - Glow embaixo colorido conforme estado
 * - VU: 3 dots verticais que escalam com o RMS
 * - Entrada: spring (CSS keyframes)
 */

import { useEffect, useRef, useState } from "react";
import type { FinalEvent, PartialEvent, ServerError } from "../lib/dictation-socket";
import { COLOR, FONT_STACK, RADIUS, SHADOW } from "../ui/tokens";

export type PasteState =
  | { kind: "idle" }
  | { kind: "pasting" }
  | { kind: "ok"; outcome: "paste" | "fallback"; focusRestored: boolean }
  | { kind: "error"; message: string };

export type PillVisualState =
  | { kind: "idle" }
  | { kind: "recording"; chunksSent: number; level: number }
  | { kind: "transcribing"; level: number }
  | { kind: "final"; final: FinalEvent; paste: PasteState }
  | { kind: "error"; message: string };

interface PillProps {
  state: PillVisualState;
  lastPartial: PartialEvent | null;
  serverError: ServerError | null;
}

const ACCENT = {
  idle: COLOR.accent.idle,
  recording: COLOR.accent.recording,
  transcribing: COLOR.accent.transcribing,
  ok: COLOR.accent.ok,
  error: COLOR.accent.error,
} as const;

export function Pill({ state, lastPartial, serverError }: PillProps): React.ReactElement {
  const accent = accentFor(state, serverError);
  const isRecording = state.kind === "recording";
  const level = vuLevel(state);

  // Re-mount key força a animação de entrada toda vez que a pill é mostrada.
  // Hide/show da window não desmonta o React; usamos `state.kind` como gatilho.
  const [entryKey, setEntryKey] = useState(0);
  const lastVisibleKindRef = useRef<string>("idle");
  useEffect(() => {
    const k = state.kind;
    if (k !== "idle" && lastVisibleKindRef.current === "idle") {
      setEntryKey((n) => n + 1);
    }
    lastVisibleKindRef.current = k;
  }, [state.kind]);

  return (
    <div
      key={entryKey}
      className="jarvs-pill"
      style={{
        height: "100vh",
        boxSizing: "border-box",
        padding: "0 18px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        color: COLOR.text,
        fontFamily: FONT_STACK,
        background: COLOR.surfaceGradient,
        border: `0.5px solid ${COLOR.borderSubtle}`,
        borderRadius: RADIUS.capsule,
        backdropFilter: "blur(20px) saturate(140%)",
        WebkitBackdropFilter: "blur(20px) saturate(140%)",
        // Drop shadow neutra (sem cor de estado vazando ao redor).
        // O sinal de cor fica só no `Dot` (interno) — pill no plano de fundo é elegante e estável.
        boxShadow: SHADOW.pill,
        overflow: "hidden",
      }}
    >
      <Dot color={accent} pulse={isRecording} />

      <VuDots level={level} accent={accent} active={state.kind !== "idle"} />

      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          lineHeight: 1.2,
        }}
      >
        <div
          style={{
            fontSize: 10,
            letterSpacing: 0.4,
            textTransform: "uppercase",
            opacity: 0.55,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {statusLabel(state, serverError)}
        </div>
        <div
          style={{
            fontSize: state.kind === "final" ? 13 : 12.5,
            fontWeight: state.kind === "final" ? 600 : 450,
            opacity: state.kind === "idle" ? 0.45 : 0.96,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {bodyText(state, lastPartial, serverError)}
        </div>
      </div>
    </div>
  );
}

function Dot({ color, pulse }: { color: string; pulse: boolean }): React.ReactElement {
  return (
    <span
      style={{
        position: "relative",
        width: 12,
        height: 12,
        borderRadius: 6,
        background: color,
        flexShrink: 0,
        boxShadow: `0 0 12px ${color}`,
        animation: pulse ? "jarvs-pulse 1.4s ease-in-out infinite" : undefined,
        transition: "background 200ms ease",
      }}
    />
  );
}

function VuDots({
  level,
  accent,
  active,
}: {
  level: number;
  accent: string;
  active: boolean;
}): React.ReactElement {
  // 3 dots verticais — alto central, baixos nas laterais (estilo Siri compacto).
  // Heights escalam com `level` (0-1) e ganham offset por índice pra criar relevo.
  const base = 4;
  const max = 20;
  const amp = Math.min(1, Math.max(0, level * 3.0));
  const heights = [
    base + amp * max * 0.65,
    base + amp * max * 1.0,
    base + amp * max * 0.65,
  ];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 3,
        flexShrink: 0,
        opacity: active ? 1 : 0.25,
        transition: "opacity 200ms ease",
      }}
    >
      {heights.map((h, i) => (
        <span
          key={i}
          style={{
            width: 3,
            height: h,
            background: accent,
            borderRadius: 1.5,
            transition: "height 80ms ease-out, background 200ms ease",
            boxShadow: `0 0 6px ${accent}40`,
          }}
        />
      ))}
    </div>
  );
}

function accentFor(state: PillVisualState, srvErr: ServerError | null): string {
  if (srvErr) return ACCENT.error;
  switch (state.kind) {
    case "recording":
      return ACCENT.recording;
    case "transcribing":
      return ACCENT.transcribing;
    case "final":
      if (state.paste.kind === "ok") return ACCENT.ok;
      if (state.paste.kind === "error") return ACCENT.error;
      return ACCENT.transcribing;
    case "error":
      return ACCENT.error;
    default:
      return ACCENT.idle;
  }
}

function vuLevel(state: PillVisualState): number {
  if (state.kind === "recording" || state.kind === "transcribing") return state.level;
  return 0;
}

function statusLabel(state: PillVisualState, srvErr: ServerError | null): string {
  if (srvErr) return `erro · ${srvErr.code}`;
  switch (state.kind) {
    case "recording":
      return `ouvindo · ${state.chunksSent}`;
    case "transcribing":
      return "transcrevendo";
    case "final":
      if (state.paste.kind === "pasting") return "colando";
      if (state.paste.kind === "ok") {
        const via = state.paste.outcome === "paste" ? "clipboard" : "sendinput";
        return `colado · ${via}`;
      }
      if (state.paste.kind === "error") return "falha ao colar";
      return "pronto";
    case "error":
      return "erro";
    default:
      return "aguardando · F8";
  }
}

function bodyText(
  state: PillVisualState,
  lastPartial: PartialEvent | null,
  srvErr: ServerError | null,
): string {
  if (srvErr) return srvErr.message;
  switch (state.kind) {
    case "recording":
      return lastPartial?.text ?? "fale agora...";
    case "transcribing":
      return lastPartial?.text ?? "...";
    case "final":
      if (state.paste.kind === "error") return state.paste.message;
      return state.final.textPolished ?? state.final.textRaw;
    case "error":
      return state.message;
    default:
      return "F8 pra ditar";
  }
}
