/**
 * Design tokens — COSLU Labz Brand v1.0.
 * "Academic Journal Brutalism" — paper + ink + accents quentes/profundos.
 *
 * Espelha `COSLU Labz/brand-tokens.css`. Atualizar lá primeiro e refletir aqui.
 */

export const FONT_DISPLAY =
  '"Newsreader", "Times New Roman", Georgia, serif';

export const FONT_MONO =
  '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace';

// Mantido pra compat com chamadas antigas; aponta pro display.
export const FONT_STACK = FONT_DISPLAY;

export const COLOR = {
  // PAPER & INK — surfaces
  paper: "#efe8d8", // primary surface (cream)
  paper2: "#e5dec9", // aged
  paper3: "#d9d1bf", // deep

  // Background gradient — para Settings; mantém superfície quase plana (brand-aligned).
  bgGradient:
    "linear-gradient(180deg, #efe8d8 0%, #e5dec9 100%)",
  surfaceGradient:
    "linear-gradient(180deg, #efe8d8 0%, #e5dec9 100%)",

  // Ink — texto
  ink: "#1a1a1a",
  inkMute: "#5a5147",
  inkFaint: "#8c8478",

  // Rule (1px ink) é o elemento gráfico do brand. Sem sombras.
  borderSubtle: "rgba(26,26,26,0.20)",
  borderHairline: "rgba(26,26,26,0.10)",
  borderInk: "#1a1a1a",

  // Surfaces de input
  inputBg: "rgba(26,26,26,0.04)",
  inputBgFocus: "rgba(26,26,26,0.07)",

  // Aliases pra compat com código que usa COLOR.text etc.
  text: "#1a1a1a",
  textMuted: "#5a5147",
  textDim: "#8c8478",

  // Accents semânticos mapeados na paleta journal
  accent: {
    idle: "#8c8478", // ink-faint
    recording: "#b8311e", // vermilion (alert/hot)
    transcribing: "#5a5147", // ink-mute (thinking)
    ok: "#1f3a8a", // cobalt (cool/deep)
    error: "#8a2516", // vermilion-d
    primary: "#1a1a1a", // ink — botão primário em paper
  },

  vermilion: "#b8311e",
  vermilionDark: "#8a2516",
  cobalt: "#1f3a8a",
  cobaltDark: "#142562",
} as const;

export const RADIUS = {
  // Brand é journal/print-like — usa formas honestas. Capsule pra pill,
  // arredondamento sutil pra cards/inputs.
  capsule: 999,
  card: 6,
  control: 4,
} as const;

export const SHADOW = {
  // Brand não usa sombras — borda 1px ink ("rule") é o elemento gráfico.
  pill: "none",
  card: "none",
} as const;

export const RULE = {
  thin: `1px solid ${COLOR.borderInk}`,
  mute: `1px solid ${COLOR.borderSubtle}`,
  thick: `3px solid ${COLOR.borderInk}`,
} as const;
