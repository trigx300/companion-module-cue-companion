import { CompanionActionDefinitions } from '@companion-module/base'
import type { CueCompanionInstance } from './main'

export function GetActions(self: CueCompanionInstance): CompanionActionDefinitions {
	return {
		go: {
			name: 'Transport: GO (Fire Standby Cue)',
			options: [],
			callback: async () => {
				self.triggerGo()
			},
		},
		panic: {
			name: 'Transport: PANIC / Stop All (1x = Fade Out, 2x = Hard Cut)',
			options: [],
			callback: async () => {
				self.triggerPanic()
			},
		},
		pause_toggle: {
			name: 'Transport: Pause / Resume All',
			options: [
				{
					type: 'dropdown',
					id: 'mode',
					label: 'Action',
					default: 'toggle',
					choices: [
						{ id: 'toggle', label: 'Toggle Pause / Resume' },
						{ id: 'pause', label: 'Pause All Active Cues' },
						{ id: 'resume', label: 'Resume All Paused Cues' },
					],
				},
			],
			callback: async (event) => {
				const mode = event.options.mode as 'toggle' | 'pause' | 'resume'
				self.triggerPause(mode)
			},
		},
		playhead_move: {
			name: 'Playhead: Move Up / Down (Previous / Next Cue)',
			options: [
				{
					type: 'dropdown',
					id: 'direction',
					label: 'Direction',
					default: 'next',
					choices: [
						{ id: 'next', label: 'Next Cue (Down ▼)' },
						{ id: 'prev', label: 'Previous Cue (Up ▲)' },
						{ id: 'top', label: 'Top of Cue List (First Cue)' },
					],
				},
			],
			callback: async (event) => {
				const dir = event.options.direction as 'next' | 'prev' | 'top'
				self.movePlayhead(dir)
			},
		},
		playhead_goto: {
			name: 'Playhead: Set Standby to Cue Number (Q#)',
			options: [
				{
					type: 'textinput',
					id: 'qNumber',
					label: 'Cue Number (e.g. 1, 2, 1.1)',
					default: '1',
				},
			],
			callback: async (event) => {
				self.setPlayheadByQNumber(String(event.options.qNumber))
			},
		},
		fire_cue: {
			name: 'Cue: Fire Specific Cue by Number (Q#)',
			options: [
				{
					type: 'textinput',
					id: 'qNumber',
					label: 'Cue Number (e.g. 1, 2, 5)',
					default: '1',
				},
			],
			callback: async (event) => {
				self.fireCueByQNumber(String(event.options.qNumber))
			},
		},
		stop_cue: {
			name: 'Cue: Stop Specific Cue by Number (Q#)',
			options: [
				{
					type: 'textinput',
					id: 'qNumber',
					label: 'Cue Number (e.g. 1.1)',
					default: '1.1',
				},
			],
			callback: async (event) => {
				self.stopCueByQNumber(String(event.options.qNumber))
			},
		},
		master_volume: {
			name: 'Audio: Adjust Master Volume (dB)',
			options: [
				{
					type: 'dropdown',
					id: 'operation',
					label: 'Operation',
					default: 'set',
					choices: [
						{ id: 'set', label: 'Set Exact Level (dB)' },
						{ id: 'delta', label: 'Nudge Relative (+/- dB)' },
					],
				},
				{
					type: 'number',
					id: 'db',
					label: 'Level / Delta (dB)',
					default: 0,
					min: -60,
					max: 12,
				},
			],
			callback: async (event) => {
				const op = event.options.operation as 'set' | 'delta'
				const val = Number(event.options.db)
				self.setMasterVolume(op, val)
			},
		},
	}
}

