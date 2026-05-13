/**
 * Stamp — carimbo retangular vermilion da COSLU Labz, baseado no
 * `SealVarDate` (s.08) do brand-book. "Pra carimbar capa de slide, primeira
 * página de PDF, datasheet, certificado e commit message."
 *
 * Borda dupla vermilion + "BUILT · BY" mono + "COSLU LABZ" serif + linha +
 * "— MAY 2026 —" mono. Rotação leve (-3°).
 */

import { COLOR, FONT_DISPLAY, FONT_MONO } from "./tokens";

interface StampProps {
  /** Fator de escala (1 = brand book original, ~120px de largura). */
  scale?: number;
  /** Rotação em graus. Default -3° (brand book recomenda entre -3° e -5°). */
  rotate?: number;
  /** Texto da data — default 'MAY 2026'. */
  date?: string;
}

export function Stamp({
  scale = 1,
  rotate = -3,
  date = "MAY 2026",
}: StampProps): React.ReactElement {
  const v = COLOR.vermilion;

  return (
    <div
      aria-label="Built by COSLU Labz"
      title="Built by COSLU Labz"
      style={{
        border: `${3 * scale}px double ${v}`,
        padding: `${14 * scale}px ${24 * scale}px`,
        transform: `rotate(${rotate}deg)`,
        color: v,
        fontFamily: FONT_MONO,
        textAlign: "center",
        display: "inline-block",
        userSelect: "none",
        pointerEvents: "none",
        backgroundColor: "transparent",
      }}
    >
      <div
        style={{
          fontWeight: 700,
          fontSize: 12 * scale,
          letterSpacing: "0.32em",
          lineHeight: 1,
        }}
      >
        BUILT · BY
      </div>
      <div
        style={{
          fontFamily: FONT_DISPLAY,
          fontWeight: 800,
          fontSize: 32 * scale,
          letterSpacing: "-0.04em",
          lineHeight: 1,
          margin: `${6 * scale}px 0`,
        }}
      >
        COSLU LABZ
      </div>
      <div
        style={{
          width: "100%",
          height: 1,
          background: v,
          margin: `${6 * scale}px 0`,
        }}
      />
      <div
        style={{
          fontWeight: 700,
          fontSize: 11 * scale,
          letterSpacing: "0.32em",
          lineHeight: 1,
        }}
      >
        — {date} —
      </div>
    </div>
  );
}
