// Emoji Obsidian's core parser doesn't recognize as a highlight color
// (only 🔴🟠🟡🟢🔵🟣 get a native data-highlight attribute). This plugin
// assigns the rest a data-highlight value of its own, same attribute
// native colors use — style mark[data-highlight="value"] in your own CSS.
export interface EmojiMapping {
	emoji: string
	value: string
}

export const DEFAULT_EMOJI_MAP: EmojiMapping[] = [
	{ emoji: '💬', value: 'quote' },
	{ emoji: '💡', value: 'coreideas' },
	{ emoji: '🛠️', value: 'application' },
	{ emoji: '🎯', value: 'action' },
	{ emoji: '🩷', value: 'reflections' },
]

function trimStart(text: string): string {
	return text.replace(/^\s+/, '')
}

function sortedMappings(mappings: EmojiMapping[]): EmojiMapping[] {
	return mappings.filter((m) => m.emoji).sort((a, b) => b.emoji.length - a.emoji.length)
}

export function highlightValueForMarkText(text: string, mappings: EmojiMapping[]): string | null {
	const trimmed = trimStart(text)
	for (const { emoji, value } of sortedMappings(mappings)) {
		if (trimmed.startsWith(emoji)) return value
	}
	return null
}

export function stripLeadingEmoji(text: string, mappings: EmojiMapping[]): string {
	const trimmed = trimStart(text)
	for (const { emoji } of sortedMappings(mappings)) {
		if (trimmed.startsWith(emoji)) {
			return trimStart(trimmed.slice(emoji.length))
		}
	}
	return text
}
