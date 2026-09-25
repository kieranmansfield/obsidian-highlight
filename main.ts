import { Plugin } from 'obsidian'
import { ViewPlugin, type ViewUpdate, type EditorView } from '@codemirror/view'
import { highlightValueForMarkText, stripLeadingEmoji, type EmojiMapping } from './emojiMap'
import { DEFAULT_SETTINGS, HighlightSettingTab, type HighlightSettings } from './settings'

// Reading View renders highlights as <mark data-highlight="...">. Obsidian
// always sets the attribute (even "" for unrecognized emoji), so presence
// alone can't signal "already processed" — check its value instead.
function processReadingViewMarks(root: ParentNode, mappings: EmojiMapping[]): void {
	root.querySelectorAll<HTMLElement>('mark').forEach((mark) => {
		if (mark.getAttribute('data-highlight')) return

		const value = highlightValueForMarkText(mark.textContent ?? '', mappings)
		if (!value) return

		mark.setAttribute('data-highlight', value)
		mark.textContent = stripLeadingEmoji(mark.textContent ?? '', mappings)
	})
}

// Live Preview renders highlights as <span class="cm-highlight">, with an
// extra "cm-highlight-<color>" class for recognized native colors — no
// <mark> element at all. The "==" delimiters get their own sibling spans
// (class cm-formatting cm-formatting-highlight cm-highlight) that also get
// the color class from core, so they need it added too or they're left in
// the default (yellow) highlight color. Group by .cm-line and apply the
// same class to every cm-highlight span on the line — text is left alone
// since this DOM is contenteditable.
// ponytail: assumes one highlight per line (true for this vault's content);
// two marks on the same line would incorrectly share one color.
function colorClassOf(span: HTMLElement): string | null {
	return Array.from(span.classList).find((c) => c.startsWith('cm-highlight-')) ?? null
}

function processLivePreviewSpans(root: ParentNode, mappings: EmojiMapping[]): void {
	root.querySelectorAll<HTMLElement>('.cm-line').forEach((line) => {
		const spans = Array.from(line.querySelectorAll<HTMLElement>('span.cm-highlight'))
		if (spans.length === 0) return

		// Delimiter spans are recreated (uncolored) whenever the cursor moves
		// onto/off the line, even after the content span was already colored
		// on an earlier pass — so derive the color from whichever span has it
		// rather than bailing out if *any* span looks done.
		const alreadyColored = spans.map(colorClassOf).find((c) => c !== null)
		const colorClass =
			alreadyColored ??
			(() => {
				const contentSpan = spans.find((s) => !s.classList.contains('cm-formatting'))
				const value = contentSpan && highlightValueForMarkText(contentSpan.textContent ?? '', mappings)
				return value ? `cm-highlight-${value}` : null
			})()
		if (!colorClass) return

		spans.forEach((s) => {
			if (!colorClassOf(s)) s.classList.add(colorClass)
		})
	})
}

export default class HighlightPlugin extends Plugin {
	settings: HighlightSettings = DEFAULT_SETTINGS

	async onload(): Promise<void> {
		await this.loadSettings()

		this.registerMarkdownPostProcessor((el) => {
			processReadingViewMarks(el, this.settings.emojiMap)
		})

		const settings = this.settings
		const livePreviewMarkPlugin = ViewPlugin.fromClass(
			class {
				constructor(view: EditorView) {
					processLivePreviewSpans(view.dom, settings.emojiMap)
				}

				update(update: ViewUpdate): void {
					// selectionSet matters here too: moving the cursor onto/off a
					// highlighted line reveals/hides its "==" delimiter spans as
					// fresh DOM, which then need (re-)coloring.
					if (update.docChanged || update.viewportChanged || update.selectionSet) {
						processLivePreviewSpans(update.view.dom, settings.emojiMap)
					}
				}
			},
		)
		this.registerEditorExtension(livePreviewMarkPlugin)

		this.addSettingTab(new HighlightSettingTab(this.app, this))
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings)
	}
}
