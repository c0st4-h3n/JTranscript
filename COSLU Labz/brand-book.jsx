// COSLU Labz · BrandBook
// Single source-of-truth document. Loads on brand-book.html.
// Reuses atoms from brand.jsx + site.jsx (MiniSeal, Wordmark, Tag, Rule, etc.)

// ─────────────────────────────────────────────────────────────
// SHARED LOCAL ATOMS
// ─────────────────────────────────────────────────────────────

function BBSection({ index, kicker, title, children, dark = false, id }) {
  const fg = dark ? T.paper : T.ink;
  const muted = dark ? T.inkFaint : T.inkMute;
  const bg = dark ? T.ink : T.paper;
  return (
    <section id={id} style={{ background: bg, color: fg, padding: '80px 64px', borderBottom: `1px solid ${fg}` }} className={dark ? 'ink-bg' : 'paper-bg'}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 18 }}>
        <span style={{ fontFamily: T.fMono, fontSize: 14, color: T.vermilion, fontWeight: 700, letterSpacing: '0.2em' }}>§ {index}</span>
        <div style={{ height: 1, flex: 1, background: fg, opacity: 0.3 }} />
        <span style={{ fontFamily: T.fMono, fontSize: 12, color: muted, letterSpacing: '0.18em', textTransform: 'uppercase' }}>{kicker}</span>
      </div>
      <div style={{ fontFamily: T.fSerif, fontWeight: 800, fontSize: 64, letterSpacing: '-0.04em', lineHeight: 0.96, marginBottom: 36, textWrap: 'balance', maxWidth: 900, color: fg }}>
        {title}
      </div>
      {children}
    </section>
  );
}

function BBLabel({ children, dark = false }) {
  return (
    <span style={{
      fontFamily: T.fMono, fontSize: 11, letterSpacing: '0.18em',
      textTransform: 'uppercase', color: dark ? T.inkFaint : T.inkMute, fontWeight: 600,
    }}>{children}</span>
  );
}

function CodeBlock({ children, lang = '', dark = false }) {
  return (
    <div style={{
      background: dark ? '#0a0a0a' : T.ink,
      color: T.paper, fontFamily: T.fMono, fontSize: 13, lineHeight: 1.65,
      padding: '18px 22px', overflow: 'auto',
      border: `1px solid ${dark ? T.inkFaint : T.ink}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingBottom: 8, borderBottom: `1px solid ${T.inkFaint}` }}>
        <span style={{ fontSize: 10, letterSpacing: '0.2em', color: T.inkFaint }}>// {lang}</span>
        <span style={{ fontSize: 10, color: T.inkFaint, letterSpacing: '0.1em' }}>copy</span>
      </div>
      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 'inherit', color: 'inherit' }}>{children}</pre>
    </div>
  );
}

// Do / Don't pair
function DoDont({ doIt, dont, children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
      <div style={{ background: T.paper2, border: `1px solid ${T.ink}`, padding: 18, position: 'relative' }}>
        <div style={{ position: 'absolute', top: -10, left: 14, background: T.paper, padding: '2px 10px', fontFamily: T.fMono, fontSize: 11, color: T.ink, fontWeight: 700, letterSpacing: '0.2em', border: `1px solid ${T.ink}` }}>
          ✓ DO
        </div>
        <div style={{ marginTop: 10, fontFamily: T.fSerif, fontSize: 15, lineHeight: 1.45, color: T.ink, textWrap: 'pretty' }}>{doIt}</div>
        {children && children[0]}
      </div>
      <div style={{ background: T.paper2, border: `1px solid ${T.vermilion}`, padding: 18, position: 'relative' }}>
        <div style={{ position: 'absolute', top: -10, left: 14, background: T.paper, padding: '2px 10px', fontFamily: T.fMono, fontSize: 11, color: T.vermilion, fontWeight: 700, letterSpacing: '0.2em', border: `1px solid ${T.vermilion}` }}>
          ✗ DON'T
        </div>
        <div style={{ marginTop: 10, fontFamily: T.fSerif, fontSize: 15, lineHeight: 1.45, color: T.ink, textWrap: 'pretty' }}>{dont}</div>
        {children && children[1]}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 00 — COVER
// ─────────────────────────────────────────────────────────────

function BBCover() {
  return (
    <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '56px 64px', boxSizing: 'border-box' }} className="paper-bg">
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Tag>coslu.labz / brand book / v.1.0</Tag>
        <Tag>May 2026 · São Paulo · BR</Tag>
      </div>
      <Rule style={{ marginTop: 10 }} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 60, alignItems: 'center' }}>
          <div>
            <Wordmark size={220} mode="stack" sub="LABZ" />
            <div style={{ marginTop: 36, fontFamily: T.fSerif, fontStyle: 'italic', fontWeight: 400, fontSize: 26, lineHeight: 1.4, color: T.ink, maxWidth: 600 }}>
              <span style={{ color: T.vermilion, fontWeight: 700, fontStyle: 'normal' }}>¶</span>{' '}
              Tudo o que você precisa pra criar com a identidade da COSLU Labz —
              logo, selos, paleta, tipografia, patterns e componentes.
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <MiniSeal size={300} />
          </div>
        </div>

        <Rule color={T.ink} style={{ height: 3, marginTop: 50 }} />

        <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
          {[
            ['C', 'Code'],
            ['O', 'Open Source'],
            ['L', 'Logic'],
            ['U', 'Utility'],
          ].map(([k, v]) => (
            <div key={k} style={{ borderLeft: `2px solid ${T.ink}`, paddingLeft: 14 }}>
              <div style={{ fontFamily: T.fSerif, fontWeight: 800, fontSize: 36, color: T.vermilion, letterSpacing: '-0.04em', lineHeight: 1 }}>{k}</div>
              <div style={{ fontFamily: T.fMono, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 6, color: T.ink }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      <Rule />
      <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between' }}>
        <Tag>fig. 0.0 — cover</Tag>
        <Tag>§ logo · stamp · color · type · patterns · components · voice</Tag>
        <Tag>pp. 01 / 11</Tag>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// 01 — LOGO
// ─────────────────────────────────────────────────────────────

function BBLogo() {
  return (
    <BBSection id="logo" index="01" kicker="logo & wordmark" title={<>O wordmark é a marca. Sem símbolo separado — o <span style={{ color: T.vermilion, fontStyle: 'italic', fontWeight: 600 }}>L vermilion</span> faz o trabalho.</>}>
      {/* primary lockup */}
      <div style={{ background: T.paper2, border: `1px solid ${T.ink}`, padding: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <Wordmark size={160} mode="inline" sub="LABZ" />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32 }}>
        <BBLabel>1.1 · primary lockup · horizontal</BBLabel>
        <BBLabel>Newsreader 800 · JetBrains Mono 700</BBLabel>
      </div>

      {/* variations */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        <div>
          <div style={{ background: T.paper2, border: `1px solid ${T.ink}`, padding: 36, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Wordmark size={72} mode="stack" sub="LABZ" />
          </div>
          <BBLabel>1.2 · stacked</BBLabel>
        </div>
        <div>
          <div style={{ background: T.ink, border: `1px solid ${T.ink}`, padding: 36, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Wordmark size={64} mode="inline" sub="LABZ" color={T.paper} />
          </div>
          <BBLabel>1.3 · inverse on ink</BBLabel>
        </div>
        <div>
          <div style={{ background: T.paper2, border: `1px solid ${T.ink}`, padding: 36, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: T.fSerif, fontWeight: 800, fontSize: 110, letterSpacing: '-0.07em', lineHeight: 1, color: T.ink }}>
              C<span style={{ color: T.vermilion }}>L</span>
            </span>
          </div>
          <BBLabel>1.4 · CL monogram (favicon)</BBLabel>
        </div>
      </div>

      {/* clearspace */}
      <div style={{ background: T.paper2, border: `1px solid ${T.ink}`, padding: 36, marginBottom: 16, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          {/* clearspace markers */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 600, height: 200, border: `1.5px dashed ${T.vermilion}`, position: 'relative' }}>
              <span style={{ position: 'absolute', top: -10, left: 8, background: T.paper2, padding: '0 4px', fontFamily: T.fMono, fontSize: 10, color: T.vermilion, letterSpacing: '0.2em' }}>min clearspace = 1× cap height</span>
            </div>
          </div>
          <div style={{ zIndex: 1 }}>
            <Wordmark size={96} mode="inline" sub="LABZ" />
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40 }}>
        <BBLabel>1.5 · clearspace rule</BBLabel>
        <BBLabel>nada toca a marca dentro da margem da altura-de-caixa-alta (cap × 1)</BBLabel>
      </div>

      {/* do / don't */}
      <DoDont
        doIt="Mantém Newsreader 800 e tracking -0.04em. L sempre vermilion (#b8311e) quando colorido."
        dont="Não troca a fonte, não rotaciona, não aplica drop-shadow, não usa o L em outra cor."
      />
    </BBSection>
  );
}

// ─────────────────────────────────────────────────────────────
// 02 — STAMP & SEAL
// ─────────────────────────────────────────────────────────────

function BBStamp() {
  return (
    <BBSection id="stamp" index="02" kicker="stamp & seal" title={<>Dois carimbos oficiais — selo institucional e date stamp.</>} dark>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'start' }}>
        {/* s.02 inverse seal */}
        <div>
          <div style={{ background: T.ink, border: `1px solid ${T.inkFaint}`, padding: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MiniSeal size={360} />
          </div>
          <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between' }}>
            <BBLabel dark>2.1 · seal · s.02</BBLabel>
            <BBLabel dark>official badge</BBLabel>
          </div>
          <div style={{ marginTop: 18, fontFamily: T.fSerif, fontSize: 17, lineHeight: 1.5, color: T.paper, textWrap: 'pretty' }}>
            Uso institucional. Badge de OSS, footer de site/deck, watermark em docs,
            avatar do GitHub. Top arc carrega o significado (CODE · OPEN SOURCE · LOGIC · UTILITY).
            Bottom arc carrega a marca (COSLU · <span style={{ color: T.vermilion, fontWeight: 700 }}>LABZ</span>).
          </div>
        </div>
        {/* s.08 date stamp */}
        <div>
          <div style={{ background: T.paper, border: `1px solid ${T.inkFaint}`, padding: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 408 }}>
            <DateStampInline rotate={-3} size={1.3} />
          </div>
          <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between' }}>
            <BBLabel dark>2.2 · date stamp · s.08</BBLabel>
            <BBLabel dark>official document mark</BBLabel>
          </div>
          <div style={{ marginTop: 18, fontFamily: T.fSerif, fontSize: 17, lineHeight: 1.5, color: T.paper, textWrap: 'pretty' }}>
            Pra carimbar capa de slide, primeira página de PDF, datasheet, certificado e
            commit message. Sempre rotacionado entre -3° e -5°. Vermilion sobre paper.
            Conteúdo customizável: <code style={{ fontFamily: T.fMono, color: T.vermilion }}>BUILT · BY / COSLU LABZ / — MAY 2026 —</code>.
          </div>
        </div>
      </div>

      <Rule color={T.paper} style={{ marginTop: 56, marginBottom: 32, opacity: 0.4 }} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18, alignItems: 'end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <MiniSeal size={48} />
          <BBLabel dark>16–48px · favicon</BBLabel>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <MiniSeal size={96} />
          <BBLabel dark>96px · ui badge</BBLabel>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <MiniSeal size={160} />
          <BBLabel dark>160px · footer</BBLabel>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <MiniSeal size={220} />
          <BBLabel dark>220px+ · hero / cover</BBLabel>
        </div>
      </div>
    </BBSection>
  );
}

// ─────────────────────────────────────────────────────────────
// 03 — COLOR
// ─────────────────────────────────────────────────────────────

function BBColor() {
  const colors = [
    { name: 'Paper',     hex: '#efe8d8', oklch: 'oklch(0.92 0.018 86)',  role: 'surface · primary',   fg: T.ink },
    { name: 'Paper II',  hex: '#e5dec9', oklch: 'oklch(0.88 0.022 86)',  role: 'surface · secondary', fg: T.ink },
    { name: 'Paper III', hex: '#d9d1bf', oklch: 'oklch(0.84 0.023 86)',  role: 'surface · tertiary',  fg: T.ink },
    { name: 'Ink',       hex: '#1a1a1a', oklch: 'oklch(0.21 0 0)',       role: 'text · primary',      fg: T.paper },
    { name: 'Ink mute',  hex: '#5a5147', oklch: 'oklch(0.40 0.014 70)',  role: 'text · footnote',     fg: T.paper },
    { name: 'Ink faint', hex: '#8c8478', oklch: 'oklch(0.59 0.013 70)',  role: 'text · margin',       fg: T.paper },
    { name: 'Vermilion', hex: '#b8311e', oklch: 'oklch(0.52 0.183 32)',  role: 'accent · brand',      fg: T.paper },
    { name: 'Cobalt',    hex: '#1f3a8a', oklch: 'oklch(0.34 0.155 265)', role: 'accent · cool',       fg: T.paper },
  ];
  return (
    <BBSection id="color" index="03" kicker="palette · journal" title={<>Paleta JOURNAL — papel envelhecido, tinta e dois acentos.</>}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, border: `1px solid ${T.ink}`, borderRight: 'none', borderBottom: 'none', marginBottom: 24 }}>
        {colors.map((c) => (
          <div key={c.name} style={{
            background: c.hex, color: c.fg,
            padding: 22, borderRight: `1px solid ${T.ink}`, borderBottom: `1px solid ${T.ink}`,
            minHeight: 200, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          }}>
            <BBLabel dark={c.fg === T.paper}>{c.role}</BBLabel>
            <div>
              <div style={{ fontFamily: T.fSerif, fontWeight: 800, fontSize: 26, letterSpacing: '-0.02em', lineHeight: 1 }}>{c.name}</div>
              <div style={{ fontFamily: T.fMono, fontSize: 12, marginTop: 8, lineHeight: 1.5 }}>
                <div>{c.hex}</div>
                <div style={{ opacity: 0.75 }}>{c.oklch}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* allocation */}
      <div style={{ marginTop: 32, marginBottom: 20, display: 'flex', justifyContent: 'space-between' }}>
        <Tag>allocation in the wild</Tag>
        <Tag>60 / 30 / 7 / 3</Tag>
      </div>
      <div style={{ display: 'flex', height: 32, marginBottom: 8 }}>
        <div style={{ flex: 60, background: T.paper, borderRight: `1px solid ${T.ink}` }} />
        <div style={{ flex: 30, background: T.ink }} />
        <div style={{ flex: 7,  background: T.vermilion }} />
        <div style={{ flex: 3,  background: T.cobalt }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 36 }}>
        <BBLabel>60% paper</BBLabel>
        <BBLabel>30% ink</BBLabel>
        <BBLabel>7% vermilion</BBLabel>
        <BBLabel>3% cobalt</BBLabel>
      </div>

      <DoDont
        doIt="Use vermilion APENAS pra um acento por seção — destaque, link ativo, número-chave. Cobalt fica pra elementos técnicos (código, links secundários)."
        dont="Não use vermilion em backgrounds grandes. Não cria gradiente. Não inventa cores fora desses 8 tokens."
      />
    </BBSection>
  );
}

// ─────────────────────────────────────────────────────────────
// 04 — TYPE
// ─────────────────────────────────────────────────────────────

function BBType() {
  const scale = [
    { name: 'display · hero',     family: 'Newsreader 800',       size: '108–168px', lh: '0.90', sample: 'We ship artifacts.' },
    { name: 'h1',                 family: 'Newsreader 800',       size: '64–84px',   lh: '0.95', sample: 'Quatro frentes.' },
    { name: 'h2',                 family: 'Newsreader 700',       size: '40–56px',   lh: '1.00', sample: 'Como o loop ficou.' },
    { name: 'h3',                 family: 'Newsreader 700',       size: '26–32px',   lh: '1.15', sample: 'Cutting a 4h loop.' },
    { name: 'body · lead',        family: 'Newsreader 400',       size: '19–26px',   lh: '1.50', sample: 'Construímos em público.' },
    { name: 'body',               family: 'Newsreader 400',       size: '15–17px',   lh: '1.55', sample: 'A maior parte do que construímos vira biblioteca pública.' },
    { name: 'caption',            family: 'JetBrains Mono 700',   size: '10–14px',   lh: '1.40', sample: '// fig. 4.1 — pairing' },
    { name: 'metadata · tag',     family: 'JetBrains Mono 600',   size: '10–12px',   lh: '1.20', sample: 'COSLU.LABZ / VOL.I · ISS.01' },
  ];
  return (
    <BBSection id="type" index="04" kicker="typography" title={<>Newsreader display × JetBrains Mono técnica.</>}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 40, marginBottom: 48 }}>
        <div style={{ background: T.paper2, border: `1px solid ${T.ink}`, padding: 28, display: 'flex', flexDirection: 'column' }}>
          <BBLabel>display · serif</BBLabel>
          <div style={{ fontFamily: T.fSerif, fontWeight: 800, fontSize: 108, letterSpacing: '-0.04em', lineHeight: 0.9, marginTop: 12 }}>Newsreader</div>
          <div style={{ fontFamily: T.fSerif, fontStyle: 'italic', fontSize: 30, color: T.inkMute, marginTop: 4 }}>Aa Bb Cc — &amp; — "quote"</div>
          <div style={{ marginTop: 24, display: 'flex', gap: 24 }}>
            {['400','600','800'].map(w => (
              <div key={w}>
                <div style={{ fontFamily: T.fSerif, fontWeight: w, fontSize: 38, letterSpacing: '-0.02em', lineHeight: 1 }}>Ag</div>
                <BBLabel>weight {w}</BBLabel>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: T.paper2, border: `1px solid ${T.ink}`, padding: 28, display: 'flex', flexDirection: 'column' }}>
          <BBLabel>technical · mono</BBLabel>
          <div style={{ fontFamily: T.fMono, fontWeight: 700, fontSize: 52, letterSpacing: '-0.02em', lineHeight: 1.05, marginTop: 12 }}>JetBrains<br/>Mono</div>
          <div style={{ marginTop: 24, display: 'flex', gap: 18 }}>
            {['400','500','700'].map(w => (
              <div key={w}>
                <div style={{ fontFamily: T.fMono, fontWeight: w, fontSize: 28, lineHeight: 1 }}>Ag</div>
                <BBLabel>{w}</BBLabel>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* type scale */}
      <div style={{ border: `1px solid ${T.ink}` }}>
        {scale.map((s, idx) => (
          <div key={s.name} style={{
            display: 'grid', gridTemplateColumns: '180px 200px 140px 80px 1fr', alignItems: 'baseline',
            padding: '18px 22px', borderTop: idx === 0 ? 'none' : `1px solid ${T.ink}`,
            background: idx % 2 === 0 ? T.paper : T.paper2, gap: 16,
          }}>
            <BBLabel>{s.name}</BBLabel>
            <span style={{ fontFamily: T.fMono, fontSize: 12, color: T.ink }}>{s.family}</span>
            <span style={{ fontFamily: T.fMono, fontSize: 12, color: T.ink }}>{s.size}</span>
            <span style={{ fontFamily: T.fMono, fontSize: 12, color: T.ink }}>lh {s.lh}</span>
            <span style={{
              fontFamily: s.family.includes('Mono') ? T.fMono : T.fSerif,
              fontWeight: s.family.includes('800') ? 800 : s.family.includes('700') ? 700 : s.family.includes('600') ? 600 : 400,
              fontSize: parseInt(s.size) || 16, color: T.ink, lineHeight: 1.2,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{s.sample}</span>
          </div>
        ))}
      </div>
    </BBSection>
  );
}

// ─────────────────────────────────────────────────────────────
// 05 — PATTERNS / TEXTURES
// ─────────────────────────────────────────────────────────────

function BBPatterns() {
  return (
    <BBSection id="patterns" index="05" kicker="patterns & textures" title={<>Cinco texturas e dois ritmos.</>}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        {/* paper bg */}
        <div>
          <div className="paper-bg" style={{ height: 200, border: `1px solid ${T.ink}` }} />
          <BBLabel>5.1 · paper-bg · dotted noise</BBLabel>
        </div>
        {/* ink bg */}
        <div>
          <div className="ink-bg" style={{ height: 200, border: `1px solid ${T.ink}` }} />
          <BBLabel>5.2 · ink-bg · dotted noise inverso</BBLabel>
        </div>
        {/* stripe */}
        <div>
          <div className="ph-stripe" style={{ height: 200, color: T.ink }}>// image placeholder</div>
          <BBLabel>5.3 · ph-stripe · diagonal hatch</BBLabel>
        </div>
        {/* crosshair */}
        <div>
          <div style={{ position: 'relative', height: 200, border: `1px solid ${T.ink}`, background: T.paper2 }} className="crosshair tl tr bl br">
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.fMono, fontSize: 11, color: T.inkMute, letterSpacing: '0.2em' }}>
              ─── content ───
            </div>
          </div>
          <BBLabel>5.4 · crosshair corners</BBLabel>
        </div>
        {/* dashed rule */}
        <div>
          <div style={{ height: 200, border: `1px dashed ${T.ink}`, background: T.paper, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '70%', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ height: 1, background: T.ink }} />
              <div style={{ height: 1, borderTop: `1px dashed ${T.ink}` }} />
              <div style={{ height: 1, background: T.ink, opacity: 0.4 }} />
              <div style={{ height: 3, background: T.ink }} />
              <div style={{ height: 1, background: T.vermilion }} />
            </div>
          </div>
          <BBLabel>5.5 · rule system (solid · dashed · thick · accent)</BBLabel>
        </div>
        {/* grid */}
        <div>
          <div style={{ height: 200, border: `1px solid ${T.ink}`, background: T.paper2, backgroundImage: `linear-gradient(to right, ${T.ink}22 1px, transparent 1px), linear-gradient(to bottom, ${T.ink}22 1px, transparent 1px)`, backgroundSize: '24px 24px' }} />
          <BBLabel>5.6 · grid · 24px module</BBLabel>
        </div>
      </div>

      <Rule />
      <div style={{ marginTop: 18, marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
        <Tag>copy-paste CSS</Tag>
        <Tag color={T.vermilion}>brand-tokens.css</Tag>
      </div>
      <CodeBlock lang="css · patterns">{`.paper-bg {
  background-color: var(--c-paper);
  background-image:
    radial-gradient(rgba(26,26,26,0.045) 1px, transparent 1px),
    radial-gradient(rgba(26,26,26,0.025) 1px, transparent 1px);
  background-size: 24px 24px, 11px 11px;
  background-position: 0 0, 6px 6px;
}

.ink-bg {
  background-color: var(--c-ink);
  background-image:
    radial-gradient(rgba(239,232,216,0.05) 1px, transparent 1px);
  background-size: 22px 22px;
}

.ph-stripe {
  background:
    repeating-linear-gradient(135deg, transparent 0 7px,
      color-mix(in srgb, currentColor 12%, transparent) 7px 8px),
    color-mix(in srgb, currentColor 4%, transparent);
}`}</CodeBlock>
    </BBSection>
  );
}

// ─────────────────────────────────────────────────────────────
// 06 — COMPONENTS (atoms)
// ─────────────────────────────────────────────────────────────

function BBComponents() {
  return (
    <BBSection id="components" index="06" kicker="components · atoms" title={<>Tijolos. Tudo que aparece em qualquer página.</>}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, marginBottom: 32 }}>
        {/* Tag */}
        <div style={{ background: T.paper2, border: `1px solid ${T.ink}`, padding: 22 }}>
          <BBLabel>tag (mono uppercase, 0.14em tracked)</BBLabel>
          <div style={{ marginTop: 12, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <Tag>standard tag</Tag>
            <Tag color={T.vermilion}>vermilion · accent</Tag>
            <Tag color={T.cobalt}>cobalt · technical</Tag>
          </div>
        </div>
        {/* CtaButton */}
        <div style={{ background: T.paper2, border: `1px solid ${T.ink}`, padding: 22 }}>
          <BBLabel>cta button</BBLabel>
          <div style={{ marginTop: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
            <CtaButton primary>Primary →</CtaButton>
            <CtaButton>Secondary</CtaButton>
          </div>
        </div>
        {/* DocFrame */}
        <div style={{ background: T.paper2, border: `1px solid ${T.ink}`, padding: 0, gridColumn: 'span 2' }}>
          <div style={{ padding: '22px 22px 0' }}><BBLabel>doc-frame · top bar + title + footer</BBLabel></div>
          <div style={{ padding: 22 }}>
            <div style={{ height: 180, border: `1px solid ${T.ink}` }}>
              <DocFrame vol="I" issue="01" section="§ DEMO" title="Doc-frame title">
                <div style={{ flex: 1, fontFamily: T.fSerif, fontSize: 14, lineHeight: 1.5 }}>
                  Use pra qualquer "documento" — relatório, card de case, página interna.
                  Header com vol/iss, rule, título grande, conteúdo flexível.
                </div>
                <Tag style={{ marginTop: 8 }}>fig. demo</Tag>
              </DocFrame>
            </div>
          </div>
        </div>
        {/* Rule */}
        <div style={{ background: T.paper2, border: `1px solid ${T.ink}`, padding: 22 }}>
          <BBLabel>rule (1px solid)</BBLabel>
          <Rule style={{ marginTop: 14 }} />
          <BBLabel>rule (thick 3px)</BBLabel>
          <Rule style={{ height: 3, marginTop: 8 }} />
          <BBLabel>rule (dashed mute)</BBLabel>
          <div style={{ height: 1, borderTop: `1px dashed ${T.inkMute}`, marginTop: 8 }} />
        </div>
        {/* ColorChip */}
        <div style={{ background: T.paper2, border: `1px solid ${T.ink}`, padding: 22 }}>
          <BBLabel>color chip</BBLabel>
          <div style={{ marginTop: 12, display: 'flex', gap: 0 }}>
            <ColorChip name="Vermilion" hex="#b8311e" role="accent · brand" fg={T.paper} height={120} w={1} />
            <ColorChip name="Cobalt"    hex="#1f3a8a" role="accent · cool"  fg={T.paper} height={120} w={1} />
          </div>
        </div>
      </div>

      <CodeBlock lang="jsx · usage examples">{`// Tag — caption / metadata
<Tag>section · 01</Tag>
<Tag color={T.vermilion}>// approved</Tag>

// CtaButton — actions
<CtaButton primary>Start a brief →</CtaButton>
<CtaButton>Browse OSS</CtaButton>

// Rule — divider
<Rule />
<Rule style={{ height: 3 }} />

// DocFrame — wraps any document-like content
<DocFrame vol="I" issue="01" section="§ 2.1" title="Title">
  <p>body...</p>
</DocFrame>

// MiniSeal — institutional badge
<MiniSeal size={160} />
<MiniSeal size={48} />  // favicon scale`}</CodeBlock>
    </BBSection>
  );
}

// ─────────────────────────────────────────────────────────────
// 07 — VOICE
// ─────────────────────────────────────────────────────────────

function BBVoice() {
  return (
    <BBSection id="voice" index="07" kicker="voice · copywriting" title={<>Como a gente fala.</>}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18, marginBottom: 36 }}>
        {[
          ['Direto',    'Linhas curtas. Verbos no presente. Sem "soluções inovadoras", sem "transformação digital".'],
          ['Técnico',   'Citamos modelos, números, cost reduction. Mostra um terminal antes de mostrar uma promessa.'],
          ['Humano',    'PT-BR descontraído. Pode falar "a gente", "rola", "no caminho". Nada de jargão corporativo.'],
          ['Acadêmico', 'Quando precisa, footnote. fig. 1.1, vol. I, iss. 01. Sentimento de paper, não de pitch.'],
          ['Confiante', '"Construímos em público" — não "tentamos construir". Mostra o que já saiu da prensa.'],
          ['Curto',     'Se cabe em 8 palavras, não use 14. Pretty wrap, balance, oxford comma quando ajuda.'],
        ].map(([k, v]) => (
          <div key={k} style={{ background: T.paper2, border: `1px solid ${T.ink}`, padding: 22 }}>
            <div style={{ fontFamily: T.fSerif, fontWeight: 800, fontSize: 28, letterSpacing: '-0.02em', lineHeight: 1 }}>{k}</div>
            <div style={{ marginTop: 10, fontFamily: T.fSerif, fontSize: 14, lineHeight: 1.5, color: T.ink, textWrap: 'pretty' }}>{v}</div>
          </div>
        ))}
      </div>
      <DoDont
        doIt={<>"<i>Cutting a 4-hour ops loop down to 11 minutes with one queue and one model.</i>"</>}
        dont={<>"<i>Leverage cutting-edge AI to revolutionize your operational efficiency through next-generation automation.</i>"</>}
      />
    </BBSection>
  );
}

// ─────────────────────────────────────────────────────────────
// 08 — SPACING & GRID
// ─────────────────────────────────────────────────────────────

function BBSpacing() {
  const steps = [4, 8, 12, 16, 24, 32, 48, 64, 96];
  return (
    <BBSection id="spacing" index="08" kicker="spacing & grid" title={<>Base 8px. Tipos múltiplos de 4.</>}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 16 }}>
        {steps.map((s) => (
          <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ width: s, height: s, background: T.ink }} />
            <BBLabel>{s}</BBLabel>
          </div>
        ))}
      </div>
      <Rule />
      <div style={{ marginTop: 24, fontFamily: T.fSerif, fontSize: 17, lineHeight: 1.5, color: T.ink, maxWidth: 800, textWrap: 'pretty' }}>
        Use 4 / 8 pra micro (entre tag e título), 16 / 24 pra elementos do mesmo bloco,
        32 / 48 entre blocos, 64 / 96 entre seções inteiras. Padding de cards: 22–28px. Padding de seções: 80–100px.
      </div>
    </BBSection>
  );
}

// ─────────────────────────────────────────────────────────────
// 09 — RESOURCES (code snippets)
// ─────────────────────────────────────────────────────────────

function BBResources() {
  return (
    <BBSection id="resources" index="09" kicker="resources · snippets" title={<>Copia, cola, usa.</>} dark>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <div>
          <BBLabel dark>9.1 · CSS variables (root)</BBLabel>
          <div style={{ marginTop: 8 }}>
            <CodeBlock lang="css · :root" dark>{`:root {
  --c-paper:     #efe8d8;
  --c-paper-2:   #e5dec9;
  --c-paper-3:   #d9d1bf;
  --c-ink:       #1a1a1a;
  --c-ink-mute:  #5a5147;
  --c-ink-faint: #8c8478;
  --c-vermilion: #b8311e;
  --c-cobalt:    #1f3a8a;

  --f-display: 'Newsreader', Georgia, serif;
  --f-mono:    'JetBrains Mono', ui-monospace, monospace;
}`}</CodeBlock>
          </div>
        </div>
        <div>
          <BBLabel dark>9.2 · font import (google fonts)</BBLabel>
          <div style={{ marginTop: 8 }}>
            <CodeBlock lang="html · <head>" dark>{`<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;0,6..72,700;0,6..72,800;1,6..72,400;1,6..72,600&family=JetBrains+Mono:wght@400;500;700&display=swap">`}</CodeBlock>
          </div>
        </div>
        <div>
          <BBLabel dark>9.3 · README badge (markdown)</BBLabel>
          <div style={{ marginTop: 8 }}>
            <CodeBlock lang="markdown" dark>{`![built by coslu labz](https://img.shields.io/badge/built_by-COSLU_LABZ-b8311e?style=for-the-badge&labelColor=1a1a1a)

> "Code · Open Source · Logic · Utility."
> — coslu.io`}</CodeBlock>
          </div>
        </div>
        <div>
          <BBLabel dark>9.4 · footer signature</BBLabel>
          <div style={{ marginTop: 8 }}>
            <CodeBlock lang="html" dark>{`<footer>
  <span>C · O · S · L · U</span>
  <span>code · open source · logic · utility</span>
  <span>est. 2026 / SP / BR</span>
</footer>`}</CodeBlock>
          </div>
        </div>
      </div>
    </BBSection>
  );
}

// ─────────────────────────────────────────────────────────────
// 10 — INDEX (TOC + colophon)
// ─────────────────────────────────────────────────────────────

function BBIndex() {
  const toc = [
    ['00', 'Cover',           '#'],
    ['01', 'Logo & wordmark', '#logo'],
    ['02', 'Stamp & seal',    '#stamp'],
    ['03', 'Color · journal', '#color'],
    ['04', 'Typography',      '#type'],
    ['05', 'Patterns',        '#patterns'],
    ['06', 'Components',      '#components'],
    ['07', 'Voice',           '#voice'],
    ['08', 'Spacing & grid',  '#spacing'],
    ['09', 'Resources',       '#resources'],
  ];
  return (
    <BBSection id="index" index="10" kicker="colophon · index" title={<>Índice & créditos.</>}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 48 }}>
        <div>
          {toc.map(([n, t, h]) => (
            <a key={n} href={h} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 60px', alignItems: 'baseline', padding: '14px 0', borderBottom: `1px solid ${T.ink}`, textDecoration: 'none', color: 'inherit' }}>
              <span style={{ fontFamily: T.fMono, fontSize: 14, color: T.vermilion, fontWeight: 700, letterSpacing: '0.1em' }}>§ {n}</span>
              <span style={{ fontFamily: T.fSerif, fontWeight: 700, fontSize: 24, letterSpacing: '-0.02em' }}>{t}</span>
              <span style={{ fontFamily: T.fMono, fontSize: 11, color: T.inkMute, letterSpacing: '0.16em', textAlign: 'right' }}>p. {n}</span>
            </a>
          ))}
        </div>
        <div>
          <BBLabel>colophon</BBLabel>
          <div style={{ marginTop: 14, fontFamily: T.fSerif, fontSize: 17, lineHeight: 1.6, textWrap: 'pretty' }}>
            Esta brand book v.1.0 foi escrita em Newsreader e JetBrains Mono,
            sobre paper <code style={{ fontFamily: T.fMono, fontSize: 14 }}>#efe8d8</code>,
            em São Paulo, maio de 2026.
          </div>
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
            <DateStampInline rotate={2} size={0.9} />
          </div>
        </div>
      </div>
    </BBSection>
  );
}

// ─────────────────────────────────────────────────────────────
// FULL BRAND BOOK
// ─────────────────────────────────────────────────────────────

function BrandBook() {
  return (
    <div style={{ background: T.paper, color: T.ink, fontFamily: T.fSerif, minHeight: '100vh' }}>
      <style>{`
        html { scroll-behavior: smooth; }
        @media print {
          section { break-inside: avoid; break-after: page; }
        }
      `}</style>
      <BBCover />
      <BBLogo />
      <BBStamp />
      <BBColor />
      <BBType />
      <BBPatterns />
      <BBComponents />
      <BBVoice />
      <BBSpacing />
      <BBResources />
      <BBIndex />
    </div>
  );
}

Object.assign(window, { BrandBook, BBCover, BBLogo, BBStamp, BBColor, BBType, BBPatterns, BBComponents, BBVoice, BBSpacing, BBResources, BBIndex });
