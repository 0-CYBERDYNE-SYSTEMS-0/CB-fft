import { html, nothing } from "lit";
import { unsafeHTML } from "lit/directives/unsafe-html.js";

import { toSanitizedMarkdownHtml } from "../markdown";
import { formatToolDetail, resolveToolDisplay } from "../tool-display";
import type { ToolCard } from "../types/chat-types";
import { TOOL_INLINE_THRESHOLD } from "./constants";
import {
  formatToolOutputForSidebar,
  getTruncatedPreview,
} from "./tool-helpers";
import { isToolResultMessage } from "./message-normalizer";
import { extractText } from "./message-extract";

export function extractToolCards(message: unknown): ToolCard[] {
  const m = message as Record<string, unknown>;
  const content = normalizeContent(m.content);
  const cards: ToolCard[] = [];

  for (const item of content) {
    const kind = String(item.type ?? "").toLowerCase();
    const isToolCall =
      ["toolcall", "tool_call", "tooluse", "tool_use"].includes(kind) ||
      (typeof item.name === "string" && item.arguments != null);
    if (isToolCall) {
      cards.push({
        kind: "call",
        name: (item.name as string) ?? "tool",
        args: coerceArgs(item.arguments ?? item.args),
      });
    }
  }

  for (const item of content) {
    const kind = String(item.type ?? "").toLowerCase();
    if (kind !== "toolresult" && kind !== "tool_result") continue;
    const text = extractToolText(item);
    const name = typeof item.name === "string" ? item.name : "tool";
    cards.push({ kind: "result", name, text });
  }

  if (
    isToolResultMessage(message) &&
    !cards.some((card) => card.kind === "result")
  ) {
    const name =
      (typeof m.toolName === "string" && m.toolName) ||
      (typeof m.tool_name === "string" && m.tool_name) ||
      "tool";
    const text = extractText(message) ?? undefined;
    cards.push({ kind: "result", name, text });
  }

  return cards;
}

export function renderToolCardLegacy(
  card: ToolCard,
  opts?: {
    id: string;
    expanded: boolean;
    onToggle?: (id: string, expanded: boolean) => void;
  },
) {
  const display = resolveToolDisplay({ name: card.name, args: card.args });
  const detail = formatToolDetail(display);
  const hasOutput = typeof card.text === "string" && card.text.length > 0;
  const expanded = opts?.expanded ?? false;
  const id = opts?.id ?? `${card.name}-${Math.random()}`;
  return html`
    <div class="chat-tool-card">
      <div class="chat-tool-card__header">
        <div class="chat-tool-card__title">
          <span class="chat-tool-card__icon">${renderToolIcon(display.icon)}</span>
          <span>${display.label}</span>
        </div>
        ${!hasOutput ? html`<span class="chat-tool-card__status">ok</span>` : nothing}
      </div>
      ${detail
        ? html`<div class="chat-tool-card__detail">${detail}</div>`
        : nothing}
      ${hasOutput
        ? html`
            <details
              class="chat-tool-card__details"
              ?open=${expanded}
              @toggle=${(e: Event) => {
                if (!opts?.onToggle) return;
                const target = e.currentTarget as HTMLDetailsElement;
                opts.onToggle(id, target.open);
              }}
            >
              <summary class="chat-tool-card__summary">
                ${expanded ? "Hide output" : "Show output"}
                <span class="chat-tool-card__summary-meta">
                  (${card.text?.length ?? 0} chars)
                </span>
              </summary>
              ${expanded
                ? html`<div class="chat-tool-card__output chat-text">
                    ${unsafeHTML(toSanitizedMarkdownHtml(card.text ?? ""))}
                  </div>`
                : nothing}
            </details>
          `
        : nothing}
    </div>
  `;
}

export function renderToolCardSidebar(
  card: ToolCard,
  onOpenSidebar?: (content: string) => void,
) {
  const display = resolveToolDisplay({ name: card.name, args: card.args });
  const detail = formatToolDetail(display);
  const hasText = Boolean(card.text?.trim());

  const canClick = Boolean(onOpenSidebar);
  const handleClick = canClick
    ? () => {
        if (hasText) {
          onOpenSidebar!(formatToolOutputForSidebar(card.text!));
          return;
        }
        const info = `## ${display.label}\n\n${
          detail ? `**Command:** \`${detail}\`\n\n` : ""
        }*No output — tool completed successfully.*`;
        onOpenSidebar!(info);
      }
    : undefined;

  const isShort = hasText && (card.text?.length ?? 0) <= TOOL_INLINE_THRESHOLD;
  const showCollapsed = hasText && !isShort;
  const showInline = hasText && isShort;
  const isEmpty = !hasText;

  return html`
    <div
      class="chat-tool-card ${canClick ? "chat-tool-card--clickable" : ""}"
      @click=${handleClick}
      role=${canClick ? "button" : nothing}
      tabindex=${canClick ? "0" : nothing}
      @keydown=${canClick
        ? (e: KeyboardEvent) => {
            if (e.key !== "Enter" && e.key !== " ") return;
            e.preventDefault();
            handleClick?.();
          }
        : nothing}
    >
      <div class="chat-tool-card__header">
        <div class="chat-tool-card__title">
          <span class="chat-tool-card__icon">${renderToolIcon(display.icon)}</span>
          <span>${display.label}</span>
        </div>
        ${canClick
          ? html`<span class="chat-tool-card__action">${hasText ? "View ›" : "›"}</span>`
          : nothing}
        ${isEmpty && !canClick ? html`<span class="chat-tool-card__status">ok</span>` : nothing}
      </div>
      ${detail
        ? html`<div class="chat-tool-card__detail">${detail}</div>`
        : nothing}
      ${isEmpty
        ? html`<div class="chat-tool-card__status-text muted">Completed</div>`
        : nothing}
      ${showCollapsed
        ? html`<div class="chat-tool-card__preview mono">${getTruncatedPreview(card.text!)}</div>`
        : nothing}
      ${showInline
        ? html`<div class="chat-tool-card__inline mono">${card.text}</div>`
        : nothing}
    </div>
  `;
}

function renderToolIcon(icon: string) {
  const base = (content: unknown) => html`
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      ${content}
    </svg>
  `;
  switch (icon) {
    case "wrench":
      return base(
        html`<path d="M14 5a4 4 0 0 0-5 5l-5 5 3 3 5-5a4 4 0 0 0 5-5l-3 3-3-3z"></path>`,
      );
    case "process":
      return base(html`
        <rect x="4" y="6" width="16" height="12" rx="2"></rect>
        <path d="M8 6V4h8v2"></path>
      `);
    case "read":
      return base(html`
        <path d="M4 6h12a3 3 0 0 1 3 3v9H7a3 3 0 0 0-3 3z"></path>
        <path d="M4 6v12"></path>
      `);
    case "write":
    case "edit":
      return base(html`
        <path d="M12 20h9"></path>
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"></path>
      `);
    case "attach":
      return base(
        html`<path d="M16 7v9a4 4 0 0 1-8 0V6a3 3 0 0 1 6 0v9a1 1 0 0 1-2 0V7"></path>`,
      );
    case "browser":
      return base(html`
        <circle cx="12" cy="12" r="9"></circle>
        <path d="M3 12h18"></path>
        <path d="M12 3a15 15 0 0 1 0 18"></path>
      `);
    case "canvas":
      return base(html`
        <rect x="3" y="5" width="18" height="14" rx="2"></rect>
        <path d="M7 13l3-3 4 4 3-3 3 3"></path>
      `);
    case "nodes":
      return base(html`
        <rect x="3" y="6" width="18" height="12" rx="2"></rect>
        <path d="M7 18v2h10v-2"></path>
      `);
    case "cron":
      return base(
        html`<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 3"></path>`,
      );
    case "gateway":
      return base(html`
        <path d="M4 7h16v10H4z"></path>
        <path d="M8 7V4h8v3"></path>
      `);
    case "chat":
      return base(
        html`<path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"></path>`,
      );
    default:
      return base(html`<rect x="4" y="4" width="16" height="16" rx="3"></rect>`);
  }
}

function normalizeContent(content: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(content)) return [];
  return content.filter(Boolean) as Array<Record<string, unknown>>;
}

function coerceArgs(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed) return value;
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return value;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function extractToolText(item: Record<string, unknown>): string | undefined {
  if (typeof item.text === "string") return item.text;
  if (typeof item.content === "string") return item.content;
  return undefined;
}
