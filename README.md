# Cue Companion — Bitfocus Companion Module

**Cue Companion** is a self-contained Show Control & Media Playback Workspace built directly into **Bitfocus Companion**.

It provides a browser-based cue list and show-control engine with multi-screen stage video output, dynamic background gradients, WebAudio synthesis and playback, timeline cropping/scrubbing, fade curves, and native Companion button triggers.

---

## Features

- **Audio Cues**: Play `.mp3`, `.wav`, `.ogg`, `.flac`, `.m4a`, or built-in WebAudio synth presets (`synth:warm_pad`, `synth:chime`, `synth:stinger`, `synth:440`) with dB volume, stereo pan, in/out crop points, loop modes, waveform display, and live fade envelopes.
- **Video Cues**: Play video files routed to one or more borderless fullscreen **Stage Output Windows** across connected displays/projectors, including *One-Shot*, *Infinite Loop*, and *Pause at Last Frame* modes.
- **Background Cues**: Render solid colors, linear gradients, or radial gradients on the Stage Output Window with smooth transition fades.
- **Companion Button Cues**: Trigger any Bitfocus Companion button (`Page / Row / Column`) directly from your cue sequence.
- **Fade Cues**: Smoothly fade the volume (dB) or visual opacity of another running cue over a specified duration, with optional *Stop target when done*.
- **Wait, Group, Network, Stop & Goto Cues**: Full show-control sequencing with *Auto-Continue* (`→`), *Auto-Follow* (`⚓`), and collapsible Group cues.

---

## Installation & Distribution Options

### Option 1: Import Module Package into Bitfocus Companion (`.tgz`)
1. Open the **Bitfocus Companion** admin UI (`http://localhost:8000`).
2. Navigate to the **Modules** tab.
3. Click **Import module package** and select **`cue-companion-1.0.0.tgz`**.
4. Add a new **Cue Companion** connection under **Connections**.

### Option 2: Direct Installed Module Folder
Copy the **`cue-companion-1.0.0`** folder directly into your Companion modules directory:
- **Windows**: `%APPDATA%\companion\modules\cue-companion-1.0.0`
- **macOS**: `~/Library/Application Support/companion/modules/cue-companion-1.0.0`
- **Linux**: `~/.config/companion/modules/cue-companion-1.0.0`

Then restart Bitfocus Companion.

---

## Opening the Cue Companion Web Workspace

Once the connection is enabled in Companion:
- Click the green **🎬 Open Cue Companion UI ↗** button inside the connection settings, or
- Open your browser to **`http://<companion-ip>:8090`** (default port `8090`).

### Keyboard Shortcuts in the Web Workspace
- **`Space`**: **GO** (Fire standby cue & advance playhead)
- **`Esc`**: **PANIC** (Press once to fade out all active cues; double-press to hard cut immediately)
- **`Up` / `Down` Arrows**: Move Standby Playhead up or down (`Shift + Up/Down` to multi-select cues)
- **`P`**: Pause / Resume all active cues
- **`Delete` / `Backspace`**: Delete selected cue(s)

