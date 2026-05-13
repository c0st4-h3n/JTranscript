/**
 * Janela de Settings — conecta no backend WS, lê config via `get_config`,
 * salva via `set_config`. Hot-reloadable: model + device + mode.
 *
 * Visual: mesma paleta + tipografia + bg gradient da Pill, pra coerência.
 */

import { invoke } from "@tauri-apps/api/core";
import {
  disable as disableAutostart,
  enable as enableAutostart,
  isEnabled as isAutostartEnabled,
} from "@tauri-apps/plugin-autostart";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  type ConfigAppliedEvent,
  DictationSocket,
  type SettingsSnapshot,
} from "../lib/dictation-socket";
import { browserWebSocketTransport } from "../lib/ws-transport";
import { Stamp } from "../ui/Stamp";
import { COLOR, FONT_DISPLAY, FONT_MONO, RADIUS, RULE } from "../ui/tokens";

const BACKEND_URL = "ws://127.0.0.1:7979";

interface ModelOption {
  value: string;
  label: string;
  hint: string;
}

const MODEL_OPTIONS: ModelOption[] = [
  { value: "tiny", label: "tiny", hint: "~75MB · qualidade baixa · ~1GB VRAM" },
  { value: "base", label: "base", hint: "~150MB · qualidade modesta" },
  { value: "small", label: "small", hint: "~500MB · qualidade ok" },
  { value: "medium", label: "medium", hint: "~1.5GB · qualidade boa" },
  { value: "large-v3", label: "large-v3", hint: "~3GB · melhor qualidade · ~5GB VRAM" },
  {
    value: "large-v3-turbo",
    label: "large-v3-turbo (recomendado)",
    hint: "~1.5GB · ótima qualidade · ~2GB VRAM",
  },
  { value: "distil-large-v3", label: "distil-large-v3", hint: "~700MB · rápido + bom" },
];

const HOT_RELOAD_FIELDS = new Set(["model", "device", "mode"]);

type SaveState =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved"; reloadMsg?: string }
  | { kind: "needs_restart"; field: string }
  | { kind: "error"; message: string };

type AutostartState =
  | { kind: "loading" }
  | { kind: "ready"; enabled: boolean }
  | { kind: "error"; message: string };

export function Settings() {
  const [original, setOriginal] = useState<SettingsSnapshot | null>(null);
  const [draft, setDraft] = useState<SettingsSnapshot | null>(null);
  const [customModel, setCustomModel] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [save, setSave] = useState<SaveState>({ kind: "idle" });
  const [autostart, setAutostart] = useState<AutostartState>({ kind: "loading" });
  const socketRef = useRef<DictationSocket | null>(null);

  // Carrega estado atual do autostart no boot.
  useEffect(() => {
    isAutostartEnabled()
      .then((enabled) => setAutostart({ kind: "ready", enabled }))
      .catch((e) => {
        setAutostart({
          kind: "error",
          message: e instanceof Error ? e.message : String(e),
        });
      });
  }, []);

  const toggleAutostart = async (next: boolean) => {
    // Otimismo na UI; reverte se falhar.
    setAutostart({ kind: "ready", enabled: next });
    try {
      if (next) await enableAutostart();
      else await disableAutostart();
    } catch (e) {
      setAutostart({
        kind: "error",
        message: e instanceof Error ? e.message : String(e),
      });
    }
  };

  // ESC fecha a janela (sem chrome do OS, esse é o caminho de saída).
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        invoke("close_settings").catch(() => {});
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const socket = new DictationSocket(BACKEND_URL, browserWebSocketTransport);
    socketRef.current = socket;

    const unsubConfig = socket.onConfig((s) => {
      setOriginal(s);
      setDraft(s);
      const inList = MODEL_OPTIONS.some((o) => o.value === s.model);
      setUseCustom(!inList);
      if (!inList) setCustomModel(s.model);
    });
    const unsubApplied = socket.onConfigApplied((e: ConfigAppliedEvent) => {
      setOriginal(e.settings);
      setDraft(e.settings);
      if (e.reload === null) {
        setSave({ kind: "needs_restart", field: "campo nao hot" });
      } else if (e.reload.error) {
        setSave({ kind: "error", message: `reload falhou: ${e.reload.error}` });
      } else if (e.reload.changed) {
        setSave({
          kind: "saved",
          reloadMsg: `modelo trocado pra ${e.reload.model} (${e.reload.device})`,
        });
      } else {
        setSave({ kind: "saved" });
      }
    });
    const unsubErr = socket.onServerError((e) => {
      setSave({ kind: "error", message: `${e.code}: ${e.message}` });
    });

    socket
      .connect()
      .then(() => socket.sendGetConfig())
      .catch((e) => {
        setSave({
          kind: "error",
          message: `nao conectou: ${e instanceof Error ? e.message : String(e)}`,
        });
      });

    return () => {
      unsubConfig();
      unsubApplied();
      unsubErr();
      socket.close();
    };
  }, []);

  const dirty = useMemo(() => {
    if (!draft || !original) return false;
    if (useCustom && draft.model !== customModel) return true;
    return JSON.stringify(draft) !== JSON.stringify(original);
  }, [draft, original, useCustom, customModel]);

  const handleSave = () => {
    if (!draft || !original) return;
    const finalModel = useCustom ? customModel.trim() : draft.model;
    if (!finalModel) {
      setSave({ kind: "error", message: "modelo nao pode ficar vazio" });
      return;
    }

    const patch: Partial<SettingsSnapshot> = {};
    const candidate = { ...draft, model: finalModel };
    for (const k of Object.keys(candidate) as Array<keyof SettingsSnapshot>) {
      if (JSON.stringify(candidate[k]) !== JSON.stringify(original[k])) {
        (patch as Record<string, unknown>)[k] = candidate[k];
      }
    }
    if (Object.keys(patch).length === 0) return;

    setSave({ kind: "saving" });
    try {
      socketRef.current?.sendSetConfig(patch);
    } catch (e) {
      setSave({
        kind: "error",
        message: e instanceof Error ? e.message : String(e),
      });
    }
  };

  const handleClose = () => {
    invoke("close_settings").catch(() => {});
  };

  if (!draft) {
    return (
      <main style={pageStyle}>
        <p style={{ opacity: 0.6, fontSize: 12 }}>carregando settings...</p>
      </main>
    );
  }

  const restartHint = (changedField: string) =>
    HOT_RELOAD_FIELDS.has(changedField)
      ? ""
      : " — exige restart do backend pra aplicar";

  return (
    <main style={pageStyle}>
      <header
        style={{
          marginBottom: 24,
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          borderBottom: RULE.thin,
          paddingBottom: 14,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: FONT_MONO,
              fontSize: 10,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: COLOR.inkMute,
              marginBottom: 4,
            }}
          >
            JarvsTranscript · v0.0.1
          </div>
          <h1
            style={{
              margin: 0,
              fontFamily: FONT_DISPLAY,
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: "-0.025em",
              lineHeight: 1,
              color: COLOR.ink,
            }}
          >
            Settings
          </h1>
          <p
            style={{
              margin: "8px 0 0",
              fontSize: 11,
              color: COLOR.inkMute,
              lineHeight: 1.5,
            }}
          >
            Mudanças em <Tag>model</Tag>, <Tag>device</Tag> e <Tag>mode</Tag>{" "}
            aplicam ao vivo. Demais campos persistem mas exigem restart.{" "}
            <span style={{ color: COLOR.inkFaint }}>ESC fecha.</span>
          </p>
        </div>
        <button
          onClick={handleClose}
          aria-label="fechar"
          style={closeButton}
          onMouseDown={(e) => e.preventDefault()}
        >
          ×
        </button>
      </header>

      <Field label="Modelo Whisper">
        <select
          value={useCustom ? "__custom__" : draft.model}
          onChange={(e) => {
            if (e.target.value === "__custom__") {
              setUseCustom(true);
            } else {
              setUseCustom(false);
              setDraft({ ...draft, model: e.target.value });
            }
          }}
          style={inputStyle}
        >
          {MODEL_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label} — {o.hint}
            </option>
          ))}
          <option value="__custom__">custom (digite o nome HF)…</option>
        </select>
        {useCustom && (
          <input
            type="text"
            value={customModel}
            onChange={(e) => setCustomModel(e.target.value)}
            placeholder="ex: Systran/faster-whisper-medium"
            style={{ ...inputStyle, marginTop: 6 }}
          />
        )}
      </Field>

      <Row>
        <Field label="Device">
          <select
            value={draft.device}
            onChange={(e) => setDraft({ ...draft, device: e.target.value })}
            style={inputStyle}
          >
            <option value="auto">auto (cuda se disponível)</option>
            <option value="cuda">cuda (GPU)</option>
            <option value="cpu">cpu (fallback)</option>
          </select>
        </Field>
        <Field label="Modo da hotkey">
          <select
            value={draft.mode}
            onChange={(e) => setDraft({ ...draft, mode: e.target.value })}
            style={inputStyle}
          >
            <option value="ptt">PTT — segurar</option>
            <option value="toggle">Toggle — 1 toque + VAD</option>
          </select>
        </Field>
      </Row>

      <Row>
        <Field label="VAD" hint="(restart)">
          <select
            value={draft.vad}
            onChange={(e) => setDraft({ ...draft, vad: e.target.value })}
            style={inputStyle}
          >
            <option value="silero">silero (recomendado)</option>
            <option value="rms">rms (heurística)</option>
            <option value="off">desligado</option>
          </select>
        </Field>
        <Field label="Silêncio toggle (ms)" hint="(restart)">
          <input
            type="number"
            min={500}
            max={10_000}
            step={250}
            value={draft.silence_to_end_ms}
            onChange={(e) =>
              setDraft({
                ...draft,
                silence_to_end_ms: Number(e.target.value) || 3000,
              })
            }
            style={inputStyle}
          />
        </Field>
      </Row>

      <Field label="Iniciar com o Windows">
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 10px",
            background: COLOR.inputBg,
            border: `0.5px solid ${COLOR.borderSubtle}`,
            borderRadius: RADIUS.control,
            cursor: autostart.kind === "ready" ? "pointer" : "default",
            fontSize: 12,
          }}
        >
          <input
            type="checkbox"
            checked={autostart.kind === "ready" ? autostart.enabled : false}
            disabled={autostart.kind !== "ready"}
            onChange={(e) => toggleAutostart(e.target.checked)}
            style={{ accentColor: COLOR.accent.primary, cursor: "inherit" }}
          />
          <span style={{ flex: 1, color: COLOR.text }}>
            {autostart.kind === "loading" && "verificando..."}
            {autostart.kind === "ready" &&
              (autostart.enabled
                ? "ativado — inicia automaticamente no login"
                : "desativado — só roda quando voce abrir")}
            {autostart.kind === "error" && (
              <span style={{ color: COLOR.accent.error }}>
                erro: {autostart.message}
              </span>
            )}
          </span>
        </label>
      </Field>

      <footer
        style={{
          marginTop: 28,
          paddingTop: 16,
          borderTop: RULE.thin,
        }}
      >
        <div
          style={{ display: "flex", gap: 10, alignItems: "center" }}
        >
          <button
            onClick={handleSave}
            disabled={!dirty || save.kind === "saving"}
            style={{
              ...primaryButton,
              opacity: dirty && save.kind !== "saving" ? 1 : 0.45,
              cursor: dirty && save.kind !== "saving" ? "pointer" : "not-allowed",
            }}
          >
            {save.kind === "saving" ? "salvando…" : "salvar"}
          </button>
          <button onClick={handleClose} style={secondaryButton}>
            fechar
          </button>
          <div
            style={{
              flex: 1,
              fontSize: 11,
              color: COLOR.inkMute,
              textAlign: "right",
            }}
          >
            {save.kind === "saved" && (
              <>
                <span style={{ color: COLOR.cobalt }}>✓ salvo</span>
                {save.reloadMsg ? ` — ${save.reloadMsg}` : ""}
              </>
            )}
            {save.kind === "needs_restart" && (
              <span style={{ color: COLOR.vermilion }}>
                ✓ salvo no disco{restartHint(save.field)}
              </span>
            )}
            {save.kind === "error" && (
              <span style={{ color: COLOR.vermilionDark }}>✗ {save.message}</span>
            )}
          </div>
        </div>
      </footer>

      {/* Selo overlay — canto inferior direito, fora do fluxo, vibe carimbo */}
      <div
        style={{
          position: "absolute",
          right: 22,
          bottom: 18,
          pointerEvents: "none",
        }}
      >
        <Stamp scale={0.55} />
      </div>
    </main>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <section style={{ marginBottom: 14, flex: 1, minWidth: 0 }}>
      <label
        style={{
          display: "block",
          fontFamily: FONT_MONO,
          fontSize: 10,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: COLOR.inkMute,
          marginBottom: 6,
        }}
      >
        {label}
        {hint && <span style={{ marginLeft: 6, color: COLOR.inkFaint }}>{hint}</span>}
      </label>
      {children}
    </section>
  );
}

function Row({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div style={{ display: "flex", gap: 12 }}>{children}</div>
  );
}

function Tag({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <code
      style={{
        background: COLOR.inputBg,
        padding: "1px 6px",
        borderRadius: 3,
        fontSize: 10,
        fontFamily: FONT_MONO,
        color: COLOR.ink,
      }}
    >
      {children}
    </code>
  );
}

const pageStyle: React.CSSProperties = {
  fontFamily: FONT_DISPLAY,
  padding: 24,
  background: COLOR.paper,
  // Background "paper-bg" do brand book — pontilhado sutil de tinta espalhada.
  backgroundImage: `
    radial-gradient(rgba(26,26,26,0.045) 1px, transparent 1px),
    radial-gradient(rgba(26,26,26,0.025) 1px, transparent 1px)
  `,
  backgroundSize: "24px 24px, 11px 11px",
  backgroundPosition: "0 0, 6px 6px",
  color: COLOR.ink,
  height: "100vh",
  boxSizing: "border-box",
  // Card flutuante (janela transparente) — rule 1px ink envolve.
  border: RULE.thin,
  borderRadius: RADIUS.card,
  overflow: "hidden",
  position: "relative",
};

const closeButton: React.CSSProperties = {
  width: 28,
  height: 28,
  background: COLOR.paper,
  color: COLOR.ink,
  border: RULE.thin,
  borderRadius: RADIUS.control,
  fontSize: 16,
  lineHeight: 1,
  cursor: "pointer",
  fontFamily: FONT_MONO,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  flexShrink: 0,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  background: COLOR.paper2,
  color: COLOR.ink,
  border: RULE.thin,
  borderRadius: RADIUS.control,
  fontSize: 12,
  fontFamily: FONT_MONO,
  boxSizing: "border-box",
  outline: "none",
};

const primaryButton: React.CSSProperties = {
  padding: "9px 20px",
  // High-contrast brutalist: ink solid + paper text. Sem sombra.
  background: COLOR.ink,
  color: COLOR.paper,
  border: RULE.thin,
  borderRadius: RADIUS.control,
  fontSize: 11,
  fontWeight: 600,
  fontFamily: FONT_MONO,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  cursor: "pointer",
};

const secondaryButton: React.CSSProperties = {
  padding: "9px 16px",
  background: COLOR.paper,
  color: COLOR.ink,
  border: RULE.thin,
  borderRadius: RADIUS.control,
  fontSize: 11,
  fontWeight: 500,
  fontFamily: FONT_MONO,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  cursor: "pointer",
};
