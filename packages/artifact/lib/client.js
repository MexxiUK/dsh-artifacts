window.__ModuleLoader__.load({ id: "@dsh-artifact/artifact", factory: (require) => { var module = { exports: {} }; var exports = module.exports;
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
var name = "@dsh-artifact/artifact";
var inject = ["slots", "layout", "sessions"];
var sessions = /* @__PURE__ */ new Map();
var listeners = /* @__PURE__ */ new Set();
var EMPTY_VERSIONS = [];
function getState(sessionId) {
  let s = sessions.get(sessionId);
  if (!s) {
    s = { selected: null, latest: null, history: /* @__PURE__ */ new Map() };
    sessions.set(sessionId, s);
  }
  return s;
}
function setSelected(sessionId, a) {
  getState(sessionId).selected = a;
  for (const l of listeners) l();
}
function noteArtifact(sessionId, a) {
  const s = getState(sessionId);
  s.latest = a;
  if (a.version != null) {
    const list = s.history.get(a.artifact_id) ?? [];
    if (!list.some((x) => x.version === a.version)) {
      s.history.set(
        a.artifact_id,
        [...list, a].sort((x, y) => (y.version ?? 0) - (x.version ?? 0))
      );
    }
  }
  for (const l of listeners) l();
}
function subscribe(l) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
function useSelectedArtifact(sessionId) {
  return (0, import_react.useSyncExternalStore)(
    subscribe,
    () => getState(sessionId).selected,
    () => null
  );
}
function useArtifactVersions(sessionId, artifactId) {
  return (0, import_react.useSyncExternalStore)(
    subscribe,
    () => getState(sessionId).history.get(artifactId) ?? EMPTY_VERSIONS,
    () => EMPTY_VERSIONS
  );
}
function useIsLive(sessionId, artifact) {
  return (0, import_react.useSyncExternalStore)(
    subscribe,
    () => {
      const latest = getState(sessionId).latest;
      return artifact != null && latest != null && artifact.artifact_id === latest.artifact_id && artifact.version === latest.version;
    },
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
var ERROR_CAPTURE_SCRIPT = `<script>(function(){
  function report(kind, message, source, line, col) {
    try { parent.postMessage({ v: 1, type: "artifact:error", kind: kind, message: message, source: source, line: line, col: col }, "*"); } catch (e) {}
  }
  window.addEventListener("error", function(e) {
    if (e.message) report("error", e.message, e.filename, e.lineno, e.colno);
    else if (e.target && e.target.tagName) report("resource", "Failed to load " + e.target.tagName.toLowerCase() + (e.target.src || e.target.href || ""));
  }, true);
  window.addEventListener("unhandledrejection", function(e) {
    report("unhandledrejection", String(e.reason));
  });
  var origError = console.error;
  console.error = function() {
    report("console.error", Array.prototype.map.call(arguments, String).join(" "));
    origError.apply(console, arguments);
  };
})();<\/script>`;
function lastIndexOfRegex(html, re) {
  let m;
  let last = -1;
  while ((m = re.exec(html)) !== null) last = m.index;
  return last;
}
function injectErrorCapture(html) {
  const body = lastIndexOfRegex(html, /<\/body>/gi);
  if (body !== -1) {
    return html.slice(0, body) + ERROR_CAPTURE_SCRIPT + html.slice(body);
  }
  const head = lastIndexOfRegex(html, /<\/head>/gi);
  if (head !== -1) {
    return html.slice(0, head) + ERROR_CAPTURE_SCRIPT + html.slice(head);
  }
  return html + ERROR_CAPTURE_SCRIPT;
}
var FILL_CSS = `<style>html, body { height: 100%; margin: 0; } body { display: flex; flex-direction: column; } body > *:last-child { flex: 1; min-height: 0; }</style>`;
function injectFillCss(html) {
  const head = lastIndexOfRegex(html, /<\/head>/gi);
  if (head !== -1) {
    return html.slice(0, head) + FILL_CSS + html.slice(head);
  }
  return FILL_CSS + html;
}
var CSP_META = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:;">`;
function injectCsp(html) {
  const m = /<head[^>]*>/i.exec(html);
  if (m) {
    const end = m.index + m[0].length;
    return html.slice(0, end) + CSP_META + html.slice(end);
  }
  return CSP_META + html;
}
var iframeWindows = /* @__PURE__ */ new Set();
function useTrackIframe() {
  const prev = (0, import_react.useRef)(null);
  return (0, import_react.useCallback)((el) => {
    if (prev.current) {
      iframeWindows.delete(prev.current);
      prev.current = null;
    }
    if (el) {
      const win = el.contentWindow;
      if (win) {
        iframeWindows.add(win);
        prev.current = win;
      }
    }
  }, []);
}
function HtmlRenderer({ artifact }) {
  const ref = useTrackIframe();
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "iframe",
    {
      ref,
      sandbox: "allow-scripts",
      srcDoc: injectCsp(injectErrorCapture(artifact.content)),
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
function findMatches(text, query) {
  if (!query) return [];
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  const matches = [];
  let i = 0;
  while ((i = lower.indexOf(q, i)) !== -1) {
    matches.push(i);
    i += q.length;
  }
  return matches;
}
function CodeRenderer({
  artifact,
  search
}) {
  const containerRef = (0, import_react.useRef)(null);
  (0, import_react.useEffect)(() => {
    if (!search || !search.query) return;
    const el = containerRef.current?.querySelector("mark[data-current='true']");
    el?.scrollIntoView({ block: "center" });
  }, [search?.currentIndex, search?.query]);
  if (search && search.query && search.matches.length > 0) {
    const parts = [];
    let last = 0;
    search.matches.forEach((m, i) => {
      parts.push(artifact.content.slice(last, m));
      parts.push(
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "mark",
          {
            "data-current": i === search.currentIndex ? "true" : void 0,
            style: {
              background: i === search.currentIndex ? "var(--dsw-alias-state-warn-primary)" : "color-mix(in srgb, var(--dsw-alias-state-warn-primary) 40%, transparent)",
              color: "inherit",
              borderRadius: "2px"
            },
            children: artifact.content.slice(m, m + search.query.length)
          },
          i
        )
      );
      last = m + search.query.length;
    });
    parts.push(artifact.content.slice(last));
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref: containerRef, style: { overflow: "auto", height: "100%" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "pre",
      {
        style: {
          margin: 0,
          padding: "16px",
          fontFamily: "monospace",
          fontSize: "13px",
          lineHeight: "1.5",
          whiteSpace: "pre",
          color: "var(--dsw-alias-label-primary)"
        },
        children: parts
      }
    ) });
  }
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
function SvgRenderer({ artifact }) {
  const src = `data:image/svg+xml;utf8,${encodeURIComponent(artifact.content)}`;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "div",
    {
      style: {
        padding: "16px",
        overflow: "auto",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      },
      children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "img",
        {
          src,
          alt: artifact.title,
          style: { maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }
        }
      )
    }
  );
}
function OptionsRenderer({ artifact }) {
  const ref = useTrackIframe();
  let data = null;
  let error = null;
  try {
    data = JSON.parse(artifact.content);
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      error = 'Expected a JSON object with a "visual" (a complete HTML document).';
    }
  } catch (e) {
    error = `Invalid JSON: ${e instanceof Error ? e.message : String(e)}`;
  }
  if (error) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { padding: "16px", overflow: "auto", height: "100%" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { fontWeight: 600, color: "var(--dsw-alias-state-error-primary)" }, children: "Malformed options artifact" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "div",
        {
          style: {
            fontSize: "12px",
            marginTop: "4px",
            color: "var(--dsw-alias-label-secondary)",
            whiteSpace: "pre-wrap"
          },
          children: error
        }
      )
    ] });
  }
  const visual = typeof data?.visual === "string" ? data.visual : void 0;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { height: "100%" }, children: visual && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "iframe",
    {
      ref,
      sandbox: "allow-scripts",
      srcDoc: injectCsp(injectErrorCapture(injectFillCss(visual))),
      title: artifact.title,
      style: { width: "100%", height: "100%", border: "none", background: "#fff" }
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
        color: live ? "var(--dsw-alias-state-success-primary)" : "var(--dsw-alias-label-tertiary)",
        background: live ? "var(--dsw-alias-state-success-tertiary)" : "var(--dsw-alias-interactive-bg-hover)"
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
function VersionSwitcher({
  sessionId,
  artifact
}) {
  const versions = useArtifactVersions(sessionId, artifact.artifact_id);
  const [open, setOpen] = (0, import_react.useState)(false);
  const ref = (0, import_react.useRef)(null);
  (0, import_react.useEffect)(() => {
    if (!open) return;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);
  if (versions.length <= 1) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { opacity: 0.6 }, children: [
      "v",
      artifact.version
    ] });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { ref, style: { position: "relative" }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
      "button",
      {
        onClick: () => setOpen((o) => !o),
        title: "Switch version",
        "aria-label": "Switch version",
        "aria-haspopup": "listbox",
        "aria-expanded": open,
        style: {
          display: "inline-flex",
          alignItems: "center",
          gap: "2px",
          padding: "2px 6px",
          border: "1px solid var(--dsw-alias-border-l3)",
          borderRadius: "6px",
          background: "transparent",
          cursor: "pointer",
          fontSize: "12px",
          color: "var(--dsw-alias-label-secondary)"
        },
        children: [
          "v",
          artifact.version,
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconChevronDownOutline14, {})
        ]
      }
    ),
    open && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "div",
      {
        role: "listbox",
        style: {
          position: "absolute",
          top: "calc(100% + 4px)",
          left: 0,
          zIndex: 20,
          minWidth: "120px",
          background: "var(--dsw-alias-bg-layer-3)",
          border: "1px solid var(--dsw-alias-border-l3)",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
          padding: "4px"
        },
        children: versions.map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
          "button",
          {
            role: "option",
            "aria-selected": v.version === artifact.version,
            onClick: () => {
              setSelected(sessionId, v);
              setOpen(false);
            },
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px",
              width: "100%",
              padding: "4px 8px",
              border: "none",
              borderRadius: "4px",
              background: v.version === artifact.version ? "var(--dsw-alias-interactive-bg-active)" : "transparent",
              cursor: "pointer",
              fontSize: "12px",
              color: "var(--dsw-alias-label-primary)",
              textAlign: "left"
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
                "v",
                v.version
              ] }),
              v.version === versions[0].version && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { opacity: 0.6, fontSize: "11px" }, children: "latest" })
            ]
          },
          v.version
        ))
      }
    )
  ] });
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
function FullscreenExitIcon({ size = 16 }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg",
      "aria-hidden": true,
      children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "path",
        {
          d: "M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z",
          fill: "currentColor"
        }
      )
    }
  );
}
function ConsoleIcon({ size = 16 }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg",
      "aria-hidden": true,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", { x: "3", y: "4", width: "18", height: "16", rx: "2", stroke: "currentColor", strokeWidth: "1.5" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "path",
          {
            d: "M7 9.5 10.5 12 7 14.5",
            stroke: "currentColor",
            strokeWidth: "1.5",
            strokeLinecap: "round",
            strokeLinejoin: "round"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12.5 15h4", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" })
      ]
    }
  );
}
function MagicWandIcon({ size = 16 }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg",
      "aria-hidden": true,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M4 20 16.5 7.5", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "path",
          {
            d: "M7.5 3.5 8.4 6l2.5.9-2.5.9-.9 2.5L6.6 7.8 4.1 6.9l2.5-.9.9-2.5Z",
            fill: "currentColor"
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "path",
          {
            d: "M17 12.5 17.7 15l2.5.7-2.5.7-.7 2.5-.7-2.5-2.5-.7 2.5-.7.7-2.5Z",
            fill: "currentColor"
          }
        )
      ]
    }
  );
}
function ArtifactIcon({ size = 20 }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg",
      "aria-hidden": true,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 4.5 18.5 15.5H5.5L12 4.5Z", fill: "currentColor" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "7.5", cy: "18.5", r: "2.75", fill: "currentColor" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", { x: "13", y: "15.75", width: "6.5", height: "5.5", rx: "1.5", fill: "currentColor" })
      ]
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
        background: "var(--dsw-alias-interactive-bg-hover)",
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
            background: "color-mix(in srgb, var(--dsw-alias-state-business-primary) 12%, transparent)",
            pointerEvents: "none"
          }
        }
      )
    }
  );
}
function ArtifactCanvas(props) {
  const sessionId = props.sessionId;
  const artifact = useSelectedArtifact(sessionId);
  const [view, setView] = (0, import_react.useState)("preview");
  const renderSlot = props.renderSlot;
  const closeDetails = props.closeDetails;
  const prompt = props.prompt;
  const isLive = useIsLive(sessionId, artifact);
  const [selectMode, setSelectMode] = (0, import_react.useState)(false);
  const [selection, setSelection] = (0, import_react.useState)(null);
  const [askText, setAskText] = (0, import_react.useState)("");
  const previewRef = (0, import_react.useRef)(null);
  const rootRef = (0, import_react.useRef)(null);
  const [isFullscreen, setIsFullscreen] = (0, import_react.useState)(false);
  const [errors, setErrors] = (0, import_react.useState)([]);
  const [consoleOpen, setConsoleOpen] = (0, import_react.useState)(false);
  const [searchOpen, setSearchOpen] = (0, import_react.useState)(false);
  const [searchQuery, setSearchQuery] = (0, import_react.useState)("");
  const [searchIndex, setSearchIndex] = (0, import_react.useState)(0);
  (0, import_react.useEffect)(() => {
    setErrors([]);
  }, [artifact?.artifact_id, artifact?.version]);
  (0, import_react.useEffect)(() => {
    setSearchOpen(false);
    setSearchQuery("");
    setSearchIndex(0);
  }, [artifact?.artifact_id, artifact?.version]);
  (0, import_react.useEffect)(() => {
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
      context
    ].join("\n");
    prompt(message);
    cancelSelect();
  };
  const fixErrors = () => {
    if (!prompt || !artifact) return;
    if (errors.length > 0) {
      const message = [
        `The artifact "${artifact.title}" has the following errors:`,
        ...errors.map(
          (e) => `- ${e.kind}: ${e.message}${e.line != null ? ` (line ${e.line})` : ""}`
        ),
        "",
        "Please fix these errors and update the artifact."
      ].join("\n");
      prompt(message);
    } else {
      prompt(
        `The user asked you to fix the artifact "${artifact.title}". It may have visual or layout issues that were not auto-detected. Please review it and update the artifact with a fix.`
      );
    }
  };
  const searchMatches = searchQuery ? findMatches(artifact?.content ?? "", searchQuery) : [];
  const openSearch = () => {
    setView("code");
    setSearchOpen(true);
  };
  const stepSearch = (dir) => {
    if (searchMatches.length === 0) return;
    setSearchIndex((i) => (i + dir + searchMatches.length) % searchMatches.length);
  };
  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery("");
    setSearchIndex(0);
  };
  const keydownStateRef = (0, import_react.useRef)({
    selectMode,
    selection,
    sendAsk,
    cancelSelect,
    closeDetails,
    openSearch
  });
  keydownStateRef.current = {
    selectMode,
    selection,
    sendAsk,
    cancelSelect,
    closeDetails,
    openSearch
  };
  (0, import_react.useEffect)(() => {
    const onKeyDown = (e) => {
      const s = keydownStateRef.current;
      if (e.key === "Escape") {
        if (document.fullscreenElement) return;
        if (s.selectMode || s.selection) {
          s.cancelSelect();
        } else {
          s.closeDetails?.();
        }
      } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        s.sendAsk();
      } else if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        s.openSearch();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
  (0, import_react.useEffect)(() => {
    if (!artifact || artifact.type !== "html" || !prompt) return;
    const onMessage = (event) => {
      const data = event.data;
      if (!data || data.v !== 1) return;
      if (event.origin !== "null") return;
      if (!iframeWindows.has(event.source)) return;
      if (data.type === "artifact:select" && data.value != null) {
        const label = data.label != null ? ` (${data.label})` : "";
        prompt(`The user selected: ${String(data.value)}${label}`);
      } else if (data.type === "artifact:error" && data.message != null) {
        setErrors((prev) => [
          ...prev,
          {
            kind: String(data.kind ?? "error"),
            message: String(data.message),
            source: data.source != null ? String(data.source) : void 0,
            line: typeof data.line === "number" ? data.line : void 0,
            col: typeof data.col === "number" ? data.col : void 0
          }
        ]);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [artifact, prompt]);
  if (!artifact) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { padding: "16px", color: "var(--dsw-alias-label-tertiary)" }, children: "No artifact selected. Create one with the artifact tool, or click \u201COpen in canvas\u201D on an artifact card." });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    "div",
    {
      ref: rootRef,
      style: {
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--dsw-alias-bg-base)"
      },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 12px",
              borderBottom: "1px solid var(--dsw-alias-border-l3)"
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontWeight: 600 }, children: artifact.title }),
              artifact.version != null && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VersionSwitcher, { sessionId, artifact }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LivenessBadge, { live: isLive }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ViewToggle, { view, onChange: setView }),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { flex: 1 } }),
              renderSlot("artifact.chrome", { artifact }),
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
        searchOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 12px",
              borderBottom: "1px solid var(--dsw-alias-border-l3)"
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "input",
                {
                  autoFocus: true,
                  value: searchQuery,
                  onChange: (e) => {
                    setSearchQuery(e.target.value);
                    setSearchIndex(0);
                  },
                  onKeyDown: (e) => {
                    if (e.key === "Escape") {
                      e.stopPropagation();
                      closeSearch();
                    } else if (e.key === "Enter") {
                      e.stopPropagation();
                      stepSearch(e.shiftKey ? -1 : 1);
                    }
                  },
                  placeholder: "Find in artifact",
                  style: {
                    flex: 1,
                    padding: "4px 8px",
                    border: "1px solid var(--dsw-alias-border-l3)",
                    borderRadius: "6px",
                    background: "var(--dsw-alias-bg-layer-2)",
                    color: "var(--dsw-alias-label-primary)",
                    fontSize: "13px"
                  }
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "span",
                {
                  style: {
                    fontSize: "12px",
                    color: "var(--dsw-alias-label-secondary)",
                    minWidth: "64px",
                    textAlign: "center"
                  },
                  children: searchQuery ? searchMatches.length ? `${searchIndex + 1} of ${searchMatches.length}` : "No matches" : ""
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "button",
                {
                  onClick: () => stepSearch(-1),
                  title: "Previous match",
                  "aria-label": "Previous match",
                  style: { ...iconButtonStyle, fontSize: "14px" },
                  children: "\u2191"
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "button",
                {
                  onClick: () => stepSearch(1),
                  title: "Next match",
                  "aria-label": "Next match",
                  style: { ...iconButtonStyle, fontSize: "14px" },
                  children: "\u2193"
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                "button",
                {
                  onClick: closeSearch,
                  title: "Close search",
                  "aria-label": "Close search",
                  style: iconButtonStyle,
                  children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconCloseOutline16, {})
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { ref: previewRef, style: { flex: 1, minHeight: 0, position: "relative" }, children: [
          view === "preview" ? renderSlot(
            "artifact.renderer",
            { artifact },
            {
              entryKey: artifact.type,
              fallback: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RawFallback, { artifact })
            }
          ) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            CodeRenderer,
            {
              artifact,
              search: searchOpen && searchQuery ? { query: searchQuery, matches: searchMatches, currentIndex: searchIndex } : void 0
            }
          ),
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
                background: "color-mix(in srgb, var(--dsw-alias-state-business-primary) 12%, transparent)",
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
                border: "1px solid var(--dsw-alias-border-l3)",
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
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
            "div",
            {
              style: {
                position: "absolute",
                bottom: "12px",
                right: "12px",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                padding: "4px",
                background: "var(--dsw-alias-bg-layer-2)",
                border: "1px solid var(--dsw-alias-border-l3)",
                borderRadius: "12px",
                boxShadow: "var(--dsw-shadow-lv2)",
                zIndex: 30
              },
              children: [
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
                    onClick: fixErrors,
                    title: "Ask the AI to fix this artifact",
                    "aria-label": "Ask the AI to fix this artifact",
                    style: iconButtonStyle,
                    children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MagicWandIcon, {})
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CopyButton, { artifact, style: iconButtonStyle }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DownloadButton, { sessionId, artifact, style: iconButtonStyle }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  "button",
                  {
                    onClick: openSearch,
                    title: "Find in artifact",
                    "aria-label": "Find in artifact",
                    style: iconButtonStyle,
                    children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconSearchOutline16, {})
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { position: "relative" }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                    "button",
                    {
                      onClick: () => setConsoleOpen(!consoleOpen),
                      title: "Console",
                      "aria-label": "Console",
                      style: iconButtonStyle,
                      children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConsoleIcon, {})
                    }
                  ),
                  errors.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                    "span",
                    {
                      style: {
                        position: "absolute",
                        top: "-4px",
                        right: "-4px",
                        minWidth: "14px",
                        height: "14px",
                        padding: "0 3px",
                        borderRadius: "7px",
                        background: "var(--dsw-alias-state-error-primary)",
                        color: "#fff",
                        fontSize: "10px",
                        lineHeight: "14px",
                        textAlign: "center",
                        pointerEvents: "none"
                      },
                      children: errors.length
                    }
                  )
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
                  "button",
                  {
                    onClick: toggleFullscreen,
                    title: isFullscreen ? "Exit fullscreen" : "Fullscreen",
                    "aria-label": isFullscreen ? "Exit fullscreen" : "Fullscreen",
                    style: iconButtonStyle,
                    children: isFullscreen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FullscreenExitIcon, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconFullscreenOutline16, {})
                  }
                )
              ]
            }
          )
        ] }),
        consoleOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
          "div",
          {
            style: {
              borderTop: "1px solid var(--dsw-alias-border-l3)",
              maxHeight: "200px",
              overflow: "auto",
              background: "var(--dsw-alias-bg-layer-1)"
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                "div",
                {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 12px"
                  },
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontWeight: 600 }, children: "Console" }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: "var(--dsw-alias-label-secondary)", fontSize: "12px" }, children: errors.length === 0 ? "No errors" : `${errors.length} error${errors.length === 1 ? "" : "s"}` })
                  ]
                }
              ),
              errors.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: errors.map((e, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
                "div",
                {
                  style: {
                    padding: "4px 12px",
                    fontSize: "12px",
                    borderTop: "1px solid var(--dsw-alias-border-l3)",
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
                  },
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { color: "var(--dsw-alias-state-error-primary)", fontWeight: 600 }, children: e.kind }),
                    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { color: "var(--dsw-alias-label-primary)" }, children: [
                      ": ",
                      e.message
                    ] }),
                    e.line != null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { style: { color: "var(--dsw-alias-label-tertiary)" }, children: [
                      " ",
                      "(line ",
                      e.line,
                      ")"
                    ] })
                  ]
                },
                i
              )) })
            ]
          }
        ),
        renderSlot("artifact.panel", { artifact }),
        renderSlot("artifact.interaction", { artifact })
      ]
    }
  );
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
  let content = artifact.content;
  let ext;
  let mime;
  if (artifact.type === "options") {
    try {
      const data = JSON.parse(artifact.content);
      if (typeof data?.visual === "string") content = data.visual;
    } catch {
    }
    ext = "html";
    mime = "text/html";
  } else if (artifact.type === "html") {
    ext = "html";
    mime = "text/html";
  } else if (artifact.type === "code") {
    ext = CODE_EXT[artifact.language ?? ""] ?? artifact.language ?? "txt";
    mime = "text/plain";
  } else if (artifact.type === "svg") {
    ext = "svg";
    mime = "image/svg+xml";
  } else {
    ext = "md";
    mime = "text/markdown";
  }
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const versionSuffix = artifact.version != null ? `-v${artifact.version}` : "";
  a.download = `${artifact.artifact_id}${versionSuffix}.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
}
function htmlToText(html) {
  const body = /<body[^>]*>([\s\S]*)<\/body>/i.exec(html);
  const div = document.createElement("div");
  div.innerHTML = body ? body[1] : html;
  return (div.textContent ?? "").replace(/\s+/g, " ").trim();
}
function renderedText(artifact) {
  if (artifact.type === "markdown") return (0, import_dsh_client_ui_primitives.extractMarkdownPlainText)(artifact.content);
  if (artifact.type === "html") return htmlToText(artifact.content);
  return null;
}
var menuItemStyle = {
  display: "block",
  width: "100%",
  padding: "4px 8px",
  border: "none",
  borderRadius: "4px",
  background: "transparent",
  cursor: "pointer",
  fontSize: "12px",
  color: "var(--dsw-alias-label-primary)",
  textAlign: "left"
};
var menuStyle = {
  position: "absolute",
  right: "calc(100% + 4px)",
  top: "50%",
  transform: "translateY(-50%)",
  zIndex: 30,
  minWidth: "140px",
  background: "var(--dsw-alias-bg-layer-3)",
  border: "1px solid var(--dsw-alias-border-l3)",
  borderRadius: "8px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
  padding: "4px"
};
function CopyButton({
  artifact,
  style
}) {
  const rendered = renderedText(artifact);
  const [open, setOpen] = (0, import_react.useState)(false);
  const ref = (0, import_react.useRef)(null);
  (0, import_react.useEffect)(() => {
    if (!open) return;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);
  const doCopy = (text) => {
    void (0, import_dsh_client_ui_primitives.writeClipboard)(text);
    setOpen(false);
  };
  if (rendered === null) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "button",
      {
        onClick: () => doCopy(artifact.content),
        title: "Copy",
        "aria-label": "Copy",
        style,
        children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconCopyOutline16, {})
      }
    );
  }
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { ref, style: { position: "relative" }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "button",
      {
        onClick: () => setOpen((o) => !o),
        title: "Copy",
        "aria-label": "Copy",
        "aria-haspopup": "menu",
        "aria-expanded": open,
        style,
        children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconCopyOutline16, {})
      }
    ),
    open && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { role: "menu", style: menuStyle, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { role: "menuitem", onClick: () => doCopy(artifact.content), style: menuItemStyle, children: "Copy source" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { role: "menuitem", onClick: () => doCopy(rendered), style: menuItemStyle, children: "Copy rendered" })
    ] })
  ] });
}
function DownloadButton({
  sessionId,
  artifact,
  style
}) {
  const versions = useArtifactVersions(sessionId, artifact.artifact_id);
  const [open, setOpen] = (0, import_react.useState)(false);
  const ref = (0, import_react.useRef)(null);
  (0, import_react.useEffect)(() => {
    if (!open) return;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);
  const downloadAll = () => {
    const ordered = [...versions].sort((a, b) => (a.version ?? 0) - (b.version ?? 0));
    ordered.forEach((v, i) => {
      setTimeout(() => downloadArtifact(v), i * 300);
    });
    setOpen(false);
  };
  if (versions.length <= 1) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "button",
      {
        onClick: () => downloadArtifact(artifact),
        title: "Download",
        "aria-label": "Download",
        style,
        children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconDownloadOutline16, {})
      }
    );
  }
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { ref, style: { position: "relative" }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "button",
      {
        onClick: () => setOpen((o) => !o),
        title: "Download",
        "aria-label": "Download",
        "aria-haspopup": "menu",
        "aria-expanded": open,
        style,
        children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconDownloadOutline16, {})
      }
    ),
    open && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { role: "menu", style: menuStyle, children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "button",
        {
          role: "menuitem",
          onClick: () => {
            downloadArtifact(artifact);
            setOpen(false);
          },
          style: menuItemStyle,
          children: "Download current"
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { role: "menuitem", onClick: downloadAll, style: menuItemStyle, children: "Download all versions" })
    ] })
  ] });
}
var TYPE_LABELS = {
  html: "HTML",
  markdown: "Markdown",
  code: "Code",
  svg: "SVG",
  options: "Options"
};
var ACTION_TEXT = {
  html: "Click to view",
  markdown: "Click to view document",
  code: "Click to view code",
  svg: "Click to view image",
  options: "Click to view options"
};
function ArtifactToolRow(props) {
  const artifact = artifactFromBlock(props.block);
  const openCanvas = props.openCanvas;
  const sessionId = props.sessionId;
  (0, import_react.useEffect)(() => {
    if (artifact && sessionId) noteArtifact(sessionId, artifact);
  }, [sessionId, artifact?.artifact_id, artifact?.version]);
  if (!artifact) return null;
  const actionText = ACTION_TEXT[artifact.type] ?? "Click to view";
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    "button",
    {
      type: "button",
      onClick: () => {
        if (sessionId) setSelected(sessionId, artifact);
        openCanvas?.();
      },
      style: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        width: "100%",
        padding: "16px",
        border: "1px solid var(--dsw-alias-border-l3)",
        borderRadius: "12px",
        background: "var(--dsw-alias-bg-layer-1)",
        cursor: "pointer",
        textAlign: "left",
        font: "inherit",
        color: "inherit",
        appearance: "none"
      },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "40px",
              height: "40px",
              flexShrink: 0,
              borderRadius: "8px",
              background: "var(--dsw-alias-bg-layer-2)",
              color: "var(--dsw-alias-label-secondary)"
            },
            children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArtifactIcon, { size: 20 })
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "span",
              {
                style: {
                  fontWeight: 600,
                  color: "var(--dsw-alias-label-primary)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                },
                children: artifact.title
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
              "span",
              {
                style: {
                  flexShrink: 0,
                  fontSize: "11px",
                  fontWeight: 500,
                  letterSpacing: "0.02em",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  background: "var(--dsw-alias-bg-layer-2)",
                  color: "var(--dsw-alias-label-secondary)"
                },
                children: TYPE_LABELS[artifact.type] ?? artifact.type.toUpperCase()
              }
            )
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { fontSize: "12px", color: "var(--dsw-alias-label-secondary)" }, children: actionText })
        ] })
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
          sessionId,
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
    "artifact.renderer",
    () => ctx.slots.register({ name: "artifact.renderer", key: "svg" }, SvgRenderer)
  );
  ctx.slots.inject(
    "artifact.renderer",
    () => ctx.slots.register({ name: "artifact.renderer", key: "options" }, OptionsRenderer)
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
