import { Plugin } from 'obsidian'
import { ViewPlugin, type ViewUpdate, type EditorView } from '@codemirror/view'
import { classForMarkText, stripLeadingEmoji } from './emojiMap'

const PROCESSED = 'hltrSemantic'

function applyClassToMark(mark: HTMLElement, stripText: boolean): void {
	if (mark.dataset[PROCESSED]) return
	if (mark.hasAttribute('data-highlight')) return

	const cls = classForMarkText(mark.textContent ?? '')
	if (!cls) return

	mark.classList.add(cls)
	mark.dataset[PROCESSED] = '1'

	if (stripText) {
		mark.textContent = stripLeadingEmoji(mark.textContent ?? '')
	}
}

function processMarks(root: ParentNode, stripText: boolean): void {
	root.querySelectorAll<HTMLElement>('mark:not([data-highlight])').forEach((mark) => {
		applyClassToMark(mark, stripText)
	})
}

const livePreviewMarkPlugin = ViewPlugin.fromClass(
	class {
		constructor(view: EditorView) {
			processMarks(view.dom, false)
		}

		update(update: ViewUpdate): void {
			if (update.docChanged || update.viewportChanged) {
				processMarks(update.view.dom, false)
			}
		}
	},
)

export default class SemanticHighlightsPlugin extends Plugin {
	onload(): void {
		this.registerMarkdownPostProcessor((el) => {
			processMarks(el, true)
		})

		this.registerEditorExtension(livePreviewMarkPlugin)
	}
}
