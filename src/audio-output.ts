import { execFileSync } from 'child_process'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

/**
 * Playback devices on the computer running Companion.
 * The workspace may be opened from another machine, so this never asks
 * the operator's browser for its own sound card.
 */

export type AudioKind = 'default' | 'hdmi' | 'trs' | 'usb' | 'speakers' | 'bluetooth' | 'other'
export type AudioBackend = 'default' | 'wasapi' | 'coreaudio' | 'pipewire' | 'pulse' | 'alsa'

export interface AudioOutput {
	id: string
	label: string
	detail: string
	kind: AudioKind
	backend: AudioBackend
	token: string
	isSystemDefault: boolean
	offline?: boolean
}

export interface AudioSnapshot {
	ok: boolean
	message: string
	outputs: AudioOutput[]
	selectedId: string
	relaunchKiosk: boolean
}

export interface BrowserAudioDevice {
	deviceId: string
	label: string
}

const CARD_FILE = '/tmp/cue-audio-card'
const ASOUND_FILE = '/tmp/cue-asound.conf'

const WIN_PS1 = String.raw`
param([string]$Mode, [string]$DeviceId)
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -TypeDefinition @"
using System;
using System.Text;
using System.Runtime.InteropServices;
[ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")]
public class MMDeviceEnumeratorCom {}
[Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IMMDeviceEnumerator {
  [PreserveSig] int EnumAudioEndpoints(int dataFlow, uint stateMask, out IMMDeviceCollection devices);
  [PreserveSig] int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice device);
  [PreserveSig] int GetDevice([MarshalAs(UnmanagedType.LPWStr)] string id, out IMMDevice device);
}
[Guid("0BD7A1BE-7A1A-44DB-8397-CC5392387B5E"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IMMDeviceCollection {
  [PreserveSig] int GetCount(out uint count);
  [PreserveSig] int Item(uint index, out IMMDevice device);
}
[Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IMMDevice {
  [PreserveSig] int Activate(ref Guid iid, int clsCtx, IntPtr activation, [MarshalAs(UnmanagedType.IUnknown)] out object instance);
  [PreserveSig] int OpenPropertyStore(int access, out IPropertyStore store);
  [PreserveSig] int GetId([MarshalAs(UnmanagedType.LPWStr)] out string id);
  [PreserveSig] int GetState(out int state);
}
[Guid("886d8eeb-8cf2-4446-8d02-cdba1dbdcf99"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IPropertyStore {
  [PreserveSig] int GetCount(out uint count);
  [PreserveSig] int GetAt(uint index, out PropertyKey key);
  [PreserveSig] int GetValue(ref PropertyKey key, out PropVariant value);
}
[StructLayout(LayoutKind.Sequential)]
public struct PropertyKey {
  public Guid fmtid;
  public uint pid;
}
[StructLayout(LayoutKind.Sequential)]
public struct PropVariant {
  public ushort vt;
  public ushort r1;
  public ushort r2;
  public ushort r3;
  public IntPtr data;
  public int extra;
}
[Guid("870AF99C-171D-4F9E-AF0D-E63DF40C2BC9"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IPolicyConfig {
  [PreserveSig] int GetMixFormat([MarshalAs(UnmanagedType.LPWStr)] string id, out IntPtr format);
  [PreserveSig] int GetDeviceFormat([MarshalAs(UnmanagedType.LPWStr)] string id, [MarshalAs(UnmanagedType.Bool)] bool def, out IntPtr format);
  [PreserveSig] int ResetDeviceFormat([MarshalAs(UnmanagedType.LPWStr)] string id);
  [PreserveSig] int SetDeviceFormat([MarshalAs(UnmanagedType.LPWStr)] string id, IntPtr endpoint, IntPtr mix);
  [PreserveSig] int GetProcessingPeriod([MarshalAs(UnmanagedType.LPWStr)] string id, [MarshalAs(UnmanagedType.Bool)] bool def, IntPtr defPeriod, IntPtr minPeriod);
  [PreserveSig] int SetProcessingPeriod([MarshalAs(UnmanagedType.LPWStr)] string id, IntPtr period);
  [PreserveSig] int GetShareMode([MarshalAs(UnmanagedType.LPWStr)] string id, IntPtr mode);
  [PreserveSig] int SetShareMode([MarshalAs(UnmanagedType.LPWStr)] string id, IntPtr mode);
  [PreserveSig] int GetPropertyValue([MarshalAs(UnmanagedType.LPWStr)] string id, [MarshalAs(UnmanagedType.Bool)] bool fx, ref PropertyKey key, IntPtr value);
  [PreserveSig] int SetPropertyValue([MarshalAs(UnmanagedType.LPWStr)] string id, [MarshalAs(UnmanagedType.Bool)] bool fx, ref PropertyKey key, IntPtr value);
  [PreserveSig] int SetDefaultEndpoint([MarshalAs(UnmanagedType.LPWStr)] string id, uint role);
  [PreserveSig] int SetEndpointVisibility([MarshalAs(UnmanagedType.LPWStr)] string id, [MarshalAs(UnmanagedType.Bool)] bool visible);
}
[ComImport, Guid("870AF99C-171D-4F9E-AF0D-E63DF40C2BC9")]
public class PolicyConfigClient {}
public static class CueAudioWin {
  static string Json(string s) {
    if (s == null) return "";
    return s.Replace("\\", "\\\\").Replace("\"", "\\\"").Replace("\r", "").Replace("\n", " ");
  }
  static string ReadString(IPropertyStore store, string fmt, uint pid) {
    PropertyKey key = new PropertyKey();
    key.fmtid = new Guid(fmt);
    key.pid = pid;
    PropVariant value;
    if (store.GetValue(ref key, out value) != 0) return "";
    if (value.vt == 31 && value.data != IntPtr.Zero) return Marshal.PtrToStringUni(value.data) ?? "";
    return "";
  }
  static int ReadDword(IPropertyStore store, string fmt, uint pid) {
    PropertyKey key = new PropertyKey();
    key.fmtid = new Guid(fmt);
    key.pid = pid;
    PropVariant value;
    if (store.GetValue(ref key, out value) != 0) return -1;
    if (value.vt == 19) return value.data.ToInt32();
    return -1;
  }
  public static string List() {
    IMMDeviceEnumerator enumerator = (IMMDeviceEnumerator)new MMDeviceEnumeratorCom();
    IMMDeviceCollection collection;
    if (enumerator.EnumAudioEndpoints(0, 1, out collection) != 0 || collection == null) return "[]";
    uint count;
    collection.GetCount(out count);
    string defaultId = "";
    IMMDevice defaultDevice;
    if (enumerator.GetDefaultAudioEndpoint(0, 0, out defaultDevice) == 0 && defaultDevice != null) {
      defaultDevice.GetId(out defaultId);
    }
    StringBuilder json = new StringBuilder();
    json.Append("[");
    bool first = true;
    for (uint i = 0; i < count; i++) {
      IMMDevice device;
      if (collection.Item(i, out device) != 0 || device == null) continue;
      string id;
      device.GetId(out id);
      IPropertyStore store;
      if (device.OpenPropertyStore(0, out store) != 0 || store == null) continue;
      string name = ReadString(store, "a45c254e-df1c-4efd-8020-67d146a850e0", 14);
      if (string.IsNullOrEmpty(name)) name = ReadString(store, "b3f8fa53-0004-438e-9003-51a46e139bfc", 6);
      int form = ReadDword(store, "1da5d803-d492-4edd-8c23-e0c0ffee7f0e", 0);
      if (!first) json.Append(",");
      first = false;
      json.Append("{\"id\":\"").Append(Json(id)).Append("\",\"name\":\"").Append(Json(name)).Append("\",\"formFactor\":").Append(form).Append(",\"isDefault\":").Append(id == defaultId ? "true" : "false").Append("}");
    }
    json.Append("]");
    return json.ToString();
  }
  public static string SetDefault(string id) {
    if (string.IsNullOrEmpty(id)) return "ERR missing id";
    IPolicyConfig policy = (IPolicyConfig)new PolicyConfigClient();
    for (uint role = 0; role < 3; role++) {
      int hr = policy.SetDefaultEndpoint(id, role);
      if (hr != 0) return "ERR set " + hr;
    }
    return "OK";
  }
}
"@
if ($Mode -eq 'set') {
  $result = [CueAudioWin]::SetDefault($DeviceId)
  Write-Output $result
  if ($result -ne 'OK') { exit 1 }
  exit 0
}
Write-Output ([CueAudioWin]::List())
`

const MAC_SWIFT = `
import CoreAudio
import Foundation

let wanted = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : ""
if wanted.isEmpty {
  fputs("missing name\\n", stderr)
  exit(1)
}

var listAddr = AudioObjectPropertyAddress(
  mSelector: kAudioHardwarePropertyDevices,
  mScope: kAudioObjectPropertyScopeGlobal,
  mElement: kAudioObjectPropertyElementMain)
var dataSize: UInt32 = 0
let system = AudioObjectID(kAudioObjectSystemObject)
guard AudioObjectGetPropertyDataSize(system, &listAddr, 0, nil, &dataSize) == noErr else {
  fputs("device list failed\\n", stderr)
  exit(1)
}
let count = Int(dataSize) / MemoryLayout<AudioDeviceID>.size
var devices = [AudioDeviceID](repeating: 0, count: max(count, 1))
guard AudioObjectGetPropertyData(system, &listAddr, 0, nil, &dataSize, &devices) == noErr else {
  fputs("device list failed\\n", stderr)
  exit(1)
}

func deviceName(_ id: AudioDeviceID) -> String {
  var addr = AudioObjectPropertyAddress(
    mSelector: kAudioDevicePropertyDeviceNameCFString,
    mScope: kAudioObjectPropertyScopeGlobal,
    mElement: kAudioObjectPropertyElementMain)
  var name: CFString = "" as CFString
  var size = UInt32(MemoryLayout<CFString?>.size)
  let err = AudioObjectGetPropertyData(id, &addr, 0, nil, &size, &name)
  if err != noErr { return "" }
  return name as String
}

func hasOutput(_ id: AudioDeviceID) -> Bool {
  var addr = AudioObjectPropertyAddress(
    mSelector: kAudioDevicePropertyStreamConfiguration,
    mScope: kAudioDevicePropertyScopeOutput,
    mElement: kAudioObjectPropertyElementMain)
  var size: UInt32 = 0
  if AudioObjectGetPropertyDataSize(id, &addr, 0, nil, &size) != noErr || size == 0 { return false }
  let raw = UnsafeMutableRawPointer.allocate(byteCount: Int(size), alignment: MemoryLayout<AudioBufferList>.alignment)
  defer { raw.deallocate() }
  if AudioObjectGetPropertyData(id, &addr, 0, nil, &size, raw) != noErr { return false }
  let buffers = raw.bindMemory(to: AudioBufferList.self, capacity: 1)
  return buffers.pointee.mNumberBuffers > 0
}

guard let chosen = devices.first(where: { deviceName($0) == wanted && hasOutput($0) }) else {
  fputs("device not found\\n", stderr)
  exit(1)
}
var setAddr = AudioObjectPropertyAddress(
  mSelector: kAudioHardwarePropertyDefaultOutputDevice,
  mScope: kAudioObjectPropertyScopeGlobal,
  mElement: kAudioObjectPropertyElementMain)
var selected = chosen
let setErr = AudioObjectSetPropertyData(system, &setAddr, 0, nil, UInt32(MemoryLayout<AudioDeviceID>.size), &selected)
if setErr != noErr {
  fputs("set failed\\n", stderr)
  exit(1)
}
print("ok")
`

interface RawDevice {
	token: string
	name: string
	detail: string
	isSystemDefault: boolean
	formFactor?: number
}

function run(command: string, args: string[], timeoutMs = 8000): { code: number; stdout: string } {
	try {
		const stdout = execFileSync(command, args, {
			encoding: 'utf8',
			timeout: timeoutMs,
			windowsHide: true,
			maxBuffer: 8 * 1024 * 1024,
		})
		return { code: 0, stdout: stdout || '' }
	} catch (err) {
		const caught = err as { status?: number; stdout?: string | Buffer; stderr?: string | Buffer }
		const stdout = `${caught.stdout || ''}${caught.stderr || ''}`
		return { code: typeof caught.status === 'number' ? caught.status : 1, stdout }
	}
}

function commandExists(command: string): boolean {
	if (!command) return false
	if (path.isAbsolute(command)) return fs.existsSync(command)
	const finder = process.platform === 'win32' ? 'where.exe' : 'which'
	return run(finder, [command], 3000).code === 0
}

function sanitizeCard(card: string): string {
	return card.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64)
}

export function asoundConf(card: string): string {
	const safe = sanitizeCard(card)
	return `pcm.!default {
  type plug
  slave.pcm "cueout"
}
pcm.cueout {
  type hw
  card ${safe}
  device 0
}
ctl.!default {
  type hw
  card ${safe}
}
`
}

function systemDefaultOutput(): AudioOutput {
	return {
		id: 'default',
		label: 'System default',
		detail: 'Whatever this computer is using right now',
		kind: 'default',
		backend: 'default',
		token: '',
		isSystemDefault: false,
	}
}

export function classifyOutput(name: string, formFactor = -1): AudioKind {
	const text = name.toLowerCase()
	if (formFactor === 9 || /hdmi|displayport|display port|vc4-?hdmi/.test(text)) return 'hdmi'
	if (
		formFactor === 3 ||
		formFactor === 5 ||
		formFactor === 6 ||
		/headphone|headset|earphone|earpiece|\btrs\b|analog|line[\s-]?out|bcm2835/.test(text)
	) {
		return 'trs'
	}
	if (/bluetooth|airpods/.test(text)) return 'bluetooth'
	if (/\busb\b/.test(text)) return 'usb'
	if (formFactor === 1 || /speaker/.test(text)) return 'speakers'
	return 'other'
}

function displayLabel(kind: AudioKind, name: string, hdmiIndex: number, hdmiCount: number): string {
	const trimmed = name.replace(/\s+/g, ' ').trim() || 'Audio output'
	if (kind === 'hdmi') {
		const prefix = hdmiCount > 1 ? `HDMI ${hdmiIndex}` : 'HDMI'
		const stripped = trimmed.replace(/hdmi|displayport|display port|vc4-?hdmi|digital|stereo|audio|built-in|builtin/gi, '').replace(/[^a-z0-9]+/gi, '')
		if (!stripped || /vc4|hdmi/i.test(trimmed)) return prefix
		const monitor = trimmed.replace(/^(hdmi|display\s*port)\s*[-:—]?\s*/i, '').trim()
		if (!monitor || /^hdmi$/i.test(monitor) || monitor.length > 60) return prefix
		return `${prefix} — ${monitor}`
	}
	if (kind === 'trs') {
		const rest = trimmed
			.replace(/^(headphones?|headset|earphones?)\s*/i, '')
			.replace(/^\(+|\)+$/g, '')
			.trim()
		if (!rest || /analog|bcm2835/i.test(trimmed)) return 'Headphones / TRS'
		return `Headphones / TRS — ${rest}`
	}
	if (kind === 'usb') {
		const rest = trimmed.replace(/^usb\s*/i, '').replace(/^\(+|\)+$/g, '').trim()
		return rest ? `USB — ${rest}` : 'USB'
	}
	if (kind === 'bluetooth') return `Bluetooth — ${trimmed}`
	if (kind === 'speakers') {
		const rest = trimmed.replace(/^speakers?\s*/i, '').replace(/^\(+|\)+$/g, '').trim()
		return rest ? `Speakers — ${rest}` : 'Speakers'
	}
	return trimmed
}

function finishOutputs(backend: AudioBackend, raw: RawDevice[]): AudioOutput[] {
	const drafted = raw.map((device) => ({
		device,
		kind: classifyOutput(device.name, device.formFactor),
	}))
	const hdmiCount = drafted.filter((item) => item.kind === 'hdmi').length
	let hdmiIndex = 0
	return drafted.map((item) => {
		const index = item.kind === 'hdmi' ? ++hdmiIndex : 0
		return {
			id: `${backend}:${item.device.token}`,
			label: displayLabel(item.kind, item.device.name, index, hdmiCount),
			detail: item.device.detail || item.device.name,
			kind: item.kind,
			backend,
			token: item.device.token,
			isSystemDefault: item.device.isSystemDefault,
		}
	})
}

export function parseAlsaCards(text: string): RawDevice[] {
	const found: RawDevice[] = []
	for (const line of text.split(/\r?\n/)) {
		const match = line.match(/^\s*\d+\s+\[([^\]]+)\]:\s*(.+)$/)
		if (!match) continue
		const id = match[1].trim()
		const description = match[2].trim()
		found.push({ token: id, name: description || id, detail: id, isSystemDefault: false })
	}
	return found
}

export function parseAplay(text: string): RawDevice[] {
	const found: RawDevice[] = []
	for (const line of text.split(/\r?\n/)) {
		const match = line.match(/^card\s+\d+:\s+(\S+)\s+\[([^\]]+)\]/)
		if (!match) continue
		found.push({ token: match[1], name: match[2].trim(), detail: match[1], isSystemDefault: false })
	}
	return found
}

export function parseWpctl(text: string): RawDevice[] {
	const found: RawDevice[] = []
	let inSinks = false
	for (const line of text.split(/\r?\n/)) {
		if (/Sinks:/.test(line) && !/Sink endpoints/.test(line)) {
			inSinks = true
			continue
		}
		if (inSinks && /(Sources:|Sink endpoints:|Source endpoints:|Filters:|Streams:|Devices:)/.test(line)) {
			inSinks = false
		}
		if (!inSinks) continue
		const match = line.match(/(\*)?\s*(\d+)\.\s+(.+)$/)
		if (!match) continue
		const name = match[3].replace(/\s+\[.*$/, '').trim()
		if (!name) continue
		found.push({ token: match[2], name, detail: name, isSystemDefault: Boolean(match[1]) })
	}
	return found
}

export function parsePactl(text: string): RawDevice[] {
	const found: RawDevice[] = []
	let current: { name: string; description: string } | null = null
	const push = () => {
		if (!current?.name) return
		found.push({
			token: current.name,
			name: current.description || current.name,
			detail: current.name,
			isSystemDefault: false,
		})
	}
	for (const line of text.split(/\r?\n/)) {
		if (/^\s*Sink #/.test(line)) {
			push()
			current = { name: '', description: '' }
			continue
		}
		if (!current) continue
		const name = line.match(/^\s*Name:\s*(.+)$/)
		const description = line.match(/^\s*Description:\s*(.+)$/)
		if (name) current.name = name[1].trim()
		if (description) current.description = description[1].trim()
	}
	push()
	return found
}

function parsePactlJson(text: string): RawDevice[] {
	const parsed = JSON.parse(text) as unknown
	const rows = Array.isArray(parsed) ? parsed : Object.values((parsed || {}) as Record<string, unknown>)
	const found: RawDevice[] = []
	for (const row of rows) {
		if (!row || typeof row !== 'object') continue
		const record = row as { name?: string; Name?: string; description?: string; Description?: string }
		const token = record.name || record.Name || ''
		if (!token) continue
		const name = record.description || record.Description || token
		found.push({ token, name, detail: token, isSystemDefault: false })
	}
	return found
}

function normalizeMatch(value: string): string {
	return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

export function matchBrowserSink(label: string, detail: string, devices: BrowserAudioDevice[]): string {
	const wantLabel = normalizeMatch(label)
	const wantDetail = normalizeMatch(detail)
	let best = ''
	let bestScore = 0
	for (const device of devices) {
		if (!device.deviceId || !device.label) continue
		const got = normalizeMatch(device.label)
		if (!got || got === 'default') continue
		const score = (candidate: string): number => {
			if (!candidate) return 0
			if (got === candidate) return 100
			const wantNum = (candidate.match(/\bhdmi\s*(\d+)/) || [])[1]
			const gotNum = (got.match(/\bhdmi\s*(\d+)/) || [])[1]
			if (wantNum && gotNum && wantNum !== gotNum) return 0
			if (got.includes(candidate) || candidate.includes(got)) return 80
			const parts = candidate.split(' ').filter((part) => part.length > 2)
			if (!parts.length) return 0
			const hits = parts.filter((part) => got.includes(part)).length
			return (hits / parts.length) * 60
		}
		const next = Math.max(score(wantLabel), score(wantDetail) - 5)
		if (next > bestScore) {
			bestScore = next
			best = device.deviceId
		}
	}
	return bestScore >= 50 ? best : ''
}

function parseJsonArray(text: string): unknown[] {
	const start = text.indexOf('[')
	const end = text.lastIndexOf(']')
	if (start < 0 || end < start) return []
	const parsed = JSON.parse(text.slice(start, end + 1)) as unknown
	if (Array.isArray(parsed)) return parsed
	return parsed ? [parsed] : []
}

export class HostAudio {
	outputs: AudioOutput[] = [systemDefaultOutput()]
	selectedId = 'default'
	message = ''
	private browserDevices: BrowserAudioDevice[] = []
	private readonly filePath: string

	constructor(
		private readonly dataDir: string,
		private readonly log: (level: 'info' | 'warn' | 'error', message: string) => void,
	) {
		this.filePath = path.join(dataDir, 'audio-output.json')
	}

	load(): void {
		try {
			const parsed = JSON.parse(fs.readFileSync(this.filePath, 'utf8')) as { id?: string }
			if (parsed && typeof parsed.id === 'string' && parsed.id) this.selectedId = parsed.id
		} catch {
			this.selectedId = 'default'
		}
	}

	refresh(): AudioSnapshot {
		let devices: AudioOutput[] = []
		try {
			if (process.platform === 'win32') devices = this.listWindows()
			else if (process.platform === 'darwin') devices = this.listMac()
			else devices = this.listLinux()
		} catch (err) {
			this.log('warn', `Audio output detection failed: ${err}`)
			devices = []
		}
		const current = devices.find((device) => device.isSystemDefault)
		const fallback = systemDefaultOutput()
		if (current) fallback.detail = `Currently ${current.label}`
		this.outputs = [fallback, ...devices]
		if (this.selectedId !== 'default' && !this.outputs.some((device) => device.id === this.selectedId)) {
			this.outputs.push({
				id: this.selectedId,
				label: 'Saved output (not connected)',
				detail: this.selectedId,
				kind: 'other',
				backend: 'default',
				token: '',
				isSystemDefault: false,
				offline: true,
			})
		}
		return this.snapshot(true, false)
	}

	select(id: string): AudioSnapshot {
		const requested = id || 'default'
		if (this.outputs.length <= 1) this.refresh()
		if (requested === 'default') {
			this.selectedId = 'default'
			this.save()
			this.prepareAlsaOverride()
			const relaunch = this.linuxUsesAlsa()
			this.message = relaunch
				? 'Stage audio follows the system default. The stage browser restarts so the previous card is released.'
				: 'Stage audio follows the system default.'
			this.log('info', this.message)
			return this.snapshot(true, relaunch)
		}
		const device = this.outputs.find((item) => item.id === requested)
		if (!device || device.offline) {
			this.message = 'That audio output is not available on this computer.'
			return this.snapshot(false, false)
		}
		const applied = this.applyDevice(device)
		this.selectedId = device.id
		this.save()
		this.prepareAlsaOverride()
		try {
			this.refresh()
		} catch {
			/* keep the list we already showed */
		}
		this.message = applied.message
		this.log(applied.ok ? 'info' : 'warn', applied.message)
		return this.snapshot(applied.ok, applied.relaunch)
	}

	noteBrowserDevices(devices: BrowserAudioDevice[]): void {
		this.browserDevices = (devices || [])
			.filter((device) => device && typeof device.deviceId === 'string')
			.map((device) => ({ deviceId: device.deviceId, label: String(device.label || '') }))
	}

	sinkIdForSelected(): string {
		if (this.selectedId === 'default') return ''
		const device = this.outputs.find((item) => item.id === this.selectedId)
		if (!device) return ''
		return matchBrowserSink(device.label, device.detail, this.browserDevices)
	}

	selectedLabel(): string {
		return this.outputs.find((device) => device.id === this.selectedId)?.label || 'System default'
	}

	prepareAlsaOverride(): void {
		if (process.platform !== 'linux') return
		try {
			if (this.selectedId.startsWith('alsa:')) {
				const card = sanitizeCard(this.selectedId.slice('alsa:'.length))
				if (!card) return
				fs.writeFileSync(CARD_FILE, `${card}\n`)
				fs.writeFileSync(ASOUND_FILE, asoundConf(card))
				return
			}
			if (fs.existsSync(CARD_FILE)) fs.unlinkSync(CARD_FILE)
		} catch (err) {
			this.log('warn', `Could not update the ALSA output file: ${err}`)
		}
	}

	stageProcessEnv(): Record<string, string> {
		if (process.platform !== 'linux' || !this.selectedId.startsWith('alsa:')) return {}
		const card = sanitizeCard(this.selectedId.slice('alsa:'.length))
		if (!card) return {}
		try {
			fs.writeFileSync(ASOUND_FILE, asoundConf(card))
			return { ALSA_CONFIG_PATH: ASOUND_FILE }
		} catch {
			return {}
		}
	}

	private snapshot(ok: boolean, relaunchKiosk: boolean): AudioSnapshot {
		return {
			ok,
			message: this.message,
			outputs: this.outputs,
			selectedId: this.selectedId,
			relaunchKiosk,
		}
	}

	private save(): void {
		try {
			fs.writeFileSync(this.filePath, JSON.stringify({ id: this.selectedId }, null, 2), 'utf8')
		} catch (err) {
			this.log('warn', `Could not save the audio output choice: ${err}`)
		}
	}

	private linuxUsesAlsa(): boolean {
		return process.platform === 'linux' && this.outputs.some((device) => device.backend === 'alsa')
	}

	private listLinux(): AudioOutput[] {
		if (commandExists('wpctl')) {
			const status = run('wpctl', ['status'], 5000)
			const sinks = parseWpctl(status.stdout)
			if (sinks.length) return finishOutputs('pipewire', sinks)
		}
		if (commandExists('pactl')) {
			const json = run('pactl', ['-f', 'json', 'list', 'sinks'], 5000)
			let sinks: RawDevice[] = []
			const body = json.stdout.trim()
			try {
				if (json.code === 0 && (body.startsWith('{') || body.startsWith('['))) {
					sinks = parsePactlJson(json.stdout)
				}
			} catch {
				sinks = []
			}
			if (!sinks.length) sinks = parsePactl(run('pactl', ['list', 'sinks'], 5000).stdout)
			if (sinks.length) {
				const def = run('pactl', ['get-default-sink'], 3000).stdout.trim()
				for (const sink of sinks) sink.isSystemDefault = sink.token === def
				return finishOutputs('pulse', sinks)
			}
		}
		let cards: RawDevice[] = []
		try {
			cards = parseAlsaCards(fs.readFileSync('/proc/asound/cards', 'utf8'))
		} catch {
			cards = []
		}
		if (!cards.length && commandExists('aplay')) cards = parseAplay(run('aplay', ['-l'], 3000).stdout)
		if (cards[0]) cards[0].isSystemDefault = true
		return finishOutputs('alsa', cards)
	}

	private listWindows(): AudioOutput[] {
		const script = path.join(this.dataDir, 'audio-win.ps1')
		fs.writeFileSync(script, WIN_PS1.trimStart(), 'utf8')
		const listed = run('powershell.exe', ['-NoProfile', '-NonInteractive', '-File', script, 'list'], 20000)
		const rows = parseJsonArray(listed.stdout) as Array<{ id?: string; name?: string; formFactor?: number; isDefault?: boolean }>
		const raw: RawDevice[] = []
		for (const row of rows) {
			if (!row || !row.id) continue
			raw.push({
				token: row.id,
				name: row.name || 'Audio output',
				detail: row.name || row.id,
				isSystemDefault: !!row.isDefault,
				formFactor: typeof row.formFactor === 'number' ? row.formFactor : -1,
			})
		}
		return finishOutputs('wasapi', raw)
	}

	private listMac(): AudioOutput[] {
		const profiler = fs.existsSync('/usr/sbin/system_profiler') ? '/usr/sbin/system_profiler' : 'system_profiler'
		const listed = run(profiler, ['SPAudioDataType', '-json'], 20000)
		let raw: RawDevice[] = []
		try {
			raw = parseMacProfiler(listed.stdout)
		} catch {
			raw = []
		}
		return finishOutputs('coreaudio', raw)
	}

	private applyDevice(device: AudioOutput): { ok: boolean; message: string; relaunch: boolean } {
		if (device.backend === 'wasapi') return this.applyWindows(device)
		if (device.backend === 'coreaudio') return this.applyMac(device)
		if (device.backend === 'pipewire') return this.applyPipewire(device)
		if (device.backend === 'pulse') return this.applyPulse(device)
		if (device.backend === 'alsa') {
			return {
				ok: true,
				relaunch: true,
				message: `Stage audio set to ${device.label}. The stage browser restarts so this output is the one that plays.`,
			}
		}
		return { ok: false, relaunch: false, message: 'This computer did not report a way to switch that output.' }
	}

	private applyWindows(device: AudioOutput): { ok: boolean; message: string; relaunch: boolean } {
		const script = path.join(this.dataDir, 'audio-win.ps1')
		fs.writeFileSync(script, WIN_PS1.trimStart(), 'utf8')
		const result = run('powershell.exe', ['-NoProfile', '-NonInteractive', '-File', script, 'set', device.token], 20000)
		const ok = result.code === 0 && result.stdout.includes('OK')
		return {
			ok,
			relaunch: false,
			message: ok
				? `Stage audio set to ${device.label}.`
				: `Saved ${device.label}, but Windows did not change the system output (${result.stdout.trim() || 'no details'}). The stage will still try to use it.`,
		}
	}

	private applyMac(device: AudioOutput): { ok: boolean; message: string; relaunch: boolean } {
		const swift = ['/usr/bin/swift', 'swift'].find((cmd) => commandExists(cmd))
		if (!swift) {
			return {
				ok: true,
				relaunch: false,
				message: `Stage audio set to ${device.label}. This Mac has no Swift tools, so the system default was left as it is. The stage browser will use the device if it can see it.`,
			}
		}
		const script = path.join(os.tmpdir(), 'cue-audio-set.swift')
		fs.writeFileSync(script, MAC_SWIFT, 'utf8')
		const result = run(swift, [script, device.token], 60000)
		const ok = result.code === 0 && result.stdout.includes('ok')
		return {
			ok,
			relaunch: false,
			message: ok
				? `Stage audio set to ${device.label}.`
				: `Saved ${device.label}, but the Mac system default did not change (${result.stdout.trim() || 'no details'}). The stage browser will still try to use it.`,
		}
	}

	private applyPipewire(device: AudioOutput): { ok: boolean; message: string; relaunch: boolean } {
		const set = run('wpctl', ['set-default', device.token], 5000)
		const inspected = run('wpctl', ['inspect', device.token], 5000).stdout
		const node = inspected.match(/node\.name\s*=\s*"([^"]+)"/)
		if (node && commandExists('pactl')) this.movePulseInputs(node[1])
		const ok = set.code === 0
		return {
			ok,
			relaunch: false,
			message: ok
				? `Stage audio set to ${device.label}.`
				: `Saved ${device.label}, but PipeWire did not switch (${set.stdout.trim() || 'no details'}).`,
		}
	}

	private applyPulse(device: AudioOutput): { ok: boolean; message: string; relaunch: boolean } {
		const set = run('pactl', ['set-default-sink', device.token], 5000)
		this.movePulseInputs(device.token)
		const ok = set.code === 0
		return {
			ok,
			relaunch: false,
			message: ok
				? `Stage audio set to ${device.label}.`
				: `Saved ${device.label}, but PulseAudio did not switch (${set.stdout.trim() || 'no details'}).`,
		}
	}

	private movePulseInputs(sink: string): void {
		if (!commandExists('pactl') || !sink) return
		const inputs = run('pactl', ['list', 'short', 'sink-inputs'], 4000).stdout
		for (const line of inputs.split(/\r?\n/)) {
			const id = line.trim().split(/\s+/)[0]
			if (!/^\d+$/.test(id)) continue
			run('pactl', ['move-sink-input', id, sink], 4000)
		}
	}
}

function parseMacProfiler(text: string): RawDevice[] {
	const start = text.indexOf('{')
	if (start < 0) return []
	const parsed = JSON.parse(text.slice(start)) as { SPAudioDataType?: unknown }
	const rows = Array.isArray(parsed.SPAudioDataType) ? parsed.SPAudioDataType : []
	const found: RawDevice[] = []
	for (const row of rows) {
		if (!row || typeof row !== 'object') continue
		const record = row as Record<string, unknown>
		const name = String(record._name || '').trim()
		if (!name) continue
		const outputChannels = Number(record.coreaudio_device_output || record.coreaudio_output_channels || 0)
		const hasSource = typeof record.coreaudio_output_source === 'string' && record.coreaudio_output_source.length > 0
		const looksLikeOutput = /output|speaker|headphone|hdmi|display/i.test(name)
		if (!outputChannels && !hasSource && !looksLikeOutput) continue
		const transport = String(record.coreaudio_device_transport || '')
		const source = String(record.coreaudio_output_source || '')
		const combined = `${name} ${source} ${transport}`
		const isDefault = String(record.coreaudio_default_audio_output_device || '') === 'spaudio_yes'
		found.push({
			token: name,
			name: source && !name.toLowerCase().includes(source.toLowerCase()) ? `${name} ${source}` : combined.trim(),
			detail: [name, source, transport.replace(/_/g, ' ')].filter(Boolean).join(' · '),
			isSystemDefault: isDefault,
		})
	}
	return found
}
