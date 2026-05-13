// COSLU Labz · Site v2 — clean, animated, interactive
// Adds on top of brand.jsx + site.jsx primitives.
// Highlights:
//   • useInView (IntersectionObserver) → scroll-triggered reveals & count-ups
//   • Hero terminal with live typewriter
//   • Slim-on-scroll nav
//   • OSS grid with language filter
//   • Build-a-brief: pick chips → live-generated brief on the right
//   • Marquee at the bottom

const { useState, useEffect, useRef, useMemo } = React;

// ─────────────────────────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────────────────────────

function useInView(threshold = 0.18, once = true) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        if (once) obs.disconnect();
      } else if (!once) setInView(false);
    }, { threshold });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold, once]);
  return [ref, inView];
}

function useTypewriter(text, { speed = 28, startDelay = 0, enabled = true } = {}) {
  const [out, setOut] = useState('');
  useEffect(() => {
    if (!enabled) { setOut(text); return; }
    setOut('');
    let i = 0, t;
    const tick = () => {
      i++;
      setOut(text.slice(0, i));
      if (i < text.length) t = setTimeout(tick, speed);
    };
    const start = setTimeout(() => { tick(); }, startDelay);
    return () => { clearTimeout(start); clearTimeout(t); };
  }, [text, speed, startDelay, enabled]);
  return out;
}

function useCountUp(target, { duration = 1400, enabled = true, format = (n) => n } = {}) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!enabled) { setValue(0); return; }
    const startTime = performance.now();
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, enabled]);
  return format(Math.round(value));
}

// Generic reveal-on-scroll wrapper
function Reveal({ children, delay = 0, dist = 28, style = {}, threshold = 0.15, ...rest }) {
  const [ref, inView] = useInView(threshold);
  return (
    <div ref={ref} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? 'translateY(0)' : `translateY(${dist}px)`,
      transition: `opacity 760ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 760ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
      willChange: 'opacity, transform',
      ...style,
    }} {...rest}>{children}</div>
  );
}

// ─────────────────────────────────────────────────────────────
// NAV (slim on scroll)
// ─────────────────────────────────────────────────────────────

function NavV2({ scrollerRef }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const el = scrollerRef?.current || window;
    const onScroll = () => {
      const y = (scrollerRef?.current ? el.scrollTop : window.scrollY) || 0;
      setScrolled(y > 60);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener('scroll', onScroll);
  }, [scrollerRef]);
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 20,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: scrolled ? '12px 40px' : '20px 56px',
      borderBottom: `1px solid ${T.ink}`,
      background: scrolled ? 'rgba(239, 232, 216, 0.92)' : T.paper,
      backdropFilter: scrolled ? 'blur(8px)' : 'none',
      transition: 'padding 240ms ease, background 240ms ease',
    }}>
      <Wordmark size={scrolled ? 22 : 26} mode="inline" sub="LABZ" />
      <div style={{ display: 'flex', gap: 28, fontFamily: T.fMono, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.ink }}>
        {['work', 'open source', 'games', 'writing', 'contact'].map((l) => (
          <span key={l} className="nav-link" style={{ cursor: 'pointer', position: 'relative', padding: '4px 0' }}>{l}</span>
        ))}
      </div>
      <div style={{ fontFamily: T.fMono, fontSize: 11, color: T.inkMute, padding: '6px 10px', border: `1px solid ${T.ink}` }}>
        <span style={{ color: T.vermilion, display: 'inline-block', animation: 'pulse 1.8s infinite' }}>●</span>&nbsp; accepting briefs · q3 2026
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// HERO (with live typewriter terminal + count-up KPIs)
// ─────────────────────────────────────────────────────────────

function HeroV2() {
  const [ref, inView] = useInView(0.2);

  // typewriter chain — each line waits for the prior
  const l1 = useTypewriter('coslu run --pipeline ops/triage', { speed: 22, startDelay: 600, enabled: inView });
  const l1Done = l1.length === 'coslu run --pipeline ops/triage'.length;
  const l2 = useTypewriter('queue: ready · workers: 8', { speed: 18, startDelay: l1Done ? 200 : 99999, enabled: inView && l1Done });
  const l2Done = l2.length === 'queue: ready · workers: 8'.length;
  const l3 = useTypewriter('model: ft-v3 · fallback: human', { speed: 18, startDelay: l2Done ? 150 : 99999, enabled: inView && l2Done });
  const l3Done = l3.length === 'model: ft-v3 · fallback: human'.length;
  const l4 = useTypewriter('1.204 tickets resolved (11m 04s)', { speed: 16, startDelay: l3Done ? 200 : 99999, enabled: inView && l3Done });

  return (
    <div ref={ref} style={{ padding: '56px 56px 80px', borderBottom: `1px solid ${T.ink}` }}>
      <Reveal>
        <Tag>vol. I · iss. 01 · may 2026 · São Paulo / BR</Tag>
      </Reveal>
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 56, marginTop: 24, alignItems: 'end' }}>
        <Reveal delay={120}>
          <div style={{ fontFamily: T.fSerif, fontWeight: 800, fontSize: 108, lineHeight: 0.9, letterSpacing: '-0.045em' }}>
            We&nbsp;ship<br/>
            <span style={{ color: T.vermilion, fontStyle: 'italic', fontWeight: 600 }}>artifacts</span>,<br/>
            not&nbsp;decks.
          </div>
          <div style={{ marginTop: 28, fontFamily: T.fSerif, fontSize: 21, lineHeight: 1.5, color: T.ink, maxWidth: 540, textWrap: 'pretty' }}>
            Um coletivo de engenharia que constrói automação, IA aplicada e plataforma —
            e <i>publica o caminho</i>:{' '}
            <span style={{ borderBottom: `2px solid ${T.vermilion}` }}>código aberto, papers e devlogs</span>.
          </div>
          <div style={{ marginTop: 32, display: 'flex', gap: 12 }}>
            <CtaButton primary>Start a brief →</CtaButton>
            <CtaButton>Browse OSS</CtaButton>
          </div>
        </Reveal>

        <Reveal delay={240}>
          <div className="case-card" style={{ background: T.paper2, border: `1px solid ${T.ink}`, padding: 24, transition: 'transform 320ms ease, box-shadow 320ms ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Tag color={T.vermilion}>// case · automation</Tag>
              <Tag>fig. 1</Tag>
            </div>
            <div style={{ marginTop: 10, fontFamily: T.fSerif, fontWeight: 700, fontSize: 26, lineHeight: 1.15, letterSpacing: '-0.02em' }}>
              Cutting a 4-hour ops loop down to 11 minutes with one queue and one model.
            </div>
            <Placeholder label="diagram · pipeline overview" height={140} style={{ marginTop: 14 }} />
            <div style={{ marginTop: 14, fontFamily: T.fMono, fontSize: 11, lineHeight: 1.7, color: T.ink, background: T.paper3, padding: '10px 12px', minHeight: 92 }}>
              <div><span style={{ color: T.inkMute }}>$ </span>{l1}<TermCaret show={!l1Done} /></div>
              {l1Done && <div><span style={{ color: T.cobalt }}>→</span> {l2}<TermCaret show={l1Done && !l2Done} /></div>}
              {l2Done && <div><span style={{ color: T.cobalt }}>→</span> {l3}<TermCaret show={l2Done && !l3Done} /></div>}
              {l3Done && <div><span style={{ color: T.vermilion }}>✓</span> {l4}<TermCaret show={l3Done && l4.length < 32} /></div>}
            </div>
            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between' }}>
              <Tag>read the devlog →</Tag>
              <Tag color={T.vermilion}>open source</Tag>
            </div>
          </div>
        </Reveal>
      </div>

      <KPIStrip inView={inView} />
    </div>
  );
}

function TermCaret({ show }) {
  return show ? <span style={{ display: 'inline-block', width: 6, height: 11, background: T.ink, marginLeft: 2, verticalAlign: 'baseline', animation: 'blink 1s steps(1) infinite' }} /> : null;
}

function KPIStrip({ inView }) {
  const k1 = useCountUp(41, { enabled: inView });
  const k2 = useCountUp(12, { enabled: inView });
  const k3 = useCountUp(7, { enabled: inView });
  return (
    <Reveal delay={360}>
      <div style={{ marginTop: 48, paddingTop: 24, borderTop: `1px dashed ${T.inkMute}`, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
        {[[k1, 'OSS repos'], [k2, 'platforms shipped'], [k3, 'games in lab'], ['∞', 'curiosity']].map(([n, l]) => (
          <div key={l}>
            <div style={{ fontFamily: T.fSerif, fontWeight: 800, fontSize: 44, lineHeight: 1, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>{n}</div>
            <Tag style={{ marginTop: 6 }}>{l}</Tag>
          </div>
        ))}
      </div>
    </Reveal>
  );
}

// ─────────────────────────────────────────────────────────────
// WE BUILD (2x2 with staggered reveal + hover)
// ─────────────────────────────────────────────────────────────

function WeBuildV2() {
  const items = [
    { i: '01', t: 'Automation',  d: 'Pipelines, queues, agents que substituem trabalho operacional.', s: 'ops/triage · ops/inbox' },
    { i: '02', t: 'AI applied',  d: 'Modelos fine-tuned em dados do cliente. RAG sério, agents com guard-rails.', s: 'gpt-4.1 · llama-4 · custom' },
    { i: '03', t: 'Open source', d: 'A maior parte vira biblioteca pública. Você ganha o que aprendemos.', s: 'coslu/queue · /lattice' },
    { i: '04', t: 'Platforms',   d: 'SaaS internos ou consumer, observados de cabo-a-rabo.', s: 'admin · billing · analytics' },
  ];
  return (
    <div style={{ padding: '88px 56px', borderBottom: `1px solid ${T.ink}` }}>
      <Reveal>
        <SectionHead index="01" kicker="what we build" title={<>Quatro frentes — mesma <span style={{ color: T.vermilion }}>obsessão</span>.</>} />
      </Reveal>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0, border: `1px solid ${T.ink}`, borderRight: 'none', borderBottom: 'none' }}>
        {items.map((it, idx) => (
          <Reveal key={it.i} delay={idx * 80}>
            <BuildCard idx={idx} {...it} />
          </Reveal>
        ))}
      </div>
    </div>
  );
}

function BuildCard({ i, t, d, s, idx }) {
  const [hover, setHover] = useState(false);
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{
      padding: 28, borderRight: `1px solid ${T.ink}`, borderBottom: `1px solid ${T.ink}`,
      background: hover ? T.ink : (idx === 1 ? T.paper2 : T.paper),
      color: hover ? T.paper : T.ink,
      minHeight: 220, display: 'flex', flexDirection: 'column',
      transition: 'background 320ms ease, color 320ms ease',
      cursor: 'pointer', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Tag color={T.vermilion}>§ {i}</Tag>
        <Tag color={hover ? T.inkFaint : T.inkMute}>{`fig. 1.${idx + 1}`}</Tag>
      </div>
      <div style={{ fontFamily: T.fSerif, fontWeight: 800, fontSize: 42, letterSpacing: '-0.03em', marginTop: 14, lineHeight: 1, transition: 'color 320ms' }}>
        {t}
      </div>
      <div style={{ fontFamily: T.fSerif, fontSize: 16, lineHeight: 1.5, marginTop: 12, color: hover ? T.paper : T.ink, opacity: hover ? 0.9 : 1, textWrap: 'pretty' }}>
        {d}
      </div>
      <div style={{ marginTop: 'auto', paddingTop: 18, fontFamily: T.fMono, fontSize: 11, color: hover ? T.vermilion : T.inkMute, letterSpacing: '0.06em' }}>
        {`// ${s}`}
      </div>
      {/* arrow that slides in on hover */}
      <div style={{ position: 'absolute', bottom: 24, right: 24, fontFamily: T.fSerif, fontSize: 28, color: T.vermilion, transform: hover ? 'translateX(0)' : 'translateX(-12px)', opacity: hover ? 1 : 0, transition: 'transform 320ms, opacity 320ms' }}>→</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// OSS GRID with language filter
// ─────────────────────────────────────────────────────────────

function OSSV2() {
  const repos = [
    { n: 'coslu/queue',         d: 'Job queue that does retries the way you actually want.',         lang: 'Go',         stars: '4.1k' },
    { n: 'coslu/lattice',       d: 'Composable agents — LLM-agnostic, observable, replayable.',      lang: 'TypeScript', stars: '12.6k' },
    { n: 'coslu/datalab',       d: 'Notebooks that compile to production. No Streamlit pain.',       lang: 'Python',     stars: '2.8k' },
    { n: 'coslu/inference-cli', d: 'One-line model serving for fine-tuned models. OpenAI-compat.',   lang: 'Rust',       stars: '6.4k' },
    { n: 'coslu/devpipe',       d: 'CI/CD with sane defaults. Less yaml, more shipping.',            lang: 'Go',         stars: '1.2k' },
    { n: 'coslu/specimen',      d: 'Snapshot-test for LLM outputs. Diff models like you diff code.', lang: 'Python',     stars: '3.7k' },
  ];
  const langs = ['all', ...Array.from(new Set(repos.map((r) => r.lang)))];
  const [filter, setFilter] = useState('all');
  const filtered = filter === 'all' ? repos : repos.filter((r) => r.lang === filter);
  const langColor = (lang) => ({ Go: '#00ADD8', TypeScript: '#3178C6', Python: '#3776AB', Rust: '#CE422B' }[lang] || T.ink);

  return (
    <div style={{ padding: '88px 56px', borderBottom: `1px solid ${T.ink}` }}>
      <Reveal>
        <SectionHead index="03" kicker="open source" title={<>O lab é <span style={{ color: T.vermilion }}>público</span>. Fork, star, abre PR.</>} />
      </Reveal>
      <Reveal delay={100}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
          <Tag>filter by lang</Tag>
          {langs.map((l) => (
            <button key={l} onClick={() => setFilter(l)} style={{
              fontFamily: T.fMono, fontSize: 12, padding: '6px 12px',
              background: filter === l ? T.ink : 'transparent',
              color: filter === l ? T.paper : T.ink,
              border: `1px solid ${T.ink}`, cursor: 'pointer',
              letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600,
              transition: 'background 180ms, color 180ms',
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>
              {l !== 'all' && <span style={{ width: 7, height: 7, borderRadius: 4, background: langColor(l) }} />}
              {l}
            </button>
          ))}
        </div>
      </Reveal>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, border: `1px solid ${T.ink}`, borderRight: 'none', borderBottom: 'none', position: 'relative', minHeight: 360 }}>
        {filtered.map((r, idx) => (
          <Reveal key={r.n} delay={idx * 50}>
            <RepoCard r={r} langColor={langColor(r.lang)} />
          </Reveal>
        ))}
        {filtered.length === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: 60, textAlign: 'center', fontFamily: T.fMono, color: T.inkMute, borderRight: `1px solid ${T.ink}`, borderBottom: `1px solid ${T.ink}` }}>
            // no repos match this filter
          </div>
        )}
      </div>
    </div>
  );
}

function RepoCard({ r, langColor }) {
  const [hover, setHover] = useState(false);
  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{
      padding: 22, borderRight: `1px solid ${T.ink}`, borderBottom: `1px solid ${T.ink}`,
      display: 'flex', flexDirection: 'column', minHeight: 180,
      background: T.paper, cursor: 'pointer',
      boxShadow: hover ? `inset 0 0 0 2px ${T.vermilion}` : 'none',
      transition: 'box-shadow 180ms ease, transform 180ms ease',
      transform: hover ? 'translateY(-2px)' : 'translateY(0)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: T.fMono, fontWeight: 700, fontSize: 14 }}>
          <span style={{ color: T.inkMute }}>github.com/</span>{r.n.replace('coslu/', '')}
        </span>
        <Tag color={T.vermilion}>★ {r.stars}</Tag>
      </div>
      <div style={{ marginTop: 14, fontFamily: T.fSerif, fontSize: 17, lineHeight: 1.4, textWrap: 'pretty' }}>
        {r.d}
      </div>
      <div style={{ marginTop: 'auto', paddingTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: 4, background: langColor }} />
          <span style={{ fontFamily: T.fMono, fontSize: 11, color: T.inkMute }}>{r.lang}</span>
        </div>
        <Tag color={hover ? T.vermilion : T.inkMute}>{hover ? 'open repo →' : 'MIT'}</Tag>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// BUILD A BRIEF — interactive form
// ─────────────────────────────────────────────────────────────

const BRIEF_OPTIONS = {
  type:  { label: 'What kind of build?', options: ['Automation', 'AI / ML', 'Platform', 'Game prototype'] },
  scope: { label: 'How deep?',            options: ['Quick spike (2–4w)', 'Full build (2–3mo)', 'Long-term (6mo+)'] },
  when:  { label: 'When do you start?',   options: ['ASAP', 'Next quarter', 'Exploratory'] },
  oss:   { label: 'Open-source the work?',options: ['Yes, MIT', 'Yes, AGPL', 'Internal only'] },
};

const BRIEF_ESTIMATE = {
  'Quick spike (2–4w)':   { range: '$24k – $48k',  squad: '2 eng',     time: '2–4 weeks' },
  'Full build (2–3mo)':   { range: '$84k – $180k', squad: '3–4 eng',   time: '8–12 weeks' },
  'Long-term (6mo+)':     { range: '$300k+ / qtr', squad: '4–6 eng',   time: '6+ months' },
};

function BuildABrief() {
  const [picks, setPicks] = useState({});
  const ready = picks.type && picks.scope && picks.when && picks.oss;
  const est = picks.scope ? BRIEF_ESTIMATE[picks.scope] : null;

  return (
    <div style={{ padding: '88px 56px', borderBottom: `1px solid ${T.ink}`, background: T.paper2 }}>
      <Reveal>
        <SectionHead index="05" kicker="interactive · build a brief" title={<>Monta o brief em <span style={{ color: T.vermilion, fontStyle: 'italic', fontWeight: 600 }}>30 segundos</span>.</>} />
      </Reveal>
      <Reveal delay={120}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          {/* left: choices */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {Object.entries(BRIEF_OPTIONS).map(([k, { label, options }]) => (
              <div key={k}>
                <Tag color={T.vermilion}>{label}</Tag>
                <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {options.map((opt) => {
                    const active = picks[k] === opt;
                    return (
                      <button key={opt} onClick={() => setPicks((p) => ({ ...p, [k]: opt }))} style={{
                        fontFamily: T.fMono, fontSize: 12, padding: '10px 14px',
                        background: active ? T.ink : T.paper, color: active ? T.paper : T.ink,
                        border: `1px solid ${T.ink}`, cursor: 'pointer',
                        letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600,
                        transition: 'background 180ms, color 180ms, transform 120ms',
                        transform: active ? 'translateY(-1px)' : 'translateY(0)',
                      }}>{opt}</button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* right: live output */}
          <div style={{
            background: ready ? T.ink : T.paper, color: ready ? T.paper : T.ink,
            border: `1px solid ${T.ink}`, padding: 28, position: 'relative',
            transition: 'background 320ms, color 320ms',
            minHeight: 460,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Tag color={T.vermilion}>// generated_brief.md</Tag>
              <Tag color={ready ? T.inkFaint : T.inkMute}>{ready ? 'ready to send' : 'awaiting input'}</Tag>
            </div>
            {!ready && (
              <div style={{ marginTop: 32, fontFamily: T.fMono, fontSize: 13, color: T.inkMute, lineHeight: 1.7 }}>
                <div># brief</div>
                <div># type:    <span style={{ color: picks.type ? T.vermilion : T.inkFaint }}>{picks.type || '_____'}</span></div>
                <div># scope:   <span style={{ color: picks.scope ? T.vermilion : T.inkFaint }}>{picks.scope || '_____'}</span></div>
                <div># when:    <span style={{ color: picks.when ? T.vermilion : T.inkFaint }}>{picks.when || '_____'}</span></div>
                <div># oss:     <span style={{ color: picks.oss ? T.vermilion : T.inkFaint }}>{picks.oss || '_____'}</span></div>
                <div style={{ marginTop: 18, color: T.inkFaint }}>// fill in the four picks on the left to generate</div>
              </div>
            )}
            {ready && (
              <div style={{ marginTop: 18 }}>
                <div style={{ fontFamily: T.fSerif, fontWeight: 800, fontSize: 32, color: T.paper, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                  {picks.type} · {picks.scope.split(' (')[0]}
                </div>
                <div style={{ fontFamily: T.fMono, fontSize: 12, color: T.inkFaint, marginTop: 8, letterSpacing: '0.06em' }}>
                  start: {picks.when} · ip: {picks.oss}
                </div>
                <Rule color={T.paper} style={{ marginTop: 18, opacity: 0.4 }} />
                <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                  <Field k="Budget"   v={est.range} />
                  <Field k="Squad"    v={est.squad} />
                  <Field k="Timeline" v={est.time} />
                </div>
                <Rule color={T.paper} style={{ marginTop: 18, opacity: 0.4 }} />
                <div style={{ marginTop: 18, fontFamily: T.fSerif, fontSize: 16, color: T.paper, lineHeight: 1.55, textWrap: 'pretty' }}>
                  Pra um build de <b>{picks.type.toLowerCase()}</b> com escopo <b>{picks.scope.toLowerCase()}</b>,
                  começando <b>{picks.when.toLowerCase()}</b>, montamos um squad de <b>{est.squad}</b> e entregamos em <b>{est.time}</b>.
                  O caminho vira <b>{picks.oss.toLowerCase()}</b>, com devlog público no final.
                </div>
                <button style={{
                  marginTop: 24,
                  fontFamily: T.fMono, fontSize: 13, fontWeight: 700, padding: '14px 22px',
                  background: T.vermilion, color: T.paper, border: 'none',
                  letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
                }}>Send brief →</button>
              </div>
            )}
          </div>
        </div>
      </Reveal>
    </div>
  );
}

function Field({ k, v }) {
  return (
    <div>
      <div style={{ fontFamily: T.fMono, fontSize: 10, letterSpacing: '0.2em', color: T.inkFaint, textTransform: 'uppercase' }}>{k}</div>
      <div style={{ fontFamily: T.fSerif, fontWeight: 700, fontSize: 20, color: T.vermilion, marginTop: 4, letterSpacing: '-0.01em' }}>{v}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MANIFESTO with seal reveal
// ─────────────────────────────────────────────────────────────

function ManifestoV2() {
  const [ref, inView] = useInView(0.25);
  return (
    <div ref={ref} style={{ padding: '100px 56px', background: T.ink, color: T.paper, borderBottom: `1px solid ${T.ink}` }} className="ink-bg">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 64, alignItems: 'center' }}>
        <div style={{
          display: 'flex', justifyContent: 'center',
          opacity: inView ? 1 : 0,
          transform: inView ? 'rotate(0deg) scale(1)' : 'rotate(-15deg) scale(0.85)',
          transition: 'opacity 900ms ease 80ms, transform 900ms cubic-bezier(0.16, 1, 0.3, 1) 80ms',
        }}>
          <MiniSeal size={300} />
        </div>
        <Reveal delay={200}>
          <Tag color={T.vermilion}>§ 04 · manifesto</Tag>
          <div style={{ marginTop: 14, fontFamily: T.fSerif, fontWeight: 800, fontSize: 56, letterSpacing: '-0.03em', lineHeight: 1, color: T.paper }}>
            <span style={{ color: T.vermilion, fontStyle: 'italic', fontWeight: 600 }}>¶</span>{' '}
            Construímos em público.
          </div>
          <div style={{ marginTop: 24, fontFamily: T.fSerif, fontSize: 19, lineHeight: 1.6, color: T.paper, opacity: 0.9, maxWidth: 580, textWrap: 'pretty' }}>
            O lab existe porque a melhor forma de provar que sabemos construir é construindo.
            Cada projeto pago vira biblioteca, devlog, paper ou ferramenta aberta — o próximo
            cliente já chega sabendo no que tá entrando.
          </div>
          <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 18 }}>
            {[
              ['Code',         'Tudo o que escrevemos é versionado e auditável.'],
              ['Open Source',  'A maior parte é pública. Sempre que possível, MIT.'],
              ['Logic',        'Decisões baseadas em métricas, não opinião.'],
              ['Utility',      'Se não resolve dor real do cliente, não fazemos.'],
            ].map(([k, v], idx) => (
              <Reveal key={k} delay={260 + idx * 60}>
                <div style={{ borderLeft: `2px solid ${T.vermilion}`, paddingLeft: 14 }}>
                  <div style={{ fontFamily: T.fSerif, fontWeight: 800, fontSize: 22, color: T.paper, letterSpacing: '-0.02em' }}>{k}</div>
                  <div style={{ fontFamily: T.fMono, fontSize: 11, color: T.inkFaint, marginTop: 4, lineHeight: 1.5, letterSpacing: '0.04em' }}>{v}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </Reveal>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MARQUEE strip
// ─────────────────────────────────────────────────────────────

function MarqueeStrip() {
  const items = ['CODE', '· OPEN SOURCE ·', 'LOGIC', '· UTILITY ·', 'BUILT IN PUBLIC', '· SP · BR ·', 'EST · 2026', '· COSLU · LABZ ·'];
  const run = (
    <div style={{ display: 'flex', gap: 40, paddingRight: 40, fontFamily: T.fSerif, fontWeight: 800, fontSize: 56, letterSpacing: '-0.02em', color: T.paper }}>
      {items.map((it, i) => <span key={i} style={{ whiteSpace: 'nowrap' }}>{i % 4 === 1 || i % 4 === 3 ? <span style={{ color: T.vermilion }}>{it}</span> : it}</span>)}
    </div>
  );
  return (
    <div style={{ background: T.ink, color: T.paper, padding: '24px 0', overflow: 'hidden', borderTop: `1px solid ${T.ink}` }}>
      <div style={{ display: 'flex', animation: 'marquee 28s linear infinite', width: 'max-content' }}>
        {run}{run}{run}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// FULL SITE V2
// ─────────────────────────────────────────────────────────────

function FullSiteV2() {
  return (
    <div style={{ width: '100%', minHeight: '100%', background: T.paper, fontFamily: T.fSerif, color: T.ink, position: 'relative' }} className="paper-bg">
      <style>{`
        @keyframes blink { 0%, 50% { opacity: 1 } 51%, 100% { opacity: 0 } }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1) } 50% { opacity: 0.6; transform: scale(1.4) } }
        @keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-33.333%) } }
        .nav-link::after {
          content: ''; position: absolute; left: 0; right: 0; bottom: 0;
          height: 2px; background: ${T.vermilion}; transform: scaleX(0); transform-origin: left;
          transition: transform 200ms ease;
        }
        .nav-link:hover::after { transform: scaleX(1); }
        .case-card:hover { transform: translateY(-3px); box-shadow: 0 12px 0 -8px ${T.vermilion}; }
      `}</style>
      <NavV2 />
      <HeroV2 />
      <WeBuildV2 />
      <SiteWork />
      <OSSV2 />
      <ManifestoV2 />
      <BuildABrief />
      <MarqueeStrip />
      <SiteFooter />
    </div>
  );
}

Object.assign(window, { FullSiteV2, NavV2, HeroV2, WeBuildV2, OSSV2, BuildABrief, MarqueeStrip, ManifestoV2, useInView, useTypewriter, useCountUp, Reveal });
