# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Highlight is an Obsidian plugin. Obsidian's core parser recognizes only six `==emoji text==` highlight colors (🔴🟠🟡🟢🔵🟣), rendering them as `<mark data-highlight="color">`. This plugin adds matching `hltr-*` classes to marks that use a leading emoji core doesn't recognize (💬 quote, 💡 coreideas, 🛠️ application, 🎯 action, 🩷 reflections/pink), so a separate CSS snippet can color them the same way. It ships no CSS of its own — colors live in the target vault's own `highlights.css` snippet.

## Build & Development Commands

```bash
# Install dependencies
pnpm install

# Development mode (watch for changes and rebuild automatically)
pnpm dev

# Production build (with type checking)
pnpm build

# Type check only
tsc -noEmit -skipLibCheck

# Lint
eslint main.ts
```

## Architecture

- `emojiMap.ts` — single source of truth: `EMOJI_CLASS` maps each semantic emoji to its `hltr-*` class, plus `classForMarkText`/`stripLeadingEmoji` helpers.
- `main.ts` — `HighlightPlugin`:
  - `registerMarkdownPostProcessor` — Reading View. Adds the class and strips the emoji from displayed text (safe, static DOM).
  - `registerEditorExtension` with a CM6 `ViewPlugin` — Live Preview. Adds the class only; does **not** mutate text (contenteditable DOM — stripping risks cursor/undo breakage).
  - Both paths skip any `<mark>` that already has `data-highlight` (native color marks) and guard against double-processing via `dataset.hltrSemantic`.

## Important Constraints

1. **No external dependencies bundled**: only externals are Obsidian + CodeMirror APIs (see `esbuild.config.mjs`'s `external` list).
2. **Mobile compatible**: `isDesktopOnly: false`.
3. **No own CSS**: `styles.css` is intentionally empty — the `hltr-*` classes it targets are defined per-vault.

## Testing Workflow

1. Run `pnpm dev` to start watch mode.
2. Plugin lives in the vault's `.obsidian/plugins/obsidian-highlight/` directory.
3. Reload Obsidian after changes, or use `obsidian plugin:reload id=obsidian-highlight` via the `obsidian` CLI.
4. Test against a vault that actually defines the `hltr-quote` / `hltr-coreideas` / `hltr-application` / `hltr-action` / `hltr-reflections` CSS classes (e.g. the ZK2026 vault's `.obsidian/snippets/highlights.css`) — this dev vault doesn't, so classes will be added but invisible here.

## Code Style Notes

- Tabs, single quotes, no semicolons (per `.editorconfig` / existing repo style).
- TypeScript with strict null checks; `lib` is ES5/6/7 only — no ES2019+ string methods like `trimStart` (use a regex instead, see `emojiMap.ts`).
