# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Highlight is an Obsidian plugin. Obsidian's core parser recognizes only six `==emoji text==` highlight colors (🔴🟠🟡🟢🔵🟣), rendering them as `<mark data-highlight="color">`. This plugin gives marks with a leading emoji core doesn't recognize (default: 💬 quote, 💡 coreideas, 🛠️ application, 🎯 action, 🩷 reflections/pink) a `data-highlight` value of their own — same attribute native colors use — so a vault's own CSS can style `mark[data-highlight="value"]` the same way it styles native colors. The emoji→value mapping is user-configurable via a settings tab. Ships its own default `styles.css` colors for the 5 default values (quote/coreideas/application/action/reflections) — custom values added in settings need their own CSS rule to show a color.

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

- `emojiMap.ts` — `DEFAULT_EMOJI_MAP` (array of `{emoji, value}`), plus `highlightValueForMarkText`/`stripLeadingEmoji` helpers that take the current mapping array as a parameter (not hardcoded — comes from settings).
- `settings.ts` — `HighlightSettings` (`{ emojiMap: EmojiMapping[] }`), defaults, and `HighlightSettingTab`: one row per mapping (emoji text field, value text field, delete button) plus an "Add mapping" button. Array-indexed, not keyed by emoji — avoids key-rename bugs while editing.
- `main.ts` — `HighlightPlugin`, `loadSettings`/`saveSettings` via `loadData`/`saveData`. Reading View and Live Preview render highlights as **different DOM** — each needs its own detection + styling:
  - `registerMarkdownPostProcessor` — Reading View renders `<mark data-highlight="...">`. Obsidian always sets the attribute, even `""` for an unrecognized emoji, so presence alone can't signal "already processed" — check the *value*. Sets `data-highlight` to our value and strips the leading emoji from displayed text (safe, static DOM).
  - `registerEditorExtension` with a CM6 `ViewPlugin` — Live Preview has **no `<mark>` at all**; it renders `<span class="cm-highlight">`, with an extra `cm-highlight-<color>` class for recognized native colors. We add our own `cm-highlight-<value>` class to match. Does **not** mutate text (contenteditable DOM — stripping risks cursor/undo breakage).

## Important Constraints

1. **No external dependencies bundled**: only externals are Obsidian + CodeMirror APIs (see `esbuild.config.mjs`'s `external` list).
2. **Mobile compatible**: `isDesktopOnly: false`.
3. **Own CSS, dual selectors**: `styles.css` pairs `mark[data-highlight="value"]` (Reading View) with `.cm-highlight-value` (Live Preview) in the same rule for each of the 5 default values.

## Testing Workflow

1. Run `pnpm dev` to start watch mode.
2. Plugin lives in the `obsidian-plugins` dev vault's `.obsidian/plugins/obsidian-highlight/` directory — **not** the ZK2026 vault, which is the user's production vault and must not have dev/test plugins installed into it.
3. Reload Obsidian after changes, or use `obsidian plugin:reload id=obsidian-highlight` via the `obsidian` CLI (target `vault="obsidian-plugins"` if it's not the most recently focused vault).
4. Verify both views: Reading View (`setViewState({mode: "preview"})`) checks `<mark data-highlight>`; Live Preview (`setViewState({mode: "source", source: false})`) checks `.cm-highlight` spans — they are genuinely different DOM, so testing only one will miss regressions in the other.

## Code Style Notes

- Tabs, single quotes, no semicolons (per `.editorconfig` / existing repo style).
- TypeScript with strict null checks; `lib` is ES5/6/7 only — no ES2019+ string methods like `trimStart` (use a regex instead, see `emojiMap.ts`).
