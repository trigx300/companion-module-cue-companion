import { combineRgb, CompanionPresetDefinitions } from '@companion-module/base'

export function GetPresets(): CompanionPresetDefinitions {
	return {
		cue_go: {
			type: 'button',
			category: 'Cue Companion Transport',
			name: 'Giant GO Button (with Standby Q#)',
			style: {
				text: 'GO\\nQ$(CueCompanion:next_cue_num)\\n$(CueCompanion:next_cue_name)',
				size: '14',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 130, 50),
			},
			steps: [
				{
					down: [{ actionId: 'go', options: {} }],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'any_running',
					options: {},
					style: {
						bgcolor: combineRgb(0, 200, 80),
						color: combineRgb(0, 0, 0),
					},
				},
			],
		},
		cue_countdown: {
			type: 'button',
			category: 'Cue Companion Transport',
			name: 'Active Cue Countdown Timer',
			style: {
				text: '$(CueCompanion:running_cue_name)\\n$(CueCompanion:running_remaining)',
				size: '14',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(25, 25, 30),
			},
			steps: [{ down: [], up: [] }],
			feedbacks: [
				{
					feedbackId: 'any_running',
					options: {},
					style: {
						bgcolor: combineRgb(15, 90, 40),
						color: combineRgb(255, 255, 255),
					},
				},
				{
					feedbackId: 'time_remaining_warning',
					options: { seconds: 10 },
					style: {
						bgcolor: combineRgb(210, 25, 25),
						color: combineRgb(255, 255, 255),
					},
				},
			],
		},
		cue_panic: {
			type: 'button',
			category: 'Cue Companion Transport',
			name: 'PANIC / Stop All (Fade -> Cut)',
			style: {
				text: 'PANIC\\nSTOP ALL\\n($(CueCompanion:active_count) active)',
				size: '14',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(150, 20, 20),
			},
			steps: [
				{
					down: [{ actionId: 'panic', options: {} }],
					up: [],
				},
			],
			feedbacks: [],
		},
		cue_pause: {
			type: 'button',
			category: 'Cue Companion Transport',
			name: 'Pause / Resume All',
			style: {
				text: 'PAUSE /\\nRESUME',
				size: '14',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(60, 60, 65),
			},
			steps: [
				{
					down: [{ actionId: 'pause_toggle', options: { mode: 'toggle' } }],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'is_paused',
					options: {},
					style: {
						bgcolor: combineRgb(230, 160, 0),
						color: combineRgb(0, 0, 0),
					},
				},
			],
		},
		cue_prev: {
			type: 'button',
			category: 'Cue Companion Transport',
			name: 'Playhead Up (Prev Cue ▲)',
			style: {
				text: '▲ PREV\\nQ$(CueCompanion:next_cue_num)',
				size: '14',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(40, 40, 48),
			},
			steps: [
				{
					down: [{ actionId: 'playhead_move', options: { direction: 'prev' } }],
					up: [],
				},
			],
			feedbacks: [],
		},
		cue_next: {
			type: 'button',
			category: 'Cue Companion Transport',
			name: 'Playhead Down (Next Cue ▼)',
			style: {
				text: '▼ NEXT\\nQ$(CueCompanion:next_cue_num)',
				size: '14',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(40, 40, 48),
			},
			steps: [
				{
					down: [{ actionId: 'playhead_move', options: { direction: 'next' } }],
					up: [],
				},
			],
			feedbacks: [],
		},
	}
}

