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
// <mark> element at all. We add our own "cm-highlight-<value>" class to
// match; text is left alone since this DOM is contenteditable.
function processLivePreviewSpans(root: ParentNode, mappings: EmojiMapping[]): void {
	root.querySelectorAll<HTMLElement>('span.cm-highlight').forEach((span) => {
		if (Array.from(span.classList).some((c) => c.startsWith('cm-highlight-'))) return

		const value = highlightValueForMarkText(span.textContent ?? '', mappings)
		if (!value) return

		span.classList.add(`cm-highlight-${value}`)
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
					if (update.docChanged || update.viewportChanged) {
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
