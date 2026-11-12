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
# Cage still uploads its own arrow if the theme is missing. The blank theme
# covers that path. The hide-cursor library below is what actually keeps the
# HDMI pointer off, including after a reboot.
export XCURSOR_PATH=/usr/local/share/icons:/usr/share/icons
export XCURSOR_THEME=cue-blank
export XCURSOR_SIZE=24
CARD_FILE=/tmp/cue-audio-card
ASOUND=/tmp/cue-asound.conf
if [ -f "$CARD_FILE" ]; then
  CARD=$(tr -cd 'A-Za-z0-9_-' < "$CARD_FILE" | head -c 64)
  if [ -n "$CARD" ]; then
    cat > "$ASOUND" <<EOF
pcm.!default {
  type plug
  slave.pcm "cueout"
}
pcm.cueout {
  type hw
  card \${CARD}
  device 0
}
ctl.!default {
  type hw
  card \${CARD}
}
EOF
    export ALSA_CONFIG_PATH="$ASOUND"
  fi
fi
install_blank_cursor() {
  local dest="\$1"
  mkdir -p "\$dest/cursors"
  printf '%s' 'WGN1chAAAAAAAAEAAQAAAAIA/f8YAAAAHAAAACQAAAACAP3/GAAAAAEAAAAYAAAAGAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==' | base64 -d > "\$dest/cursors/left_ptr"
  ln -sfn left_ptr "\$dest/cursors/default"
  ln -sfn left_ptr "\$dest/cursors/arrow"
  ln -sfn left_ptr "\$dest/cursors/top_left_arrow"
  ln -sfn left_ptr "\$dest/cursors/left_ptr_watch"
  ln -sfn left_ptr "\$dest/cursors/hand1"
  ln -sfn left_ptr "\$dest/cursors/hand2"
  ln -sfn left_ptr "\$dest/cursors/pointer"
  ln -sfn left_ptr "\$dest/cursors/cross"
  ln -sfn left_ptr "\$dest/cursors/text"
  ln -sfn left_ptr "\$dest/cursors/watch"
  ln -sfn left_ptr "\$dest/cursors/xterm"
  printf '%s\n' '[Icon Theme]' 'Name=cue-blank' 'Comment=Hidden kiosk cursor' 'Inherits=cue-blank' > "\$dest/index.theme"
}
install_blank_cursor /usr/local/share/icons/cue-blank
install_blank_cursor /usr/share/icons/cue-blank
if [ -L /usr/share/icons/default/index.theme ] || [ -f /usr/share/icons/default/index.theme ]; then
  rm -f /usr/share/icons/default/index.theme
  printf '%s\n' '[Icon Theme]' 'Inherits=cue-blank' > /usr/share/icons/default/index.theme
fi
# The bootloader only reads the first line. A previous install put the flag on
# its own line, so a reboot ignored it and the console pointer came back.
if [ -f /boot/cmdline.txt ] && grep -q 'DO NOT EDIT' /boot/cmdline.txt; then
  printf '%s\n' 'DO NOT EDIT THIS FILE' '' 'The file you are looking for has moved to /boot/firmware/cmdline.txt' > /boot/cmdline.txt
fi
for CMDLINE in /boot/firmware/cmdline.txt /boot/cmdline.txt; do
  if [ -f "\$CMDLINE" ] && head -n 1 "\$CMDLINE" | grep -q 'root='; then
    LINE=$(head -n 1 "\$CMDLINE" | sed 's/[[:space:]]*$//')
    case " \$LINE " in
      *" vt.global_cursor_default=0 "*) ;;
      *) LINE="\$LINE vt.global_cursor_default=0" ;;
    esac
    printf '%s\n' "\$LINE" > "\$CMDLINE"
  fi
done
if [ -w /sys/class/graphics/fbcon/cursor_blink ]; then
  echo 0 > /sys/class/graphics/fbcon/cursor_blink || true
fi
if [ -c /dev/tty1 ]; then
  printf '\\033[?25l' > /dev/tty1 || true
fi
systemctl mask getty@tty1.service >/dev/null 2>&1 || true
systemctl stop getty@tty1.service || true
hide_hdmi_cursor() {
python3 - <<'PY'
import ctypes, os, sys
class Res(ctypes.Structure):
    _fields_ = [
        ('count_fbs', ctypes.c_int), ('fbs', ctypes.POINTER(ctypes.c_uint32)),
        ('count_crtcs', ctypes.c_int), ('crtcs', ctypes.POINTER(ctypes.c_uint32)),
        ('count_connectors', ctypes.c_int), ('connectors', ctypes.POINTER(ctypes.c_uint32)),
        ('count_encoders', ctypes.c_int), ('encoders', ctypes.POINTER(ctypes.c_uint32)),
        ('min_width', ctypes.c_uint32), ('max_width', ctypes.c_uint32),
        ('min_height', ctypes.c_uint32), ('max_height', ctypes.c_uint32),
    ]
lib = ctypes.CDLL('libdrm.so.2')
lib.drmSetMaster.argtypes = [ctypes.c_int]
lib.drmDropMaster.argtypes = [ctypes.c_int]
lib.drmModeGetResources.restype = ctypes.POINTER(Res)
lib.drmModeSetCursor.argtypes = [ctypes.c_int, ctypes.c_uint32, ctypes.c_uint32, ctypes.c_uint32, ctypes.c_uint32]
ok = False
for card in ('/dev/dri/card1', '/dev/dri/card0'):
    if not os.path.exists(card):
        continue
    fd = os.open(card, os.O_RDWR)
    got = False
    try:
        if lib.drmSetMaster(fd) != 0:
            continue
        got = True
        res = lib.drmModeGetResources(fd)
        if res:
            for i in range(res.contents.count_crtcs):
                if lib.drmModeSetCursor(fd, res.contents.crtcs[i], 0, 0, 0) == 0:
                    ok = True
            lib.drmModeFreeResources(res)
    finally:
        if got:
            lib.drmDropMaster(fd)
        os.close(fd)
sys.exit(0 if ok else 1)
PY
}
# Cage calls wlr_cursor_set_xcursor and puts a 64x64 arrow at the center of
# HDMI. CSS and a blank Xcursor theme do not stop that. This library makes
# those calls clear the cursor instead, and it is loaded only into Cage.
install_cursor_hook() {
  local dir=/usr/local/lib/cue-companion
  local src="\$dir/hide-cursor.c"
  local so="\$dir/hide-cursor.so"
  cat > "\$src" << 'EOF'
#define _GNU_SOURCE
#include <dlfcn.h>
#include <stdint.h>
static void hide(void *cursor) {
	void (*unset)(void *) = dlsym(RTLD_NEXT, "wlr_cursor_unset_image");
	if (unset && cursor) unset(cursor);
}
void wlr_cursor_set_xcursor(void *cursor, void *manager, const char *name) {
	(void)manager;
	(void)name;
	hide(cursor);
}
void wlr_cursor_set_surface(void *cursor, void *surface, int32_t hx, int32_t hy) {
	(void)surface;
	(void)hx;
	(void)hy;
	hide(cursor);
}
EOF
  if [ ! -s "\$so" ] || [ "\$src" -nt "\$so" ]; then
    if ! command -v gcc >/dev/null 2>&1; then
      DEBIAN_FRONTEND=noninteractive apt-get install -y gcc >/dev/null 2>&1 || true
    fi
    gcc -shared -fPIC -o "\$so" "\$src" -ldl >/dev/null 2>&1 || true
  fi
  cat > "\$dir/chromium-stage.sh" << 'EOF'
#!/bin/bash
unset LD_PRELOAD
exec /usr/bin/chromium "$@"
EOF
  chmod 755 "\$dir/chromium-stage.sh"
}
install_cursor_hook
for _try in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20; do
  if python3 - "\$PORT" <<'PY'
import sys, urllib.request
port = sys.argv[1]
urllib.request.urlopen('http://127.0.0.1:%s/blank-cursor.png' % port, timeout=2).read()
PY
  then
    break
  fi
  sleep 1
done
# Drop the running stage first. The cursor clear can only take the display
# while Cage is not already its owner.
pkill -f cue-chrome-root >/dev/null 2>&1 || true
sleep 0.3
pkill -x cage >/dev/null 2>&1 || true
sleep 0.4
for _try in 1 2 3 4 5 6; do
  systemctl stop getty@tty1.service >/dev/null 2>&1 || true
  if hide_hdmi_cursor; then
    break
  fi
  sleep 0.5
done
URL="http://127.0.0.1:\${PORT}/stage?screen=0&fs=1&pi=1"
CHROME=/usr/bin/chromium
if [ -s /usr/local/lib/cue-companion/hide-cursor.so ]; then
  export LD_PRELOAD=/usr/local/lib/cue-companion/hide-cursor.so
  CHROME=/usr/local/lib/cue-companion/chromium-stage.sh
fi
setsid nohup cage -- "\$CHROME" \\
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
systemctl unmask getty@tty1.service >/dev/null 2>&1 || true
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

export function renderPiLaunchScript(): string {
	return launchScript()
}

export async function relaunchPiStageKiosk(port: number, log: PiKioskLog): Promise<PiKioskResult> {
	if (!isRaspberryPi()) return { ok: true, message: '' }
	if (!fs.existsSync(LAUNCH_SCRIPT)) {
		return ensurePiStageKiosk({ port, disabled: [], scriptDir: '', log })
	}
	log('info', 'Restarting the HDMI stage for the selected audio output.')
	const launched = await runPrivileged([LAUNCH_SCRIPT, String(port)], undefined, 45000)
	if (launched.code !== 0) {
		const message = launched.output || 'The HDMI stage did not restart on the selected audio output.'
		log('error', message)
		return { ok: false, message }
	}
	return { ok: true, message: launched.output || 'HDMI stage restarted on the selected audio output.' }
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
	const launched = await runPrivileged([LAUNCH_SCRIPT, String(port)], undefined, 45000)
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
