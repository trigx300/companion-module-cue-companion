export type CueType =
	| 'audio'
	| 'video'
	| 'background'
	| 'companion'
	| 'fade'
	| 'wait'
	| 'group'
	| 'network'
	| 'stop'
	| 'goto'

export type ContinueMode = 'none' | 'auto_continue' | 'auto_follow'

export type CueColor = 'none' | 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple'

export type CueRunState = 'idle' | 'prewait' | 'running' | 'postwait' | 'paused'

export type GroupMode = 'simultaneous' | 'first_and_go' | 'sequential'

export type PlaybackLoopMode = 'one_shot' | 'infinite_loop' | 'pause_at_end'

export interface Cue {
	id: string
	qNumber: string
	name: string
	type: CueType
	color: CueColor
	notes: string
	armed: boolean
	parentId: string | null // If inside a Group cue
	groupMode?: GroupMode
	expanded?: boolean

	// Timing & Cropping (in seconds)
	preWait: number
	duration: number // Action duration (cropped TRT: endTime - startTime)
	sourceDuration?: number // Full uncropped media file duration
	postWait: number
	continueMode: ContinueMode
	pauseAtTime?: number

	// Audio / Video / Fade properties
	filePath: string // Uploaded file in media/ or synth preset like "synth:440" or "synth:chime"
	volumeDb: number // -60 to +12 dB (0 dB = unity)
	pan: number // -1 (Left) to +1 (Right)
	startTime: number // In-point crop (seconds)
	endTime: number // Out-point crop (seconds)
	loop: boolean
	loopMode?: PlaybackLoopMode // 'one_shot' | 'infinite_loop' | 'pause_at_end' (Pause at Last Frame)
	fadeIn: number
	fadeOut: number

	// Background Cue properties (solid color or gradient on Video Stage)
	bgStyle?: 'solid' | 'linear-gradient' | 'radial-gradient'
	bgColor1?: string
	bgColor2?: string
	bgAngle?: number

	// Video / Display Screen Routing
	targetScreens?: string // 'all' or comma-separated screen indices e.g. '0', '1', '0,1'

	// Target Cue ID (for Fade, Stop, Goto cues)
	targetCueId: string
	stopTargetWhenDone: boolean

	// Companion Button Cue target
	companionPage: number
	companionRow: number
	companionCol: number
	companionAction: 'press' | 'down' | 'up'

	// Network Cue target
	networkUrl: string
	networkMethod: 'GET' | 'POST' | 'PUT'
	networkBody: string

	// Runtime state (not persisted as active)
	state?: CueRunState
	preWaitElapsed?: number
	actionElapsed?: number
	postWaitElapsed?: number
	currentVolumeDb?: number
	fadeStartVolumeDb?: number
	pauseAtTimeTriggered?: boolean
	heldAtLastFrame?: boolean
}

export function CreateDefaultDemoCues(): Cue[] {
	return [
		{
			id: 'cue-group-1',
			qNumber: '1',
			name: 'Preshow & Walk-In Sequence',
			type: 'group',
			color: 'blue',
			notes: 'Fires walk-in music and sets Companion lobby look simultaneously',
			armed: true,
			parentId: null,
			groupMode: 'simultaneous',
			expanded: true,
			preWait: 0,
			duration: 0,
			postWait: 0,
			continueMode: 'none',
			pauseAtTime: 0,
			filePath: '',
			volumeDb: 0,
			pan: 0,
			startTime: 0,
			endTime: 0,
			loop: false,
			fadeIn: 0,
			fadeOut: 0,
			targetCueId: '',
			stopTargetWhenDone: false,
			companionPage: 1,
			companionRow: 0,
			companionCol: 0,
			companionAction: 'press',
			networkUrl: '',
			networkMethod: 'POST',
			networkBody: '',
		},
		{
			id: 'cue-audio-1',
			qNumber: '1.1',
			name: 'Walk-In Ambient Pad (Synth Warm Chord)',
			type: 'audio',
			color: 'green',
			notes: 'Warm stereo ambient synth chord — loops until faded out in Q 3',
			armed: true,
			parentId: 'cue-group-1',
			preWait: 0,
			duration: 30,
			postWait: 0,
			continueMode: 'none',
			pauseAtTime: 0,
			filePath: 'synth:warm_pad',
			volumeDb: -3,
			pan: 0,
			startTime: 0,
			endTime: 30,
			loop: true,
			fadeIn: 2.0,
			fadeOut: 0,
			targetCueId: '',
			stopTargetWhenDone: false,
			companionPage: 1,
			companionRow: 0,
			companionCol: 0,
			companionAction: 'press',
			networkUrl: '',
			networkMethod: 'POST',
			networkBody: '',
		},
		{
			id: 'cue-comp-1',
			qNumber: '1.2',
			name: 'Companion: Trigger Preshow Lighting (Page 1, 0/0)',
			type: 'companion',
			color: 'purple',
			notes: 'Presses Companion button at Page 1, Row 0, Col 0',
			armed: true,
			parentId: 'cue-group-1',
			preWait: 0.5,
			duration: 0.5,
			postWait: 0,
			continueMode: 'none',
			pauseAtTime: 0,
			filePath: '',
			volumeDb: 0,
			pan: 0,
			startTime: 0,
			endTime: 0,
			loop: false,
			fadeIn: 0,
			fadeOut: 0,
			targetCueId: '',
			stopTargetWhenDone: false,
			companionPage: 1,
			companionRow: 0,
			companionCol: 0,
			companionAction: 'press',
			networkUrl: '',
			networkMethod: 'POST',
			networkBody: '',
		},
		{
			id: 'cue-audio-2',
			qNumber: '2',
			name: 'Voice of God: "Please Take Your Seats" Chime',
			type: 'audio',
			color: 'yellow',
			notes: 'Plays 3-note broadcast chime and auto-continues to fade out walk-in',
			armed: true,
			parentId: null,
			preWait: 0,
			duration: 4.5,
			postWait: 1.5,
			continueMode: 'auto_continue',
			pauseAtTime: 0,
			filePath: 'synth:chime',
			volumeDb: 0,
			pan: 0,
			startTime: 0,
			endTime: 4.5,
			loop: false,
			fadeIn: 0,
			fadeOut: 0.5,
			targetCueId: '',
			stopTargetWhenDone: false,
			companionPage: 1,
			companionRow: 0,
			companionCol: 0,
			companionAction: 'press',
			networkUrl: '',
			networkMethod: 'POST',
			networkBody: '',
		},
		{
			id: 'cue-fade-1',
			qNumber: '3',
			name: 'Fade & Stop Walk-In Ambient Pad (Q 1.1)',
			type: 'fade',
			color: 'orange',
			notes: 'Fades Q 1.1 down to -60 dB over 4 seconds and stops it, then auto-follows to Q 4',
			armed: true,
			parentId: null,
			preWait: 0,
			duration: 4.0,
			postWait: 0,
			continueMode: 'auto_follow',
			pauseAtTime: 0,
			filePath: '',
			volumeDb: -60,
			pan: 0,
			startTime: 0,
			endTime: 0,
			loop: false,
			fadeIn: 0,
			fadeOut: 0,
			targetCueId: 'cue-audio-1',
			stopTargetWhenDone: true,
			companionPage: 1,
			companionRow: 0,
			companionCol: 0,
			companionAction: 'press',
			networkUrl: '',
			networkMethod: 'POST',
			networkBody: '',
		},
		{
			id: 'cue-comp-2',
			qNumber: '4',
			name: 'Show Start: Cut ATEM / Roll Intro (Page 1, 1/1)',
			type: 'companion',
			color: 'red',
			notes: 'Triggers main show start macro on Companion Page 1, Row 1, Col 1',
			armed: true,
			parentId: null,
			preWait: 0,
			duration: 1.0,
			postWait: 0,
			continueMode: 'none',
			pauseAtTime: 0,
			filePath: '',
			volumeDb: 0,
			pan: 0,
			startTime: 0,
			endTime: 0,
			loop: false,
			fadeIn: 0,
			fadeOut: 0,
			targetCueId: '',
			stopTargetWhenDone: false,
			companionPage: 1,
			companionRow: 1,
			companionCol: 1,
			companionAction: 'press',
			networkUrl: '',
			networkMethod: 'POST',
			networkBody: '',
		},
		{
			id: 'cue-audio-3',
			qNumber: '5',
			name: 'Walk-On Stinger (Upbeat Fanfare)',
			type: 'audio',
			color: 'green',
			notes: 'Presenter walk-on synth stinger',
			armed: true,
			parentId: null,
			preWait: 0,
			duration: 6.0,
			postWait: 0,
			continueMode: 'none',
			pauseAtTime: 0,
			filePath: 'synth:stinger',
			volumeDb: 0,
			pan: 0,
			startTime: 0,
			endTime: 6.0,
			loop: false,
			fadeIn: 0,
			fadeOut: 1.0,
			targetCueId: '',
			stopTargetWhenDone: false,
			companionPage: 1,
			companionRow: 0,
			companionCol: 0,
			companionAction: 'press',
			networkUrl: '',
			networkMethod: 'POST',
			networkBody: '',
		},
	]
}
