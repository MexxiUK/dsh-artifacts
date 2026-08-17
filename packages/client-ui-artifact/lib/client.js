window.__ModuleLoader__.load({ id: "@dsh-artifact/client-ui-artifact", factory: (require) => { var module = { exports: {} }; var exports = module.exports;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client.tsx
var client_exports = {};
__export(client_exports, {
  apply: () => apply,
  inject: () => inject,
  name: () => name
});
module.exports = __toCommonJS(client_exports);
var import_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
var import_react = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
var name = "@dsh-artifact/client-ui-artifact";
var inject = ["slots", "layout", "sessions"];
var selected = null;
var latest = null;
var listeners = /* @__PURE__ */ new Set();
function getSelected() {
  return selected;
}
function setSelected(a) {
  selected = a;
  for (const l of listeners) l();
}
function noteArtifact(a) {
  latest = a;
  for (const l of listeners) l();
}
function subscribe(l) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
function useSelectedArtifact() {
  return (0, import_react.useSyncExternalStore)(subscribe, getSelected, getSelected);
}
function useIsLive(artifact) {
  return (0, import_react.useSyncExternalStore)(
    subscribe,
    () => artifact != null && latest != null && artifact.artifact_id === latest.artifact_id && artifact.version === latest.version,
    () => false
  );
}
function artifactFromBlock(block) {
  if (block && block.kind === "tool-result") {
    const meta = block.meta;
    if (meta && meta.artifact_id && meta.content != null) return meta;
    return null;
  }
  try {
    const args = JSON.parse(block?.argsRaw ?? "{}");
    if (args && args.title && args.content != null) {
      return {
        artifact_id: args.artifact_id,
        title: args.title,
        type: args.type,
        content: args.content,
        language: args.language ?? args.type,
        version: void 0
      };
    }
  } catch {
  }
  return null;
}
function HtmlRenderer({ artifact }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "iframe",
    {
      sandbox: "allow-scripts",
      srcDoc: artifact.content,
      title: artifact.title,
      style: {
        width: "100%",
        height: "100%",
        border: "none",
        background: "#fff"
      }
    }
  );
}
function MarkdownRenderer({ artifact }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { padding: "16px", overflow: "auto", height: "100%" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.MarkdownText, { text: artifact.content }) });
}
function CodeRenderer({ artifact }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { overflow: "auto", height: "100%" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    import_dsh_client_ui_primitives.CodeBlock,
    {
      code: artifact.content,
      lang: artifact.language ?? "text",
      copyLabel: "Copy",
      copiedLabel: "Copied"
    }
  ) });
}
function RawFallback({ artifact }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "pre",
    {
      style: {
        margin: 0,
        padding: "12px",
        overflow: "auto",
        height: "100%",
        whiteSpace: "pre-wrap",
        fontFamily: "var(--dsw-font-markdown-code-block)"
      },
      children: artifact.content
    }
  );
}
function LivenessBadge({ live }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    "span",
    {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        fontSize: "11px",
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: "999px",
        color: live ? "var(--dsw-alias-success, #16a34a)" : "var(--dsw-alias-label-tertiary)",
        background: live ? "var(--dsw-alias-success-soft, rgba(22,163,74,0.12))" : "var(--dsw-alias-bg-subtle, rgba(128,128,128,0.12))"
      },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "span",
          {
            style: {
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: "currentColor",
              animation: live ? "dsh-artifact-pulse 1.6s ease-in-out infinite" : "none"
            }
          }
        ),
        live ? "Live" : "Older",
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `@keyframes dsh-artifact-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }` })
      ]
    }
  );
}
function EyeIcon({ size = 16 }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 16 16",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg",
      "aria-hidden": true,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "path",
          {
            d: "M1.5 8s2.5-4.5 6.5-4.5S14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8Z",
            stroke: "currentColor",
            strokeWidth: "1.5",
            strokeLinejoin: "round"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "8", cy: "8", r: "2", fill: "currentColor" })
      ]
    }
  );
}
function CursorIcon({ size = 16 }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg",
      "aria-hidden": true,
      children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z", fill: "currentColor" })
    }
  );
}
var iconButtonStyle = {
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
  color: "var(--dsw-alias-label-secondary)"
};
function ViewToggle({
  view,
  onChange
}) {
  const options = [
    { value: "preview", label: "Preview", icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeIcon, {}) },
    { value: "code", label: "Code", icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconCodeOutline16, {}) }
  ];
  const activeIndex = view === "code" ? 1 : 0;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    "div",
    {
      role: "tablist",
      "aria-label": "View",
      style: {
        position: "relative",
        display: "inline-flex",
        background: "var(--dsw-alias-bg-subtle, rgba(128,128,128,0.12))",
        borderRadius: "999px",
        padding: "2px"
      },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "span",
          {
            "aria-hidden": true,
            style: {
              position: "absolute",
              top: "2px",
              bottom: "2px",
              left: "2px",
              width: "calc(50% - 2px)",
              background: "var(--dsw-alias-button-floating-fill, #fff)",
              borderRadius: "999px",
              boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
              transition: "transform 0.2s ease",
              transform: activeIndex === 1 ? "translateX(100%)" : "translateX(0)"
            }
          }
        ),
        options.map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "button",
          {
            role: "tab",
            "aria-selected": view === opt.value,
            "aria-label": opt.label,
            title: opt.label,
            onClick: () => onChange(view === "preview" ? "code" : "preview"),
            style: {
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
              color: view === opt.value ? "var(--dsw-alias-label-primary)" : "var(--dsw-alias-label-secondary)",
              transition: "color 0.2s ease"
            },
            children: opt.icon
          },
          opt.value
        ))
      ]
    }
  );
}
function extractTextUnderRect(container, rect, artifactType) {
  if (!container) return "[no preview content]";
  if (artifactType === "html") {
    return `[region of the HTML preview: x=${Math.round(rect.x)}, y=${Math.round(rect.y)}, width=${Math.round(rect.w)}, height=${Math.round(rect.h)}]`;
  }
  const doc = container.ownerDocument;
  const abs = container.getBoundingClientRect();
  const ax = abs.left + rect.x;
  const ay = abs.top + rect.y;
  const bx = abs.left + rect.x + rect.w;
  const by = abs.top + rect.y + rect.h;
  const caret = doc.caretRangeFromPoint?.bind(doc);
  if (caret) {
    const start = caret(ax, ay);
    const end = caret(bx, by);
    if (start && end) {
      const range = doc.createRange();
      range.setStart(start.startContainer, start.startOffset);
      range.setEnd(end.endContainer, end.endOffset);
      const text2 = range.toString().trim();
      if (text2) return text2.slice(0, 4e3);
    }
  }
  const parts = [];
  const walker = doc.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let node;
  while (node = walker.nextNode()) {
    const el = node.parentElement;
    if (!el) continue;
    const r = el.getBoundingClientRect();
    if (r.left < bx && r.right > ax && r.top < by && r.bottom > ay) {
      const t = (node.textContent ?? "").trim();
      if (t) parts.push(t);
    }
  }
  const text = parts.join(" ").trim();
  return text ? text.slice(0, 4e3) : "[no text in selection]";
}
function SelectOverlay({
  onSelect
}) {
  const [drag, setDrag] = (0, import_react.useState)(null);
  const ref = (0, import_react.useRef)(null);
  const pos = (e) => {
    const r = ref.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "div",
    {
      ref,
      style: {
        position: "absolute",
        inset: 0,
        cursor: "crosshair",
        zIndex: 10,
        touchAction: "none"
      },
      onPointerDown: (e) => {
        const p = pos(e);
        setDrag({ sx: p.x, sy: p.y, cx: p.x, cy: p.y });
        e.currentTarget.setPointerCapture(e.pointerId);
      },
      onPointerMove: (e) => {
        if (!drag) return;
        const p = pos(e);
        setDrag({ ...drag, cx: p.x, cy: p.y });
      },
      onPointerUp: (e) => {
        if (!drag) return;
        const p = pos(e);
        const x = Math.min(drag.sx, p.x);
        const y = Math.min(drag.sy, p.y);
        const w = Math.abs(p.x - drag.sx);
        const h = Math.abs(p.y - drag.sy);
        if (w > 6 && h > 6) onSelect({ x, y, w, h });
        setDrag(null);
      },
      children: drag && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "div",
        {
          style: {
            position: "absolute",
            left: Math.min(drag.sx, drag.cx),
            top: Math.min(drag.sy, drag.cy),
            width: Math.abs(drag.cx - drag.sx),
            height: Math.abs(drag.cy - drag.sy),
            border: "2px solid var(--dsw-alias-state-business-primary, #3b82f6)",
            background: "rgba(59,130,246,0.12)",
            pointerEvents: "none"
          }
        }
      )
    }
  );
}
function ArtifactCanvas(props) {
  const artifact = useSelectedArtifact();
  const [view, setView] = (0, import_react.useState)("preview");
  const renderSlot = props.renderSlot;
  const closeDetails = props.closeDetails;
  const prompt = props.prompt;
  const isLive = useIsLive(artifact);
  const [selectMode, setSelectMode] = (0, import_react.useState)(false);
  const [selection, setSelection] = (0, import_react.useState)(null);
  const [askText, setAskText] = (0, import_react.useState)("");
  const previewRef = (0, import_react.useRef)(null);
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
      context
    ].join("\n");
    prompt(message);
    cancelSelect();
  };
  (0, import_react.useEffect)(() => {
    if (!artifact || artifact.type !== "html" || !prompt) return;
    const onMessage = (event) => {
      const data = event.data;
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
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { padding: "16px", color: "var(--dsw-alias-label-tertiary)" }, children: "No artifact selected. Create one with the artifact tool, or click \u201COpen in canvas\u201D on an artifact card." });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexDirection: "column", height: "100%" }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 12px",
          borderBottom: "1px solid var(--dsw-alias-border)"
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontWeight: 600 }, children: artifact.title }),
          artifact.version != null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { opacity: 0.6 }, children: [
            "v",
            artifact.version
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LivenessBadge, { live: isLive }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { flex: 1 } }),
          renderSlot("artifact.chrome", { artifact }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ViewToggle, { view, onChange: setView }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "button",
            {
              onClick: () => {
                if (selectMode) cancelSelect();
                else {
                  setSelectMode(true);
                  setSelection(null);
                  setAskText("");
                }
              },
              title: selectMode ? "Cancel" : "Select",
              "aria-label": selectMode ? "Cancel" : "Select",
              style: {
                ...iconButtonStyle,
                ...selectMode ? {
                  background: "var(--dsw-alias-state-business-primary, #3b82f6)",
                  color: "#fff"
                } : {}
              },
              children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CursorIcon, {})
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "button",
            {
              onClick: () => navigator.clipboard.writeText(artifact.content),
              title: "Copy",
              "aria-label": "Copy",
              style: iconButtonStyle,
              children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconCopyOutline16, {})
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "button",
            {
              onClick: () => downloadArtifact(artifact),
              title: "Download",
              "aria-label": "Download",
              style: iconButtonStyle,
              children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconDownloadOutline16, {})
            }
          ),
          closeDetails && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "button",
            {
              onClick: closeDetails,
              title: "Close",
              "aria-label": "Close",
              style: iconButtonStyle,
              children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconCloseOutline16, {})
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { ref: previewRef, style: { flex: 1, minHeight: 0, position: "relative" }, children: [
      view === "preview" ? renderSlot("artifact.renderer", { artifact }, {
        entryKey: artifact.type,
        fallback: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RawFallback, { artifact })
      }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CodeRenderer, { artifact }),
      selectMode && view === "preview" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectOverlay, { onSelect: setSelection }),
      selection && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "div",
        {
          style: {
            position: "absolute",
            left: selection.x,
            top: selection.y,
            width: selection.w,
            height: selection.h,
            border: "2px solid var(--dsw-alias-state-business-primary, #3b82f6)",
            background: "rgba(59,130,246,0.12)",
            pointerEvents: "none",
            zIndex: 10
          }
        }
      ),
      selection && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
        "div",
        {
          style: {
            position: "absolute",
            left: selection.x,
            top: Math.min(
              selection.y + selection.h + 8,
              (previewRef.current?.clientHeight ?? 0) - 56
            ),
            zIndex: 20,
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px",
            background: "var(--dsw-specific-input-major, #fff)",
            border: "1px solid var(--dsw-alias-border)",
            borderRadius: "8px",
            boxShadow: "var(--dsw-shadow-lv2)"
          },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "input",
              {
                autoFocus: true,
                value: askText,
                onChange: (e) => setAskText(e.target.value),
                onKeyDown: (e) => {
                  if (e.key === "Enter") sendAsk();
                  else if (e.key === "Escape") cancelSelect();
                },
                placeholder: "Ask about this, or describe an issue\u2026",
                style: {
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontSize: "13px",
                  minWidth: "220px",
                  color: "var(--dsw-alias-label-primary)"
                }
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: sendAsk, disabled: !askText.trim(), children: "Send" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { onClick: cancelSelect, "aria-label": "Cancel selection", children: "\u2715" })
          ]
        }
      )
    ] }),
    renderSlot("artifact.panel", { artifact }),
    renderSlot("artifact.interaction", { artifact })
  ] });
}
var CODE_EXT = {
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
  markdown: "md"
};
function downloadArtifact(artifact) {
  const ext = artifact.type === "html" ? "html" : artifact.type === "code" ? CODE_EXT[artifact.language ?? ""] ?? artifact.language ?? "txt" : "md";
  const mime = artifact.type === "html" ? "text/html" : artifact.type === "code" ? "text/plain" : "text/markdown";
  const blob = new Blob([artifact.content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${artifact.artifact_id}.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
}
function ArtifactToolRow(props) {
  const artifact = artifactFromBlock(props.block);
  const openCanvas = props.openCanvas;
  (0, import_react.useEffect)(() => {
    if (artifact) noteArtifact(artifact);
  }, [artifact?.artifact_id, artifact?.version]);
  if (!artifact) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    "div",
    {
      style: {
        padding: "8px 12px",
        border: "1px solid var(--dsw-alias-border)",
        borderRadius: "8px"
      },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: "8px" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontWeight: 600 }, children: artifact.title }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { opacity: 0.6 }, children: artifact.type }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { flex: 1 } }),
          openCanvas && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "button",
            {
              onClick: () => {
                setSelected(artifact);
                openCanvas();
              },
              children: "Open in canvas"
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { maxHeight: "220px", overflow: "hidden", marginTop: "8px" }, children: artifact.type === "html" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HtmlRenderer, { artifact }) : artifact.type === "code" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "pre",
          {
            style: {
              margin: 0,
              padding: "8px",
              overflow: "hidden",
              whiteSpace: "pre-wrap",
              fontFamily: "var(--dsw-font-markdown-code-block)",
              fontSize: "12px"
            },
            children: artifact.content.slice(0, 2e3)
          }
        ) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MarkdownRenderer, { artifact }) })
      ]
    }
  );
}
function apply(ctx) {
  const layout = ctx.layout;
  ctx.slots.inject(
    "details",
    () => ctx.slots.register(
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
          "artifact.panel": { kind: "list", scope: "session" }
        },
        inject: (sessionId) => ({
          closeDetails: () => layout.closeDetails(),
          // Feed a selection back to the model as a queued user message.
          prompt: (text) => {
            const binding = ctx.sessions.binding(sessionId);
            if (binding) {
              void binding.session.prompt([{ type: "text", text }], "queue");
            }
          }
        })
      },
      ArtifactCanvas
    )
  );
  ctx.slots.inject(
    "artifact.renderer",
    () => ctx.slots.register({ name: "artifact.renderer", key: "html" }, HtmlRenderer)
  );
  ctx.slots.inject(
    "artifact.renderer",
    () => ctx.slots.register({ name: "artifact.renderer", key: "markdown" }, MarkdownRenderer)
  );
  ctx.slots.inject(
    "artifact.renderer",
    () => ctx.slots.register({ name: "artifact.renderer", key: "code" }, CodeRenderer)
  );
  ctx.slots.inject(
    "tool.call.toolview",
    () => ctx.slots.register(
      {
        name: "tool.call.toolview",
        key: "artifact",
        inject: () => ({ openCanvas: () => layout.openDetails() })
      },
      ArtifactToolRow
    )
  );
}
return module.exports; } });
