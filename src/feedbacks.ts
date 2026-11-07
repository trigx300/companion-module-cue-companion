import { combineRgb, CompanionFeedbackDefinitions } from '@companion-module/base'
import type { CueCompanionInstance } from './main'

export function GetFeedbacks(self: CueCompanionInstance): CompanionFeedbackDefinitions {
	return {
		any_running: {
			type: 'boolean',
			name: 'Playback: Any Cue is Currently Running',
			description: 'Highlights button green when one or more cues are actively playing',
			defaultStyle: {
				bgcolor: combineRgb(0, 185, 70),
				color: combineRgb(255, 255, 255),
			},
			options: [],
			callback: () => {
				return self.getActiveCues().length > 0 && !self.isPaused
			},
		},
		is_paused: {
			type: 'boolean',
			name: 'Playback: Cue List is Paused',
			description: 'Highlights button amber/yellow when cues are paused',
			defaultStyle: {
				bgcolor: combineRgb(230, 160, 0),
				color: combineRgb(0, 0, 0),
			},
			options: [],
			callback: () => {
				return self.isPaused
			},
		},
		cue_running: {
			type: 'boolean',
			name: 'Cue: Specific Cue Number (Q#) is Running',
			description: 'True while the specified Q# is in Pre-Wait, Action, or Post-Wait',
			defaultStyle: {
				bgcolor: combineRgb(0, 185, 70),
				color: combineRgb(255, 255, 255),
			},
			options: [
				{
					type: 'textinput',
					id: 'qNumber',
					label: 'Cue Number (Q#)',
					default: '1',
				},
			],
			callback: (feedback) => {
				const q = String(feedback.options.qNumber).trim()
				return self.isQNumberRunning(q)
			},
		},
		cue_standby: {
			type: 'boolean',
			name: 'Cue: Specific Cue Number (Q#) is Standby (Playhead)',
			description: 'True when the Cue Companion Standby Playhead is pointing at this Q#',
			defaultStyle: {
				bgcolor: combineRgb(220, 140, 0),
				color: combineRgb(0, 0, 0),
			},
			options: [
				{
					type: 'textinput',
					id: 'qNumber',
					label: 'Cue Number (Q#)',
					default: '1',
				},
			],
			callback: (feedback) => {
				const q = String(feedback.options.qNumber).trim()
				const standby = self.getStandbyCue()
				return standby?.qNumber === q
			},
		},
		time_remaining_warning: {
			type: 'boolean',
			name: 'Playback: Active Cue Time Remaining Warning (< N sec)',
			description: 'Turns button red when the primary running cue has fewer than N seconds left',
			defaultStyle: {
				bgcolor: combineRgb(210, 25, 25),
				color: combineRgb(255, 255, 255),
			},
			options: [
				{
					type: 'number',
					id: 'seconds',
					label: 'Warning Threshold (seconds)',
					default: 10,
					min: 1,
					max: 120,
				},
			],
			callback: (feedback) => {
				const rem = self.getPrimaryRemainingSeconds()
				if (rem === null) return false
				return rem > 0 && rem <= Number(feedback.options.seconds)
			},
		},
	}
}

