/**
 * Design tokens compartilhados entre Pill e Settings.
 * Mudanças aqui propagam pros dois lugares — fonte de verdade da identidade visual.
 */

export const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", "SF Pro Display", system-ui, sans-serif';

export const FONT_MONO =
  'ui-monospace, "SF Mono", "Cascadia Mono", "JetBrains Mono", Menlo, monospace';

export const COLOR = {
  // Quase sólido — Henrique preferiu menos transparência. Mantém só hint de
  // glass via backdrop-filter, mas a cor já cobre o que está atrás.
  bgGradient:
    "linear-gradient(180deg, rgba(28,28,36,0.985) 0%, rgba(18,18,24,0.995) 100%)",
  surfaceGradient:
    "linear-gradient(180deg, rgba(28,28,36,0.97) 0%, rgba(18,18,24,0.99) 100%)",
  borderSubtle: "rgba(255,255,255,0.10)",
  borderHairline: "rgba(255,255,255,0.06)",
  text: "#eef0f4",
  textMuted: "rgba(238,240,244,0.55)",
  textDim: "rgba(238,240,244,0.40)",
  inputBg: "rgba(255,255,255,0.04)",
  inputBgFocus: "rgba(255,255,255,0.07)",
  accent: {
    idle: "#7a7a85",
    recording: "#ff5a52",
    transcribing: "#ffb84d",
    ok: "#4ade80",
    error: "#ff9d4d",
    primary: "#4ade80", // botão save
  },
} as const;

export const RADIUS = {
  capsule: 999,
  card: 14,
  control: 8,
} as const;

export const SHADOW = {
  // Pill sem sombra externa — pedido do Henrique (estava feia "vazando").
  pill: "none",
  card: "0 6px 24px rgba(0,0,0,0.40)",
} as const;
