// Emoji Obsidian's core parser doesn't recognize as a highlight color
// (only 🔴🟠🟡🟢🔵🟣 get a native data-highlight attribute).
// These map to the semantic hltr-* classes already defined in the vault's
// highlights.css snippet.
export const EMOJI_CLASS: Record<string, string> = {
	'💬': 'hltr-quote',
	'💡': 'hltr-coreideas',
	'🛠️': 'hltr-application',
	'🎯': 'hltr-action',
	'🩷': 'hltr-reflections',
}

const EMOJIS = Object.keys(EMOJI_CLASS).sort((a, b) => b.length - a.length)

function trimStart(text: string): string {
	return text.replace(/^\s+/, '')
}

export function classForMarkText(text: string): string | null {
	const trimmed = trimStart(text)
	for (const emoji of EMOJIS) {
		if (trimmed.startsWith(emoji)) return EMOJI_CLASS[emoji]
	}
	return null
}

export function stripLeadingEmoji(text: string): string {
	const trimmed = trimStart(text)
	for (const emoji of EMOJIS) {
		if (trimmed.startsWith(emoji)) {
			return trimStart(trimmed.slice(emoji.length))
		}
	}
	return text
}
