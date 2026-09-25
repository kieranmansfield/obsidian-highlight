import { App, PluginSettingTab, Setting } from 'obsidian'
import type HighlightPlugin from './main'
import { DEFAULT_EMOJI_MAP, type EmojiMapping } from './emojiMap'

export interface HighlightSettings {
	emojiMap: EmojiMapping[]
}

export const DEFAULT_SETTINGS: HighlightSettings = {
	emojiMap: DEFAULT_EMOJI_MAP.map((m) => ({ ...m })),
}

export class HighlightSettingTab extends PluginSettingTab {
	constructor(
		app: App,
		private plugin: HighlightPlugin,
	) {
		super(app, plugin)
	}

	display(): void {
		const { containerEl } = this
		containerEl.empty()

		containerEl.createEl('p', {
			text:
				"Maps a leading emoji inside ==emoji text== highlights — that Obsidian's core parser " +
				'doesn\'t already recognize as a color — to a data-highlight value. Style ' +
				'mark[data-highlight="value"] in your own CSS snippet; this plugin ships no CSS.',
		})

		this.plugin.settings.emojiMap.forEach((mapping, index) => {
			new Setting(containerEl)
				.addText((text) =>
					text
						.setPlaceholder('Emoji')
						.setValue(mapping.emoji)
						.onChange(async (value) => {
							mapping.emoji = value
							await this.plugin.saveSettings()
						}),
				)
				.addText((text) =>
					text
						.setPlaceholder('data-highlight value')
						.setValue(mapping.value)
						.onChange(async (value) => {
							mapping.value = value
							await this.plugin.saveSettings()
						}),
				)
				.addExtraButton((btn) =>
					btn
						.setIcon('trash')
						.setTooltip('Remove')
						.onClick(async () => {
							this.plugin.settings.emojiMap.splice(index, 1)
							await this.plugin.saveSettings()
							this.display()
						}),
				)
		})

		new Setting(containerEl).addButton((btn) =>
			btn
				.setButtonText('Add mapping')
				.setCta()
				.onClick(async () => {
					this.plugin.settings.emojiMap.push({ emoji: '', value: '' })
					await this.plugin.saveSettings()
					this.display()
				}),
		)
	}
}
