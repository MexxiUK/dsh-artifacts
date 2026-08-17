// @dsh-artifact/client-ui-artifact — browser half.
//
// Extensible artifact canvas. Registers:
//   - the `details` side-panel slot (replacing the currently-unreachable
//     DetailsPanel) with the ArtifactCanvas, and in the same breath declares
//     four child slots so other plugins can extend the canvas:
//       * `artifact.renderer`    (keyed by artifact type) — how to display a type;
//       * `artifact.interaction` (list) — postMessage handlers for the iframe;
//       * `artifact.chrome`      (list) — toolbar buttons / status indicators;
//       * `artifact.panel`       (list) — extra panels/tabs inside the canvas.
//   - a keyed `tool.call.toolview` for the `artifact` tool (inline card with
//     an "Open in canvas" affordance).
//
// The artifact envelope rides the tool result's `meta` (set by the host tool's
// `output.presentationMeta`), so the canvas and card read the same frozen data.
//
// Interaction loop: HTML artifacts run in a sandboxed iframe (opaque origin).
// The iframe may `postMessage` a selection to the parent; the canvas validates
// the source/origin and feeds the selection back to the model as a queued user
// message. Liveness: the canvas badges the selected artifact "Live" while it is
// the most recently produced one, and "Older" otherwise.
import {
  CodeBlock,
  IconChevronDownOutline14,
  IconCloseOutline16,
  IconCodeOutline16,
  IconCopyOutline16,
  IconDownloadOutline16,
  IconFullscreenOutline16,
  MarkdownText,
} from "@deepseek-ai/dsh-client-ui-primitives";
import { useEffect, useRef, useSyncExternalStore, useState } from "react";

const name = "@dsh-artifact/client-ui-artifact";
const inject = ["slots", "layout", "sessions"];

// ── artifact store (per-session) ────────────────────────────────────────────
// The selected artifact is shared between the inline card ("Open in canvas")
// and the canvas panel, keyed by session id so artifacts never leak across
// sessions. `latest` tracks the most recently produced artifact so the canvas
// can badge liveness.

type Artifact = {
  artifact_id: string;
  title: string;
  type: string; // widened from "html" | "markdown" so renderers are extensible
  content: string;
  language?: string;
  version?: number;
};

type SessionState = {
  selected: Artifact | null;
  latest: Artifact | null;
  /** All versions of each artifact, keyed by artifact_id (newest first). */
  history: Map<string, Artifact[]>;
};
/** Per-session artifact state, keyed by session id. */
const sessions = new Map<string, SessionState>();
const listeners = new Set<() => void>();
const EMPTY_VERSIONS: Artifact[] = [];

function getState(sessionId: string): SessionState {
  let s = sessions.get(sessionId);
  if (!s) {
    s = { selected: null, latest: null, history: new Map() };
    sessions.set(sessionId, s);
  }
  return s;
}

function setSelected(sessionId: string, a: Artifact | null) {
  getState(sessionId).selected = a;
  for (const l of listeners) l();
}
/** Record a produced artifact: drives the liveness badge and version history. */
function noteArtifact(sessionId: string, a: Artifact) {
  const s = getState(sessionId);
  s.latest = a;
  // Only completed versions (with a version number) enter the history; a
  // running call has no version yet and must not appear in the switcher.
  if (a.version != null) {
    const list = s.history.get(a.artifact_id) ?? [];
    if (!list.some((x) => x.version === a.version)) {
      s.history.set(
        a.artifact_id,
        [...list, a].sort((x, y) => (y.version ?? 0) - (x.version ?? 0)),
      );
    }
  }
  for (const l of listeners) l();
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
function useSelectedArtifact(sessionId: string): Artifact | null {
  return useSyncExternalStore(
    subscribe,
    () => getState(sessionId).selected,
    () => null,
  );
}
function useArtifactVersions(sessionId: string, artifactId: string): Artifact[] {
  return useSyncExternalStore(
    subscribe,
    () => getState(sessionId).history.get(artifactId) ?? EMPTY_VERSIONS,
    () => EMPTY_VERSIONS,
  );
}
function useIsLive(sessionId: string, artifact: Artifact | null): boolean {
  return useSyncExternalStore(
    subscribe,
    () => {
      const latest = getState(sessionId).latest;
      return (
        artifact != null &&
        latest != null &&
        artifact.artifact_id === latest.artifact_id &&
        artifact.version === latest.version
      );
    },
    () => false,
  );
}

// ── artifact extraction from a tool block ──────────────────────────────────

function artifactFromBlock(block: any): Artifact | null {
  if (block && block.kind === "tool-result") {
    const meta = block.meta as Artifact | undefined;
    if (meta && meta.artifact_id && meta.content != null) return meta;
    return null;
  }
  // running call: parse the raw args
  try {
    const args = JSON.parse(block?.argsRaw ?? "{}");
    if (args && args.title && args.content != null) {
      return {
        artifact_id: args.artifact_id,
        title: args.title,
        type: args.type,
        content: args.content,
        language: args.language ?? args.type,
        version: undefined,
      };
    }
  } catch {
    /* ignore */
  }
  return null;
}

// ── built-in renderers (registered into `artifact.renderer`) ────────────────

function HtmlRenderer({ artifact }: { artifact: Artifact }) {
  // Sandboxed iframe: opaque origin, scripts allowed but no same-origin, so
  // the artifact cannot reach the app's origin, cookies, or DOM.
  return (
    <iframe
      sandbox="allow-scripts"
      srcDoc={artifact.content}
      title={artifact.title}
      style={{
        width: "100%",
        height: "100%",
        border: "none",
        background: "#fff",
      }}
    />
  );
}

function MarkdownRenderer({ artifact }: { artifact: Artifact }) {
  return (
    <div style={{ padding: "16px", overflow: "auto", height: "100%" }}>
      <MarkdownText text={artifact.content} />
    </div>
  );
}

function CodeRenderer({ artifact }: { artifact: Artifact }) {
  return (
    <div style={{ overflow: "auto", height: "100%" }}>
      <CodeBlock
        code={artifact.content}
        lang={artifact.language ?? "text"}
        copyLabel="Copy"
        copiedLabel="Copied"
      />
    </div>
  );
}

/** Fallback for artifact types with no registered renderer. */
function RawFallback({ artifact }: { artifact: Artifact }) {
  return (
    <pre
      style={{
        margin: 0,
        padding: "12px",
        overflow: "auto",
        height: "100%",
        whiteSpace: "pre-wrap",
        fontFamily: "var(--dsw-font-markdown-code-block)",
      }}
    >
      {artifact.content}
    </pre>
  );
}

// ── liveness badge ──────────────────────────────────────────────────────────

function LivenessBadge({ live }: { live: boolean }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        fontSize: "11px",
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: "999px",
        color: live ? "var(--dsw-alias-state-success-primary)" : "var(--dsw-alias-label-tertiary)",
        background: live
          ? "var(--dsw-alias-state-success-tertiary)"
          : "var(--dsw-alias-interactive-bg-hover)",
      }}
    >
      <span
        style={{
          width: "7px",
          height: "7px",
          borderRadius: "50%",
          background: "currentColor",
          animation: live ? "dsh-artifact-pulse 1.6s ease-in-out infinite" : "none",
        }}
      />
      {live ? "Live" : "Older"}
      <style>{`@keyframes dsh-artifact-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }`}</style>
    </span>
  );
}

// ── version switcher ─────────────────────────────────────────────────────────

function VersionSwitcher({
  sessionId,
  artifact,
}: {
  sessionId: string;
  artifact: Artifact;
}) {
  const versions = useArtifactVersions(sessionId, artifact.artifact_id);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close the dropdown on an outside click.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  if (versions.length <= 1) {
    return <span style={{ opacity: 0.6 }}>v{artifact.version}</span>;
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        title="Switch version"
        aria-label="Switch version"
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "2px",
          padding: "2px 6px",
          border: "1px solid var(--dsw-alias-border-l3)",
          borderRadius: "6px",
          background: "transparent",
          cursor: "pointer",
          fontSize: "12px",
          color: "var(--dsw-alias-label-secondary)",
        }}
      >
        v{artifact.version}
        <IconChevronDownOutline14 />
      </button>
      {open && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            zIndex: 20,
            minWidth: "120px",
            background: "var(--dsw-alias-bg-layer-3)",
            border: "1px solid var(--dsw-alias-border-l3)",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
            padding: "4px",
          }}
        >
          {versions.map((v) => (
            <button
              key={v.version}
              role="option"
              aria-selected={v.version === artifact.version}
              onClick={() => {
                setSelected(sessionId, v);
                setOpen(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
                width: "100%",
                padding: "4px 8px",
                border: "none",
                borderRadius: "4px",
                background:
                  v.version === artifact.version
                    ? "var(--dsw-alias-interactive-bg-active)"
                    : "transparent",
                cursor: "pointer",
                fontSize: "12px",
                color: "var(--dsw-alias-label-primary)",
                textAlign: "left",
              }}
            >
              <span>v{v.version}</span>
              {v.version === versions[0].version && (
                <span style={{ opacity: 0.6, fontSize: "11px" }}>latest</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── inline icons (no primitives equivalent) ─────────────────────────────────

function EyeIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M1.5 8s2.5-4.5 6.5-4.5S14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="8" r="2" fill="currentColor" />
    </svg>
  );
}

function CursorIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" fill="currentColor" />
    </svg>
  );
}

function FullscreenExitIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"
        fill="currentColor"
      />
    </svg>
  );
}

const iconButtonStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "28px",
  height: "28px",
  padding: "0",
  border: "none",
  background: "transparent",
  borderRadius: "6px",
  cursor: "pointer",
  color: "var(--dsw-alias-label-secondary)",
};

// ── view toggle (segmented control) ─────────────────────────────────────────

function ViewToggle({
  view,
  onChange,
}: {
  view: "preview" | "code";
  onChange: (view: "preview" | "code") => void;
}) {
  const options: Array<{
    value: "preview" | "code";
    label: string;
    icon: React.ReactNode;
  }> = [
    { value: "preview", label: "Preview", icon: <EyeIcon /> },
    { value: "code", label: "Code", icon: <IconCodeOutline16 /> },
  ];
  const activeIndex = view === "code" ? 1 : 0;
  return (
    <div
      role="tablist"
      aria-label="View"
      style={{
        position: "relative",
        display: "inline-flex",
        background: "var(--dsw-alias-interactive-bg-hover)",
        borderRadius: "999px",
        padding: "2px",
      }}
    >
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: "2px",
          bottom: "2px",
          left: "2px",
          width: "calc(50% - 2px)",
          background: "var(--dsw-alias-button-floating-fill, #fff)",
          borderRadius: "999px",
          boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
          transition: "transform 0.2s ease",
          transform: activeIndex === 1 ? "translateX(100%)" : "translateX(0)",
        }}
      />
      {options.map((opt) => (
        <button
          key={opt.value}
          role="tab"
          aria-selected={view === opt.value}
          aria-label={opt.label}
          title={opt.label}
          onClick={() => onChange(view === "preview" ? "code" : "preview")}
          style={{
            position: "relative",
            zIndex: 1,
            minWidth: "32px",
            padding: "4px 8px",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color:
              view === opt.value
                ? "var(--dsw-alias-label-primary)"
                : "var(--dsw-alias-label-secondary)",
            transition: "color 0.2s ease",
          }}
        >
          {opt.icon}
        </button>
      ))}
    </div>
  );
}

// ── selection text extraction ───────────────────────────────────────────────

function extractTextUnderRect(
  container: HTMLElement | null,
  rect: { x: number; y: number; w: number; h: number },
  artifactType: string | undefined,
): string {
  if (!container) return "[no preview content]";
  // HTML artifacts render in an opaque-origin iframe; the parent cannot read
  // their text, so report the region geometry instead.
  if (artifactType === "html") {
    return `[region of the HTML preview: x=${Math.round(rect.x)}, y=${Math.round(rect.y)}, width=${Math.round(rect.w)}, height=${Math.round(rect.h)}]`;
  }
  const doc = container.ownerDocument;
  const abs = container.getBoundingClientRect();
  const ax = abs.left + rect.x;
  const ay = abs.top + rect.y;
  const bx = abs.left + rect.x + rect.w;
  const by = abs.top + rect.y + rect.h;
  // Prefer caretRangeFromPoint (Chromium) for a precise range across the rect.
  const caret = (doc as any).caretRangeFromPoint?.bind(doc);
  if (caret) {
    const start = caret(ax, ay);
    const end = caret(bx, by);
    if (start && end) {
      const range = doc.createRange();
      range.setStart(start.startContainer, start.startOffset);
      range.setEnd(end.endContainer, end.endOffset);
      const text = range.toString().trim();
      if (text) return text.slice(0, 4000);
    }
  }
  // Fallback: collect text from elements intersecting the rect.
  const parts: string[] = [];
  const walker = doc.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const el = node.parentElement;
    if (!el) continue;
    const r = el.getBoundingClientRect();
    if (r.left < bx && r.right > ax && r.top < by && r.bottom > ay) {
      const t = (node.textContent ?? "").trim();
      if (t) parts.push(t);
    }
  }
  const text = parts.join(" ").trim();
  return text ? text.slice(0, 4000) : "[no text in selection]";
}

// ── drag-select overlay ──────────────────────────────────────────────────────

function SelectOverlay({
  onSelect,
}: {
  onSelect: (rect: { x: number; y: number; w: number; h: number }) => void;
}) {
  const [drag, setDrag] = useState<{
    sx: number;
    sy: number;
    cx: number;
    cy: number;
  } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const pos = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        inset: 0,
        cursor: "crosshair",
        zIndex: 10,
        touchAction: "none",
      }}
      onPointerDown={(e) => {
        const p = pos(e);
        setDrag({ sx: p.x, sy: p.y, cx: p.x, cy: p.y });
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!drag) return;
        const p = pos(e);
        setDrag({ ...drag, cx: p.x, cy: p.y });
      }}
      onPointerUp={(e) => {
        if (!drag) return;
        const p = pos(e);
        const x = Math.min(drag.sx, p.x);
        const y = Math.min(drag.sy, p.y);
        const w = Math.abs(p.x - drag.sx);
        const h = Math.abs(p.y - drag.sy);
        if (w > 6 && h > 6) onSelect({ x, y, w, h });
        setDrag(null);
      }}
    >
      {drag && (
        <div
          style={{
            position: "absolute",
            left: Math.min(drag.sx, drag.cx),
            top: Math.min(drag.sy, drag.cy),
            width: Math.abs(drag.cx - drag.sx),
            height: Math.abs(drag.cy - drag.sy),
            border: "2px solid var(--dsw-alias-state-business-primary, #3b82f6)",
            background: "color-mix(in srgb, var(--dsw-alias-state-business-primary) 12%, transparent)",
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}

// ── canvas panel (details slot) ─────────────────────────────────────────────

function ArtifactCanvas(props: any) {
  const sessionId = props.sessionId as string;
  const artifact = useSelectedArtifact(sessionId);
  const [view, setView] = useState<"preview" | "code">("preview");
  const renderSlot = props.renderSlot as (
    key: string,
    owner: object,
    opts?: { entryKey?: string; fallback?: React.ReactNode },
  ) => React.ReactNode;
  const closeDetails = props.closeDetails as (() => void) | undefined;
  const prompt = props.prompt as ((text: string) => void) | undefined;
  const isLive = useIsLive(sessionId, artifact);

  // ── select-and-ask state ────────────────────────────────────────────────
  const [selectMode, setSelectMode] = useState(false);
  const [selection, setSelection] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const [askText, setAskText] = useState("");
  const previewRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Track native fullscreen state so the button can flip between expand/contract.
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void rootRef.current?.requestFullscreen();
    }
  };

  const cancelSelect = () => {
    setSelectMode(false);
    setSelection(null);
    setAskText("");
  };

  const sendAsk = () => {
    if (!selection || !askText.trim() || !prompt) return;
    const context = extractTextUnderRect(previewRef.current, selection, artifact?.type);
    const message = [
      `The user selected a region of the artifact "${artifact?.title ?? "artifact"}" and wrote: ${askText.trim()}`,
      "",
      "Selected content:",
      context,
    ].join("\n");
    prompt(message);
    cancelSelect();
  };

  // Interaction loop: listen for postMessage from the sandboxed iframe. Only
  // accept messages whose source is the iframe we rendered and whose origin is
  // "null" (opaque origin) — never trust a same-origin or cross-origin frame.
  useEffect(() => {
    if (!artifact || artifact.type !== "html" || !prompt) return;
    const onMessage = (event: MessageEvent) => {
      const data = event.data as { v?: number; type?: string; value?: unknown; label?: string } | null;
      if (!data || data.v !== 1) return;
      if (event.origin !== "null") return;
      if (data.type === "artifact:select" && data.value != null) {
        const label = data.label != null ? ` (${data.label})` : "";
        prompt(`The user selected: ${String(data.value)}${label}`);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [artifact, prompt]);

  if (!artifact) {
    return (
      <div style={{ padding: "16px", color: "var(--dsw-alias-label-tertiary)" }}>
        No artifact selected. Create one with the artifact tool, or click
        &ldquo;Open in canvas&rdquo; on an artifact card.
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--dsw-alias-bg-base)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 12px",
          borderBottom: "1px solid var(--dsw-alias-border-l3)",
        }}
      >
        <span style={{ fontWeight: 600 }}>{artifact.title}</span>
        {artifact.version != null && (
          <VersionSwitcher sessionId={sessionId} artifact={artifact} />
        )}
        <LivenessBadge live={isLive} />
        <span style={{ flex: 1 }} />
        {renderSlot("artifact.chrome", { artifact })}
        <ViewToggle view={view} onChange={setView} />
        <button
          onClick={() => {
            if (selectMode) cancelSelect();
            else {
              setSelectMode(true);
              setSelection(null);
              setAskText("");
            }
          }}
          title={selectMode ? "Cancel" : "Select"}
          aria-label={selectMode ? "Cancel" : "Select"}
          style={{
            ...iconButtonStyle,
            ...(selectMode
              ? {
                  background: "var(--dsw-alias-state-business-primary, #3b82f6)",
                  color: "#fff",
                }
              : {}),
          }}
        >
          <CursorIcon />
        </button>
        <button
          onClick={() => navigator.clipboard.writeText(artifact.content)}
          title="Copy"
          aria-label="Copy"
          style={iconButtonStyle}
        >
          <IconCopyOutline16 />
        </button>
        <button
          onClick={() => downloadArtifact(artifact)}
          title="Download"
          aria-label="Download"
          style={iconButtonStyle}
        >
          <IconDownloadOutline16 />
        </button>
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          style={iconButtonStyle}
        >
          {isFullscreen ? <FullscreenExitIcon /> : <IconFullscreenOutline16 />}
        </button>
        {closeDetails && (
          <button
            onClick={closeDetails}
            title="Close"
            aria-label="Close"
            style={iconButtonStyle}
          >
            <IconCloseOutline16 />
          </button>
        )}
      </div>
      <div ref={previewRef} style={{ flex: 1, minHeight: 0, position: "relative" }}>
        {view === "preview" ? (
          renderSlot("artifact.renderer", { artifact }, {
            entryKey: artifact.type,
            fallback: <RawFallback artifact={artifact} />,
          })
        ) : (
          <CodeRenderer artifact={artifact} />
        )}
        {selectMode && view === "preview" && (
          <SelectOverlay onSelect={setSelection} />
        )}
        {selection && (
          <div
            style={{
              position: "absolute",
              left: selection.x,
              top: selection.y,
              width: selection.w,
              height: selection.h,
              border: "2px solid var(--dsw-alias-state-business-primary, #3b82f6)",
              background: "color-mix(in srgb, var(--dsw-alias-state-business-primary) 12%, transparent)",
              pointerEvents: "none",
              zIndex: 10,
            }}
          />
        )}
        {selection && (
          <div
            style={{
              position: "absolute",
              left: selection.x,
              top: Math.min(
                selection.y + selection.h + 8,
                (previewRef.current?.clientHeight ?? 0) - 56,
              ),
              zIndex: 20,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px",
              background: "var(--dsw-specific-input-major, #fff)",
              border: "1px solid var(--dsw-alias-border-l3)",
              borderRadius: "8px",
              boxShadow: "var(--dsw-shadow-lv2)",
            }}
          >
            <input
              autoFocus
              value={askText}
              onChange={(e) => setAskText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendAsk();
                else if (e.key === "Escape") cancelSelect();
              }}
              placeholder="Ask about this, or describe an issue…"
              style={{
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: "13px",
                minWidth: "220px",
                color: "var(--dsw-alias-label-primary)",
              }}
            />
            <button onClick={sendAsk} disabled={!askText.trim()}>
              Send
            </button>
            <button onClick={cancelSelect} aria-label="Cancel selection">
              ✕
            </button>
          </div>
        )}
      </div>
      {renderSlot("artifact.panel", { artifact })}
      {/* Interaction handlers: each entry mounts a postMessage listener (via
          useEffect) and renders nothing — the slot is a hook surface, not a
          visual region. Entries receive `{ artifact }` and may register their
          own message types on top of the built-in `artifact:select` loop. */}
      {renderSlot("artifact.interaction", { artifact })}
    </div>
  );
}

const CODE_EXT: Record<string, string> = {
  javascript: "js",
  typescript: "ts",
  python: "py",
  go: "go",
  rust: "rs",
  java: "java",
  c: "c",
  cpp: "cpp",
  csharp: "cs",
  bash: "sh",
  shell: "sh",
  json: "json",
  yaml: "yml",
  toml: "toml",
  html: "html",
  css: "css",
  sql: "sql",
  markdown: "md",
};

function downloadArtifact(artifact: Artifact) {
  const ext =
    artifact.type === "html"
      ? "html"
      : artifact.type === "code"
        ? CODE_EXT[artifact.language ?? ""] ?? artifact.language ?? "txt"
        : "md";
  const mime =
    artifact.type === "html"
      ? "text/html"
      : artifact.type === "code"
        ? "text/plain"
        : "text/markdown";
  const blob = new Blob([artifact.content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${artifact.artifact_id}.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── inline tool card ────────────────────────────────────────────────────────

function ArtifactToolRow(props: any) {
  const artifact = artifactFromBlock(props.block);
  const openCanvas = props.openCanvas as (() => void) | undefined;
  const sessionId = props.sessionId as string | undefined;

  // Record the most recently produced artifact for the liveness badge.
  useEffect(() => {
    if (artifact && sessionId) noteArtifact(sessionId, artifact);
  }, [sessionId, artifact?.artifact_id, artifact?.version]);

  if (!artifact) return null;
  return (
    <div
      style={{
        padding: "8px 12px",
        border: "1px solid var(--dsw-alias-border-l3)",
        borderRadius: "8px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontWeight: 600 }}>{artifact.title}</span>
        <span style={{ opacity: 0.6 }}>{artifact.type}</span>
        <span style={{ flex: 1 }} />
        {openCanvas && (
          <button
            onClick={() => {
              if (sessionId) setSelected(sessionId, artifact);
              openCanvas();
            }}
          >
            Open in canvas
          </button>
        )}
      </div>
      <div style={{ maxHeight: "220px", overflow: "hidden", marginTop: "8px" }}>
        {artifact.type === "html" ? (
          <HtmlRenderer artifact={artifact} />
        ) : artifact.type === "code" ? (
          <pre
            style={{
              margin: 0,
              padding: "8px",
              overflow: "hidden",
              whiteSpace: "pre-wrap",
              fontFamily: "var(--dsw-font-markdown-code-block)",
              fontSize: "12px",
            }}
          >
            {artifact.content.slice(0, 2000)}
          </pre>
        ) : (
          <MarkdownRenderer artifact={artifact} />
        )}
      </div>
    </div>
  );
}

// ── plugin body ─────────────────────────────────────────────────────────────

function apply(ctx: any) {
  const layout = ctx.layout;

  ctx.slots.inject(
    "details",
    () =>
      ctx.slots.register(
        {
          name: "details",
          // Shadow the built-in DetailsPanel (ui-conversation registers at
          // priority 0). Load order is non-deterministic — the loader applies
          // entries in parallel — so a lower priority is the only reliable way
          // to win the single "details" slot ("lowest renders").
          priority: -10,
          // Declare the canvas's own child slots: other plugins register into
          // these to extend the canvas without touching its core.
          children: {
            "artifact.renderer": { kind: "keyed", scope: "session" },
            "artifact.interaction": { kind: "list", scope: "session" },
            "artifact.chrome": { kind: "list", scope: "session" },
            "artifact.panel": { kind: "list", scope: "session" },
          },
          inject: (sessionId: string) => ({
            sessionId,
            closeDetails: () => layout.closeDetails(),
            // Feed a selection back to the model as a queued user message.
            prompt: (text: string) => {
              const binding = ctx.sessions.binding(sessionId);
              if (binding) {
                void binding.session.prompt([{ type: "text", text }], "queue");
              }
            },
          }),
        },
        ArtifactCanvas,
      ),
  );

  // Built-in renderers (the canvas's own contributions to its child slot).
  ctx.slots.inject("artifact.renderer", () =>
    ctx.slots.register({ name: "artifact.renderer", key: "html" }, HtmlRenderer),
  );
  ctx.slots.inject("artifact.renderer", () =>
    ctx.slots.register({ name: "artifact.renderer", key: "markdown" }, MarkdownRenderer),
  );
  ctx.slots.inject("artifact.renderer", () =>
    ctx.slots.register({ name: "artifact.renderer", key: "code" }, CodeRenderer),
  );

  ctx.slots.inject(
    "tool.call.toolview",
    () =>
      ctx.slots.register(
        {
          name: "tool.call.toolview",
          key: "artifact",
          inject: () => ({ openCanvas: () => layout.openDetails() }),
        },
        ArtifactToolRow,
      ),
  );
}

export { apply, inject, name };
