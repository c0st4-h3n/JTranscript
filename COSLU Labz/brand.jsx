// COSLU Labz · Brand artboards
// Academic Journal Brutalism — paper + ink + vermilion/cobalt
// All shared atoms first, then artboards organized by section.

const T = {
  paper:   '#efe8d8',
  paper2:  '#e5dec9',
  paper3:  '#d9d1bf',
  ink:     '#1a1a1a',
  inkMute: '#5a5147',
  inkFaint:'#8c8478',
  vermilion: '#b8311e',
  vermilionD:'#8a2516',
  cobalt:    '#1f3a8a',
  cobaltD:   '#142562',
  fSerif: "'Newsreader', Georgia, serif",
  fMono:  "'JetBrains Mono', ui-monospace, Menlo, monospace",
};

// ═══════════════════════════════════════════════════════════════
// ATOMS
// ═══════════════════════════════════════════════════════════════

// Rule — horizontal divider with optional caption on left/right
function Rule({ color = T.ink, weight = 1, style = {} }) {
  return <div style={{ width: '100%', height: weight, background: color, ...style }} />;
}

// Tag — small monospace footnote
function Tag({ children, color = T.inkMute, size = 10, style = {} }) {
  return (
    <span style={{
      fontFamily: T.fMono, fontSize: size, letterSpacing: '0.14em',
      textTransform: 'uppercase', color, ...style,
    }}>{children}</span>
  );
}

// Wordmark — heart of the system.
// Format: "COSLU" big in Newsreader Black, with optional ".LABZ" subscript or stacked.
function Wordmark({ size = 96, color = T.ink, sub = 'LABZ', mode = 'inline', italic = false }) {
  const tracking = italic ? '-0.02em' : '-0.04em';
  const subSize = Math.max(11, size * 0.135);
  if (mode === 'stack') {
    return (
      <div style={{ fontFamily: T.fSerif, fontWeight: 800, color, lineHeight: 0.86, fontStyle: italic ? 'italic' : 'normal' }}>
        <div style={{ fontSize: size, letterSpacing: tracking }}>COSLU</div>
        {sub && (
          <div style={{
            fontFamily: T.fMono, fontWeight: 700, fontSize: subSize,
            letterSpacing: '0.4em', marginTop: size * 0.18, paddingLeft: size * 0.04,
            color, fontStyle: 'normal',
          }}>{sub}</div>
        )}
      </div>
    );
  }
  // inline: COSLU<sub>LABZ</sub>
  return (
    <div style={{ display: 'inline-flex', alignItems: 'flex-end', gap: size * 0.18, color, lineHeight: 0.86 }}>
      <span style={{ fontFamily: T.fSerif, fontWeight: 800, fontSize: size, letterSpacing: tracking, fontStyle: italic ? 'italic' : 'normal' }}>COSLU</span>
      {sub && (
        <span style={{
          fontFamily: T.fMono, fontWeight: 700, fontSize: subSize,
          letterSpacing: '0.4em', paddingBottom: size * 0.08, color,
        }}>{sub}</span>
      )}
    </div>
  );
}

// Monogram CL — for favicon / avatar
function Monogram({ size = 80, color = T.ink, bg = 'transparent', accent = T.vermilion }) {
  const s = size;
  return (
    <div style={{
      width: s, height: s, background: bg, position: 'relative',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: T.fSerif, fontWeight: 800, color,
      letterSpacing: '-0.06em', lineHeight: 1,
    }}>
      <span style={{ fontSize: s * 0.72, position: 'relative' }}>
        C
        <span style={{ color: accent }}>L</span>
      </span>
    </div>
  );
}

// Document-style frame: index number top-left, tag top-right, content
function DocFrame({ vol = 'I', issue = '01', section, title, children, accent = T.ink, dark = false }) {
  const fg = dark ? T.paper : T.ink;
  const bg = dark ? T.ink : T.paper;
  return (
    <div style={{
      width: '100%', height: '100%', background: bg, color: fg,
      padding: 28, boxSizing: 'border-box', position: 'relative',
      fontFamily: T.fSerif, display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Tag color={dark ? T.inkFaint : T.inkMute}>
          coslu.labz / vol.{vol} · iss.{issue}
        </Tag>
        <Tag color={accent} style={{ fontWeight: 700 }}>{section}</Tag>
      </div>
      <Rule color={fg} style={{ marginTop: 10, marginBottom: 18 }} />
      {title && (
        <div style={{ fontFamily: T.fSerif, fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em', marginBottom: 14 }}>
          {title}
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  );
}

// Color chip with hex + role
function ColorChip({ name, hex, role, fg, height = 180, w = 1 }) {
  return (
    <div style={{ flex: w, background: hex, color: fg, padding: 16, height, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' }}>
      <div>
        <Tag color={fg} style={{ opacity: 0.7 }}>{role}</Tag>
      </div>
      <div>
        <div style={{ fontFamily: T.fSerif, fontWeight: 700, fontSize: 22, letterSpacing: '-0.02em', lineHeight: 1 }}>{name}</div>
        <div style={{ fontFamily: T.fMono, fontSize: 11, marginTop: 6, opacity: 0.85 }}>{hex}</div>
      </div>
    </div>
  );
}

// Striped placeholder for imagery
function Placeholder({ label = 'image', height = 160, color = T.ink, style = {} }) {
  return (
    <div className="ph-stripe" style={{ height, color, ...style }}>
      // {label}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECTION 1 — IDENTITY / COVER
// ═══════════════════════════════════════════════════════════════

function Cover() {
  return (
    <div className="paper-bg" style={{
      width: '100%', height: '100%', position: 'relative', boxSizing: 'border-box',
      padding: '44px 48px', display: 'flex', flexDirection: 'column',
      fontFamily: T.fSerif, color: T.ink, overflow: 'hidden',
    }}>
      {/* header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Tag>coslu.labz / brand book / v.0.1</Tag>
        <Tag>May 2026 · São Paulo · BR</Tag>
      </div>
      <Rule style={{ marginTop: 10 }} />

      {/* center title */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24, marginBottom: 22 }}>
          <Wordmark size={180} mode="stack" sub="LABZ" />
          <div style={{
            marginLeft: 'auto', marginBottom: 6, maxWidth: 360, textAlign: 'right',
            fontFamily: T.fSerif, fontStyle: 'italic', fontWeight: 400,
            fontSize: 18, lineHeight: 1.35, color: T.ink,
          }}>
            <span style={{ color: T.vermilion, fontWeight: 700, fontStyle: 'normal' }}>¶</span>{' '}
            Um coletivo de mentes técnicas <br/>
            construindo em público — automação,<br/>
            IA aplicada e software aberto.
          </div>
        </div>

        <Rule color={T.ink} style={{ height: 3 }} />

        <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
          {[
            ['C', 'Code'],
            ['O', 'Open Source'],
            ['L', 'Logic'],
            ['U', 'Utility'],
          ].map(([k, v]) => (
            <div key={k} style={{ borderLeft: `2px solid ${T.ink}`, paddingLeft: 12 }}>
              <div style={{ fontFamily: T.fSerif, fontWeight: 800, fontSize: 28, color: T.vermilion, letterSpacing: '-0.04em', lineHeight: 1 }}>{k}</div>
              <div style={{ fontFamily: T.fMono, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 6, color: T.ink }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* footer */}
      <Rule />
      <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between' }}>
        <Tag>fig. 0.0 — cover</Tag>
        <Tag>§ identity · type · color · application</Tag>
        <Tag>pp. 01 / 24</Tag>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECTION 2 — LOGO SYSTEM
// ═══════════════════════════════════════════════════════════════

// 2.1 — primary horizontal lockup
function LogoPrimary() {
  return (
    <DocFrame vol="I" issue="01" section="§ 2.1 PRIMARY">
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <Wordmark size={140} mode="inline" sub="LABZ" />
        <div style={{ marginTop: 22, fontFamily: T.fMono, fontSize: 11, letterSpacing: '0.3em', color: T.inkMute, textTransform: 'uppercase' }}>
          code · open source · logic · utility
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Tag>fig. 2.1 — horizontal lockup</Tag>
        <Tag>Newsreader 800 · JetBrains Mono 700</Tag>
      </div>
    </DocFrame>
  );
}

// 2.2 — vertical stack
function LogoStack() {
  return (
    <DocFrame vol="I" issue="01" section="§ 2.2 STACK">
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Wordmark size={130} mode="stack" sub="LABZ" />
      </div>
      <Tag>fig. 2.2 — vertical stack</Tag>
    </DocFrame>
  );
}

// 2.3 — inverse on ink
function LogoInverse() {
  return (
    <DocFrame vol="I" issue="01" section="§ 2.3 INVERSE" dark accent={T.vermilion}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Wordmark size={140} mode="inline" sub="LABZ" color={T.paper} />
        <div style={{ marginTop: 22, fontFamily: T.fMono, fontSize: 11, letterSpacing: '0.3em', color: T.inkFaint, textTransform: 'uppercase' }}>
          // night build
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Tag color={T.inkFaint}>fig. 2.3 — inverse on ink</Tag>
        <Tag color={T.vermilion}>dark mode primary</Tag>
      </div>
    </DocFrame>
  );
}

// 2.4 — monogram / mark
function LogoMonogram() {
  return (
    <DocFrame vol="I" issue="01" section="§ 2.4 MARK">
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <div style={{ position: 'relative', width: 280, height: 280, border: `3px solid ${T.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* crosshair marks */}
          {['tl','tr','bl','br'].map(p => (
            <span key={p} style={{
              position: 'absolute', fontFamily: T.fMono, fontSize: 14, color: T.inkMute,
              ...(p[0]==='t' ? { top: -10 } : { bottom: -10 }),
              ...(p[1]==='l' ? { left: -10 } : { right: -10 }),
            }}>+</span>
          ))}
          <div style={{ fontFamily: T.fSerif, fontWeight: 800, fontSize: 200, letterSpacing: '-0.08em', lineHeight: 1, color: T.ink }}>
            C<span style={{ color: T.vermilion }}>L</span>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Tag>fig. 2.4 — favicon mark</Tag>
        <Tag>2×1 grid · C ink / L vermilion</Tag>
      </div>
    </DocFrame>
  );
}

// 2.5 — construction grid
function LogoConstruction() {
  return (
    <DocFrame vol="I" issue="01" section="§ 2.5 CONSTRUCTION">
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* grid lines */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            linear-gradient(to right, ${T.vermilion}22 1px, transparent 1px),
            linear-gradient(to bottom, ${T.vermilion}22 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
        }} />
        {/* baseline + cap-height + x-height rules */}
        <div style={{ position: 'absolute', left: 30, right: 30, top: '38%', borderTop: `1px dashed ${T.vermilion}`, opacity: 0.6 }}>
          <span style={{ position: 'absolute', right: 0, top: -14, fontFamily: T.fMono, fontSize: 9, color: T.vermilion }}>cap</span>
        </div>
        <div style={{ position: 'absolute', left: 30, right: 30, bottom: '38%', borderTop: `1px dashed ${T.vermilion}`, opacity: 0.6 }}>
          <span style={{ position: 'absolute', right: 0, top: 2, fontFamily: T.fMono, fontSize: 9, color: T.vermilion }}>baseline</span>
        </div>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <Wordmark size={120} mode="inline" sub="LABZ" />
        </div>
        {/* dim markers */}
        <span style={{ position: 'absolute', left: 30, top: 30, fontFamily: T.fMono, fontSize: 10, color: T.cobalt }}>x = 24px</span>
        <span style={{ position: 'absolute', right: 30, top: 30, fontFamily: T.fMono, fontSize: 10, color: T.cobalt }}>tracking -0.04em</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Tag>fig. 2.5 — construction</Tag>
        <Tag color={T.vermilion}>grid module = 24px</Tag>
      </div>
    </DocFrame>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECTION 2.5 — LOGO LAB (variations)
// ═══════════════════════════════════════════════════════════════

function LabFrame({ id, name, note, children, bg = T.paper, fg = T.ink }) {
  return (
    <div style={{ width: '100%', height: '100%', background: bg, color: fg, padding: 22, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', position: 'relative', fontFamily: T.fSerif }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Tag color={fg === T.ink ? T.inkMute : T.inkFaint}>{id} — {name}</Tag>
        <Tag color={fg === T.ink ? T.inkMute : T.inkFaint}>variant</Tag>
      </div>
      <Rule color={fg} style={{ marginTop: 8 }} />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 0' }}>
        {children}
      </div>
      <Rule color={fg} />
      <div style={{ marginTop: 6 }}><Tag color={fg === T.ink ? T.inkMute : T.inkFaint}>{note}</Tag></div>
    </div>
  );
}

// v1 — Baseline (current)
function LogoVarBaseline() {
  return (
    <LabFrame id="v.01" name="baseline" note="Newsreader 800 + L vermilion + LABZ mono sub. Current.">
      <Wordmark size={86} mode="inline" sub="LABZ" />
    </LabFrame>
  );
}

// v2 — Rule lockup
function LogoVarRule() {
  return (
    <LabFrame id="v.02" name="rule lockup" note="COSLU ──── LABZ. Manuscrito academic.">
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
        <span style={{ fontFamily: T.fSerif, fontWeight: 800, fontSize: 84, letterSpacing: '-0.04em', color: T.ink, lineHeight: 0.9 }}>
          COSLU
        </span>
        <span style={{ display: 'inline-block', width: 64, height: 3, background: T.ink, transform: 'translateY(-14px)' }} />
        <span style={{ fontFamily: T.fSerif, fontWeight: 800, fontStyle: 'italic', fontSize: 60, letterSpacing: '-0.03em', color: T.vermilion, lineHeight: 0.9 }}>
          labz
        </span>
      </div>
    </LabFrame>
  );
}

// v3 — Period
function LogoVarPeriod() {
  return (
    <LabFrame id="v.03" name="period" note="Pausa antes do laboratório. Mínimo e firme.">
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, lineHeight: 0.9 }}>
        <span style={{ fontFamily: T.fSerif, fontWeight: 800, fontSize: 92, letterSpacing: '-0.04em', color: T.ink }}>
          coslu
        </span>
        <span style={{ display: 'inline-block', width: 14, height: 14, background: T.vermilion, marginBottom: 6 }} />
        <span style={{ fontFamily: T.fSerif, fontWeight: 800, fontSize: 92, letterSpacing: '-0.04em', color: T.ink }}>
          labz
        </span>
      </div>
    </LabFrame>
  );
}

// v4 — Italic display
function LogoVarItalic() {
  return (
    <LabFrame id="v.04" name="italic display" note="Newsreader 800 italic. Op-ed / editorial vibe.">
      <div style={{ fontFamily: T.fSerif, fontWeight: 800, fontStyle: 'italic', fontSize: 92, letterSpacing: '-0.03em', lineHeight: 0.9, color: T.ink }}>
        <span>coslu</span>
        <span style={{ color: T.vermilion }}>·</span>
        <span>labz</span>
      </div>
    </LabFrame>
  );
}

// v5 — Mono only (terminal voice)
function LogoVarMono() {
  return (
    <LabFrame id="v.05" name="terminal" note="Tudo em JetBrains Mono. Pra dev tools / CLI.">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <div style={{ fontFamily: T.fMono, fontWeight: 700, fontSize: 56, letterSpacing: '-0.04em', color: T.ink, lineHeight: 1 }}>
          <span style={{ color: T.inkMute }}>[</span>coslu<span style={{ color: T.vermilion }}>/</span>labz<span style={{ color: T.inkMute }}>]</span>
        </div>
        <div style={{ fontFamily: T.fMono, fontWeight: 500, fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: T.inkMute }}>
          $ build --in-public
        </div>
      </div>
    </LabFrame>
  );
}

// v6 — Spaced caps (journal cover)
function LogoVarSpaced() {
  return (
    <LabFrame id="v.06" name="journal cover" note="C·O·S·L·U letter-spaced. Capa de periódico.">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <div style={{ fontFamily: T.fSerif, fontWeight: 700, fontSize: 54, letterSpacing: '0.32em', color: T.ink, lineHeight: 1, paddingLeft: '0.32em' }}>
          COSLU
        </div>
        <div style={{ width: 240, height: 1, background: T.ink }} />
        <div style={{ fontFamily: T.fMono, fontWeight: 500, fontSize: 13, letterSpacing: '0.4em', color: T.vermilion, textTransform: 'uppercase' }}>
          — LABZ —
        </div>
      </div>
    </LabFrame>
  );
}

// v7 — Year stamp
function LogoVarYear() {
  return (
    <LabFrame id="v.07" name="year stamp" note="COSLU'26 — marca + ano fundação. Stamp-like.">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, lineHeight: 0.9 }}>
        <span style={{ fontFamily: T.fSerif, fontWeight: 800, fontSize: 96, letterSpacing: '-0.04em', color: T.ink }}>COSLU</span>
        <span style={{ fontFamily: T.fSerif, fontWeight: 800, fontStyle: 'italic', fontSize: 38, color: T.vermilion, marginTop: 4 }}>'26</span>
      </div>
    </LabFrame>
  );
}

// v8 — Stamp / seal (circular)
function LogoVarSeal() {
  const R = 110;
  const chars = 'COSLU·LABZ·CODE·OPEN·SOURCE·LOGIC·UTIL·';
  return (
    <LabFrame id="v.08" name="seal" note="Marca circular tipo selo. Pra carimbo / commits.">
      <div style={{ width: R*2, height: R*2, position: 'relative' }}>
        <svg viewBox="-130 -130 260 260" width={R*2} height={R*2} style={{ position: 'absolute', inset: 0 }}>
          <circle r="120" fill="none" stroke={T.ink} strokeWidth="2" />
          <circle r="108" fill="none" stroke={T.ink} strokeWidth="1" />
          <defs>
            <path id="seal-path" d="M 0,0 m -114,0 a 114,114 0 1,1 228,0 a 114,114 0 1,1 -228,0" />
          </defs>
          <text fill={T.ink} style={{ fontFamily: T.fMono, fontSize: 13, letterSpacing: '0.2em', fontWeight: 700 }}>
            <textPath href="#seal-path" startOffset="0">{chars + chars}</textPath>
          </text>
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <div style={{ fontFamily: T.fSerif, fontWeight: 800, fontSize: 38, letterSpacing: '-0.04em', color: T.ink, lineHeight: 1 }}>
            C<span style={{ color: T.vermilion }}>L</span>
          </div>
          <div style={{ width: 50, height: 1, background: T.ink }} />
          <div style={{ fontFamily: T.fMono, fontWeight: 700, fontSize: 10, letterSpacing: '0.3em', color: T.ink }}>EST 2026</div>
        </div>
      </div>
    </LabFrame>
  );
}

// ═══════════════════════════════════════════════════════════════
// SEAL LAB — variations of v.08
// ═══════════════════════════════════════════════════════════════

// SealCore — reusable circular seal w/ outer text on path
function SealCore({
  size = 220,
  ringColor = T.ink,
  innerColor = T.ink,
  textColor = T.ink,
  accent = T.vermilion,
  ringText = 'COSLU·LABZ·CODE·OPEN·SOURCE·LOGIC·UTIL·',
  rings = 2,
  center,
  centerKind = 'CL',
  rotate = 0,
  textSize = 13,
  textWeight = 700,
  bg = 'transparent',
}) {
  const pid = React.useId();
  return (
    <div style={{ width: size, height: size, position: 'relative', background: bg, borderRadius: '50%', transform: `rotate(${rotate}deg)` }}>
      <svg viewBox="-130 -130 260 260" width={size} height={size} style={{ position: 'absolute', inset: 0 }}>
        {rings >= 1 && <circle r="122" fill="none" stroke={ringColor} strokeWidth="2" />}
        {rings >= 2 && <circle r="108" fill="none" stroke={ringColor} strokeWidth="1" />}
        {rings >= 3 && <circle r="96" fill="none" stroke={ringColor} strokeWidth="1" strokeDasharray="2 4" />}
        <defs>
          <path id={`seal-${pid}`} d="M 0,0 m -114,0 a 114,114 0 1,1 228,0 a 114,114 0 1,1 -228,0" />
        </defs>
        <text fill={textColor} style={{ fontFamily: T.fMono, fontSize: textSize, letterSpacing: '0.2em', fontWeight: textWeight }}>
          <textPath href={`#seal-${pid}`} startOffset="0">{ringText + ringText}</textPath>
        </text>
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, transform: `rotate(${-rotate}deg)` }}>
        {center || (
          centerKind === 'CL' ? (
            <>
              <div style={{ fontFamily: T.fSerif, fontWeight: 800, fontSize: size * 0.18, letterSpacing: '-0.04em', color: innerColor, lineHeight: 1 }}>
                C<span style={{ color: accent }}>L</span>
              </div>
              <div style={{ width: size * 0.22, height: 1, background: innerColor, opacity: 0.6 }} />
              <div style={{ fontFamily: T.fMono, fontWeight: 700, fontSize: Math.max(7, size * 0.045), letterSpacing: '0.3em', color: innerColor }}>EST 2026</div>
            </>
          ) : centerKind === 'COSLU' ? (
            <>
              <div style={{ fontFamily: T.fSerif, fontWeight: 800, fontSize: size * 0.10, letterSpacing: '-0.03em', color: innerColor, lineHeight: 1 }}>COSLU</div>
              <div style={{ fontFamily: T.fMono, fontWeight: 700, fontSize: Math.max(7, size * 0.04), letterSpacing: '0.3em', color: accent, marginTop: 2 }}>LABZ</div>
            </>
          ) : null
        )}
      </div>
    </div>
  );
}

// s.01 — baseline (current v.08)
function SealVarBaseline() {
  return (
    <LabFrame id="s.01" name="baseline" note="Selo original. Anel duplo + CL monogram.">
      <SealCore size={240} />
    </LabFrame>
  );
}

// s.02 — inverse (paper on ink) — REFINED v2:
//   • Sweep flags fixed (top arc = sweep=1, bottom arc = sweep=0 in SVG Y-down)
//   • Top: backronym (meaning) · Bottom: brand with LABZ in vermilion
//   • Separate radii per arc so both text bands sit symmetrically inside outer ring
//   • Cleaner ring system: single thick outer ring + tick separators at 3/9 o'clock
function SealVarInverse() {
  const pid = React.useId();
  const size = 380;
  const vb = 180;
  const rOuter = 170;          // thick outer ring
  const rOuterThin = 161;      // thin inner liner
  const rTopPath = 138;        // top text radiates OUTWARD from here (band ~138-150)
  const rBotPath = 150;        // bottom text radiates INWARD from here  (band ~138-150)
  const tickR = 156;           // vermilion separator dots at 3/9 o'clock
  return (
    <LabFrame
      id="s.02"
      name="inverse — official badge"
      bg={T.ink}
      fg={T.paper}
      note="Top arc: backronym (significado). Bottom arc: marca, LABZ em vermilion. Texto upright nos dois arcos."
    >
      <div style={{ width: size, height: size, position: 'relative' }}>
        <svg viewBox={`-${vb} -${vb} ${vb*2} ${vb*2}`} width={size} height={size}>
          {/* concentric rings — thick outer + thin inner liner */}
          <circle r={rOuter}     fill="none" stroke={T.paper} strokeWidth="2.5" />
          <circle r={rOuterThin} fill="none" stroke={T.paper} strokeWidth="0.8" opacity="0.55" />

          {/* vermilion tick separators @ 3 & 9 o'clock divide top/bottom text */}
          <circle cx={-tickR} cy={0} r="4" fill={T.vermilion} />
          <circle cx={ tickR} cy={0} r="4" fill={T.vermilion} />

          <defs>
            {/* TOP arc visually — sweep=1 traces the upper half (SVG Y-down means
                +angle direction = clockwise = up first when starting at -r,0).
                Path direction at apex is +X, so glyphs render upright. */}
            <path id={`top-${pid}`}
              d={`M ${-rTopPath},0 A ${rTopPath},${rTopPath} 0 0,1 ${rTopPath},0`} />
            {/* BOTTOM arc visually — sweep=0 traces the lower half. Path direction at
                apex is also +X (entering apex going right), so glyphs upright. */}
            <path id={`bot-${pid}`}
              d={`M ${-rBotPath},0 A ${rBotPath},${rBotPath} 0 0,0 ${rBotPath},0`} />
          </defs>

          {/* TOP — backronym (the meaning of COSLU) */}
          <text fill={T.paper}
            style={{ fontFamily: T.fMono, fontSize: 12, letterSpacing: '0.24em', fontWeight: 700 }}>
            <textPath href={`#top-${pid}`} startOffset="50%" textAnchor="middle">
              CODE · OPEN SOURCE · LOGIC · UTILITY
            </textPath>
          </text>

          {/* BOTTOM — brand. LABZ in vermilion echoes the L in the center monogram. */}
          <text fill={T.paper}
            style={{ fontFamily: T.fMono, fontSize: 17, letterSpacing: '0.32em', fontWeight: 700 }}>
            <textPath href={`#bot-${pid}`} startOffset="50%" textAnchor="middle">
              COSLU · <tspan fill={T.vermilion}>LABZ</tspan>
            </textPath>
          </text>
        </svg>

        {/* center mark — CL monogram + EST 2026 */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <div style={{ fontFamily: T.fSerif, fontWeight: 800, fontSize: 108, letterSpacing: '-0.06em', color: T.paper, lineHeight: 1 }}>
            C<span style={{ color: T.vermilion }}>L</span>
          </div>
          <div style={{ width: 76, height: 1, background: T.paper, opacity: 0.4 }} />
          <div style={{ fontFamily: T.fMono, fontWeight: 700, fontSize: 11, letterSpacing: '0.34em', color: T.paper }}>EST · 2026</div>
        </div>
      </div>
    </LabFrame>
  );
}

// s.03 — vermilion ink stamp (rotated, official look)
function SealVarVermilion() {
  return (
    <LabFrame id="s.03" name="red ink stamp" note="Carimbo de tinta vermelha. Pra 'aprovado por'.">
      <div style={{ filter: 'contrast(0.95)', opacity: 0.94 }}>
        <SealCore
          size={230}
          ringColor={T.vermilion}
          innerColor={T.vermilion}
          textColor={T.vermilion}
          accent={T.vermilion}
          rotate={-5}
          ringText='APPROVED·BY·COSLU·LABZ·'
        />
      </div>
    </LabFrame>
  );
}

// s.04 — triple ring (more detail / official feel)
function SealVarTriple() {
  return (
    <LabFrame id="s.04" name="triple ring" note="3 anéis com pontilhado. Vibe notarial.">
      <SealCore
        size={250}
        rings={3}
        ringText='C·O·S·L·U·CODE·OPEN·SOURCE·LOGIC·UTIL·'
      />
    </LabFrame>
  );
}

// s.05 — wax seal (solid filled)
function SealVarWax() {
  return (
    <LabFrame id="s.05" name="wax seal" note="Sólido, emboss. Pra documentos / convites.">
      <div style={{
        width: 220, height: 220, borderRadius: '50%',
        background: `radial-gradient(circle at 35% 30%, ${T.vermilion}, ${T.vermilionD} 65%, #5a1408)`,
        boxShadow: 'inset 0 -8px 18px rgba(0,0,0,0.35), inset 0 6px 14px rgba(255,255,255,0.18), 0 4px 12px rgba(0,0,0,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transform: 'rotate(-3deg)', position: 'relative',
      }}>
        <div style={{ position: 'absolute', inset: 14, borderRadius: '50%', border: `1.5px solid rgba(255,235,210,0.4)` }} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: '#ffe2c8' }}>
          <div style={{ fontFamily: T.fSerif, fontWeight: 800, fontSize: 56, letterSpacing: '-0.06em', lineHeight: 1, textShadow: '0 1px 0 rgba(0,0,0,0.3)' }}>
            CL
          </div>
          <div style={{ width: 38, height: 1, background: '#ffe2c8', opacity: 0.6 }} />
          <div style={{ fontFamily: T.fMono, fontWeight: 700, fontSize: 9, letterSpacing: '0.3em' }}>EST 2026</div>
        </div>
      </div>
    </LabFrame>
  );
}

// s.06 — hexagonal seal
function SealVarHex() {
  const pid = React.useId();
  return (
    <LabFrame id="s.06" name="hexagon" note="Geométrico. Mais 'engineering badge'.">
      <div style={{ width: 240, height: 240, position: 'relative' }}>
        <svg viewBox="-130 -130 260 260" width={240} height={240} style={{ position: 'absolute', inset: 0 }}>
          <polygon points="0,-120 104,-60 104,60 0,120 -104,60 -104,-60" fill="none" stroke={T.ink} strokeWidth="2" />
          <polygon points="0,-100 87,-50 87,50 0,100 -87,50 -87,-50" fill="none" stroke={T.ink} strokeWidth="1" />
          <defs>
            <path id={`hex-${pid}`} d="M 0,0 m -114,0 a 114,114 0 1,1 228,0 a 114,114 0 1,1 -228,0" />
          </defs>
          <text fill={T.ink} style={{ fontFamily: T.fMono, fontSize: 12, letterSpacing: '0.25em', fontWeight: 700 }}>
            <textPath href={`#hex-${pid}`} startOffset="0">COSLU·LABZ·ENGINEERING·COSLU·LABZ·ENGINEERING·</textPath>
          </text>
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <div style={{ fontFamily: T.fSerif, fontWeight: 800, fontSize: 44, letterSpacing: '-0.04em', color: T.ink, lineHeight: 1 }}>
            C<span style={{ color: T.vermilion }}>L</span>
          </div>
          <div style={{ fontFamily: T.fMono, fontWeight: 700, fontSize: 9, letterSpacing: '0.3em', color: T.ink, marginTop: 4 }}>EST 2026</div>
        </div>
      </div>
    </LabFrame>
  );
}

// s.07 — scalloped notary edge
function SealVarNotary() {
  const pid = React.useId();
  const scallop = [];
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    scallop.push(<circle key={i} cx={Math.cos(a) * 118} cy={Math.sin(a) * 118} r="6" fill={T.paper} stroke={T.ink} strokeWidth="1" />);
  }
  return (
    <LabFrame id="s.07" name="notary" note="Borda denteada estilo cartório. Mais formal.">
      <div style={{ width: 250, height: 250, position: 'relative' }}>
        <svg viewBox="-130 -130 260 260" width={250} height={250} style={{ position: 'absolute', inset: 0 }}>
          {scallop}
          <circle r="118" fill="none" stroke={T.ink} strokeWidth="1" />
          <circle r="102" fill="none" stroke={T.ink} strokeWidth="1.5" />
          <defs>
            <path id={`not-${pid}`} d="M 0,0 m -108,0 a 108,108 0 1,1 216,0 a 108,108 0 1,1 -216,0" />
          </defs>
          <text fill={T.ink} style={{ fontFamily: T.fMono, fontSize: 11, letterSpacing: '0.25em', fontWeight: 700 }}>
            <textPath href={`#not-${pid}`} startOffset="0">CERTIFIED·BUILT·IN·PUBLIC·CERTIFIED·BUILT·IN·PUBLIC·</textPath>
          </text>
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
          <div style={{ fontFamily: T.fSerif, fontWeight: 800, fontSize: 38, letterSpacing: '-0.04em', color: T.ink, lineHeight: 1 }}>
            C<span style={{ color: T.vermilion }}>L</span>
          </div>
          <div style={{ width: 44, height: 1, background: T.ink, opacity: 0.5 }} />
          <div style={{ fontFamily: T.fMono, fontWeight: 700, fontSize: 8, letterSpacing: '0.3em', color: T.ink }}>SÃO PAULO · BR</div>
        </div>
      </div>
    </LabFrame>
  );
}

// s.08 — rectangular date stamp
function SealVarDate() {
  return (
    <LabFrame id="s.08" name="date stamp" note="Carimbo retangular tipo 'received'.">
      <div style={{
        border: `3px double ${T.vermilion}`, padding: '14px 24px',
        transform: 'rotate(-3deg)',
        color: T.vermilion, fontFamily: T.fMono,
        textAlign: 'center',
      }}>
        <div style={{ fontWeight: 700, fontSize: 12, letterSpacing: '0.32em' }}>BUILT · BY</div>
        <div style={{ fontFamily: T.fSerif, fontWeight: 800, fontSize: 32, letterSpacing: '-0.04em', lineHeight: 1, margin: '6px 0' }}>
          COSLU LABZ
        </div>
        <div style={{ width: '100%', height: 1, background: T.vermilion, margin: '6px 0' }} />
        <div style={{ fontWeight: 700, fontSize: 11, letterSpacing: '0.32em' }}>— MAY 2026 —</div>
      </div>
    </LabFrame>
  );
}

// SEAL APPLICATIONS — the seal at various scales / uses
function SealInTheWild() {
  return (
    <div className="paper-bg" style={{ width: '100%', height: '100%', boxSizing: 'border-box', padding: 30, fontFamily: T.fSerif, color: T.ink, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Tag>s.⋆ — in the wild</Tag>
        <Tag color={T.vermilion}>scale test</Tag>
      </div>
      <Rule style={{ marginTop: 8, marginBottom: 18 }} />
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, alignItems: 'stretch' }}>
        {/* watermark mode */}
        <div style={{ position: 'relative', background: T.paper2, padding: 14, overflow: 'hidden', border: `1px solid ${T.ink}` }}>
          <div style={{ position: 'absolute', right: -40, top: -30, opacity: 0.08 }}>
            <SealCore size={220} />
          </div>
          <Tag>watermark</Tag>
          <div style={{ marginTop: 8, fontFamily: T.fMono, fontSize: 10, color: T.inkMute, lineHeight: 1.6 }}>
            // commit log<br/>
            feat: queue v2<br/>
            fix: race in worker<br/>
            chore: deps bump<br/>
            docs: README
          </div>
        </div>
        {/* commit signature */}
        <div style={{ background: T.paper, padding: 14, border: `1px solid ${T.ink}`, display: 'flex', flexDirection: 'column' }}>
          <Tag>commit sig</Tag>
          <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            <SealCore size={56} centerKind="COSLU" textSize={6} />
            <div>
              <div style={{ fontFamily: T.fMono, fontWeight: 700, fontSize: 11 }}>signed-off-by:</div>
              <div style={{ fontFamily: T.fMono, fontSize: 10, color: T.inkMute }}>coslu.labz · a3f1c</div>
            </div>
          </div>
        </div>
        {/* certificate */}
        <div style={{ background: T.paper, padding: 14, border: `1px solid ${T.ink}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <Tag>cert</Tag>
          <SealCore size={92} />
          <div style={{ fontFamily: T.fMono, fontSize: 9, letterSpacing: '0.18em', color: T.inkMute, textTransform: 'uppercase' }}>open source · mit</div>
        </div>
        {/* favicon scale */}
        <div style={{ background: T.paper, padding: 14, border: `1px solid ${T.ink}`, display: 'flex', flexDirection: 'column' }}>
          <Tag>favicon scale</Tag>
          <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'flex-end', gap: 10 }}>
            <SealCore size={16} textSize={4} />
            <SealCore size={32} textSize={6} />
            <SealCore size={48} textSize={8} />
            <SealCore size={72} textSize={10} />
          </div>
          <div style={{ marginTop: 8, fontFamily: T.fMono, fontSize: 9, color: T.inkMute, letterSpacing: '0.1em' }}>16 · 32 · 48 · 72px</div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECTION 3 — SUB-MARCAS
// ═══════════════════════════════════════════════════════════════

function SubBrand({ name, accent, descriptor, glyph, dark }) {
  const fg = dark ? T.paper : T.ink;
  const bg = dark ? T.ink : T.paper;
  return (
    <div style={{
      width: '100%', height: '100%', background: bg, color: fg,
      padding: 28, boxSizing: 'border-box', display: 'flex', flexDirection: 'column',
      fontFamily: T.fSerif, position: 'relative',
    }} className={dark ? 'ink-bg' : 'paper-bg'}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Tag color={dark ? T.inkFaint : T.inkMute}>coslu / sub-mark</Tag>
        <Tag color={accent} style={{ fontWeight: 700 }}>{descriptor}</Tag>
      </div>
      <Rule color={fg} style={{ marginTop: 10 }} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {/* small parent mark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ fontFamily: T.fSerif, fontWeight: 800, fontSize: 22, letterSpacing: '-0.04em' }}>COSLU</span>
          <span style={{ fontFamily: T.fMono, fontSize: 11, letterSpacing: '0.2em', opacity: 0.6 }}>/</span>
        </div>
        {/* big vertical name */}
        <div style={{ fontFamily: T.fSerif, fontWeight: 800, fontSize: 76, letterSpacing: '-0.04em', lineHeight: 0.9, color: accent }}>
          {name}
        </div>
        <div style={{ marginTop: 14, fontFamily: T.fMono, fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', color: fg }}>
          {glyph}
        </div>
      </div>

      <Rule color={fg} />
      <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
        <Tag color={dark ? T.inkFaint : T.inkMute}>vertical / {name.toLowerCase()}</Tag>
        <Tag color={accent}>accent → {accent}</Tag>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECTION 4 — SYSTEM
// ═══════════════════════════════════════════════════════════════

function PaletteSheet() {
  return (
    <DocFrame vol="I" issue="02" section="§ 4.1 PALETTE — JOURNAL">
      {/* top row: paper, ink */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 2 }}>
        <ColorChip name="Paper"   hex="#efe8d8" role="surface · primary"  fg={T.ink}    w={2} />
        <ColorChip name="Paper II" hex="#e5dec9" role="surface · secondary" fg={T.ink}   w={1} />
        <ColorChip name="Ink"     hex="#1a1a1a" role="text · primary"     fg={T.paper}  w={2} />
        <ColorChip name="Ink mute" hex="#5a5147" role="text · footnote"    fg={T.paper} w={1} />
      </div>
      <div style={{ display: 'flex', gap: 0, marginBottom: 16 }}>
        <ColorChip name="Vermilion" hex="#b8311e" role="accent · brand"  fg={T.paper} w={3} />
        <ColorChip name="Cobalt"    hex="#1f3a8a" role="accent · cool"   fg={T.paper} w={3} />
      </div>
      {/* allocation bar */}
      <div style={{ marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Tag>allocation in the wild</Tag>
        <Tag>60 / 30 / 7 / 3</Tag>
      </div>
      <div style={{ display: 'flex', height: 18, marginBottom: 8 }}>
        <div style={{ flex: 60, background: T.paper, borderRight: `1px solid ${T.ink}` }} />
        <div style={{ flex: 30, background: T.ink }} />
        <div style={{ flex: 7,  background: T.vermilion }} />
        <div style={{ flex: 3,  background: T.cobalt }} />
      </div>
      <Rule />
      <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
        <Tag>fig. 4.1 — JOURNAL palette</Tag>
        <Tag>WCAG: ink-on-paper 14.3:1 · vermilion-on-paper 4.6:1</Tag>
      </div>
    </DocFrame>
  );
}

function TypeSheet() {
  return (
    <DocFrame vol="I" issue="02" section="§ 4.2 TYPOGRAPHY">
      <div style={{ display: 'flex', gap: 24, flex: 1 }}>
        {/* left: display */}
        <div style={{ flex: 1.4, borderRight: `1px solid ${T.ink}`, paddingRight: 24, display: 'flex', flexDirection: 'column' }}>
          <Tag style={{ marginBottom: 4 }}>display · headline</Tag>
          <div style={{ fontFamily: T.fSerif, fontWeight: 800, fontSize: 92, letterSpacing: '-0.04em', lineHeight: 0.9, color: T.ink }}>
            Newsreader
          </div>
          <div style={{ fontFamily: T.fSerif, fontWeight: 400, fontStyle: 'italic', fontSize: 26, color: T.inkMute, marginTop: 4, lineHeight: 1.1 }}>
            Aa Bb Cc — &amp; — “quote”
          </div>
          <Rule color={T.ink} style={{ marginTop: 16, marginBottom: 12 }} />
          <div style={{ fontFamily: T.fSerif, fontSize: 14, lineHeight: 1.55, color: T.ink, textWrap: 'pretty' }}>
            Newsreader é uma serifa contemporânea desenhada para textos de pesquisa.
            Usada em pesos <b>800</b> para títulos, <b>600</b> para subtítulos e <b>400</b> /
            <i> italic 400</i> para corpo. <span style={{ color: T.vermilion, fontWeight: 600 }}>Vermilion</span> e
            <span style={{ color: T.cobalt, fontWeight: 600 }}> Cobalt</span> entram como tinta acidental
            — destaque ou citação, nunca decoração.
          </div>
          <div style={{ marginTop: 'auto', display: 'flex', gap: 16, paddingTop: 12 }}>
            {['400','600','800'].map(w => (
              <div key={w} style={{ flex: 1 }}>
                <div style={{ fontFamily: T.fSerif, fontWeight: w, fontSize: 32, lineHeight: 1, letterSpacing: '-0.02em' }}>Ag</div>
                <Tag style={{ marginTop: 4 }}>weight {w}</Tag>
              </div>
            ))}
          </div>
        </div>

        {/* right: mono */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Tag style={{ marginBottom: 4 }}>technical · ui · code</Tag>
          <div style={{ fontFamily: T.fMono, fontWeight: 700, fontSize: 38, letterSpacing: '-0.02em', lineHeight: 1, color: T.ink }}>
            JetBrains<br/>Mono
          </div>
          <Rule color={T.ink} style={{ marginTop: 16, marginBottom: 12 }} />
          <div style={{ fontFamily: T.fMono, fontSize: 12, lineHeight: 1.6, color: T.ink, background: T.paper2, padding: '12px 14px' }}>
            <span style={{ color: T.inkMute }}>// system.tokens</span><br/>
            <span style={{ color: T.cobalt }}>const</span> brand = {`{`}<br/>
            &nbsp;&nbsp;name: <span style={{ color: T.vermilion }}>'coslu.labz'</span>,<br/>
            &nbsp;&nbsp;year: 2026,<br/>
            &nbsp;&nbsp;mode: <span style={{ color: T.vermilion }}>'journal'</span>,<br/>
            {`}`};
          </div>
          <div style={{ marginTop: 'auto', display: 'flex', gap: 12, paddingTop: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: T.fMono, fontWeight: 400, fontSize: 22 }}>Ag</div>
              <Tag style={{ marginTop: 4 }}>400</Tag>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: T.fMono, fontWeight: 500, fontSize: 22 }}>Ag</div>
              <Tag style={{ marginTop: 4 }}>500</Tag>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: T.fMono, fontWeight: 700, fontSize: 22 }}>Ag</div>
              <Tag style={{ marginTop: 4 }}>700</Tag>
            </div>
          </div>
        </div>
      </div>
      <Rule style={{ marginTop: 14 }}/>
      <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
        <Tag>fig. 4.2 — pairing</Tag>
        <Tag>display: Newsreader / technical: JetBrains Mono</Tag>
      </div>
    </DocFrame>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECTION 5 — APPLICATIONS
// ═══════════════════════════════════════════════════════════════

function BizCardFront() {
  return (
    <div className="paper-bg" style={{ width: '100%', height: '100%', boxSizing: 'border-box', padding: 30, fontFamily: T.fSerif, color: T.ink, position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Tag>fig. 5.1 — recto</Tag>
        <Tag color={T.vermilion}>nº 00042</Tag>
      </div>
      <Rule style={{ marginTop: 8 }} />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
        <Wordmark size={88} mode="stack" sub="LABZ" />
      </div>
      <Rule />
      <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
        <Tag>research · build · ship</Tag>
        <Tag>coslu.io</Tag>
      </div>
    </div>
  );
}

function BizCardBack() {
  return (
    <div style={{ width: '100%', height: '100%', background: T.ink, color: T.paper, boxSizing: 'border-box', padding: 30, fontFamily: T.fSerif, position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Tag color={T.inkFaint}>fig. 5.2 — verso</Tag>
        <Tag color={T.vermilion}>contact card</Tag>
      </div>
      <Rule color={T.paper} style={{ marginTop: 8 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ fontFamily: T.fSerif, fontWeight: 700, fontSize: 26, letterSpacing: '-0.02em', lineHeight: 1.05 }}>
          Founder Name
        </div>
        <div style={{ fontFamily: T.fSerif, fontStyle: 'italic', fontSize: 15, color: T.inkFaint, marginTop: 4 }}>
          ¶ research · build · ship
        </div>
        <div style={{ marginTop: 18, fontFamily: T.fMono, fontSize: 11, lineHeight: 1.7, color: T.paper }}>
          <div><span style={{ color: T.inkFaint }}>email →</span> hi@coslu.io</div>
          <div><span style={{ color: T.inkFaint }}>web   →</span> coslu.io</div>
          <div><span style={{ color: T.inkFaint }}>git   →</span> github.com/coslu</div>
          <div><span style={{ color: T.inkFaint }}>tel   →</span> +55 11 9 ████-████</div>
        </div>
      </div>
      <Rule color={T.paper} />
      <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
        <Tag color={T.inkFaint}>C · O · S · L · U</Tag>
        <Tag color={T.inkFaint}>est. 2026 / SP / BR</Tag>
      </div>
    </div>
  );
}

function Avatars() {
  return (
    <DocFrame vol="I" issue="03" section="§ 5.3 AVATAR SET">
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: 20 }}>
        {/* favicon 32 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 64, height: 64, background: T.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}>
            <span style={{ fontFamily: T.fSerif, fontWeight: 800, fontSize: 38, letterSpacing: '-0.06em', lineHeight: 1, color: T.paper }}>
              C<span style={{ color: T.vermilion }}>L</span>
            </span>
          </div>
          <Tag>favicon · 32px</Tag>
        </div>
        {/* GitHub avatar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 110, height: 110, background: T.paper, border: `2px solid ${T.ink}`, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
            <span style={{ fontFamily: T.fSerif, fontWeight: 800, fontSize: 56, letterSpacing: '-0.06em', lineHeight: 1, color: T.ink }}>
              C<span style={{ color: T.vermilion }}>L</span>
            </span>
          </div>
          <Tag>github · 110px</Tag>
        </div>
        {/* X / social avatar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 110, height: 110, background: T.vermilion, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: T.fSerif, fontWeight: 800, fontSize: 60, letterSpacing: '-0.06em', lineHeight: 1, color: T.paper }}>
              C<span style={{ color: T.ink }}>L</span>
            </span>
          </div>
          <Tag>social · solid</Tag>
        </div>
        {/* full wordmark badge */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 110, height: 110, background: T.paper, border: `2px solid ${T.ink}`, padding: 10, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Wordmark size={26} mode="stack" sub="LABZ" />
          </div>
          <Tag>profile · stack</Tag>
        </div>
      </div>
      <Rule />
      <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
        <Tag>fig. 5.3 — avatar set</Tag>
        <Tag>square · circular · monogram · stacked</Tag>
      </div>
    </DocFrame>
  );
}

function SocialBanner() {
  return (
    <div style={{ width: '100%', height: '100%', background: T.ink, color: T.paper, boxSizing: 'border-box', padding: '32px 48px', position: 'relative', display: 'flex', flexDirection: 'column', fontFamily: T.fSerif }} className="ink-bg">
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Tag color={T.inkFaint}>coslu.labz / social header / 1500×500</Tag>
        <Tag color={T.vermilion}>// open for collab</Tag>
      </div>
      <Rule color={T.paper} style={{ marginTop: 10 }} />

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 40 }}>
        <div style={{ flex: 1 }}>
          <Wordmark size={160} mode="stack" sub="LABZ" color={T.paper} />
        </div>
        <div style={{ flex: 1, borderLeft: `1px solid ${T.inkFaint}`, paddingLeft: 28 }}>
          <div style={{ fontFamily: T.fSerif, fontStyle: 'italic', fontWeight: 400, fontSize: 22, lineHeight: 1.35, color: T.paper, textWrap: 'pretty' }}>
            <span style={{ color: T.vermilion, fontStyle: 'normal', fontWeight: 700 }}>¶</span> Coletivo
            de mentes técnicas construindo em público — automação, IA aplicada e software aberto.
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 18 }}>
            {['games','oss','platform','research'].map(v => (
              <div key={v} style={{ fontFamily: T.fMono, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.inkFaint }}>
                <span style={{ color: T.vermilion }}>/</span> {v}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Rule color={T.paper} />
      <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
        <Tag color={T.inkFaint}>C · O · S · L · U</Tag>
        <Tag color={T.inkFaint}>est. 2026 · SP · BR</Tag>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECTION 6 — LANDING HERO
// ═══════════════════════════════════════════════════════════════

function LandingHero() {
  return (
    <div className="paper-bg" style={{ width: '100%', height: '100%', boxSizing: 'border-box', fontFamily: T.fSerif, color: T.ink, display: 'flex', flexDirection: 'column' }}>
      {/* nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 40px', borderBottom: `1px solid ${T.ink}` }}>
        <Wordmark size={28} mode="inline" sub="LABZ" />
        <div style={{ display: 'flex', gap: 28, fontFamily: T.fMono, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          <span>work</span>
          <span>open source</span>
          <span>games</span>
          <span>writing</span>
          <span>contact</span>
        </div>
        <div style={{ fontFamily: T.fMono, fontSize: 11, color: T.inkMute, padding: '6px 10px', border: `1px solid ${T.ink}` }}>
          <span style={{ color: T.vermilion }}>●</span>&nbsp; accepting briefs
        </div>
      </div>

      {/* hero body */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '36px 40px', gap: 48 }}>
        {/* left */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Tag>vol. I · iss. 01 · may 2026</Tag>
          <div style={{ marginTop: 16, fontFamily: T.fSerif, fontWeight: 800, fontSize: 84, lineHeight: 0.92, letterSpacing: '-0.04em' }}>
            We&nbsp;ship<br/>
            <span style={{ color: T.vermilion, fontStyle: 'italic', fontWeight: 600 }}>artifacts</span>,<br/>
            not&nbsp;decks.
          </div>
          <div style={{ marginTop: 22, fontFamily: T.fSerif, fontSize: 18, lineHeight: 1.5, color: T.ink, maxWidth: 480, textWrap: 'pretty' }}>
            Um coletivo de engenharia que constrói automação,
            IA aplicada e plataforma — e <i>publica o caminho</i>:{' '}
            <span style={{ borderBottom: `2px solid ${T.vermilion}` }}>código aberto, papers e devlogs</span>.
          </div>
          <div style={{ marginTop: 28, display: 'flex', gap: 12 }}>
            <button style={{ fontFamily: T.fMono, fontSize: 13, fontWeight: 600, padding: '14px 22px', background: T.ink, color: T.paper, border: 'none', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}>
              Start a brief →
            </button>
            <button style={{ fontFamily: T.fMono, fontSize: 13, fontWeight: 500, padding: '14px 22px', background: 'transparent', color: T.ink, border: `1.5px solid ${T.ink}`, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}>
              Browse OSS
            </button>
          </div>

          <div style={{ marginTop: 'auto', display: 'flex', gap: 14, paddingTop: 24, borderTop: `1px dashed ${T.inkMute}` }}>
            {[
              ['41', 'OSS repos'],
              ['12', 'platforms shipped'],
              ['7',  'games in lab'],
              ['∞',  'curiosity'],
            ].map(([n, l]) => (
              <div key={l} style={{ flex: 1 }}>
                <div style={{ fontFamily: T.fSerif, fontWeight: 800, fontSize: 32, lineHeight: 1, letterSpacing: '-0.03em' }}>{n}</div>
                <Tag style={{ marginTop: 4 }}>{l}</Tag>
              </div>
            ))}
          </div>
        </div>

        {/* right: pretend-paper card */}
        <div style={{ background: T.paper2, border: `1px solid ${T.ink}`, padding: 24, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Tag color={T.vermilion}>// case · automation</Tag>
            <Tag>fig. 1</Tag>
          </div>
          <div style={{ marginTop: 8, fontFamily: T.fSerif, fontWeight: 700, fontSize: 24, lineHeight: 1.15, letterSpacing: '-0.02em' }}>
            Cutting a 4-hour ops loop down to 11 minutes with one queue and one model.
          </div>
          <Placeholder label="diagram · pipeline overview" height={140} style={{ marginTop: 14 }} />
          <div style={{ marginTop: 14, fontFamily: T.fMono, fontSize: 11, lineHeight: 1.7, color: T.ink, background: T.paper3, padding: '10px 12px' }}>
            <span style={{ color: T.inkMute }}>$ </span>coslu run --pipeline ops/triage<br/>
            <span style={{ color: T.cobalt }}>→</span> queue: <b>ready</b> · workers: <b>8</b><br/>
            <span style={{ color: T.cobalt }}>→</span> model: <b>fine-tuned-v3</b><br/>
            <span style={{ color: T.vermilion }}>✓</span> 1,204 tickets resolved <span style={{ color: T.inkMute }}>(11m 04s)</span>
          </div>
          <div style={{ marginTop: 'auto', paddingTop: 14, display: 'flex', justifyContent: 'space-between' }}>
            <Tag>read the devlog →</Tag>
            <Tag color={T.vermilion}>open source</Tag>
          </div>
        </div>
      </div>

      {/* footer ribbon */}
      <div style={{ background: T.ink, color: T.paper, padding: '14px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: T.fMono, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
        <span>C · O · S · L · U</span>
        <span style={{ color: T.inkFaint }}>code · open source · logic · utility</span>
        <span>est. 2026 / SP / BR</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════

Object.assign(window, {
  T,
  Wordmark, Monogram, DocFrame, Tag, Rule, ColorChip, Placeholder, SubBrand,
  Cover,
  LogoPrimary, LogoStack, LogoInverse, LogoMonogram, LogoConstruction,
  LabFrame, LogoVarBaseline, LogoVarRule, LogoVarPeriod, LogoVarItalic,
  LogoVarMono, LogoVarSpaced, LogoVarYear, LogoVarSeal,
  SealCore, SealVarBaseline, SealVarInverse, SealVarVermilion, SealVarTriple,
  SealVarWax, SealVarHex, SealVarNotary, SealVarDate, SealInTheWild,
  PaletteSheet, TypeSheet,
  BizCardFront, BizCardBack, Avatars, SocialBanner,
  LandingHero,
});
