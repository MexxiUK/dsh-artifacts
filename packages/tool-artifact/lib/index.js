// @dsh-artifact/tool-artifact — host-side `artifact` tool.
//
// Registers a single model-facing tool that creates or updates a renderable
// artifact (HTML or Markdown) surfaced in the canvas viewer. The canonical
// result value is the artifact envelope; `output.presentationMeta` persists
// that envelope as the durable `tool/result` `meta` the client reads back, so
// the canvas can reconstruct every artifact and its version history from the
// session log alone.
import { defineTool } from "@deepseek-ai/dsh-tools";
import { randomUUID } from "node:crypto";

const name = "tool-artifact";

const inject = ["tools", "systemPrompt"];

const ARTIFACT_TYPES = ["html", "markdown", "code"];

/** Slugify a title into a readable, URL-safe artifact id prefix. */
function slugify(title) {
  const s = String(title ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return s || "artifact";
}

function apply(ctx) {
  ctx.systemPrompt.section({
    name: "tool:artifact",
    order: 100,
    text: [
      "Use the artifact tool to produce a self-contained, renderable deliverable — a styled HTML page, a report, a document, a diagram, or a source-code file — when the user asks for something that benefits from a dedicated preview rather than plain prose.",
      "Prefer an artifact over prose when the deliverable is a complete document, page, or code file. Use action \"create\" for a new artifact; use action \"update\" with the returned artifact_id to revise an existing one (this creates a new version).",
      "For type \"html\", emit a complete document including <!doctype html>, <html>, <head>, and <body>. For type \"markdown\", emit a complete Markdown document. For type \"code\", emit the raw source of a single code file and set \"language\" to its language id (e.g. python, typescript, javascript, go, rust, java, c, cpp, csharp, bash, json, yaml, html, css, sql).",
    ].join(" "),
  });

  // Per-process version counter keyed by artifact_id. The durable tool results
  // still record every version, so the client reconstructs history from the log;
  // this map only decides the next version number for a live `update`.
  const versions = new Map();

  ctx.tools.register(
    defineTool({
      name: "artifact",
      description:
        "Create or update a renderable artifact (HTML, Markdown, or source code) shown in the canvas viewer.",
      parameters: {
        action: {
          type: "string",
          required: true,
          enum: ["create", "update"],
          description:
            "create a new artifact, or update an existing one by artifact_id.",
        },
        artifact_id: {
          type: "string",
          description: "Required for update: the id returned by a prior create.",
        },
        title: {
          type: "string",
          required: true,
          description: "Short human-readable title for the artifact.",
        },
        type: {
          type: "string",
          required: true,
          enum: ARTIFACT_TYPES,
          description:
            "Artifact kind: html (a full HTML document), markdown, or code (a single source-code file).",
        },
        content: {
          type: "string",
          required: true,
          description:
            "The complete artifact source. For html, a full document including <!doctype html>. For code, the raw source of the file.",
        },
        language: {
          type: "string",
          description:
            "Optional source language label for the code view (e.g. html, markdown, python, typescript). Required for type \"code\".",
        },
      },
      output: {
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            artifact_id: { type: "string", required: true },
            title: { type: "string", required: true },
            type: { type: "string", required: true, enum: ARTIFACT_TYPES },
            content: { type: "string", required: true },
            language: { type: "string" },
            version: { type: "number", required: true },
          },
        },
        render: (_args, value) => [
          {
            type: "text",
            text: `Artifact "${value.title}" (${value.type}) saved as ${value.artifact_id} v${value.version}.`,
          },
        ],
        presentationMeta: (_args, value) => ({
          artifact_id: value.artifact_id,
          title: value.title,
          type: value.type,
          content: value.content,
          language: value.language ?? value.type,
          version: value.version,
        }),
      },
      async execute(args) {
        if (args.action === "create") {
          const id = `${slugify(args.title)}-${randomUUID().slice(0, 8)}`;
          versions.set(id, 1);
          return {
            artifact_id: id,
            title: args.title,
            type: args.type,
            content: args.content,
            language: args.language ?? args.type,
            version: 1,
          };
        }
        if (!args.artifact_id) {
          throw new Error("artifact: update requires artifact_id");
        }
        const current = versions.get(args.artifact_id);
        if (current === undefined) {
          throw new Error(
            `artifact: unknown artifact_id "${args.artifact_id}" (create it first)`,
          );
        }
        const next = current + 1;
        versions.set(args.artifact_id, next);
        return {
          artifact_id: args.artifact_id,
          title: args.title,
          type: args.type,
          content: args.content,
          language: args.language ?? args.type,
          version: next,
        };
      },
      presentCall(args) {
        return {
          card: "generic",
          title: `Artifact: ${args.title}`,
          kind: "other",
        };
      },
      presentResult(args, result) {
        if (result.isError) return void 0;
        return {
          card: "generic",
          title: `Artifact: ${result.value.title} (v${result.value.version})`,
        };
      },
    }),
  );
}

export { apply, inject, name };
