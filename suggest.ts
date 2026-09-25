import { App, Editor, EditorPosition, EditorSuggest, EditorSuggestContext, EditorSuggestTriggerInfo } from 'obsidian'
import type { EmojiMapping } from './emojiMap'
import type HighlightPlugin from './main'

// Obsidian's own color picker (the swatch you click on an already-typed
// ==emoji==) is a private internal menu built from hardcoded, minified
// identifiers — there's no plugin API to add entries to it, and patching
// those identifiers would break on the next Obsidian update. An
// EditorSuggest is the public, stable equivalent: it can't hook the same
// menu, but it gives the same "type and pick from a dropdown" experience.
export class HighlightEmojiSuggest extends EditorSuggest<EmojiMapping> {
	constructor(app: App, private plugin: HighlightPlugin) {
		super(app)
	}

	onTrigger(cursor: EditorPosition, editor: Editor): EditorSuggestTriggerInfo | null {
		const line = editor.getLine(cursor.line)
		const beforeCursor = line.slice(0, cursor.ch)
		const match = beforeCursor.match(/(?:^|[^=])==([a-zA-Z]{0,20})$/)
		if (!match) return null

		const query = match[1]
		return {
			start: { line: cursor.line, ch: cursor.ch - query.length - 2 },
			end: cursor,
			query,
		}
	}

	getSuggestions(context: EditorSuggestContext): EmojiMapping[] {
		const query = context.query.toLowerCase()
		return this.plugin.settings.emojiMap.filter(
			(m) => m.emoji && m.value.toLowerCase().includes(query),
		)
	}

	renderSuggestion(mapping: EmojiMapping, el: HTMLElement): void {
		el.createSpan({ text: `${mapping.emoji} ` })
		el.createSpan({ text: mapping.value, cls: 'hltr-suggest-value' })
	}

	selectSuggestion(mapping: EmojiMapping): void {
		const context = this.context
		if (!context) return
		context.editor.replaceRange(`${mapping.emoji} `, context.start, context.end)
	}
}
