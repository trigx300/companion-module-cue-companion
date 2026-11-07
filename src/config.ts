import { SomeCompanionConfigField } from '@companion-module/base'
import os from 'os'

export function DetectLocalIpAddress(): string {
	const interfaces = os.networkInterfaces()
	for (const name of Object.keys(interfaces)) {
		const ifaceList = interfaces[name]
		if (!ifaceList) continue
		for (const iface of ifaceList) {
			if (iface.family === 'IPv4' && !iface.internal && !iface.address.startsWith('169.254.')) {
				return iface.address
			}
		}
	}
	return '127.0.0.1'
}

export function ResolveCompanionHost(configuredHost?: string): string {
	const raw = (configuredHost || '').trim().toLowerCase()
	if (!raw || raw === 'auto' || raw === '10.101.10.100') {
		return DetectLocalIpAddress()
	}
	return configuredHost!.trim()
}

export interface CueCompanionConfig {
	webPort: number
	companionHost: string
	companionPort: number
	panicFadeDuration: number
	autoAdvancePlayhead: boolean
}

export function GetConfigFields(config?: Partial<CueCompanionConfig>): SomeCompanionConfigField[] {
	const detectedIp = DetectLocalIpAddress()
	const host = ResolveCompanionHost(config?.companionHost)
	const port = config?.webPort || 8090
	const uiUrl = `http://${host}:${port}`

	const btnSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="235" height="40" viewBox="0 0 235 40">
		<defs>
			<linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0%" stop-color="#24c95c"/>
				<stop offset="100%" stop-color="#13883b"/>
			</linearGradient>
		</defs>
		<rect x="1" y="1" width="233" height="38" rx="7" fill="url(#g)" stroke="#2ee66b" stroke-width="1.5"/>
		<text x="117.5" y="25" fill="#ffffff" font-family="Segoe UI, Arial, sans-serif" font-size="14" font-weight="bold" text-anchor="middle">🎬 Open Cue Companion UI ↗</text>
	</svg>`
	const btnDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(btnSvg)}`

	return [
		{
			type: 'static-text',
			id: 'info',
			width: 12,
			label: 'Cue Companion Workspace',
			value: `<a href="${uiUrl}" target="_blank" rel="noopener noreferrer"><img src="${btnDataUri}" alt="Open Cue Companion UI" width="235" height="40" /></a>`,
		},
		{
			type: 'number',
			id: 'webPort',
			label: 'Cue Companion Web Workspace Port (Default: 8090)',
			width: 6,
			default: 8090,
			min: 1024,
			max: 65535,
		},
		{
			type: 'number',
			id: 'panicFadeDuration',
			label: 'Panic Fade-Out Time (seconds)',
			width: 6,
			default: 2.0,
			min: 0,
			max: 15,
		},
		{
			type: 'textinput',
			id: 'companionHost',
			label: `Companion Host IP (Auto-detected: ${detectedIp} — edit to override)`,
			width: 6,
			default: detectedIp,
		},
		{
			type: 'number',
			id: 'companionPort',
			label: 'Companion HTTP Port (Default: 8000)',
			width: 6,
			default: 8000,
			min: 1,
			max: 65535,
		},
		{
			type: 'checkbox',
			id: 'autoAdvancePlayhead',
			label: 'Automatically advance Standby Playhead to next cue on GO',
			width: 12,
			default: true,
		},
	]
}

