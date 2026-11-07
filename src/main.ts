import { InstanceBase, runEntrypoint, InstanceStatus, SomeCompanionConfigField } from '@companion-module/base'
import http from 'http'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { execFile, spawn, ChildProcess } from 'child_process'
import { CueCompanionConfig, GetConfigFields, DetectLocalIpAddress, ResolveCompanionHost } from './config'
import { Cue, CueType, CreateDefaultDemoCues } from './types'
import { GetActions } from './actions'
import { GetFeedbacks } from './feedbacks'
import { GetVariableDefinitions } from './variables'
import { GetPresets } from './presets'
import { GetCueCompanionWebUiHtml, GetVideoStageHtml } from './webui'

export interface DetectedDisplay {
	index: number
	deviceName: string
	label: string
	left: number
	top: number
	width: number
	height: number
	isPrimary: boolean
}

export class CueCompanionInstance extends InstanceBase<CueCompanionConfig> {
	public config!: CueCompanionConfig
	public cues: Cue[] = []
	public projectName = 'Untitled Show'
	public standbyCueId: string | null = null
	public isPaused = false
	public masterVolumeDb = 0
	public detectedDisplays: DetectedDisplay[] = [
		{
			index: 0,
			deviceName: '\\\\.\\DISPLAY1',
			label: 'Screen 1 (Primary Display)',
			left: 0,
			top: 0,
			width: 1920,
			height: 1080,
			isPrimary: true,
		},
	]

	private httpServer: http.Server | null = null
	private sseClients: Set<http.ServerResponse> = new Set()
	private stageProcesses: Map<number, ChildProcess> = new Map()
	private tickTimer: NodeJS.Timeout | null = null
	private lastPanicTime = 0
	private isPanicking = false
	private panicElapsed = 0
	private dataDir: string
	private mediaDir: string
	private projectsDir: string
	private showFilePath: string

	constructor(internal: unknown) {
		super(internal)
		const devDir = 'C:\\Users\\trigx300\\.gemini\\antigravity\\scratch\\companion-module-cue-companion'
		const defaultUserDir = path.join(os.homedir(), '.cue-companion')
		this.dataDir = defaultUserDir
		try {
			if (!fs.existsSync(this.dataDir)) {
				fs.mkdirSync(this.dataDir, { recursive: true })
			}
		} catch {
			this.dataDir = path.join(os.tmpdir(), 'cue-companion-data')
			if (!fs.existsSync(this.dataDir)) {
				fs.mkdirSync(this.dataDir, { recursive: true })
			}
		}
		this.mediaDir = path.join(this.dataDir, 'media')
		this.projectsDir = path.join(this.dataDir, 'projects')
		this.showFilePath = path.join(this.dataDir, 'cues-workspace.json')

		// Migrate any existing workspace & media files from the dev directory so Companion's dev watcher never reloads on saves/uploads
		try {
			if (!fs.existsSync(this.mediaDir)) {
				fs.mkdirSync(this.mediaDir, { recursive: true })
			}
			if (!fs.existsSync(this.projectsDir)) {
				fs.mkdirSync(this.projectsDir, { recursive: true })
			}
			const devShow = path.join(devDir, 'cues-workspace.json')
			if (fs.existsSync(devShow) && !fs.existsSync(this.showFilePath)) {
				fs.copyFileSync(devShow, this.showFilePath)
			}
			const devMedia = path.join(devDir, 'media')
			if (fs.existsSync(devMedia)) {
				for (const f of fs.readdirSync(devMedia)) {
					if (f.startsWith('.')) continue
					const src = path.join(devMedia, f)
					const dst = path.join(this.mediaDir, f)
					if (!fs.existsSync(dst) && fs.statSync(src).isFile()) {
						fs.copyFileSync(src, dst)
					}
				}
			}
		} catch {}
	}

	async init(config: CueCompanionConfig): Promise<void> {
		this.config = config
		const rawHost = (this.config.companionHost || '').trim().toLowerCase()
		if (!rawHost || rawHost === 'auto' || rawHost === '10.101.10.100') {
			this.config.companionHost = DetectLocalIpAddress()
			this.saveConfig(this.config)
		}

		if (!fs.existsSync(this.mediaDir)) {
			fs.mkdirSync(this.mediaDir, { recursive: true })
		}

		this.loadWorkspaceFromDisk()
		this.refreshConnectedScreens()

		this.setActionDefinitions(GetActions(this))
		this.setFeedbackDefinitions(GetFeedbacks(this))
		this.setVariableDefinitions(GetVariableDefinitions())
		this.setPresetDefinitions(GetPresets())

		await this.startWebServer()
		this.startTickLoop()

		this.syncCompanionState()
	}

	async destroy(): Promise<void> {
		if (this.tickTimer) {
			clearInterval(this.tickTimer)
			this.tickTimer = null
		}
		for (const proc of this.stageProcesses.values()) {
			try {
				proc.kill()
			} catch {}
		}
		this.stageProcesses.clear()
		await this.stopWebServer()
	}

	async configUpdated(config: CueCompanionConfig): Promise<void> {
		const rawHost = (config.companionHost || '').trim().toLowerCase()
		if (!rawHost || rawHost === 'auto') {
			config.companionHost = DetectLocalIpAddress()
			this.saveConfig(config)
		}
		const portChanged = this.config?.webPort !== config.webPort
		this.config = config
		if (portChanged) {
			await this.startWebServer()
		}
		this.syncCompanionState()
	}

	getConfigFields(): SomeCompanionConfigField[] {
		return GetConfigFields(this.config)
	}

	private normalizeLoadedCue(c: Cue): Cue {
		return {
			...c,
			sourceDuration: Number(c.sourceDuration) || Number(c.endTime) || Number(c.duration) || 0,
			startTime: Number(c.startTime) || 0,
			endTime: Number(c.endTime) || Number(c.duration) || 0,
			loopMode: c.loopMode || (c.loop ? 'infinite_loop' : 'one_shot'),
			bgStyle: c.bgStyle || 'linear-gradient',
			bgColor1: c.bgColor1 || '#0f172a',
			bgColor2: c.bgColor2 || '#1e3a8a',
			bgAngle: c.bgAngle !== undefined ? Number(c.bgAngle) : 135,
			targetScreens: c.targetScreens || 'all',
			pauseAtTime: Number(c.pauseAtTime) || 0,
			state: 'idle',
			preWaitElapsed: 0,
			actionElapsed: 0,
			postWaitElapsed: 0,
			pauseAtTimeTriggered: false,
			heldAtLastFrame: false,
		}
	}

	private loadWorkspaceFromDisk(): void {
		try {
			if (fs.existsSync(this.showFilePath)) {
				const raw = fs.readFileSync(this.showFilePath, 'utf8')
				const parsed = JSON.parse(raw)
				if (Array.isArray(parsed.cues) && parsed.cues.length > 0) {
					this.projectName = parsed.projectName || 'Untitled Show'
					this.cues = parsed.cues.map((c: Cue) => this.normalizeLoadedCue(c))
					this.standbyCueId = parsed.standbyCueId || this.cues[0]?.id || null
					return
				}
			}
		} catch (err) {
			this.log('warn', `Failed to load saved show file, loading default demo show: ${err}`)
		}

		this.projectName = 'Demo Show'
		this.cues = CreateDefaultDemoCues().map((c) => this.normalizeLoadedCue(c))
		this.standbyCueId = this.cues[0]?.id || null
		this.saveWorkspaceToDisk()
	}

	private getSerializedWorkspacePayload(customName?: string): Record<string, any> {
		const cleanCues = this.cues.map((c) => {
			const copy = { ...c }
			delete copy.state
			delete copy.preWaitElapsed
			delete copy.actionElapsed
			delete copy.postWaitElapsed
			delete copy.currentVolumeDb
			delete copy.fadeStartVolumeDb
			delete copy.pauseAtTimeTriggered
			delete copy.heldAtLastFrame
			return copy
		})
		return {
			projectName: customName || this.projectName || 'Untitled Show',
			savedAt: new Date().toISOString(),
			standbyCueId: this.standbyCueId,
			masterVolumeDb: this.masterVolumeDb,
			cues: cleanCues,
		}
	}

	private saveWorkspaceToDisk(): void {
		try {
			const payload = this.getSerializedWorkspacePayload()
			fs.writeFileSync(this.showFilePath, JSON.stringify(payload, null, 2), 'utf8')
		} catch (err) {
			this.log('debug', `Could not save workspace: ${err}`)
		}
	}

	private getSavedProjectsList(): Array<{ name: string; filename: string; updatedAt: string; cueCount: number }> {
		try {
			if (!fs.existsSync(this.projectsDir)) return []
			const files = fs.readdirSync(this.projectsDir).filter((f) => f.endsWith('.json'))
			const list = files.map((filename) => {
				const fullPath = path.join(this.projectsDir, filename)
				const stat = fs.statSync(fullPath)
				let name = filename.replace(/\.cueproj\.json$|\.json$/i, '')
				let cueCount = 0
				try {
					const parsed = JSON.parse(fs.readFileSync(fullPath, 'utf8'))
					if (parsed.projectName) name = parsed.projectName
					if (Array.isArray(parsed.cues)) cueCount = parsed.cues.length
				} catch {}
				return {
					name,
					filename,
					updatedAt: stat.mtime.toISOString(),
					cueCount,
				}
			})
			list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
			return list
		} catch {
			return []
		}
	}

	private getMediaFiles(): string[] {
		try {
			if (!fs.existsSync(this.mediaDir)) return []
			return fs.readdirSync(this.mediaDir).filter((f) => !f.startsWith('.'))
		} catch {
			return []
		}
	}

	public getStandbyCue(): Cue | undefined {
		return this.cues.find((c) => c.id === this.standbyCueId)
	}

	public getActiveCues(): Cue[] {
		return this.cues.filter((c) => c.state && c.state !== 'idle')
	}

	public isQNumberRunning(qNum: string): boolean {
		const cue = this.cues.find((c) => c.qNumber === qNum)
		return !!cue && !!cue.state && cue.state !== 'idle'
	}

	public getPrimaryRemainingSeconds(): number | null {
		const active = this.getActiveCues().find((c) => c.state === 'running' && c.duration > 0)
		if (!active) return null
		return Math.max(0, active.duration - (active.actionElapsed || 0))
	}

	// =========================================================================
	// CUE COMPANION PLAYBACK ENGINE
	// =========================================================================

	public triggerGo(): void {
		if (this.isPaused) {
			this.triggerPause('resume')
		}

		// Reset any currently playing or held media cues when hitting GO to move to the next cue
		const standby = this.getStandbyCue()
		for (const activeCue of this.cues) {
			if (
				activeCue.state &&
				activeCue.state !== 'idle' &&
				(activeCue.type === 'audio' || activeCue.type === 'video') &&
				(!standby || standby.type !== 'fade' || standby.targetCueId !== activeCue.id)
			) {
				// If a cue is paused in the middle (not held at its last frame) and standby is still on it, allow resuming it
				if (activeCue.id === standby?.id && activeCue.state === 'paused' && !activeCue.heldAtLastFrame) {
					continue
				}
				this.stopCue(activeCue)
			}
		}

		if (standby && standby.state === 'paused' && !standby.heldAtLastFrame) {
			standby.state = 'running'
			if (standby.type === 'video') {
				this.broadcastStageEvent({
					type: 'resume_video',
					cueId: standby.id,
					targetScreens: standby.targetScreens || 'all',
				})
			}
			if (this.config.autoAdvancePlayhead !== false) {
				this.advancePlayheadFrom(standby.id)
			}
			this.broadcastState(false)
			this.syncCompanionState()
			return
		}

		if (!standby) {
			this.broadcastState(false)
			this.syncCompanionState()
			return
		}

		// Advance playhead before firing
		if (this.config.autoAdvancePlayhead !== false) {
			this.advancePlayheadFrom(standby.id)
		}

		this.fireCue(standby)
		this.broadcastState(false)
		this.syncCompanionState()
	}

	private advancePlayheadFrom(cueId: string): void {
		const idx = this.cues.findIndex((c) => c.id === cueId)
		if (idx === -1) return

		const current = this.cues[idx]
		for (let i = idx + 1; i < this.cues.length; i++) {
			const candidate = this.cues[i]
			if (!candidate.armed) continue
			if (current.type === 'group' && current.groupMode !== 'first_and_go' && candidate.parentId === current.id) {
				continue
			}
			this.standbyCueId = candidate.id
			return
		}
		this.standbyCueId = null
	}

	public fireCueByQNumber(qNumber: string): void {
		const cue = this.cues.find((c) => c.qNumber === qNumber.trim())
		if (cue) {
			this.fireCue(cue)
			this.broadcastState(false)
			this.syncCompanionState()
		}
	}

	public stopCueByQNumber(qNumber: string): void {
		const cue = this.cues.find((c) => c.qNumber === qNumber.trim())
		if (cue) {
			this.stopCue(cue)
			this.broadcastState(false)
			this.syncCompanionState()
		}
	}

	public fireCue(cue: Cue): void {
		if (!cue.armed) return

		// If cue is currently paused (e.g. via Pause at Time), firing it resumes from where it paused!
		if (cue.state === 'paused' && !cue.heldAtLastFrame) {
			this.log('info', `Resuming Paused Cue Q ${cue.qNumber}: ${cue.name}`)
			cue.state = 'running'
			if (cue.type === 'video') {
				this.broadcastStageEvent({
					type: 'resume_video',
					cueId: cue.id,
					targetScreens: cue.targetScreens || 'all',
				})
			}
			return
		}

		this.log('info', `Firing Cue Q ${cue.qNumber}: ${cue.name} (${cue.type})`)

		cue.preWaitElapsed = 0
		cue.actionElapsed = 0
		cue.postWaitElapsed = 0
		cue.currentVolumeDb = cue.volumeDb
		cue.pauseAtTimeTriggered = false
		cue.heldAtLastFrame = false

		if (cue.preWait > 0) {
			cue.state = 'prewait'
		} else {
			this.beginCueAction(cue)
		}
	}

	private computeBackgroundCss(cue: Cue): string {
		const c1 = cue.bgColor1 || '#0f172a'
		const c2 = cue.bgColor2 || '#1e3a8a'
		const angle = cue.bgAngle !== undefined ? cue.bgAngle : 135
		if (cue.bgStyle === 'solid') return c1
		if (cue.bgStyle === 'radial-gradient') return `radial-gradient(circle, ${c1} 0%, ${c2} 100%)`
		return `linear-gradient(${angle}deg, ${c1} 0%, ${c2} 100%)`
	}

	private computeVideoOpacity(cue: Cue): number {
		const dur = Number(cue.duration) || 0
		const elapsed = Number(cue.actionElapsed) || 0
		const fadeIn = Number(cue.fadeIn) || 0
		const fadeOut = Number(cue.fadeOut) || 0
		const isLoop = cue.loopMode === 'infinite_loop' || !!cue.loop
		let op = 1.0

		if (fadeIn > 0 && elapsed < fadeIn) {
			op = Math.max(0, Math.min(1, elapsed / fadeIn))
		}
		if (!isLoop && fadeOut > 0 && dur > 0) {
			const rem = dur - elapsed
			if (rem <= fadeOut) {
				op = Math.min(op, Math.max(0, rem / fadeOut))
			}
		}
		if (cue.currentVolumeDb !== undefined && cue.volumeDb !== undefined && cue.currentVolumeDb < cue.volumeDb - 0.5) {
			const span = Math.max(1, (cue.volumeDb ?? 0) - -60)
			const faderRatio = Math.max(0, Math.min(1, (cue.currentVolumeDb - -60) / span))
			op = Math.min(op, faderRatio)
		}
		return Number(op.toFixed(3))
	}

	private beginCueAction(cue: Cue): void {
		cue.state = 'running'
		cue.actionElapsed = 0

		switch (cue.type) {
			case 'video': {
				const fp = cue.filePath || ''
				if (fp && !fp.startsWith('synth:')) {
					const url = fp.startsWith('http') || fp.startsWith('/') ? fp : `/media/${encodeURIComponent(fp)}`
					const startSec = Number(cue.startTime) || 0
					const endSec = Number(cue.endTime) || Number(cue.duration) || 0
					const isLoop = cue.loopMode === 'infinite_loop' || !!cue.loop
					const pauseAtEnd = cue.loopMode === 'pause_at_end'
					const initOpacity = (Number(cue.fadeIn) || 0) > 0 ? 0 : 1
					this.broadcastStageEvent({
						type: 'play_video',
						cueId: cue.id,
						url,
						startTime: startSec,
						endTime: endSec,
						duration: Number(cue.duration) || endSec - startSec || 5,
						fadeIn: Number(cue.fadeIn) || 0,
						fadeOut: Number(cue.fadeOut) || 0,
						opacity: initOpacity,
						loop: isLoop,
						pauseAtEnd,
						volume: 0,
						targetScreens: cue.targetScreens || 'all',
					})
				}
				break
			}
			case 'background': {
				this.broadcastStageEvent({
					type: 'set_background',
					cueId: cue.id,
					css: this.computeBackgroundCss(cue),
					fadeIn: Number(cue.fadeIn) || 0,
					targetScreens: cue.targetScreens || 'all',
				})
				break
			}
			case 'companion':
				this.executeCompanionButtonCue(cue)
				break
			case 'network':
				this.executeNetworkCue(cue)
				break
			case 'stop': {
				const target = this.cues.find((c) => c.id === cue.targetCueId)
				if (target) this.stopCue(target)
				break
			}
			case 'goto': {
				const target = this.cues.find((c) => c.id === cue.targetCueId)
				if (target) this.standbyCueId = target.id
				break
			}
			case 'fade': {
				const target = this.cues.find((c) => c.id === cue.targetCueId)
				if (target) {
					cue.fadeStartVolumeDb = target.currentVolumeDb ?? target.volumeDb ?? 0
				}
				break
			}
			case 'group': {
				const children = this.cues.filter((c) => c.parentId === cue.id && c.armed)
				if (cue.groupMode === 'first_and_go') {
					if (children[0]) {
						this.fireCue(children[0])
						if (children[1]) this.standbyCueId = children[1].id
					}
				} else {
					for (const child of children) {
						this.fireCue(child)
					}
				}
				break
			}
		}

		if (cue.continueMode === 'auto_continue' && cue.postWait <= 0) {
			this.fireNextSiblingCue(cue)
		} else if (cue.continueMode === 'auto_continue' && cue.postWait > 0) {
			cue.postWaitElapsed = 0
		}

		if (cue.duration <= 0 && !cue.loop) {
			this.completeCueAction(cue)
		}
	}

	private completeCueAction(cue: Cue): void {
		if (cue.type === 'fade') {
			const target = this.cues.find((c) => c.id === cue.targetCueId)
			if (target) {
				target.currentVolumeDb = cue.volumeDb
				if (cue.stopTargetWhenDone) {
					this.stopCue(target)
				}
			}
		}

		if (cue.type === 'video') {
			this.broadcastStageEvent({
				type: 'stop_video',
				cueId: cue.id,
				resetTime: Number(cue.startTime) || 0,
				targetScreens: cue.targetScreens || 'all',
			})
		}

		// Reset media / cue runtime state first
		cue.state = 'idle'
		cue.actionElapsed = 0
		cue.preWaitElapsed = 0
		cue.postWaitElapsed = 0
		cue.currentVolumeDb = cue.volumeDb
		cue.pauseAtTimeTriggered = false
		cue.heldAtLastFrame = false

		if (cue.continueMode === 'auto_follow') {
			this.fireNextSiblingCue(cue)
		} else if (this.standbyCueId === cue.id && this.config.autoAdvancePlayhead !== false) {
			this.advancePlayheadFrom(cue.id)
		}
	}

	private fireNextSiblingCue(cue: Cue): void {
		const idx = this.cues.findIndex((c) => c.id === cue.id)
		if (idx >= 0 && idx + 1 < this.cues.length) {
			const nextCue = this.cues[idx + 1]
			if (nextCue && nextCue.armed) {
				if (this.standbyCueId === cue.id || this.standbyCueId === nextCue.id) {
					this.advancePlayheadFrom(nextCue.id)
				}
				this.fireCue(nextCue)
			}
		}
	}

	public stopCue(cue: Cue): void {
		const wasActive = cue.state && cue.state !== 'idle'
		cue.state = 'idle'
		cue.preWaitElapsed = 0
		cue.actionElapsed = 0
		cue.postWaitElapsed = 0
		cue.currentVolumeDb = cue.volumeDb
		cue.pauseAtTimeTriggered = false
		cue.heldAtLastFrame = false

		if (wasActive) {
			if (cue.type === 'video') {
				this.broadcastStageEvent({
					type: 'stop_video',
					cueId: cue.id,
					resetTime: Number(cue.startTime) || 0,
					targetScreens: cue.targetScreens || 'all',
				})
			} else if (cue.type === 'background') {
				this.broadcastStageEvent({
					type: 'clear_background',
					cueId: cue.id,
					targetScreens: cue.targetScreens || 'all',
				})
			}
		}
	}

	public triggerPanic(): void {
		const now = Date.now()
		const fadeTime = Number(this.config.panicFadeDuration) ?? 2.0

		if ((this.isPanicking && now - this.lastPanicTime < 3000) || fadeTime <= 0) {
			this.log('info', 'PANIC (Hard Cut): Stopping all cues immediately')
			this.isPanicking = false
			this.isPaused = false
			for (const c of this.cues) {
				this.stopCue(c)
			}
			this.broadcastState(false)
			this.syncCompanionState()
			return
		}

		this.log('info', `PANIC (Fade Out over ${fadeTime}s): Press Panic again to hard-cut`)
		this.lastPanicTime = now
		this.isPanicking = true
		this.panicElapsed = 0
		for (const c of this.getActiveCues()) {
			c.fadeStartVolumeDb = c.currentVolumeDb ?? c.volumeDb ?? 0
		}
	}

	public triggerPause(mode: 'toggle' | 'pause' | 'resume'): void {
		if (mode === 'toggle') {
			const anyIndividuallyPaused = this.cues.some((c) => c.state === 'paused')
			if (anyIndividuallyPaused && !this.isPaused) {
				this.isPaused = false
				for (const c of this.cues) {
					if (c.state === 'paused') {
						c.state = 'running'
						if (c.type === 'video') {
							this.broadcastStageEvent({
								type: 'resume_video',
								cueId: c.id,
								targetScreens: c.targetScreens || 'all',
							})
						}
					}
				}
				this.broadcastState(false)
				this.syncCompanionState()
				return
			}
			this.isPaused = !this.isPaused
		} else if (mode === 'pause') {
			this.isPaused = true
		} else {
			this.isPaused = false
		}

		for (const c of this.cues) {
			if (this.isPaused && (c.state === 'running' || c.state === 'prewait')) {
				c.state = 'paused'
				if (c.type === 'video') {
					this.broadcastStageEvent({
						type: 'pause_video',
						cueId: c.id,
						heldAtLastFrame: !!c.heldAtLastFrame,
						targetScreens: c.targetScreens || 'all',
					})
				}
			} else if (!this.isPaused && c.state === 'paused') {
				c.state = 'running'
				if (c.type === 'video') {
					this.broadcastStageEvent({
						type: 'resume_video',
						cueId: c.id,
						targetScreens: c.targetScreens || 'all',
					})
				}
			}
		}

		this.broadcastState(false)
		this.syncCompanionState()
	}

	public movePlayhead(direction: 'next' | 'prev' | 'top'): void {
		if (this.cues.length === 0) return
		if (direction === 'top') {
			this.standbyCueId = this.cues[0].id
		} else {
			const idx = this.cues.findIndex((c) => c.id === this.standbyCueId)
			if (direction === 'next') {
				const nextIdx = idx < this.cues.length - 1 ? idx + 1 : 0
				this.standbyCueId = this.cues[nextIdx].id
			} else if (direction === 'prev') {
				const prevIdx = idx > 0 ? idx - 1 : this.cues.length - 1
				this.standbyCueId = this.cues[prevIdx].id
			}
		}
		this.broadcastState(false)
		this.syncCompanionState()
	}

	public setPlayheadByQNumber(qNumber: string): void {
		const cue = this.cues.find((c) => c.qNumber === qNumber.trim())
		if (cue) {
			this.standbyCueId = cue.id
			this.broadcastState(false)
			this.syncCompanionState()
		}
	}

	public setMasterVolume(op: 'set' | 'delta', val: number): void {
		if (op === 'set') {
			this.masterVolumeDb = Math.max(-60, Math.min(12, val))
		} else {
			this.masterVolumeDb = Math.max(-60, Math.min(12, this.masterVolumeDb + val))
		}
		this.broadcastState(false)
		this.syncCompanionState()
	}

	private startTickLoop(): void {
		const dt = 0.05 // 50ms (20Hz)
		let tickCounter = 0

		this.tickTimer = setInterval(() => {
			if (this.isPaused) return

			const active = this.getActiveCues()
			if (active.length === 0) {
				this.isPanicking = false
				return
			}

			if (this.isPanicking) {
				const fadeDur = Math.max(0.2, Number(this.config.panicFadeDuration) || 2.0)
				this.panicElapsed += dt
				const t = Math.min(1, this.panicElapsed / fadeDur)
				for (const c of active) {
					const startDb = c.fadeStartVolumeDb ?? c.volumeDb ?? 0
					c.currentVolumeDb = startDb + (-60 - startDb) * t
					if (c.type === 'video') {
						this.broadcastStageEvent({
							type: 'video_opacity',
							cueId: c.id,
							opacity: this.computeVideoOpacity(c),
							targetScreens: c.targetScreens || 'all',
						})
					}
				}
				if (t >= 1) {
					this.isPanicking = false
					for (const c of active) this.stopCue(c)
				}
				this.broadcastState(false)
				this.syncCompanionState()
				return
			}

			let anyRunningTicked = false

			for (const cue of active) {
				if (cue.state === 'prewait') {
					anyRunningTicked = true
					cue.preWaitElapsed = (cue.preWaitElapsed || 0) + dt
					if (cue.preWaitElapsed >= cue.preWait) {
						this.beginCueAction(cue)
					}
				} else if (cue.state === 'running') {
					anyRunningTicked = true
					cue.actionElapsed = (cue.actionElapsed || 0) + dt

					// Check "Pause at Time" on media/timed cues
					const pauseAt = Number(cue.pauseAtTime) || 0
					if (pauseAt > 0 && !cue.pauseAtTimeTriggered && cue.actionElapsed >= pauseAt) {
						cue.actionElapsed = pauseAt
						cue.pauseAtTimeTriggered = true
						cue.state = 'paused'
						if (cue.type === 'video') {
							this.broadcastStageEvent({
								type: 'pause_video',
								cueId: cue.id,
								heldAtLastFrame: false,
								targetScreens: cue.targetScreens || 'all',
							})
						}
						this.log('info', `Cue Q ${cue.qNumber} (${cue.name}) auto-paused at ${pauseAt}s`)
						continue
					}

					// Handle Auto-Continue Post-Wait timer running alongside Action
					if (
						cue.continueMode === 'auto_continue' &&
						cue.postWait > 0 &&
						cue.postWaitElapsed !== undefined &&
						cue.postWaitElapsed < cue.postWait
					) {
						cue.postWaitElapsed += dt
						if (cue.postWaitElapsed >= cue.postWait) {
							this.fireNextSiblingCue(cue)
						}
					}

					// Handle Fade Cue live volume interpolation
					if (cue.type === 'fade' && cue.duration > 0) {
						const target = this.cues.find((c) => c.id === cue.targetCueId)
						if (target) {
							const progress = Math.min(1, cue.actionElapsed / cue.duration)
							const startDb = cue.fadeStartVolumeDb ?? target.volumeDb ?? 0
							target.currentVolumeDb = Number((startDb + (cue.volumeDb - startDb) * progress).toFixed(2))
							if (target.type === 'video') {
								this.broadcastStageEvent({
									type: 'video_opacity',
									cueId: target.id,
									opacity: this.computeVideoOpacity(target),
									targetScreens: target.targetScreens || 'all',
								})
							}
						}
					}

					// Handle Fade-In and Fade-Out envelope on Audio/Video cues
					const isLooping = cue.loopMode === 'infinite_loop' || cue.loop
					if ((cue.type === 'audio' || cue.type === 'video') && cue.duration > 0) {
						const fadeInDur = Number(cue.fadeIn) || 0
						const fadeOutDur = Number(cue.fadeOut) || 0
						const rem = cue.duration - cue.actionElapsed

						if (fadeInDur > 0 && cue.actionElapsed <= fadeInDur) {
							const fadeProg = Math.min(1, cue.actionElapsed / fadeInDur)
							cue.currentVolumeDb = Number((-60 + (cue.volumeDb - -60) * fadeProg).toFixed(2))
						} else if (!isLooping && fadeOutDur > 0 && rem <= fadeOutDur && rem >= 0) {
							const fadeProg = 1 - rem / fadeOutDur
							cue.currentVolumeDb = Number((cue.volumeDb + (-60 - cue.volumeDb) * fadeProg).toFixed(2))
						} else if (cue.currentVolumeDb === undefined) {
							cue.currentVolumeDb = cue.volumeDb
						}

						if (cue.type === 'video') {
							this.broadcastStageEvent({
								type: 'video_opacity',
								cueId: cue.id,
								opacity: this.computeVideoOpacity(cue),
								targetScreens: cue.targetScreens || 'all',
							})
						}
					}

					if (cue.duration > 0 && cue.actionElapsed >= cue.duration) {
						if (isLooping) {
							cue.actionElapsed = 0
							cue.pauseAtTimeTriggered = false
						} else if (cue.loopMode === 'pause_at_end' || cue.type === 'background') {
							cue.actionElapsed = cue.duration
							cue.heldAtLastFrame = true
							cue.state = 'paused'
							if (cue.type === 'video') {
								this.broadcastStageEvent({
									type: 'pause_video',
									cueId: cue.id,
									heldAtLastFrame: true,
									targetScreens: cue.targetScreens || 'all',
								})
							}
							if (cue.continueMode === 'auto_follow') {
								this.fireNextSiblingCue(cue)
							}
						} else {
							this.completeCueAction(cue)
						}
					}
				}
			}

			if (anyRunningTicked) {
				tickCounter++
				this.broadcastState(false)
				if (tickCounter % 2 === 0) {
					this.syncCompanionState()
				}
			}
		}, 50)
	}

	private executeCompanionButtonCue(cue: Cue): void {
		const host = ResolveCompanionHost(this.config.companionHost)
		const port = this.config.companionPort || 8000
		const action = cue.companionAction || 'press'
		const pathUrl = `/api/location/${cue.companionPage}/${cue.companionRow}/${cue.companionCol}/${action}`

		this.log('info', `Cue Q ${cue.qNumber} triggering Companion Button: ${host}:${port}${pathUrl}`)

		const fallbacks = [DetectLocalIpAddress(), '127.0.0.1'].filter((h, idx, arr) => h !== host && arr.indexOf(h) === idx)

		const sendRequest = (targetHost: string, remaining: string[]) => {
			const req = http.request({ hostname: targetHost, port, path: pathUrl, method: 'POST', timeout: 1500 }, (res) =>
				res.resume()
			)
			req.on('error', (err) => {
				if (remaining.length > 0) {
					sendRequest(remaining[0], remaining.slice(1))
				} else {
					this.log('warn', `Companion button trigger error: ${err.message}`)
				}
			})
			req.on('timeout', () => {
				req.destroy()
				if (remaining.length > 0) {
					sendRequest(remaining[0], remaining.slice(1))
				}
			})
			req.end()
		}

		sendRequest(host, fallbacks)
	}

	private executeNetworkCue(cue: Cue): void {
		if (!cue.networkUrl) return
		fetch(cue.networkUrl, {
			method: cue.networkMethod || 'POST',
			body: cue.networkMethod !== 'GET' && cue.networkBody ? cue.networkBody : undefined,
		}).catch((err) => this.log('warn', `Network cue error: ${err}`))
	}

	// =========================================================================
	// WEB SERVER & SSE REAL-TIME WORKSPACE
	// =========================================================================

	private async stopWebServer(): Promise<void> {
		for (const client of this.sseClients) {
			try {
				client.end()
			} catch {}
		}
		this.sseClients.clear()

		if (this.httpServer) {
			await new Promise<void>((resolve) => this.httpServer!.close(() => resolve()))
			this.httpServer = null
		}
	}

	private async startWebServer(): Promise<void> {
		await this.stopWebServer()
		const port = Number(this.config.webPort) || 8090

		this.httpServer = http.createServer((req, res) => {
			this.handleWebRequest(req, res)
		})

		this.httpServer.on('error', (err) => {
			this.log('error', `Cue Companion Web UI server error on port ${port}: ${err.message}`)
			this.updateStatus(InstanceStatus.ConnectionFailure, err.message)
		})

		this.httpServer.listen(port, '0.0.0.0', () => {
			const url = `http://${ResolveCompanionHost(this.config.companionHost)}:${port}`
			this.log('info', `Cue Companion Web Workspace live at ${url}`)
			this.updateStatus(InstanceStatus.Ok, `Ready (${url})`)
		})
	}

	private handleWebRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
		const urlObj = new URL(req.url || '/', 'http://localhost')
		const pathname = urlObj.pathname

		if (req.method === 'GET' && pathname === '/') {
			res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
			res.end(GetCueCompanionWebUiHtml())
			return
		}

		if (req.method === 'GET' && pathname === '/stage') {
			res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
			res.end(GetVideoStageHtml())
			return
		}

		if (req.method === 'GET' && pathname === '/api/projects') {
			res.writeHead(200, { 'Content-Type': 'application/json' })
			res.end(
				JSON.stringify({
					ok: true,
					projectName: this.projectName,
					projects: this.getSavedProjectsList(),
				})
			)
			return
		}

		if (req.method === 'GET' && pathname === '/api/project/export') {
			const payload = this.getSerializedWorkspacePayload()
			const safeBase = (this.projectName || 'cue-companion-show')
				.replace(/[^a-zA-Z0-9._-]/g, '_')
				.replace(/_+/g, '_')
			const downloadName = `${safeBase}.cueproj.json`
			res.writeHead(200, {
				'Content-Type': 'application/json; charset=utf-8',
				'Content-Disposition': `attachment; filename="${downloadName}"`,
			})
			res.end(JSON.stringify(payload, null, 2))
			return
		}

		if (req.method === 'GET' && pathname === '/api/screens') {
			this.refreshConnectedScreens(() => {
				res.writeHead(200, { 'Content-Type': 'application/json' })
				res.end(
					JSON.stringify({
						ok: true,
						screens: this.detectedDisplays,
						activeStageScreens: this.getActiveStageScreenIndices(),
					})
				)
			})
			return
		}

		if (req.method === 'GET' && pathname === '/api/events') {
			res.writeHead(200, {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				Connection: 'keep-alive',
				'Access-Control-Allow-Origin': '*',
			})
			this.sseClients.add(res)
			this.sendSseToClient(res, true)
			req.on('close', () => {
				this.sseClients.delete(res)
			})
			return
		}

		if (req.method === 'GET' && pathname.startsWith('/media/')) {
			const filename = path.basename(decodeURIComponent(pathname.slice('/media/'.length)))
			const filePath = path.join(this.mediaDir, filename)
			if (!fs.existsSync(filePath)) {
				res.writeHead(404)
				res.end('Not found')
				return
			}
			const stat = fs.statSync(filePath)
			const ext = path.extname(filename).toLowerCase()
			const mimeMap: Record<string, string> = {
				'.mp3': 'audio/mpeg',
				'.wav': 'audio/wav',
				'.ogg': 'audio/ogg',
				'.flac': 'audio/flac',
				'.m4a': 'audio/mp4',
				'.mp4': 'video/mp4',
				'.webm': 'video/webm',
			}
			const contentType = mimeMap[ext] || 'application/octet-stream'
			const range = req.headers.range
			if (range) {
				const parts = range.replace(/bytes=/, '').split('-')
				const start = parseInt(parts[0], 10) || 0
				const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1
				const clampedStart = Math.max(0, Math.min(start, stat.size - 1))
				const clampedEnd = Math.max(clampedStart, Math.min(end, stat.size - 1))
				const chunkSize = clampedEnd - clampedStart + 1
				res.writeHead(206, {
					'Content-Range': `bytes ${clampedStart}-${clampedEnd}/${stat.size}`,
					'Accept-Ranges': 'bytes',
					'Content-Length': chunkSize,
					'Content-Type': contentType,
					'Access-Control-Allow-Origin': '*',
				})
				const stream = fs.createReadStream(filePath, { start: clampedStart, end: clampedEnd })
				req.on('close', () => stream.destroy())
				stream.pipe(res)
			} else {
				res.writeHead(200, {
					'Content-Type': contentType,
					'Content-Length': stat.size,
					'Accept-Ranges': 'bytes',
					'Access-Control-Allow-Origin': '*',
				})
				const stream = fs.createReadStream(filePath)
				req.on('close', () => stream.destroy())
				stream.pipe(res)
			}
			return
		}

		if (req.method === 'POST' && pathname === '/api/media/upload') {
			const rawName = urlObj.searchParams.get('filename') || `media_${Date.now()}.mp3`
			const safeName = path.basename(rawName).replace(/[^a-zA-Z0-9._-]/g, '_')
			const destPath = path.join(this.mediaDir, safeName)
			const writeStream = fs.createWriteStream(destPath)
			req.pipe(writeStream)
			writeStream.on('finish', () => {
				res.writeHead(200, { 'Content-Type': 'application/json' })
				res.end(JSON.stringify({ ok: true, filename: safeName }))
				this.broadcastState(true)
			})
			return
		}

		if (req.method === 'POST' && pathname === '/api/stage/log') {
			let bodyStr = ''
			req.on('data', (chunk) => (bodyStr += chunk.toString('utf8')))
			req.on('end', () => {
				this.log('info', `[STAGE WINDOW] ${bodyStr}`)
				res.writeHead(200)
				res.end('ok')
			})
			return
		}

		if (req.method === 'POST' && pathname.startsWith('/api/')) {
			let bodyStr = ''
			req.on('data', (chunk) => {
				bodyStr += chunk.toString('utf8')
			})
			req.on('end', () => {
				try {
					const body = bodyStr ? JSON.parse(bodyStr) : {}
					const result = this.handleApiCommand(pathname, body)
					res.writeHead(200, { 'Content-Type': 'application/json' })
					res.end(JSON.stringify({ ok: true, ...(result || {}) }))
				} catch (err) {
					res.writeHead(400, { 'Content-Type': 'application/json' })
					res.end(JSON.stringify({ error: String(err) }))
				}
			})
			return
		}

		res.writeHead(404)
		res.end('Not found')
	}

	private handleApiCommand(pathname: string, body: Record<string, any>): Record<string, any> | void {
		if (pathname === '/api/transport') {
			const action = body.action
			if (action === 'go') this.triggerGo()
			else if (action === 'panic') this.triggerPanic()
			else if (action === 'pause_toggle') this.triggerPause('toggle')
			else if (action === 'next') this.movePlayhead('next')
			else if (action === 'prev') this.movePlayhead('prev')
			else if (action === 'master_vol') this.setMasterVolume('set', Number(body.db))
			return
		}

		if (pathname === '/api/standby') {
			this.standbyCueId = body.cueId || null
			this.saveWorkspaceToDisk()
			this.broadcastState(false)
			this.syncCompanionState()
			return
		}

		if (pathname === '/api/cue/fire') {
			const cue = this.cues.find((c) => c.id === body.cueId)
			if (cue) this.fireCue(cue)
			this.broadcastState(false)
			this.syncCompanionState()
			return
		}

		if (pathname === '/api/cue/pause') {
			const cue = this.cues.find((c) => c.id === body.cueId)
			if (cue) {
				if (cue.state === 'running' || cue.state === 'prewait') {
					cue.state = 'paused'
					if (cue.type === 'video') {
						this.broadcastStageEvent({
							type: 'pause_video',
							cueId: cue.id,
							heldAtLastFrame: !!cue.heldAtLastFrame,
							targetScreens: cue.targetScreens || 'all',
						})
					}
				} else if (cue.state === 'paused') {
					cue.state = 'running'
					if (cue.type === 'video') {
						this.broadcastStageEvent({
							type: 'resume_video',
							cueId: cue.id,
							targetScreens: cue.targetScreens || 'all',
						})
					}
				}
			}
			this.broadcastState(false)
			this.syncCompanionState()
			return
		}

		if (pathname === '/api/cue/stop') {
			const cue = this.cues.find((c) => c.id === body.cueId)
			if (cue) this.stopCue(cue)
			this.broadcastState(false)
			this.syncCompanionState()
			return
		}

		if (pathname === '/api/cue/update') {
			const cue = this.cues.find((c) => c.id === body.cueId)
			if (cue && body.updates) {
				Object.assign(cue, body.updates)
				if (body.updates.volumeDb !== undefined) {
					cue.currentVolumeDb = Number(body.updates.volumeDb)
				}
				if (body.updates.loopMode !== undefined) {
					cue.loop = body.updates.loopMode === 'infinite_loop'
				}
				if (body.updates.startTime !== undefined || body.updates.endTime !== undefined) {
					const st = Math.max(0, Number(cue.startTime) || 0)
					const et = Math.max(st + 0.1, Number(cue.endTime) || st + 1)
					cue.startTime = Number(st.toFixed(2))
					cue.endTime = Number(et.toFixed(2))
					cue.duration = Number((cue.endTime - cue.startTime).toFixed(2))
				}
				if (body.updates.pauseAtTime !== undefined) {
					cue.pauseAtTimeTriggered = false
				}
				this.saveWorkspaceToDisk()
				this.broadcastState(true)
				this.syncCompanionState()
			}
			return
		}

		if (pathname === '/api/cue/seek') {
			const cue = this.cues.find((c) => c.id === body.cueId)
			if (cue) {
				cue.actionElapsed = Math.max(0, Math.min(cue.duration || 0, Number(body.elapsed) || 0))
				cue.heldAtLastFrame = false
				this.broadcastState(false)
				this.syncCompanionState()
			}
			return
		}

		if (pathname === '/api/cue/add') {
			const type = (body.type || 'audio') as CueType
			const selectedIds: string[] = Array.isArray(body.selectedCueIds) ? body.selectedCueIds : []
			const selectedCue = this.cues.find((c) => c.id === body.afterCueId) || (selectedIds.length > 0 ? this.cues.find((c) => c.id === selectedIds[0]) : undefined)

			// If adding a GROUP cue while multiple cues are selected, wrap all selected cues into the new Group!
			if (type === 'group' && selectedIds.length > 1) {
				const firstIdx = this.cues.findIndex((c) => selectedIds.includes(c.id))
				const groupId = `cue-group-${Date.now()}`
				const groupQNum = String(this.cues.length + 1)
				const groupCue: Cue = {
					id: groupId,
					qNumber: groupQNum,
					name: `Group (${selectedIds.length} Cues)`,
					type: 'group',
					color: 'blue',
					notes: '',
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
					state: 'idle',
				}

				if (firstIdx >= 0) {
					this.cues.splice(firstIdx, 0, groupCue)
				} else {
					this.cues.push(groupCue)
				}

				for (const c of this.cues) {
					if (selectedIds.includes(c.id) && c.id !== groupId) {
						c.parentId = groupId
					}
				}

				this.saveWorkspaceToDisk()
				this.broadcastState(true)
				this.syncCompanionState()
				return { createdCueId: groupId }
			}

			const nextNum = String(this.cues.length + 1)
			const isTargetingType = type === 'stop' || type === 'fade' || type === 'goto'
			const autoTargetId = isTargetingType && selectedCue ? selectedCue.id : ''

			let defaultName = `New ${type.charAt(0).toUpperCase() + type.slice(1)} Cue`
			if (type === 'background') {
				defaultName = 'Stage Background Look'
			} else if (type === 'stop' && selectedCue) {
				defaultName = `Stop Q ${selectedCue.qNumber}: ${selectedCue.name}`
			} else if (type === 'fade' && selectedCue) {
				defaultName = `Fade Q ${selectedCue.qNumber}: ${selectedCue.name}`
			} else if (type === 'goto' && selectedCue) {
				defaultName = `Goto Q ${selectedCue.qNumber}: ${selectedCue.name}`
			}

			const defaultDur =
				type === 'companion' || type === 'stop' || type === 'goto'
					? 0.2
					: type === 'background'
					? 0.5
					: type === 'fade'
					? 3.0
					: 5.0

			const newCue: Cue = {
				id: `cue-${Date.now()}`,
				qNumber: nextNum,
				name: defaultName,
				type,
				color:
					type === 'audio'
						? 'green'
						: type === 'background'
						? 'blue'
						: type === 'companion'
						? 'purple'
						: type === 'fade'
						? 'orange'
						: type === 'stop'
						? 'red'
						: 'none',
				notes: '',
				armed: true,
				parentId: selectedCue?.parentId || null,
				groupMode: type === 'group' ? 'simultaneous' : undefined,
				expanded: type === 'group' ? true : undefined,
				preWait: 0,
				duration: defaultDur,
				sourceDuration: defaultDur,
				postWait: 0,
				continueMode: 'none',
				pauseAtTime: 0,
				filePath: type === 'audio' ? 'synth:chime' : '',
				volumeDb: type === 'fade' ? -60 : 0,
				pan: 0,
				startTime: 0,
				endTime: defaultDur,
				loop: false,
				loopMode: type === 'background' ? 'pause_at_end' : 'one_shot',
				fadeIn: 0,
				fadeOut: 0,
				bgStyle: 'linear-gradient',
				bgColor1: '#0f172a',
				bgColor2: '#1e3a8a',
				bgAngle: 135,
				targetScreens: 'all',
				targetCueId: autoTargetId,
				stopTargetWhenDone: type === 'fade',
				companionPage: 1,
				companionRow: 0,
				companionCol: 0,
				companionAction: 'press',
				networkUrl: '',
				networkMethod: 'POST',
				networkBody: '',
				state: 'idle',
			}

			const afterIdx = this.cues.findIndex((c) => c.id === body.afterCueId)
			if (afterIdx >= 0) {
				this.cues.splice(afterIdx + 1, 0, newCue)
			} else {
				this.cues.push(newCue)
			}
			if (!this.standbyCueId) this.standbyCueId = newCue.id
			this.saveWorkspaceToDisk()
			this.broadcastState(true)
			this.syncCompanionState()
			return { createdCueId: newCue.id }
		}

		if (pathname === '/api/cue/move') {
			const ids: string[] = Array.isArray(body.cueIds) && body.cueIds.length > 0 ? body.cueIds : body.cueId ? [body.cueId] : []
			const dir = Number(body.direction) || 0
			if (ids.length === 0 || dir === 0) return

			if (dir < 0) {
				for (let i = 1; i < this.cues.length; i++) {
					if (ids.includes(this.cues[i].id) && !ids.includes(this.cues[i - 1].id)) {
						const temp = this.cues[i - 1]
						this.cues[i - 1] = this.cues[i]
						this.cues[i] = temp
					}
				}
			} else {
				for (let i = this.cues.length - 2; i >= 0; i--) {
					if (ids.includes(this.cues[i].id) && !ids.includes(this.cues[i + 1].id)) {
						const temp = this.cues[i + 1]
						this.cues[i + 1] = this.cues[i]
						this.cues[i] = temp
					}
				}
			}
			this.saveWorkspaceToDisk()
			this.broadcastState(true)
			return
		}

		if (pathname === '/api/cue/duplicate') {
			const ids: string[] = Array.isArray(body.cueIds) && body.cueIds.length > 0 ? body.cueIds : body.cueId ? [body.cueId] : []
			let insertIdx = -1
			const copies: Cue[] = []
			this.cues.forEach((c, idx) => {
				if (ids.includes(c.id)) {
					insertIdx = idx
					copies.push({
						...c,
						id: `cue-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
						qNumber: `${c.qNumber}.1`,
						name: `${c.name} (Copy)`,
						state: 'idle',
					})
				}
			})
			if (insertIdx >= 0 && copies.length > 0) {
				this.cues.splice(insertIdx + 1, 0, ...copies)
				this.saveWorkspaceToDisk()
				this.broadcastState(true)
			}
			return
		}

		if (pathname === '/api/cue/delete') {
			const ids: string[] = Array.isArray(body.cueIds) && body.cueIds.length > 0 ? body.cueIds : body.cueId ? [body.cueId] : []
			if (ids.length === 0) return

			const firstDeletedIdx = this.cues.findIndex((c) => ids.includes(c.id))
			this.cues = this.cues.filter((c) => !ids.includes(c.id))

			if (this.standbyCueId && ids.includes(this.standbyCueId)) {
				this.standbyCueId = this.cues[Math.min(firstDeletedIdx, this.cues.length - 1)]?.id || this.cues[0]?.id || null
			}
			this.saveWorkspaceToDisk()
			this.broadcastState(true)
			this.syncCompanionState()
			return
		}

		if (pathname === '/api/cue/batch_group') {
			const ids: string[] = Array.isArray(body.cueIds) ? body.cueIds : []
			const parentId: string | null = body.parentId || null
			for (const c of this.cues) {
				if (ids.includes(c.id) && c.id !== parentId) {
					c.parentId = parentId
				}
			}
			this.saveWorkspaceToDisk()
			this.broadcastState(true)
			return
		}

		if (pathname === '/api/stage/broadcast') {
			if (body && body.message) {
				this.broadcastStageEvent(body.message)
			}
			return
		}

		if (pathname === '/api/stage/launch') {
			const screenIndex = Number(body.screenIndex) || 0
			const fullscreen = body.fullscreen !== false
			this.refreshConnectedScreens(() => {
				this.launchNativeStageWindow(screenIndex, fullscreen)
				this.broadcastState(false)
			})
			this.activeStageSet.add(screenIndex)
			return {
				launched: true,
				screenIndex,
				fullscreen,
				activeStageScreens: this.getActiveStageScreenIndices(),
			}
		}

		if (pathname === '/api/stage/close') {
			const screenIndex = Number(body.screenIndex) || 0
			this.closeNativeStageWindow(screenIndex)
			this.broadcastState(false)
			return {
				screenIndex,
				activeStageScreens: this.getActiveStageScreenIndices(),
			}
		}

		if (pathname === '/api/project/save') {
			const name = String(body.projectName || this.projectName || 'Untitled Show').trim() || 'Untitled Show'
			this.projectName = name
			this.saveWorkspaceToDisk()
			const safeFile = name.replace(/[^a-zA-Z0-9._ -]/g, '_').trim() + '.cueproj.json'
			const projPath = path.join(this.projectsDir, safeFile)
			const payload = this.getSerializedWorkspacePayload(name)
			fs.writeFileSync(projPath, JSON.stringify(payload, null, 2), 'utf8')
			this.broadcastState(true)
			return {
				projectName: this.projectName,
				filename: safeFile,
				projects: this.getSavedProjectsList(),
			}
		}

		if (pathname === '/api/project/open') {
			let parsed: any = null
			if (body.projectData && typeof body.projectData === 'object') {
				parsed = body.projectData
			} else if (body.filename) {
				const safeFile = path.basename(String(body.filename))
				const projPath = path.join(this.projectsDir, safeFile)
				if (fs.existsSync(projPath)) {
					parsed = JSON.parse(fs.readFileSync(projPath, 'utf8'))
				}
			}
			if (parsed && Array.isArray(parsed.cues)) {
				for (const c of this.cues) {
					this.stopCue(c)
				}
				this.projectName = String(parsed.projectName || body.projectName || 'Imported Show').trim()
				this.cues = parsed.cues.map((c: Cue) => this.normalizeLoadedCue(c))
				this.standbyCueId = parsed.standbyCueId || this.cues[0]?.id || null
				if (typeof parsed.masterVolumeDb === 'number') {
					this.masterVolumeDb = parsed.masterVolumeDb
				}
				this.saveWorkspaceToDisk()
				this.broadcastState(true)
				this.syncCompanionState()
				return {
					projectName: this.projectName,
					projects: this.getSavedProjectsList(),
				}
			}
			throw new Error('Invalid project file or no cues found')
		}

		if (pathname === '/api/project/new') {
			for (const c of this.cues) {
				this.stopCue(c)
			}
			const mode = body.template === 'demo' ? 'demo' : 'empty'
			this.projectName = String(body.projectName || (mode === 'demo' ? 'Demo Show' : 'Untitled Show')).trim()
			this.cues = mode === 'demo' ? CreateDefaultDemoCues().map((c) => this.normalizeLoadedCue(c)) : []
			this.standbyCueId = this.cues[0]?.id || null
			this.saveWorkspaceToDisk()
			this.broadcastState(true)
			this.syncCompanionState()
			return {
				projectName: this.projectName,
				projects: this.getSavedProjectsList(),
			}
		}

		if (pathname === '/api/project/delete') {
			if (body.filename) {
				const safeFile = path.basename(String(body.filename))
				const projPath = path.join(this.projectsDir, safeFile)
				if (fs.existsSync(projPath)) {
					fs.unlinkSync(projPath)
				}
			}
			return {
				projects: this.getSavedProjectsList(),
			}
		}
	}

	private activeStageSet: Set<number> = new Set()

	public getActiveStageScreenIndices(): number[] {
		return Array.from(this.activeStageSet)
	}

	private refreshConnectedScreens(done?: () => void): void {
		if (process.platform !== 'win32') {
			if (done) done()
			return
		}
		const psScript = `Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public class DpiV2 { [DllImport("user32.dll")] public static extern bool SetProcessDpiAwarenessContext(int f); }'; [DpiV2]::SetProcessDpiAwarenessContext(-4) | Out-Null; Add-Type -AssemblyName System.Windows.Forms; $screens = @([System.Windows.Forms.Screen]::AllScreens | ForEach-Object { @{ DeviceName=$_.DeviceName; Primary=$_.Primary; BoundsX=$_.Bounds.X; BoundsY=$_.Bounds.Y; BoundsW=$_.Bounds.Width; BoundsH=$_.Bounds.Height } }); ConvertTo-Json -InputObject $screens -Compress`
		const encoded = Buffer.from(psScript, 'utf16le').toString('base64')
		execFile(
			'powershell.exe',
			['-NoProfile', '-NonInteractive', '-EncodedCommand', encoded],
			{ timeout: 4500 },
			(err, stdout) => {
				if (!err && stdout && stdout.trim()) {
					try {
						const parsed = JSON.parse(stdout.trim())
						const arr = Array.isArray(parsed) ? parsed : [parsed]
						if (arr.length > 0) {
							// Sort so primary is first, or by BoundsX
							arr.sort((a, b) => {
								if (a.Primary && !b.Primary) return -1
								if (!a.Primary && b.Primary) return 1
								return (Number(a.BoundsX) || 0) - (Number(b.BoundsX) || 0)
							})
							this.detectedDisplays = arr.map((s, idx) => {
								const cleanDev = String(s.DeviceName || `DISPLAY${idx + 1}`).replace('\\\\.\\', '')
								const w = Number(s.BoundsW) || 1920
								const h = Number(s.BoundsH) || 1080
								const isPrim = !!s.Primary
								return {
									index: idx,
									deviceName: String(s.DeviceName || `\\\\.\\DISPLAY${idx + 1}`),
									label: `${cleanDev} (${w}×${h})${isPrim ? ' [Primary]' : ' [Extended]'}`,
									left: Number(s.BoundsX) || 0,
									top: Number(s.BoundsY) || 0,
									width: w,
									height: h,
									isPrimary: isPrim,
								}
							})
						}
					} catch (parseErr) {
						this.log('debug', `Screen parse fallback: ${parseErr}`)
					}
				}
				if (done) done()
			}
		)
	}

	private findChromiumExecutable(): string | null {
		const candidates = [
			'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
			'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
			'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
			'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
			process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Google\\Chrome\\Application\\chrome.exe') : '',
		].filter(Boolean)

		for (const candidate of candidates) {
			if (fs.existsSync(candidate)) {
				return candidate
			}
		}
		return null
	}

	private closeNativeStageWindow(screenIndex: number): void {
		this.activeStageSet.delete(screenIndex)
		const existing = this.stageProcesses.get(screenIndex)
		if (existing) {
			try {
				if (existing.pid && process.platform === 'win32') {
					execFile('taskkill', ['/PID', String(existing.pid), '/T', '/F'], () => {})
				} else {
					existing.kill()
				}
			} catch {}
			this.stageProcesses.delete(screenIndex)
		}
		if (process.platform === 'win32') {
			const psKill = `Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*cue-companion-stage-screen-${screenIndex}*" -and ($_.Name -like "*msedge*" -or $_.Name -like "*chrome*") } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }`
			const encodedKill = Buffer.from(psKill, 'utf16le').toString('base64')
			execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-EncodedCommand', encodedKill], { timeout: 3000 }, () => {})
		}
	}

	private launchNativeStageWindow(screenIndex: number, fullscreen: boolean): boolean {
		const exe = this.findChromiumExecutable()
		if (!exe) {
			this.log('warn', 'No Edge/Chrome executable found for native multi-screen stage launch')
			return false
		}

		// Cancel any still-running launcher script for this screen index (without spawning an async killer that races the new window)
		const existingLauncher = this.stageProcesses.get(screenIndex)
		if (existingLauncher) {
			try {
				existingLauncher.kill()
			} catch {}
			this.stageProcesses.delete(screenIndex)
		}
		this.activeStageSet.add(screenIndex)

		const display = this.detectedDisplays.find((d) => d.index === screenIndex) ||
			this.detectedDisplays[0] || {
				index: screenIndex,
				left: screenIndex * 1920,
				top: 0,
				width: 1920,
				height: 1080,
			}

		const w = fullscreen ? display.width : Math.min(1280, Math.round(display.width * 0.8))
		const h = fullscreen ? display.height : Math.min(720, Math.round(display.height * 0.8))
		const x = fullscreen ? display.left : display.left + Math.round((display.width - w) / 2)
		const y = fullscreen ? display.top : display.top + Math.round((display.height - h) / 2)

		const port = Number(this.config.webPort) || 8090
		const stageUrl = `http://127.0.0.1:${port}/stage?screen=${screenIndex}&fs=${fullscreen ? '1' : '0'}`
		const profileDir = path.join(os.tmpdir(), `cue-companion-stage-screen-${screenIndex}`)
		const winTitle = `Cue Companion Stage Output - Screen ${screenIndex + 1}`

		const cliArgs = [
			`--user-data-dir="${profileDir}"`,
			`--app="${stageUrl}"`,
			`--window-position=${x},${y}`,
			`--window-size=${w},${h}`,
			'--autoplay-policy=no-user-gesture-required',
			'--disable-background-media-suspend',
			'--disable-backgrounding-occluded-windows',
			'--disable-renderer-backgrounding',
			'--disable-features=CalculateNativeWinOcclusion,PreloadMediaEngagementData,MediaEngagementBypassAutoplayPolicies',
			'--no-first-run',
			'--no-default-browser-check',
			'--disable-session-crashed-bubble',
			'--disable-infobars',
		]
		const argStr = cliArgs.join(' ')

		const psLaunch = `
Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*cue-companion-stage-screen-${screenIndex}*" -and ($_.Name -like "*msedge*" -or $_.Name -like "*chrome*") } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
Start-Sleep -Milliseconds 150
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class StageWin32 {
    [DllImport("user32.dll")] public static extern bool SetProcessDpiAwarenessContext(int dpiFlag);
    [DllImport("user32.dll")] public static extern int GetWindowLong(IntPtr hWnd, int nIndex);
    [DllImport("user32.dll")] public static extern int SetWindowLong(IntPtr hWnd, int nIndex, int dwNewLong);
    [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
    [StructLayout(LayoutKind.Sequential)] public struct RECT { public int Left; public int Top; public int Right; public int Bottom; }
    [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
}
"@
[StageWin32]::SetProcessDpiAwarenessContext(-4) | Out-Null
Start-Process -FilePath '${exe}' -ArgumentList '${argStr}'
for ($attempt = 0; $attempt -lt 25; $attempt++) {
    Start-Sleep -Milliseconds 200
    $procs = Get-Process | Where-Object { $_.MainWindowTitle -like "*${winTitle}*" }
    if ($procs) {
        foreach ($p in $procs) {
            $hwnd = $p.MainWindowHandle
            if ($hwnd -ne 0) {
                [StageWin32]::ShowWindow($hwnd, 9) | Out-Null
                [StageWin32]::ShowWindow($hwnd, 5) | Out-Null
                [StageWin32]::SetForegroundWindow($hwnd) | Out-Null
                if ($${fullscreen ? 'true' : 'false'}) {
                    $style = [StageWin32]::GetWindowLong($hwnd, -16)
                    $borderless = $style -band (-bnot 0x00CF0000)
                    [StageWin32]::SetWindowLong($hwnd, -16, $borderless) | Out-Null
                }
                [StageWin32]::SetWindowPos($hwnd, [IntPtr](-1), ${x}, ${y}, ${w}, ${h}, 0x0060) | Out-Null
                $r = New-Object StageWin32+RECT
                [StageWin32]::GetWindowRect($hwnd, [ref]$r) | Out-Null
                Write-Output "Matched Window: PID=$($p.Id) hwnd=$hwnd Title='$($p.MainWindowTitle)' Rect=($($r.Left),$($r.Top) $($r.Right - $r.Left)x$($r.Bottom - $r.Top))"
            }
        }
        break
    }
}
Write-Output "Loop finished at attempt $attempt"
`
		const encodedLaunch = Buffer.from(psLaunch, 'utf16le').toString('base64')

		try {
			const child = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-EncodedCommand', encodedLaunch], {
				detached: false,
				stdio: ['ignore', 'pipe', 'ignore'],
			})
			child.stdout.on('data', (d) => {
				const msg = d.toString().trim()
				if (msg) this.log('info', `[StageLaunch] ${msg}`)
			})
			this.stageProcesses.set(screenIndex, child)

			this.log(
				'info',
				`Launched Stage Output on Screen ${screenIndex + 1} (${x},${y} ${w}x${h}, fullscreen=${fullscreen})`
			)
			return true
		} catch (err) {
			this.log('error', `Failed to spawn native stage window: ${err}`)
			return false
		}
	}

	private broadcastStageEvent(stageEvent: Record<string, any>): void {
		const payload = JSON.stringify({ stageEvent })
		for (const client of this.sseClients) {
			try {
				client.write(`data: ${payload}\n\n`)
			} catch {
				this.sseClients.delete(client)
			}
		}
	}

	private sendSseToClient(client: http.ServerResponse, fullRefresh: boolean): void {
		const payload = JSON.stringify({
			projectName: this.projectName,
			cues: this.cues,
			mediaFiles: this.getMediaFiles(),
			standbyCueId: this.standbyCueId,
			isPaused: this.isPaused,
			masterVolumeDb: this.masterVolumeDb,
			screens: this.detectedDisplays,
			activeStageScreens: this.getActiveStageScreenIndices(),
			fullRefresh,
		})
		client.write(`data: ${payload}\n\n`)

		if (fullRefresh) {
			const activeBg = [...this.cues]
				.reverse()
				.find((c) => c.type === 'background' && (c.state === 'running' || c.state === 'paused'))
			if (activeBg) {
				const bgEvt = JSON.stringify({
					stageEvent: {
						type: 'set_background',
						cueId: activeBg.id,
						css: this.computeBackgroundCss(activeBg),
						fadeIn: 0,
						targetScreens: activeBg.targetScreens || 'all',
					},
				})
				client.write(`data: ${bgEvt}\n\n`)
			}

			const activeVid = [...this.cues]
				.reverse()
				.find((c) => c.type === 'video' && (c.state === 'running' || c.state === 'paused'))
			if (activeVid && activeVid.filePath && !activeVid.filePath.startsWith('synth:')) {
				const fp = activeVid.filePath
				const url = fp.startsWith('http') || fp.startsWith('/') ? fp : `/media/${encodeURIComponent(fp)}`
				const startSec = Number(activeVid.startTime) || 0
				const endSec = Number(activeVid.endTime) || Number(activeVid.duration) || 0
				const curTime = startSec + (Number(activeVid.actionElapsed) || 0)
				const vidEvt = JSON.stringify({
					stageEvent: {
						type: 'play_video',
						cueId: activeVid.id,
						url,
						startTime: startSec,
						currentTime: curTime,
						endTime: endSec,
						duration: Number(activeVid.duration) || endSec - startSec || 5,
						fadeIn: Number(activeVid.fadeIn) || 0,
						fadeOut: Number(activeVid.fadeOut) || 0,
						opacity: this.computeVideoOpacity(activeVid),
						loop: activeVid.loopMode === 'infinite_loop' || !!activeVid.loop,
						pauseAtEnd: activeVid.loopMode === 'pause_at_end',
						paused: activeVid.state === 'paused',
						volume: 0,
						targetScreens: activeVid.targetScreens || 'all',
					},
				})
				client.write(`data: ${vidEvt}\n\n`)
			}
		}
	}

	private broadcastState(fullRefresh: boolean): void {
		for (const client of this.sseClients) {
			try {
				this.sendSseToClient(client, fullRefresh)
			} catch {
				this.sseClients.delete(client)
			}
		}
	}

	// =========================================================================
	// COMPANION VARIABLES & FEEDBACK SYNC
	// =========================================================================

	private formatClock(sec: number): string {
		const s = Math.max(0, sec)
		const m = Math.floor(s / 60)
		const rem = Math.floor(s % 60)
		const d = Math.floor((s - Math.floor(s)) * 10)
		return `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}.${d}`
	}

	private syncCompanionState(): void {
		const standby = this.getStandbyCue()
		const active = this.getActiveCues()
		const primary = active.find((c) => c.state === 'running') || active[0]

		const elapsed = primary ? primary.actionElapsed || 0 : 0
		const remaining = primary ? Math.max(0, (primary.duration || 0) - elapsed) : 0
		const pct = primary && primary.duration > 0 ? Math.min(100, Math.round((elapsed / primary.duration) * 100)) : 0

		const port = Number(this.config.webPort) || 8090
		const url = `http://${ResolveCompanionHost(this.config.companionHost)}:${port}`

		this.setVariableValues({
			next_cue_num: standby ? standby.qNumber : '-',
			next_cue_name: standby ? standby.name : 'End of List',
			next_cue_type: standby ? standby.type : 'none',
			next_cue_notes: standby ? standby.notes : '',
			running_cue_num: primary ? primary.qNumber : '-',
			running_cue_name: primary ? primary.name : 'Idle',
			running_elapsed: primary ? this.formatClock(elapsed) : '00:00.0',
			running_remaining: primary ? `-${this.formatClock(remaining)}` : '00:00.0',
			running_progress_pct: `${pct}%`,
			active_count: active.length,
			is_running: active.length > 0 && !this.isPaused,
			is_paused: this.isPaused,
			master_volume_db: `${this.masterVolumeDb} dB`,
			webui_url: url,
		})

		this.checkFeedbacks('any_running', 'is_paused', 'cue_running', 'cue_standby', 'time_remaining_warning')
	}
}

runEntrypoint(CueCompanionInstance, [])
