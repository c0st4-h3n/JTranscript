// COSLU Labz · Full landing page (Site v0)
// Single-page scroller, 1280 wide, ~3500 tall. Sections stack vertically.

// ─────────────────────────────────────────────────────────────
// SHARED ATOMS (uses globals from brand.jsx: T, Wordmark, Tag, Rule, Placeholder, SealCore)
// ─────────────────────────────────────────────────────────────

function SectionHead({ index, kicker, title, accent = T.vermilion }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
        <Tag color={accent}>§ {index}</Tag>
        <div style={{ height: 1, flex: 1, background: T.ink, opacity: 0.4 }} />
        <Tag color={T.inkMute}>{kicker}</Tag>
      </div>
      <div style={{ fontFamily: T.fSerif, fontWeight: 800, fontSize: 64, letterSpacing: '-0.04em', lineHeight: 0.96, color: T.ink, textWrap: 'balance', maxWidth: 760 }}>
        {title}
      </div>
    </div>
  );
}

function CtaButton({ children, primary, style = {} }) {
  return (
    <button style={{
      fontFamily: T.fMono, fontSize: 13, fontWeight: 600,
      padding: '14px 22px',
      background: primary ? T.ink : 'transparent',
      color: primary ? T.paper : T.ink,
      border: primary ? 'none' : `1.5px solid ${T.ink}`,
      letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
      ...style,
    }}>{children}</button>
  );
}

// ─────────────────────────────────────────────────────────────
// NAV
// ─────────────────────────────────────────────────────────────
function SiteNav() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 56px', borderBottom: `1px solid ${T.ink}`, background: T.paper, position: 'relative', zIndex: 10 }}>
      <Wordmark size={26} mode="inline" sub="LABZ" />
      <div style={{ display: 'flex', gap: 30, fontFamily: T.fMono, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.ink }}>
        <span>work</span><span>open source</span><span>games</span><span>writing</span><span>contact</span>
      </div>
      <div style={{ fontFamily: T.fMono, fontSize: 11, color: T.inkMute, padding: '6px 10px', border: `1px solid ${T.ink}` }}>
        <span style={{ color: T.vermilion }}>●</span>&nbsp; accepting briefs · q3 2026
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// HERO
// ─────────────────────────────────────────────────────────────
function SiteHeroFull() {
  return (
    <div style={{ padding: '56px 56px 80px', borderBottom: `1px solid ${T.ink}` }}>
      <Tag>vol. I · iss. 01 · may 2026 · São Paulo / BR</Tag>
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 56, marginTop: 24, alignItems: 'end' }}>
        <div>
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
        </div>

        {/* sample case card */}
        <div style={{ background: T.paper2, border: `1px solid ${T.ink}`, padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Tag color={T.vermilion}>// case · automation</Tag>
            <Tag>fig. 1</Tag>
          </div>
          <div style={{ marginTop: 10, fontFamily: T.fSerif, fontWeight: 700, fontSize: 26, lineHeight: 1.15, letterSpacing: '-0.02em' }}>
            Cutting a 4-hour ops loop down to 11 minutes with one queue and one model.
          </div>
          <Placeholder label="diagram · pipeline overview" height={140} style={{ marginTop: 14 }} />
          <div style={{ marginTop: 14, fontFamily: T.fMono, fontSize: 11, lineHeight: 1.7, color: T.ink, background: T.paper3, padding: '10px 12px' }}>
            <span style={{ color: T.inkMute }}>$ </span>coslu run --pipeline ops/triage<br/>
            <span style={{ color: T.cobalt }}>→</span> queue: <b>ready</b> · workers: <b>8</b><br/>
            <span style={{ color: T.cobalt }}>→</span> model: <b>fine-tuned-v3</b><br/>
            <span style={{ color: T.vermilion }}>✓</span> 1,204 tickets resolved <span style={{ color: T.inkMute }}>(11m 04s)</span>
          </div>
          <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between' }}>
            <Tag>read the devlog →</Tag>
            <Tag color={T.vermilion}>open source</Tag>
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ marginTop: 48, paddingTop: 24, borderTop: `1px dashed ${T.inkMute}`, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
        {[['41','OSS repos'],['12','platforms shipped'],['7','games in lab'],['∞','curiosity']].map(([n, l]) => (
          <div key={l}>
            <div style={{ fontFamily: T.fSerif, fontWeight: 800, fontSize: 44, lineHeight: 1, letterSpacing: '-0.03em' }}>{n}</div>
            <Tag style={{ marginTop: 6 }}>{l}</Tag>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// WE BUILD — 2x2 grid of verticals
// ─────────────────────────────────────────────────────────────
function SiteWeBuild() {
  const items = [
    { i: '01', t: 'Automation', d: 'Pipelines, queues, agents que substituem trabalho operacional. Métricas em tempo real, fallback humano.', sample: 'ops/triage · ops/inbox · ops/billing' },
    { i: '02', t: 'AI applied', d: 'Modelos fine-tuned em dados do cliente. RAG sério, agents com guard-rails, eval contínuo.', sample: 'gpt-4.1 · llama-4 · custom heads' },
    { i: '03', t: 'Open source', d: 'A maior parte do que construímos vira biblioteca pública. Você ganha o que aprendemos no caminho.', sample: 'coslu/queue · /agents · /lattice' },
    { i: '04', t: 'Platforms', d: 'SaaS internos ou consumer, observados de cabo-a-rabo. Engineering como produto.', sample: 'admin · billing · analytics' },
  ];
  return (
    <div style={{ padding: '80px 56px', borderBottom: `1px solid ${T.ink}` }}>
      <SectionHead index="01" kicker="what we build" title={<>Quatro frentes — mesma <span style={{ color: T.vermilion }}>obsessão</span> por automatizar a parte chata.</>} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0, border: `1px solid ${T.ink}`, borderRight: 'none', borderBottom: 'none' }}>
        {items.map((it, idx) => (
          <div key={it.i} style={{
            padding: 28, borderRight: `1px solid ${T.ink}`, borderBottom: `1px solid ${T.ink}`,
            background: idx === 1 ? T.paper2 : T.paper, minHeight: 200,
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Tag color={T.vermilion}>§ {it.i}</Tag>
              <Tag>{`fig. 1.${idx + 1}`}</Tag>
            </div>
            <div style={{ fontFamily: T.fSerif, fontWeight: 800, fontSize: 36, letterSpacing: '-0.03em', marginTop: 14, lineHeight: 1 }}>
              {it.t}
            </div>
            <div style={{ fontFamily: T.fSerif, fontSize: 16, lineHeight: 1.5, marginTop: 12, color: T.ink, textWrap: 'pretty' }}>
              {it.d}
            </div>
            <div style={{ marginTop: 'auto', paddingTop: 18, fontFamily: T.fMono, fontSize: 11, color: T.inkMute, letterSpacing: '0.06em' }}>
              {`// ${it.sample}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// WORK — 3 case studies
// ─────────────────────────────────────────────────────────────
function SiteWork() {
  const cases = [
    { tag: 'automation · fintech', title: 'Triage de 1.2k tickets/dia em 11min', metric: '−96% latência', body: 'Substituímos uma equipe de 8 analistas por uma fila + dois modelos. Humanos viraram editores, não classificadores.' },
    { tag: 'ai · b2b saas',        title: 'Agent SDK pra rh.platform',           metric: '4 modelos × 12 ferramentas', body: 'SDK plug-and-play pra clientes embarcarem agents em seus produtos. MIT, com loja de skills.' },
    { tag: 'platform · gov',       title: 'Data warehouse → lakehouse',          metric: '12tb migrados, zero downtime', body: 'Substituímos um snowflake legado por um setup duckdb + iceberg + airflow. Custos −68%.' },
  ];
  return (
    <div style={{ padding: '80px 56px', borderBottom: `1px solid ${T.ink}`, background: T.paper2 }}>
      <SectionHead index="02" kicker="selected work" title={<>Coisas que ficaram em pé depois do <i>kickoff</i>.</>} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {cases.map((c, idx) => (
          <div key={c.title} style={{ background: T.paper, border: `1px solid ${T.ink}`, padding: 22, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Tag color={T.vermilion}>// {c.tag}</Tag>
              <Tag>{`№ 00${idx + 1}`}</Tag>
            </div>
            <Placeholder label={`case shot · ${c.tag.split(' · ')[0]}`} height={160} style={{ marginTop: 14 }} />
            <div style={{ marginTop: 16, fontFamily: T.fSerif, fontWeight: 700, fontSize: 22, lineHeight: 1.15, letterSpacing: '-0.02em' }}>
              {c.title}
            </div>
            <div style={{ marginTop: 8, fontFamily: T.fMono, fontSize: 12, color: T.vermilion, letterSpacing: '0.08em' }}>
              {c.metric}
            </div>
            <div style={{ marginTop: 12, fontFamily: T.fSerif, fontSize: 15, lineHeight: 1.5, color: T.ink, textWrap: 'pretty' }}>
              {c.body}
            </div>
            <div style={{ marginTop: 'auto', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Tag>read the devlog →</Tag>
              <Tag color={T.inkMute}>2026</Tag>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// OSS — repo grid
// ─────────────────────────────────────────────────────────────
function SiteOSS() {
  const repos = [
    { n: 'coslu/queue',          d: 'Job queue that does retries the way you actually want.',         lang: 'Go',         stars: '4.1k' },
    { n: 'coslu/lattice',        d: 'Composable agents — LLM-agnostic, observable, replayable.',      lang: 'TypeScript', stars: '12.6k' },
    { n: 'coslu/datalab',        d: 'Notebooks that compile to production. No Streamlit pain.',       lang: 'Python',     stars: '2.8k' },
    { n: 'coslu/inference-cli',  d: 'One-line model serving for fine-tuned models. OpenAI-compat.',   lang: 'Rust',       stars: '6.4k' },
    { n: 'coslu/devpipe',        d: 'CI/CD with sane defaults. Less yaml, more shipping.',            lang: 'Go',         stars: '1.2k' },
    { n: 'coslu/specimen',       d: 'Snapshot-test for LLM outputs. Diff models like you diff code.', lang: 'Python',     stars: '3.7k' },
  ];
  return (
    <div style={{ padding: '80px 56px', borderBottom: `1px solid ${T.ink}` }}>
      <SectionHead index="03" kicker="open source" title={<>O nosso lab é <span style={{ color: T.vermilion }}>público</span>. Fork, star, abre PR.</>} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, border: `1px solid ${T.ink}`, borderRight: 'none', borderBottom: 'none' }}>
        {repos.map((r) => (
          <div key={r.n} style={{ padding: 22, borderRight: `1px solid ${T.ink}`, borderBottom: `1px solid ${T.ink}`, display: 'flex', flexDirection: 'column', minHeight: 180, background: T.paper }}>
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
                <span style={{ width: 8, height: 8, borderRadius: 4, background: r.lang === 'Go' ? '#00ADD8' : r.lang === 'TypeScript' ? '#3178C6' : r.lang === 'Python' ? '#3776AB' : r.lang === 'Rust' ? '#CE422B' : T.ink }} />
                <span style={{ fontFamily: T.fMono, fontSize: 11, color: T.inkMute }}>{r.lang}</span>
              </div>
              <Tag color={T.inkMute}>MIT</Tag>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MANIFESTO — large editorial band with the seal
// ─────────────────────────────────────────────────────────────
function SiteManifesto() {
  return (
    <div style={{ padding: '100px 56px', background: T.ink, color: T.paper, borderBottom: `1px solid ${T.ink}` }} className="ink-bg">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 64, alignItems: 'center' }}>
        {/* seal as visual anchor */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <MiniSeal size={300} />
        </div>
        {/* manifesto text */}
        <div>
          <Tag color={T.vermilion}>§ 04 · manifesto</Tag>
          <div style={{ marginTop: 14, fontFamily: T.fSerif, fontWeight: 800, fontSize: 56, letterSpacing: '-0.03em', lineHeight: 1, color: T.paper }}>
            <span style={{ color: T.vermilion, fontStyle: 'italic', fontWeight: 600 }}>¶</span>{' '}
            Construímos em público.
          </div>
          <div style={{ marginTop: 24, fontFamily: T.fSerif, fontSize: 19, lineHeight: 1.6, color: T.paper, opacity: 0.9, maxWidth: 580, textWrap: 'pretty' }}>
            O lab existe porque a melhor forma de provar que a gente sabe construir é construindo.
            Cada projeto pago vira biblioteca, devlog, paper ou ferramenta aberta — então o próximo
            cliente já chega sabendo no que tá entrando.
          </div>
          <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 18 }}>
            {[
              ['Code', 'Tudo o que escrevemos é versionado e auditável.'],
              ['Open Source', 'A maior parte é pública. Sempre que possível, MIT.'],
              ['Logic', 'Decisões baseadas em métricas, não opinião.'],
              ['Utility', 'Se não resolve dor real do cliente, não fazemos.'],
            ].map(([k, v]) => (
              <div key={k} style={{ borderLeft: `2px solid ${T.vermilion}`, paddingLeft: 14 }}>
                <div style={{ fontFamily: T.fSerif, fontWeight: 800, fontSize: 22, color: T.paper, letterSpacing: '-0.02em' }}>{k}</div>
                <div style={{ fontFamily: T.fMono, fontSize: 11, color: T.inkFaint, marginTop: 4, lineHeight: 1.5, letterSpacing: '0.04em' }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// MiniSeal — reusable inline seal for landing / footer / slides
function MiniSeal({ size = 220, fg = T.paper, bg = T.ink, accent = T.vermilion }) {
  const pid = React.useId();
  const vb = 180;
  const rOuter = 170, rOuterThin = 161;
  const rTopPath = 138, rBotPath = 150;
  const tickR = 156;
  return (
    <div style={{ width: size, height: size, position: 'relative' }}>
      <svg viewBox={`-${vb} -${vb} ${vb*2} ${vb*2}`} width={size} height={size}>
        <circle r={rOuter}     fill="none" stroke={fg} strokeWidth="2.5" />
        <circle r={rOuterThin} fill="none" stroke={fg} strokeWidth="0.8" opacity="0.55" />
        <circle cx={-tickR} cy={0} r="4" fill={accent} />
        <circle cx={ tickR} cy={0} r="4" fill={accent} />
        <defs>
          <path id={`mst-${pid}`} d={`M ${-rTopPath},0 A ${rTopPath},${rTopPath} 0 0,1 ${rTopPath},0`} />
          <path id={`msb-${pid}`} d={`M ${-rBotPath},0 A ${rBotPath},${rBotPath} 0 0,0 ${rBotPath},0`} />
        </defs>
        <text fill={fg} style={{ fontFamily: T.fMono, fontSize: 12, letterSpacing: '0.24em', fontWeight: 700 }}>
          <textPath href={`#mst-${pid}`} startOffset="50%" textAnchor="middle">CODE · OPEN SOURCE · LOGIC · UTILITY</textPath>
        </text>
        <text fill={fg} style={{ fontFamily: T.fMono, fontSize: 17, letterSpacing: '0.32em', fontWeight: 700 }}>
          <textPath href={`#msb-${pid}`} startOffset="50%" textAnchor="middle">COSLU · <tspan fill={accent}>LABZ</tspan></textPath>
        </text>
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: size * 0.025 }}>
        <div style={{ fontFamily: T.fSerif, fontWeight: 800, fontSize: size * 0.3, letterSpacing: '-0.06em', color: fg, lineHeight: 1 }}>
          C<span style={{ color: accent }}>L</span>
        </div>
        <div style={{ width: size * 0.22, height: 1, background: fg, opacity: 0.4 }} />
        <div style={{ fontFamily: T.fMono, fontWeight: 700, fontSize: Math.max(8, size * 0.03), letterSpacing: '0.34em', color: fg }}>EST · 2026</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CONTACT
// ─────────────────────────────────────────────────────────────
function SiteContact() {
  return (
    <div style={{ padding: '80px 56px', borderBottom: `1px solid ${T.ink}` }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 48, alignItems: 'center' }}>
        <div>
          <Tag color={T.vermilion}>§ 05 · contact</Tag>
          <div style={{ marginTop: 14, fontFamily: T.fSerif, fontWeight: 800, fontSize: 64, letterSpacing: '-0.04em', lineHeight: 0.95 }}>
            Tem um problema técnico que ninguém te ajudou a resolver?
          </div>
          <div style={{ marginTop: 18, fontFamily: T.fSerif, fontSize: 19, color: T.ink, maxWidth: 560, textWrap: 'pretty' }}>
            Manda um brief. Em 48h a gente responde com escopo, prazo e o que viraria open source no caminho.
          </div>
        </div>
        {/* form mock */}
        <div style={{ background: T.paper2, border: `1px solid ${T.ink}`, padding: 22 }}>
          <Tag color={T.vermilion}>// new brief</Tag>
          <div style={{ marginTop: 14, fontFamily: T.fMono, fontSize: 12, lineHeight: 2, color: T.ink }}>
            <div><span style={{ color: T.inkMute }}>from →</span> _____________________</div>
            <div><span style={{ color: T.inkMute }}>company →</span> _____________________</div>
            <div><span style={{ color: T.inkMute }}>brief →</span></div>
            <div style={{ background: T.paper, height: 90, border: `1px solid ${T.ink}`, marginTop: 4 }} />
          </div>
          <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Tag>encrypted · pgp available</Tag>
            <CtaButton primary>Send →</CtaButton>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// FOOTER
// ─────────────────────────────────────────────────────────────
function SiteFooter() {
  return (
    <div style={{ background: T.ink, color: T.paper, padding: '40px 56px 28px' }} className="ink-bg">
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 0.8fr', gap: 36, alignItems: 'flex-start' }}>
        <div>
          <Wordmark size={28} mode="inline" sub="LABZ" color={T.paper} />
          <div style={{ marginTop: 14, fontFamily: T.fSerif, fontStyle: 'italic', fontSize: 15, color: T.inkFaint, maxWidth: 320, lineHeight: 1.5 }}>
            ¶ Code · Open Source · Logic · Utility.<br/>São Paulo / Brasil · est. 2026.
          </div>
        </div>
        {[
          { h: 'Build',  items: ['Automation', 'AI / ML', 'Platforms', 'Games'] },
          { h: 'Public', items: ['Open Source', 'Devlogs', 'Papers', 'Newsletter'] },
          { h: 'Lab',    items: ['About', 'Manifesto', 'Contact', 'Press'] },
        ].map((col) => (
          <div key={col.h}>
            <Tag color={T.vermilion}>{col.h}</Tag>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {col.items.map((it) => (
                <span key={it} style={{ fontFamily: T.fMono, fontSize: 12, color: T.paper, letterSpacing: '0.06em' }}>{it}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 36, paddingTop: 16, borderTop: `1px solid ${T.inkFaint}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: T.fMono, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.inkFaint }}>
        <span>© 2026 coslu labz</span>
        <span>C · O · S · L · U</span>
        <span>hi@coslu.io</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// FULL SITE
// ─────────────────────────────────────────────────────────────
function FullSite() {
  return (
    <div style={{ width: '100%', minHeight: '100%', background: T.paper, fontFamily: T.fSerif, color: T.ink }} className="paper-bg">
      <SiteNav />
      <SiteHeroFull />
      <SiteWeBuild />
      <SiteWork />
      <SiteOSS />
      <SiteManifesto />
      <SiteContact />
      <SiteFooter />
    </div>
  );
}

Object.assign(window, { FullSite, MiniSeal, SectionHead, CtaButton, SiteNav, SiteHeroFull, SiteWeBuild, SiteWork, SiteOSS, SiteManifesto, SiteContact, SiteFooter });
