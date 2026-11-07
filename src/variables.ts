import { CompanionVariableDefinition } from '@companion-module/base'

export function GetVariableDefinitions(): CompanionVariableDefinition[] {
	return [
		{ variableId: 'next_cue_num', name: 'Standby (Next) Cue Number (Q#)' },
		{ variableId: 'next_cue_name', name: 'Standby (Next) Cue Name' },
		{ variableId: 'next_cue_type', name: 'Standby (Next) Cue Type' },
		{ variableId: 'next_cue_notes', name: 'Standby (Next) Cue Notes' },
		{ variableId: 'running_cue_num', name: 'Currently Running Cue Number (Q#)' },
		{ variableId: 'running_cue_name', name: 'Currently Running Cue Name' },
		{ variableId: 'running_elapsed', name: 'Running Cue Elapsed Time (MM:SS.d)' },
		{ variableId: 'running_remaining', name: 'Running Cue Remaining Time (-MM:SS.d)' },
		{ variableId: 'running_progress_pct', name: 'Running Cue Progress (%)' },
		{ variableId: 'active_count', name: 'Number of Active/Running Cues' },
		{ variableId: 'is_running', name: 'Any Cue Running (true/false)' },
		{ variableId: 'is_paused', name: 'Playback Paused (true/false)' },
		{ variableId: 'master_volume_db', name: 'Master Volume (dB)' },
		{ variableId: 'webui_url', name: 'Cue Companion Web Workspace URL' },
	]
}

