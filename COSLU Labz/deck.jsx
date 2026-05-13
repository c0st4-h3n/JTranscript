// COSLU Labz · Slide deck templates
// 1920×1080 slides — used both as artboards in the canvas and as
// <section>s inside <deck-stage> in deck.html.

// ─────────────────────────────────────────────────────────────
// SHARED CHROME
// ─────────────────────────────────────────────────────────────

// Slide frame — common margin + topbar (vol/issue, brand) + bottombar (page, tagline)
function Slide({ children, dark = false, kicker, page = '01 / 09', noChrome = false, accent = T.vermilion, bg, fg }) {
  const _fg = fg || (dark ? T.paper : T.ink);
  const _bg = bg || (dark ? T.ink : T.paper);
  const muted = dark ? T.inkFaint : T.inkMute;
  return (
    <div style={{
      width: '100%', height: '100%', background: _bg, color: _fg, position: 'relative',
      fontFamily: T.fSerif, padding: '64px 96px 56px', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }} className={dark ? 'ink-bg' : 'paper-bg'}>
      {!noChrome && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <Wordmark size={28} mode="inline" sub="LABZ" color={_fg} />
            <span style={{ width: 1, height: 22, background: _fg, opacity: 0.4 }} />
            <span style={{ fontFamily: T.fMono, fontSize: 13, letterSpacing: '0.18em', textTransform: 'uppercase', color: muted }}>
              {kicker || 'vol. I · iss. 01'}
            </span>
          </div>
          <span style={{ fontFamily: T.fMono, fontSize: 13, letterSpacing: '0.18em', textTransform: 'uppercase', color: accent, fontWeight: 700 }}>
            // built in public
          </span>
        </div>
      )}
      {!noChrome && <div style={{ height: 1, background: _fg, opacity: 0.7, marginTop: 16 }} />}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', marginTop: 28, marginBottom: 28 }}>
        {children}
      </div>
      {!noChrome && <div style={{ height: 1, background: _fg, opacity: 0.7, marginBottom: 14 }} />}
      {!noChrome && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: T.fMono, fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: muted }}>
            C · O · S · L · U
          </span>
          <span style={{ fontFamily: T.fMono, fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: muted }}>
            coslu.io · São Paulo · BR
          </span>
          <span style={{ fontFamily: T.fMono, fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase', color: muted, fontVariantNumeric: 'tabular-nums' }}>
            {page}
          </span>
        </div>
      )}
    </div>
  );
}

// Inline rectangular date-stamp (s.08) — used on cover & closing slides
function DateStampInline({ label = 'BUILT · BY', date = 'MAY 2026', big = 'COSLU LABZ', rotate = -3, size = 1 }) {
  return (
    <div style={{
      display: 'inline-block',
      border: `${3 * size}px double ${T.vermilion}`,
      padding: `${14 * size}px ${24 * size}px`,
      transform: `rotate(${rotate}deg)`,
      color: T.vermilion, fontFamily: T.fMono, textAlign: 'center',
      background: 'transparent',
    }}>
      <div style={{ fontWeight: 700, fontSize: 12 * size, letterSpacing: '0.32em' }}>{label}</div>
      <div style={{ fontFamily: T.fSerif, fontWeight: 800, fontSize: 32 * size, letterSpacing: '-0.04em', lineHeight: 1, margin: `${6 * size}px 0` }}>
        {big}
      </div>
      <div style={{ width: '100%', height: 1, background: T.vermilion, margin: `${6 * size}px 0` }} />
      <div style={{ fontWeight: 700, fontSize: 11 * size, letterSpacing: '0.32em' }}>— {date} —</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 01 — TITLE SLIDE
// ─────────────────────────────────────────────────────────────
function SlideTitle() {
  return (
    <Slide noChrome>
      <div style={{ position: 'absolute', top: 64, left: 96, right: 96, display: 'flex', justifyContent: 'space-between' }}>
        <Wordmark size={32} mode="inline" sub="LABZ" />
        <span style={{ fontFamily: T.fMono, fontSize: 14, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.inkMute }}>
          vol. I · iss. 03 · may 2026
        </span>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '2.4fr 1fr', alignItems: 'center', gap: 80 }}>
        <div>
          <div style={{ fontFamily: T.fMono, fontSize: 14, letterSpacing: '0.34em', textTransform: 'uppercase', color: T.vermilion, fontWeight: 700, marginBottom: 24 }}>
            ¶ deck · 01 of 09
          </div>
          <div style={{ fontFamily: T.fSerif, fontWeight: 800, fontSize: 168, lineHeight: 0.9, letterSpacing: '-0.045em' }}>
            We&nbsp;ship<br/>
            <span style={{ color: T.vermilion, fontStyle: 'italic', fontWeight: 600 }}>artifacts</span>,<br/>
            not&nbsp;decks.
          </div>
          <div style={{ marginTop: 32, fontFamily: T.fSerif, fontStyle: 'italic', fontSize: 26, color: T.inkMute, maxWidth: 800 }}>
            A primer on what we build, how we build it, and why we publish the path.
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <DateStampInline rotate={-4} size={1.3} />
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 56, left: 96, right: 96, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <span style={{ fontFamily: T.fMono, fontSize: 13, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.inkMute }}>
          hi@coslu.io · coslu.io
        </span>
        <span style={{ fontFamily: T.fMono, fontSize: 13, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.inkMute }}>
          presented by founder@coslu.io
        </span>
      </div>
    </Slide>
  );
}

// ─────────────────────────────────────────────────────────────
// 02 — AGENDA
// ─────────────────────────────────────────────────────────────
function SlideAgenda() {
  const items = [
    ['01', 'Who we are',          'a collective of engineers · sp/br'],
    ['02', 'What we build',       'automation · ai · oss · platform'],
    ['03', 'How we work',         'kickoff → ship → publish'],
    ['04', 'Selected case',       'a 4-hour ops loop, in 11 minutes'],
    ['05', 'Numbers · 2026',      '41 oss · 12 platforms · 7 games'],
    ['06', 'What this costs you', 'rates · timelines · ip'],
    ['07', 'What you take home',  'code + docs + devlog'],
    ['08', 'Next step',           'send a brief in 48h'],
  ];
  return (
    <Slide kicker="agenda · contents" page="02 / 09">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: 56, height: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Tag size={14} style={{ color: T.vermilion }}>§ agenda</Tag>
          <div style={{ marginTop: 16, fontFamily: T.fSerif, fontWeight: 800, fontSize: 104, letterSpacing: '-0.04em', lineHeight: 0.92 }}>
            What<br/>we'll<br/>cover.
          </div>
          <div style={{ marginTop: 28, fontFamily: T.fSerif, fontStyle: 'italic', fontSize: 22, color: T.inkMute, maxWidth: 460 }}>
            Read top to bottom. Skip with Esc.
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', borderTop: `1px solid ${T.ink}` }}>
          {items.map(([n, t, d]) => (
            <div key={n} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1.4fr', alignItems: 'center', padding: '18px 0', borderBottom: `1px solid ${T.ink}` }}>
              <span style={{ fontFamily: T.fMono, fontSize: 18, fontWeight: 700, color: T.vermilion, letterSpacing: '0.08em' }}>{n}</span>
              <span style={{ fontFamily: T.fSerif, fontWeight: 700, fontSize: 30, letterSpacing: '-0.02em' }}>{t}</span>
              <span style={{ fontFamily: T.fMono, fontSize: 13, color: T.inkMute, letterSpacing: '0.08em' }}>// {d}</span>
            </div>
          ))}
        </div>
      </div>
    </Slide>
  );
}

// ─────────────────────────────────────────────────────────────
// 03 — SECTION DIVIDER
// ─────────────────────────────────────────────────────────────
function SlideSection() {
  return (
    <Slide dark kicker="part · 02 of 04" page="03 / 09">
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1.2fr', alignItems: 'center', gap: 60 }}>
        <div>
          <div style={{ fontFamily: T.fMono, fontSize: 18, letterSpacing: '0.4em', color: T.vermilion, fontWeight: 700 }}>
            § PART · 02
          </div>
          <div style={{ marginTop: 12, fontFamily: T.fSerif, fontWeight: 800, fontSize: 320, lineHeight: 0.85, letterSpacing: '-0.05em', color: T.paper }}>
            02
          </div>
          <div style={{ marginTop: 8, height: 4, background: T.vermilion, width: 200 }} />
        </div>
        <div>
          <div style={{ fontFamily: T.fSerif, fontWeight: 800, fontSize: 100, lineHeight: 0.92, letterSpacing: '-0.04em', color: T.paper }}>
            What<br/>we&nbsp;<span style={{ color: T.vermilion, fontStyle: 'italic', fontWeight: 600 }}>build</span>.
          </div>
          <div style={{ marginTop: 28, fontFamily: T.fSerif, fontSize: 24, color: T.inkFaint, lineHeight: 1.45, maxWidth: 640 }}>
            Four verticals. One obsession — automatizar a parte chata e devolver tempo pra parte interessante.
          </div>
        </div>
      </div>
    </Slide>
  );
}

// ─────────────────────────────────────────────────────────────
// 04 — CONTENT (headline + body)
// ─────────────────────────────────────────────────────────────
function SlideContent() {
  return (
    <Slide kicker="part · 02 / what we build" page="04 / 09">
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 60, height: '100%' }}>
        <div>
          <Tag size={14} style={{ color: T.vermilion }}>§ 02.1 · automation</Tag>
          <div style={{ marginTop: 14, fontFamily: T.fSerif, fontWeight: 800, fontSize: 92, lineHeight: 0.95, letterSpacing: '-0.04em' }}>
            Filas, agents e <span style={{ color: T.vermilion, fontStyle: 'italic', fontWeight: 600 }}>guard-rails</span> que substituem trabalho operacional.
          </div>
          <div style={{ marginTop: 32, fontFamily: T.fSerif, fontSize: 24, lineHeight: 1.5, color: T.ink, maxWidth: 920, textWrap: 'pretty' }}>
            A gente substitui tarefas repetitivas por pipelines observáveis: cada decisão é
            <b> rastreável</b>, cada fallback humano é uma chance de re-treinar.
          </div>
          <div style={{ marginTop: 36, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {[
              ['fila', 'retries · DLQ · timing'],
              ['agent', 'tools · guard-rails · eval'],
              ['painel', 'métricas · drift · cost'],
            ].map(([k, v]) => (
              <div key={k} style={{ borderLeft: `3px solid ${T.vermilion}`, paddingLeft: 16 }}>
                <div style={{ fontFamily: T.fSerif, fontWeight: 800, fontSize: 36, letterSpacing: '-0.02em' }}>{k}</div>
                <div style={{ fontFamily: T.fMono, fontSize: 14, color: T.inkMute, marginTop: 6, letterSpacing: '0.04em' }}>// {v}</div>
              </div>
            ))}
          </div>
        </div>
        {/* code / artifact column */}
        <div style={{ background: T.paper2, border: `1px solid ${T.ink}`, padding: 24, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Tag color={T.vermilion}>// fig. 2.1</Tag>
            <Tag>artifact</Tag>
          </div>
          <div style={{ marginTop: 14, fontFamily: T.fMono, fontSize: 14, lineHeight: 1.7, color: T.ink, background: T.paper3, padding: '14px 16px', flex: 1 }}>
            <span style={{ color: T.inkMute }}>// queue.config.ts</span><br/>
            <span style={{ color: T.cobalt }}>export const</span> queue = {`{`}<br/>
            &nbsp;&nbsp;workers: <span style={{ color: T.vermilion }}>8</span>,<br/>
            &nbsp;&nbsp;retry: {`{`} attempts: <span style={{ color: T.vermilion }}>3</span> {`}`},<br/>
            &nbsp;&nbsp;model: <span style={{ color: T.vermilion }}>'ft-v3'</span>,<br/>
            &nbsp;&nbsp;fallback: <span style={{ color: T.vermilion }}>'human'</span>,<br/>
            {`}`};
          </div>
          <Tag style={{ marginTop: 12 }}>github.com/coslu/queue</Tag>
        </div>
      </div>
    </Slide>
  );
}

// ─────────────────────────────────────────────────────────────
// 05 — DATA (big numbers)
// ─────────────────────────────────────────────────────────────
function SlideData() {
  const data = [
    { n: '−96%', l: 'latência ops',  d: 'antes: 4h · depois: 11min' },
    { n: '1.2k', l: 'tickets/dia',   d: 'classificados automaticamente' },
    { n: '8',    l: 'workers',       d: '+ 1 fallback humano' },
    { n: '68%',  l: 'cost reduction', d: 'snowflake → duckdb + iceberg' },
  ];
  return (
    <Slide kicker="part · 03 / numbers" page="05 / 09">
      <Tag size={14} style={{ color: T.vermilion, marginBottom: 12 }}>§ 03 · what we shipped in 2026</Tag>
      <div style={{ fontFamily: T.fSerif, fontWeight: 800, fontSize: 84, lineHeight: 0.95, letterSpacing: '-0.04em' }}>
        Some numbers. <span style={{ color: T.inkMute, fontStyle: 'italic', fontWeight: 500 }}>None of them are vanity.</span>
      </div>
      <div style={{ marginTop: 56, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 40, flex: 1 }}>
        {data.map((d, idx) => (
          <div key={d.l} style={{ borderTop: `4px solid ${T.ink}`, paddingTop: 24, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontFamily: T.fMono, fontSize: 13, letterSpacing: '0.2em', color: T.vermilion, fontWeight: 700 }}>
              fig. {`3.${idx + 1}`}
            </div>
            <div style={{ marginTop: 14, fontFamily: T.fSerif, fontWeight: 800, fontSize: 152, lineHeight: 0.92, letterSpacing: '-0.05em', color: idx % 2 === 0 ? T.ink : T.vermilion }}>
              {d.n}
            </div>
            <div style={{ marginTop: 12, fontFamily: T.fSerif, fontWeight: 600, fontSize: 28, letterSpacing: '-0.02em' }}>{d.l}</div>
            <div style={{ marginTop: 6, fontFamily: T.fMono, fontSize: 13, color: T.inkMute, letterSpacing: '0.06em' }}>// {d.d}</div>
          </div>
        ))}
      </div>
    </Slide>
  );
}

// ─────────────────────────────────────────────────────────────
// 06 — QUOTE
// ─────────────────────────────────────────────────────────────
function SlideQuote() {
  return (
    <Slide kicker="testimony · 04 / 09" page="06 / 09" bg={T.paper2}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ fontFamily: T.fSerif, fontWeight: 800, fontSize: 200, lineHeight: 0.6, color: T.vermilion, letterSpacing: '-0.05em' }}>
          &ldquo;
        </div>
        <div style={{ marginTop: -20, fontFamily: T.fSerif, fontStyle: 'italic', fontWeight: 600, fontSize: 64, lineHeight: 1.15, letterSpacing: '-0.02em', textWrap: 'pretty' }}>
          A coslu chegou prometendo um MVP e entregou um <span style={{ color: T.vermilion, fontStyle: 'normal', fontWeight: 800 }}>sistema observável que ainda hoje roda em produção</span> — três anos depois.
        </div>
        <div style={{ marginTop: 48, display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ width: 64, height: 64, borderRadius: 32, background: T.ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: T.fSerif, fontWeight: 800, fontSize: 28, color: T.paper, letterSpacing: '-0.04em' }}>M</span>
          </div>
          <div>
            <div style={{ fontFamily: T.fSerif, fontWeight: 700, fontSize: 22, letterSpacing: '-0.01em' }}>Mariana Sá</div>
            <div style={{ fontFamily: T.fMono, fontSize: 13, color: T.inkMute, letterSpacing: '0.08em', marginTop: 2 }}>// CTO · banco-x · client since 2023</div>
          </div>
        </div>
      </div>
    </Slide>
  );
}

// ─────────────────────────────────────────────────────────────
// 07 — IMAGE (full-bleed placeholder)
// ─────────────────────────────────────────────────────────────
function SlideImage() {
  return (
    <Slide kicker="case · 04 / 09" page="07 / 09" noChrome>
      {/* full-bleed placeholder */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <Placeholder label="case study photo · ops floor of client-x · sp · 2026" height="100%" style={{ width: '100%', height: '100%', color: T.ink }} />
      </div>
      {/* overlay caption */}
      <div style={{ position: 'absolute', left: 96, bottom: 64, right: 96, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', color: T.ink }}>
        <div style={{ background: T.paper, padding: '22px 26px', maxWidth: 720, border: `1px solid ${T.ink}` }}>
          <Tag color={T.vermilion}>fig. 4.1 · case study</Tag>
          <div style={{ marginTop: 8, fontFamily: T.fSerif, fontWeight: 800, fontSize: 36, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            Ops floor of client-x — onde 1.2k tickets/dia eram triados à mão.
          </div>
          <div style={{ marginTop: 8, fontFamily: T.fMono, fontSize: 13, color: T.inkMute, letterSpacing: '0.06em' }}>
            // São Paulo · january 2026 · before the pipeline
          </div>
        </div>
        <div style={{ background: T.paper, padding: '14px 18px', border: `1px solid ${T.ink}` }}>
          <Tag>page 07 / 09</Tag>
        </div>
      </div>
    </Slide>
  );
}

// ─────────────────────────────────────────────────────────────
// 08 — TWO-COLUMN (text + diagram)
// ─────────────────────────────────────────────────────────────
function SlideTwoCol() {
  return (
    <Slide kicker="part · 03 / how we work" page="08 / 09">
      <Tag size={14} style={{ color: T.vermilion }}>§ 03 · process</Tag>
      <div style={{ marginTop: 14, fontFamily: T.fSerif, fontWeight: 800, fontSize: 96, letterSpacing: '-0.04em', lineHeight: 0.95 }}>
        Four steps. <span style={{ color: T.inkMute, fontStyle: 'italic', fontWeight: 500 }}>No retainer trap.</span>
      </div>
      <div style={{ marginTop: 48, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, border: `1px solid ${T.ink}`, borderRight: 'none', borderBottom: 'none' }}>
        {[
          ['01', 'BRIEF',     '48h pra ler, escopar, responder. Sem call de descoberta.'],
          ['02', 'BUILD',     '2-8 semanas. Stack escolhida com você. Demo semanal.'],
          ['03', 'SHIP',      'Deploy em produção do seu lado. Runbook + handoff.'],
          ['04', 'PUBLISH',   'O que pode virar OSS, vira. Devlog assinado.'],
        ].map(([n, h, d], idx) => (
          <div key={n} style={{
            padding: 30, borderRight: `1px solid ${T.ink}`, borderBottom: `1px solid ${T.ink}`,
            background: idx === 3 ? T.ink : T.paper, color: idx === 3 ? T.paper : T.ink,
            display: 'flex', flexDirection: 'column', minHeight: 320,
          }}>
            <div style={{ fontFamily: T.fMono, fontSize: 14, color: idx === 3 ? T.vermilion : T.vermilion, fontWeight: 700, letterSpacing: '0.18em' }}>
              STEP · {n}
            </div>
            <div style={{ marginTop: 18, fontFamily: T.fSerif, fontWeight: 800, fontSize: 56, letterSpacing: '-0.04em', lineHeight: 1 }}>
              {h}
            </div>
            <div style={{ marginTop: 16, fontFamily: T.fSerif, fontSize: 19, lineHeight: 1.5, color: idx === 3 ? T.inkFaint : T.ink, textWrap: 'pretty' }}>
              {d}
            </div>
            <div style={{ marginTop: 'auto', paddingTop: 18, fontFamily: T.fMono, fontSize: 12, color: idx === 3 ? T.inkFaint : T.inkMute, letterSpacing: '0.06em' }}>
              fig. 3.{idx + 1}
            </div>
          </div>
        ))}
      </div>
    </Slide>
  );
}

// ─────────────────────────────────────────────────────────────
// 09 — CLOSING / thank you
// ─────────────────────────────────────────────────────────────
function SlideClose() {
  return (
    <Slide dark page="09 / 09" noChrome>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 80, alignItems: 'center' }}>
        <div>
          <Wordmark size={36} mode="inline" sub="LABZ" color={T.paper} />
          <div style={{ marginTop: 36, fontFamily: T.fSerif, fontWeight: 800, fontSize: 168, lineHeight: 0.9, letterSpacing: '-0.045em', color: T.paper }}>
            Send a<br/>
            <span style={{ color: T.vermilion, fontStyle: 'italic', fontWeight: 600 }}>brief.</span>
          </div>
          <div style={{ marginTop: 28, fontFamily: T.fSerif, fontSize: 26, color: T.inkFaint, lineHeight: 1.4, maxWidth: 700 }}>
            48h pra resposta. Code, devlog e roadmap públicos no caminho.
          </div>
          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontFamily: T.fMono, fontSize: 18, color: T.paper, letterSpacing: '0.1em' }}>
              <span style={{ color: T.vermilion }}>→</span>&nbsp; hi@coslu.io
            </div>
            <div style={{ fontFamily: T.fMono, fontSize: 18, color: T.paper, letterSpacing: '0.1em' }}>
              <span style={{ color: T.vermilion }}>→</span>&nbsp; coslu.io / briefs
            </div>
            <div style={{ fontFamily: T.fMono, fontSize: 18, color: T.paper, letterSpacing: '0.1em' }}>
              <span style={{ color: T.vermilion }}>→</span>&nbsp; github.com/coslu
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>
          <MiniSeal size={380} />
          <DateStampInline rotate={3} size={1.1} label="VOL · I" date="ISS · 03" big="MAY 2026" />
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 56, left: 96, right: 96, display: 'flex', justifyContent: 'space-between', fontFamily: T.fMono, fontSize: 13, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.inkFaint }}>
        <span>C · O · S · L · U</span>
        <span>code · open source · logic · utility</span>
        <span>est. 2026 / sp / br</span>
      </div>
    </Slide>
  );
}

// ─────────────────────────────────────────────────────────────
// 10 — COMPARISON (before / after)
// ─────────────────────────────────────────────────────────────
function SlideCompare() {
  return (
    <Slide kicker="part · 04 / comparison" page="10 / 17">
      <Tag size={14} style={{ color: T.vermilion }}>§ 04.1 · before / after</Tag>
      <div style={{ marginTop: 14, fontFamily: T.fSerif, fontWeight: 800, fontSize: 84, letterSpacing: '-0.04em', lineHeight: 0.96 }}>
        Como o loop estava <span style={{ color: T.inkMute }}>—</span> e como ficou.
      </div>
      <div style={{ marginTop: 48, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, flex: 1 }}>
        <div style={{ border: `1px solid ${T.ink}`, padding: 36, background: T.paper2, display: 'flex', flexDirection: 'column' }}>
          <Tag color={T.inkMute}>BEFORE · jan 2026</Tag>
          <div style={{ marginTop: 14, fontFamily: T.fSerif, fontWeight: 800, fontSize: 144, color: T.inkMute, letterSpacing: '-0.05em', lineHeight: 0.9 }}>4h</div>
          <div style={{ marginTop: 12, fontFamily: T.fSerif, fontSize: 28 }}>average resolution time</div>
          <div style={{ marginTop: 'auto', fontFamily: T.fMono, fontSize: 18, color: T.ink, lineHeight: 1.7 }}>
            · 8 analystas humanos<br/>
            · 1.200 tickets / dia<br/>
            · 92% accuracy<br/>
            · $24k / mês headcount
          </div>
        </div>
        <div style={{ background: T.ink, color: T.paper, padding: 36, display: 'flex', flexDirection: 'column' }}>
          <Tag color={T.vermilion}>AFTER · mar 2026</Tag>
          <div style={{ marginTop: 14, fontFamily: T.fSerif, fontWeight: 800, fontSize: 184, color: T.vermilion, letterSpacing: '-0.05em', lineHeight: 0.9 }}>11m</div>
          <div style={{ marginTop: 12, fontFamily: T.fSerif, fontSize: 28, color: T.paper }}>average resolution time</div>
          <div style={{ marginTop: 'auto', fontFamily: T.fMono, fontSize: 18, color: T.paper, lineHeight: 1.7 }}>
            · 8 workers · 1 ML model<br/>
            · 1.200 tickets / dia<br/>
            · 97.4% accuracy<br/>
            · $3.2k / mês compute
          </div>
        </div>
      </div>
    </Slide>
  );
}

// ─────────────────────────────────────────────────────────────
// 11 — ROADMAP (quarterly milestones)
// ─────────────────────────────────────────────────────────────
function SlideRoadmap() {
  const qs = [
    { q: 'Q1', y: '2026', tag: 'shipped', items: ['queue v2', 'agents alpha', 'pipeline ui'] },
    { q: 'Q2', y: '2026', tag: 'in-flight', items: ['lattice 1.0', 'datalab gpu', 'inference cli'] },
    { q: 'Q3', y: '2026', tag: 'planned', items: ['platform · billing', 'devpipe stable', 'specimen v2'] },
    { q: 'Q4', y: '2026', tag: 'sketch', items: ['game runtime', 'paper · agents', 'lab unlocked'] },
  ];
  return (
    <Slide kicker="part · 05 / roadmap" page="11 / 17">
      <Tag size={14} style={{ color: T.vermilion }}>§ 05 · roadmap · 2026</Tag>
      <div style={{ marginTop: 14, fontFamily: T.fSerif, fontWeight: 800, fontSize: 84, letterSpacing: '-0.04em', lineHeight: 0.95 }}>
        Quatro trimestres. <span style={{ color: T.inkMute, fontStyle: 'italic', fontWeight: 500 }}>tudo público.</span>
      </div>
      <div style={{ flex: 1, marginTop: 48, position: 'relative', display: 'flex', alignItems: 'stretch' }}>
        {/* horizontal rule */}
        <div style={{ position: 'absolute', top: 24, left: 0, right: 0, height: 4, background: T.ink }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, width: '100%' }}>
          {qs.map((q, i) => (
            <div key={q.q} style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
              {/* node dot */}
              <div style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', width: 24, height: 24, borderRadius: 12, background: i < 2 ? T.vermilion : T.paper, border: `4px solid ${T.ink}` }} />
              <div style={{ marginTop: 56, fontFamily: T.fSerif, fontWeight: 800, fontSize: 88, letterSpacing: '-0.04em', lineHeight: 1 }}>
                {q.q}
              </div>
              <div style={{ fontFamily: T.fMono, fontSize: 14, letterSpacing: '0.16em', color: T.inkMute, marginTop: 4 }}>
                {q.y} · <span style={{ color: i < 2 ? T.vermilion : T.inkMute }}>{q.tag}</span>
              </div>
              <div style={{ marginTop: 22, paddingTop: 16, borderTop: `1px solid ${T.ink}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {q.items.map((it) => (
                  <div key={it} style={{ fontFamily: T.fMono, fontSize: 16, color: T.ink, letterSpacing: '0.04em' }}>
                    <span style={{ color: T.vermilion }}>→</span>&nbsp; {it}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Slide>
  );
}

// ─────────────────────────────────────────────────────────────
// 12 — TEAM grid
// ─────────────────────────────────────────────────────────────
function SlideTeam() {
  const team = [
    { i: 'CL', n: 'Founder',         r: 'principal · ml',     y: 'since 2023' },
    { i: 'MS', n: 'Mariana S.',      r: 'eng manager',         y: 'since 2024' },
    { i: 'RG', n: 'Rafael G.',       r: 'staff · backend',     y: 'since 2024' },
    { i: 'AK', n: 'Ana K.',          r: 'sr · ml research',    y: 'since 2025' },
    { i: 'PV', n: 'Pedro V.',        r: 'sr · platforms',      y: 'since 2025' },
    { i: 'LO', n: 'Lia O.',          r: 'staff · games',       y: 'since 2025' },
    { i: 'JN', n: 'Joana N.',        r: 'design · brand',      y: 'since 2026' },
    { i: 'BC', n: 'Bruno C.',        r: 'devrel · oss',        y: 'since 2026' },
  ];
  return (
    <Slide kicker="part · 06 / team" page="12 / 17" bg={T.paper2}>
      <Tag size={14} style={{ color: T.vermilion }}>§ 06 · the lab</Tag>
      <div style={{ marginTop: 14, fontFamily: T.fSerif, fontWeight: 800, fontSize: 84, letterSpacing: '-0.04em', lineHeight: 0.95 }}>
        Oito pessoas. <span style={{ color: T.inkMute, fontStyle: 'italic', fontWeight: 500 }}>nenhum gerente acidental.</span>
      </div>
      <div style={{ flex: 1, marginTop: 40, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, border: `1px solid ${T.ink}`, borderRight: 'none', borderBottom: 'none' }}>
        {team.map((m) => (
          <div key={m.i} style={{ padding: 24, borderRight: `1px solid ${T.ink}`, borderBottom: `1px solid ${T.ink}`, display: 'flex', flexDirection: 'column', background: T.paper, minHeight: 220 }}>
            <div style={{
              width: 96, height: 96, background: T.ink, color: T.paper,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: T.fSerif, fontWeight: 800, fontSize: 40, letterSpacing: '-0.04em',
            }}>{m.i}</div>
            <div style={{ marginTop: 18, fontFamily: T.fSerif, fontWeight: 700, fontSize: 26, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {m.n}
            </div>
            <div style={{ marginTop: 6, fontFamily: T.fMono, fontSize: 13, color: T.vermilion, letterSpacing: '0.06em' }}>// {m.r}</div>
            <div style={{ marginTop: 'auto', fontFamily: T.fMono, fontSize: 11, color: T.inkMute, letterSpacing: '0.08em' }}>{m.y}</div>
          </div>
        ))}
      </div>
    </Slide>
  );
}

// ─────────────────────────────────────────────────────────────
// 13 — PRICING tiers
// ─────────────────────────────────────────────────────────────
function SlidePricing() {
  const tiers = [
    {
      name: 'LAB',
      tag: 'short engagements',
      price: 'from $24k',
      sub: '2-4 weeks · fixed scope',
      bullets: ['discovery + spike', 'one shipping artifact', 'devlog público', 'MIT por default'],
      dark: false,
    },
    {
      name: 'PLATFORM',
      tag: 'recommended',
      price: 'from $84k / qtr',
      sub: '8-12 weeks · staffed pod',
      bullets: ['squad de 3-4 eng', 'pipeline + plataforma', 'observabilidade', 'training do time'],
      dark: true,
    },
    {
      name: 'ENTERPRISE',
      tag: 'long-term',
      price: 'contact us',
      sub: 'multi-quarter · IP custom',
      bullets: ['advisory + execução', 'SLA dedicado', 'IP fechado se preciso', 'no-OSS option'],
      dark: false,
    },
  ];
  return (
    <Slide kicker="part · 07 / pricing" page="13 / 17">
      <Tag size={14} style={{ color: T.vermilion }}>§ 07 · plans</Tag>
      <div style={{ marginTop: 14, fontFamily: T.fSerif, fontWeight: 800, fontSize: 84, letterSpacing: '-0.04em', lineHeight: 0.95 }}>
        Três formatos. <span style={{ color: T.inkMute, fontStyle: 'italic', fontWeight: 500 }}>todos com escopo claro.</span>
      </div>
      <div style={{ flex: 1, marginTop: 40, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {tiers.map((t) => (
          <div key={t.name} style={{
            border: `2px solid ${T.ink}`,
            background: t.dark ? T.ink : T.paper, color: t.dark ? T.paper : T.ink,
            padding: 32, display: 'flex', flexDirection: 'column', position: 'relative',
          }}>
            {t.dark && (
              <div style={{ position: 'absolute', top: -14, left: 24, background: T.vermilion, color: T.paper, padding: '4px 12px', fontFamily: T.fMono, fontSize: 11, fontWeight: 700, letterSpacing: '0.2em' }}>
                {t.tag}
              </div>
            )}
            <Tag color={t.dark ? T.inkFaint : T.inkMute}>{t.tag}</Tag>
            <div style={{ marginTop: 12, fontFamily: T.fSerif, fontWeight: 800, fontSize: 56, letterSpacing: '-0.04em', lineHeight: 1, color: t.dark ? T.paper : T.ink }}>
              {t.name}
            </div>
            <div style={{ marginTop: 18, fontFamily: T.fSerif, fontWeight: 700, fontSize: 32, color: t.dark ? T.vermilion : T.vermilion, letterSpacing: '-0.02em' }}>
              {t.price}
            </div>
            <div style={{ marginTop: 4, fontFamily: T.fMono, fontSize: 13, color: t.dark ? T.inkFaint : T.inkMute, letterSpacing: '0.06em' }}>// {t.sub}</div>
            <div style={{ marginTop: 24, paddingTop: 18, borderTop: `1px solid ${t.dark ? T.inkFaint : T.ink}`, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {t.bullets.map((b) => (
                <div key={b} style={{ fontFamily: T.fSerif, fontSize: 18, color: t.dark ? T.paper : T.ink, lineHeight: 1.3 }}>
                  <span style={{ color: T.vermilion, marginRight: 8 }}>+</span>{b}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Slide>
  );
}

// ─────────────────────────────────────────────────────────────
// 14 — LOGO WALL (client placeholders)
// ─────────────────────────────────────────────────────────────
function SlideLogoWall() {
  const logos = ['banco-x','rh.platform','gov-state','fintech-y','energia-z','retail-α','health-β','manufacturer-γ','startup-δ','agency-ε'];
  return (
    <Slide kicker="part · 08 / clients" page="14 / 17">
      <Tag size={14} style={{ color: T.vermilion }}>§ 08 · trusted by</Tag>
      <div style={{ marginTop: 14, fontFamily: T.fSerif, fontWeight: 800, fontSize: 84, letterSpacing: '-0.04em', lineHeight: 0.95 }}>
        Empresas que nos deixam mexer no <span style={{ color: T.vermilion, fontStyle: 'italic', fontWeight: 600 }}>core</span>.
      </div>
      <div style={{ flex: 1, marginTop: 40, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gridTemplateRows: 'repeat(2, 1fr)', gap: 0, border: `1px solid ${T.ink}`, borderRight: 'none', borderBottom: 'none' }}>
        {logos.map((l) => (
          <div key={l} style={{
            borderRight: `1px solid ${T.ink}`, borderBottom: `1px solid ${T.ink}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: T.paper, fontFamily: T.fSerif, fontWeight: 700, fontSize: 26,
            color: T.ink, letterSpacing: '-0.02em', position: 'relative',
          }}>
            <span style={{ opacity: 0.6 }}>{l}</span>
            <span style={{ position: 'absolute', top: 10, left: 10, fontFamily: T.fMono, fontSize: 9, color: T.inkFaint, letterSpacing: '0.16em' }}>★</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end' }}>
        <Tag color={T.inkMute}>// substituir por logos reais · placeholders</Tag>
      </div>
    </Slide>
  );
}

// ─────────────────────────────────────────────────────────────
// 15 — CODE DEMO (full-bleed terminal)
// ─────────────────────────────────────────────────────────────
function SlideCodeDemo() {
  return (
    <Slide kicker="part · 09 / live demo" page="15 / 17" noChrome dark>
      <div style={{ position: 'absolute', inset: 0, padding: 56, boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <span style={{ width: 12, height: 12, borderRadius: 6, background: '#ff5f57' }} />
              <span style={{ width: 12, height: 12, borderRadius: 6, background: '#febc2e' }} />
              <span style={{ width: 12, height: 12, borderRadius: 6, background: '#28c840' }} />
            </div>
            <span style={{ fontFamily: T.fMono, fontSize: 14, color: T.inkFaint, letterSpacing: '0.1em' }}>
              ~/projects/coslu-queue — bash — 120×34
            </span>
          </div>
          <Tag color={T.vermilion}>// live · running</Tag>
        </div>
        <div style={{ flex: 1, fontFamily: T.fMono, fontSize: 22, lineHeight: 1.6, color: T.paper, background: '#0a0a0a', padding: '24px 32px', border: `1px solid ${T.inkFaint}` }}>
          <div><span style={{ color: T.vermilion }}>$</span> coslu run --pipeline ops/triage --watch</div>
          <div style={{ color: T.inkFaint }}>›  loading config from queue.config.ts</div>
          <div style={{ color: T.cobalt }}>→  workers ready  <span style={{ color: T.inkFaint }}>(8 · max 16)</span></div>
          <div style={{ color: T.cobalt }}>→  model           <span style={{ color: T.paper }}>ft-v3</span> <span style={{ color: T.inkFaint }}>(latency p95: 340ms)</span></div>
          <div style={{ color: T.cobalt }}>→  fallback         <span style={{ color: T.paper }}>human queue</span> <span style={{ color: T.inkFaint }}>(SLA: 4h)</span></div>
          <div style={{ marginTop: 12, color: T.inkFaint }}>┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄</div>
          <div style={{ marginTop: 12 }}><span style={{ color: T.vermilion }}>✓</span> 1.204 tickets resolved  <span style={{ color: T.inkFaint }}>(11m 04s · 97.4% accuracy)</span></div>
          <div><span style={{ color: T.vermilion }}>✓</span> 34 escalated to human queue  <span style={{ color: T.inkFaint }}>(retry: 0)</span></div>
          <div><span style={{ color: T.vermilion }}>✓</span> cost: $4.23  <span style={{ color: T.inkFaint }}>(vs. $920 @ headcount)</span></div>
          <div style={{ marginTop: 18, color: T.paper }}><span style={{ color: T.vermilion }}>$</span> <span style={{ background: T.vermilion, color: T.ink, padding: '0 4px' }}>_</span></div>
        </div>
      </div>
    </Slide>
  );
}

// ─────────────────────────────────────────────────────────────
// 16 — CHART (bar chart)
// ─────────────────────────────────────────────────────────────
function SlideChart() {
  const data = [
    { m: 'jan', v: 14 },
    { m: 'fev', v: 22 },
    { m: 'mar', v: 41 },
    { m: 'abr', v: 58 },
    { m: 'mai', v: 76 },
    { m: 'jun', v: 88 },
    { m: 'jul', v: 102 },
    { m: 'ago', v: 124 },
    { m: 'set', v: 156 },
    { m: 'out', v: 198 },
    { m: 'nov', v: 247 },
    { m: 'dez', v: 312 },
  ];
  const max = 320;
  return (
    <Slide kicker="part · 10 / growth" page="16 / 17">
      <Tag size={14} style={{ color: T.vermilion }}>§ 10 · open source · stars</Tag>
      <div style={{ marginTop: 14, fontFamily: T.fSerif, fontWeight: 800, fontSize: 84, letterSpacing: '-0.04em', lineHeight: 0.95 }}>
        12k stars em 12 meses. <span style={{ color: T.inkMute, fontStyle: 'italic', fontWeight: 500 }}>sem ads.</span>
      </div>
      <div style={{ flex: 1, marginTop: 40, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 16, padding: '0 8px', borderBottom: `2px solid ${T.ink}` }}>
          {data.map((d, i) => {
            const h = (d.v / max) * 100;
            return (
              <div key={d.m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: T.fMono, fontSize: 14, color: T.ink, fontWeight: 700 }}>{d.v}</span>
                <div style={{ width: '100%', height: `${h}%`, background: i === data.length - 1 ? T.vermilion : T.ink, position: 'relative' }} />
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 16, padding: '12px 8px 0' }}>
          {data.map((d) => (
            <div key={d.m} style={{ flex: 1, textAlign: 'center', fontFamily: T.fMono, fontSize: 14, color: T.inkMute, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {d.m}
            </div>
          ))}
        </div>
      </div>
      <div style={{ marginTop: 18, display: 'flex', justifyContent: 'space-between' }}>
        <Tag>fig. 10.1 · cumulative stars · github.com/coslu/lattice</Tag>
        <Tag color={T.vermilion}>+ 312% YoY</Tag>
      </div>
    </Slide>
  );
}

// ─────────────────────────────────────────────────────────────
// 17 — REFERENCES (reading list)
// ─────────────────────────────────────────────────────────────
function SlideReferences() {
  const refs = [
    { n: '01', t: 'Built In Public — Notes',          a: 'coslu labz', y: '2026', kind: 'devlog' },
    { n: '02', t: 'Agents · A Survey for Builders',   a: 'a. karpathy + lab',  y: '2026', kind: 'paper' },
    { n: '03', t: 'Designing Data-Intensive Apps',    a: 'kleppmann, m.',      y: '2017', kind: 'book' },
    { n: '04', t: 'Pieter Hintjens — ZMQ Guide',      a: 'hintjens, p.',       y: '2013', kind: 'book' },
    { n: '05', t: 'Lattice · Composable agents',      a: 'github.com/coslu',   y: '2026', kind: 'repo' },
    { n: '06', t: 'Specimen · snapshot tests for LLM',a: 'github.com/coslu',   y: '2026', kind: 'repo' },
    { n: '07', t: 'The Mythical Man-Month',           a: 'brooks, f.',         y: '1975', kind: 'book' },
    { n: '08', t: 'On the Criteria to Be Used in Decomposing Systems', a: 'parnas, d.', y: '1972', kind: 'paper' },
  ];
  return (
    <Slide kicker="part · 11 / references" page="17 / 17">
      <Tag size={14} style={{ color: T.vermilion }}>§ 11 · reading</Tag>
      <div style={{ marginTop: 14, fontFamily: T.fSerif, fontWeight: 800, fontSize: 84, letterSpacing: '-0.04em', lineHeight: 0.95 }}>
        Onde a gente <span style={{ color: T.vermilion, fontStyle: 'italic', fontWeight: 600 }}>bebe água</span>.
      </div>
      <div style={{ flex: 1, marginTop: 40, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 56px' }}>
        {refs.map((r) => (
          <div key={r.n} style={{ display: 'grid', gridTemplateColumns: '50px 1fr 80px', alignItems: 'baseline', padding: '14px 0', borderBottom: `1px solid ${T.ink}`, gap: 14 }}>
            <span style={{ fontFamily: T.fMono, fontSize: 14, color: T.vermilion, fontWeight: 700, letterSpacing: '0.1em' }}>{r.n}</span>
            <div>
              <div style={{ fontFamily: T.fSerif, fontWeight: 700, fontSize: 20, letterSpacing: '-0.01em', lineHeight: 1.15, textWrap: 'balance' }}>
                {r.t}
              </div>
              <div style={{ fontFamily: T.fMono, fontSize: 11, color: T.inkMute, marginTop: 4, letterSpacing: '0.06em' }}>
                {r.a} · {r.y} · <span style={{ color: T.vermilion }}>{r.kind}</span>
              </div>
            </div>
            <span style={{ fontFamily: T.fMono, fontSize: 11, color: T.inkMute, letterSpacing: '0.16em', textTransform: 'uppercase', textAlign: 'right' }}>{r.kind}</span>
          </div>
        ))}
      </div>
    </Slide>
  );
}

Object.assign(window, {
  Slide, DateStampInline,
  SlideTitle, SlideAgenda, SlideSection, SlideContent,
  SlideData, SlideQuote, SlideImage, SlideTwoCol, SlideClose,
  SlideCompare, SlideRoadmap, SlideTeam, SlidePricing, SlideLogoWall,
  SlideCodeDemo, SlideChart, SlideReferences,
});
