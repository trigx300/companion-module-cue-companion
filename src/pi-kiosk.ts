import { spawn } from 'child_process'
import * as fs from 'fs'

/**
 * HDMI stage for Companion OS on a Raspberry Pi.
 *
 * Companion OS has no desktop. The console getty owns tty1, and the companion
 * user cannot open the DRM device. The launch that works is root, after
 * stopping getty@tty1: Cage (a one-window Wayland compositor) running Chromium
 * kiosk pointed at this module's stage page. The stage page already fades and
 * plays video cues over SSE.
 *
 * The companion user is expected to have a narrow passwordless sudo for:
 *   apt-get install -y cage chromium
 *   mkdir/tee/chmod of the two root scripts below
 *   those two scripts themselves
 * The password is never stored here.
 */

const LIB_DIR = '/usr/local/lib/cue-companion'
const LAUNCH_SCRIPT = `${LIB_DIR}/launch-stage.sh`
const STOP_SCRIPT = `${LIB_DIR}/stop-stage.sh`

export type PiKioskLog = (level: 'info' | 'warn' | 'error', message: string) => void

export interface PiKioskResult {
	ok: boolean
	message: string
}

export interface PiKioskOptions {
	port: number
	disabled: number[]
	scriptDir: string
	log: PiKioskLog
}

export function isRaspberryPi(): boolean {
	if (process.platform !== 'linux') return false
	try {
		if (fs.existsSync('/proc/device-tree/model')) {
			const model = fs.readFileSync('/proc/device-tree/model').toString().replace(/\0/g, '')
			if (/raspberry pi/i.test(model)) return true
		}
	} catch {
		/* fall through */
	}
	try {
		const cpu = fs.readFileSync('/proc/cpuinfo', 'utf8')
		return /raspberry pi/i.test(cpu)
	} catch {
		return false
	}
}

function launchScript(): string {
	return `#!/bin/bash
set -u
PORT="\${1:-8090}"
case "$PORT" in
  ''|*[!0-9]*) echo "stage port must be a number" >&2; exit 2 ;;
esac
export XDG_RUNTIME_DIR=/tmp/cue-runtime-root
mkdir -p "$XDG_RUNTIME_DIR"
chmod 700 "$XDG_RUNTIME_DIR"
export WLR_LIBINPUT_NO_DEVICES=1
systemctl stop getty@tty1.service || true
pkill -f cue-chrome-root >/dev/null 2>&1 || true
sleep 0.4
URL="http://127.0.0.1:\${PORT}/stage?screen=0&fs=1"
setsid nohup cage -- /usr/bin/chromium \\
  --no-sandbox \\
  --user-data-dir=/tmp/cue-chrome-root \\
  --kiosk \\
  --ozone-platform=wayland \\
  --autoplay-policy=no-user-gesture-required \\
  --no-first-run \\
  --no-default-browser-check \\
  --disable-infobars \\
  --disable-translate \\
  --disable-session-crashed-bubble \\
  --password-store=basic \\
  --disable-dev-shm-usage \\
  --check-for-update-interval=31536000 \\
  "$URL" >/tmp/cue-cage-root.log 2>&1 < /dev/null &
echo $! >/tmp/cue-cage.pid
sleep 8
if ! pgrep -f cue-chrome-root >/dev/null 2>&1; then
  echo "Chromium did not stay up" >&2
  tail -n 40 /tmp/cue-cage-root.log >&2 || true
  exit 1
fi
echo "HDMI browser open at $URL"
exit 0
`
}

function stopScript(): string {
	return `#!/bin/bash
set -u
pkill -f cue-chrome-root >/dev/null 2>&1 || true
sleep 0.3
pkill -x cage >/dev/null 2>&1 || true
systemctl start getty@tty1.service || true
echo "HDMI browser closed"
exit 0
`
}

function isRoot(): boolean {
	return typeof process.getuid === 'function' && process.getuid() === 0
}

function runPrivileged(args: string[], input?: string, timeoutMs = 120000): Promise<{ code: number; output: string }> {
	const cmd = isRoot() ? args[0] : '/usr/bin/sudo'
	const argv = isRoot() ? args.slice(1) : ['-n', ...args]
	return new Promise((resolve) => {
		let output = ''
		let settled = false
		const child = spawn(cmd, argv, { stdio: ['pipe', 'pipe', 'pipe'] })
		const timer = setTimeout(() => {
			if (settled) return
			child.kill('SIGKILL')
		}, timeoutMs)
		const finish = (code: number) => {
			if (settled) return
			settled = true
			clearTimeout(timer)
			resolve({ code, output: output.trim() })
		}
		child.stdout.on('data', (chunk) => {
			output += chunk.toString()
		})
		child.stderr.on('data', (chunk) => {
			output += chunk.toString()
		})
		child.on('error', (err) => {
			output += err.message
			finish(1)
		})
		child.on('close', (code) => finish(code ?? 1))
		if (input !== undefined) child.stdin.write(input)
		child.stdin.end()
	})
}

function packagesInstalled(): boolean {
	return fs.existsSync('/usr/bin/cage') && fs.existsSync('/usr/bin/chromium')
}

async function installPackages(log: PiKioskLog): Promise<boolean> {
	if (packagesInstalled()) return true
	log('info', 'Installing cage and chromium for the HDMI stage.')
	const child = isRoot()
		? spawn('/usr/bin/apt-get', ['install', '-y', 'cage', 'chromium'], {
				detached: true,
				stdio: 'ignore',
				env: { ...process.env, DEBIAN_FRONTEND: 'noninteractive' },
			})
		: spawn('/usr/bin/sudo', ['-n', '/usr/bin/apt-get', 'install', '-y', 'cage', 'chromium'], {
				detached: true,
				stdio: 'ignore',
				env: { ...process.env, DEBIAN_FRONTEND: 'noninteractive' },
			})
	child.unref()
	const deadline = Date.now() + 20 * 60 * 1000
	while (Date.now() < deadline) {
		await new Promise((resolve) => setTimeout(resolve, 5000))
		if (packagesInstalled()) return true
	}
	return packagesInstalled()
}

async function installScripts(log: PiKioskLog): Promise<string | null> {
	const mkdir = await runPrivileged(['/usr/bin/mkdir', '-p', LIB_DIR])
	if (mkdir.code !== 0) {
		return mkdir.output || 'Could not create /usr/local/lib/cue-companion. Passwordless sudo is required.'
	}
	const launch = await runPrivileged(['/usr/bin/tee', LAUNCH_SCRIPT], launchScript())
	const stop = await runPrivileged(['/usr/bin/tee', STOP_SCRIPT], stopScript())
	if (launch.code !== 0 || stop.code !== 0) {
		return launch.output || stop.output || 'Could not install the HDMI launch scripts.'
	}
	const chmodLaunch = await runPrivileged(['/usr/bin/chmod', '755', LAUNCH_SCRIPT])
	const chmodStop = await runPrivileged(['/usr/bin/chmod', '755', STOP_SCRIPT])
	if (chmodLaunch.code !== 0 || chmodStop.code !== 0) {
		return chmodLaunch.output || chmodStop.output || 'Could not mark the HDMI launch scripts executable.'
	}
	log('info', 'HDMI launch scripts are installed.')
	return null
}

export async function ensurePiStageKiosk(options: PiKioskOptions): Promise<PiKioskResult> {
	const { port, log } = options
	if (!isRaspberryPi()) {
		return { ok: true, message: '' }
	}

	const installed = await installPackages(log)
	if (!installed) {
		const message = 'cage and chromium are not installed, and the install did not finish. The companion user needs passwordless sudo for apt-get install -y cage chromium.'
		log('error', message)
		return { ok: false, message }
	}

	const scriptError = await installScripts(log)
	if (scriptError) {
		log('error', scriptError)
		return { ok: false, message: scriptError }
	}

	log('info', `Opening Chromium on the HDMI stage (port ${port}).`)
	const launched = await runPrivileged([LAUNCH_SCRIPT, String(port)], undefined, 30000)
	if (launched.code !== 0) {
		const message = launched.output || 'Cage did not keep Chromium running on the HDMI output.'
		log('error', message)
		return { ok: false, message }
	}
	log('info', launched.output || 'HDMI stage is open in Chromium.')
	return {
		ok: true,
		message: 'HDMI stage is open in Chromium. Video cues play on that screen.',
	}
}

export async function stopPiStageKiosk(scriptDir: string, log: PiKioskLog): Promise<void> {
	void scriptDir
	if (!isRaspberryPi()) return
	if (!fs.existsSync(STOP_SCRIPT)) {
		log('warn', 'HDMI stop script is not installed.')
		return
	}
	const stopped = await runPrivileged([STOP_SCRIPT])
	if (stopped.code !== 0) {
		log('warn', stopped.output || 'Could not close the HDMI browser.')
		return
	}
	log('info', stopped.output || 'HDMI browser closed.')
}
