## Cue Companion for Bitfocus Companion

An advanced, self-contained **Show Control & Media Playback Workspace** built directly into Bitfocus Companion.

### Opening the Cue Companion Web Workspace
Once enabled, open your browser to:
**`http://10.101.10.100:8090`** (or `http://localhost:8090`)

### Supported Cue Types
- **Audio Cue**: Plays `.mp3`, `.wav`, `.ogg`, `.flac`, `.m4a` (or built-in synthesized tones) with WebAudio volume (dB), pan, trim, looping, waveform visualization, and live fade curves.
- **Video Cue**: Plays video files with an optional pop-out **Stage Output Window** for secondary monitors/projectors.
- **Background Cue**: Renders solid colors, linear gradients, or radial gradients on the Stage Output Window with configurable transition fades.
- **Companion Button Cue**: Triggers any Bitfocus Companion button (`Page / Row / Column`) as part of your cue stack.
- **Fade Cue**: Smoothly fades the volume (dB) or opacity of another running cue over the Action duration, with optional *Stop target when done*.
- **Wait Cue**: Timed countdown pause in a cue sequence.
- **Group Cue**: Organizes cues into collapsible groups (*Start all children simultaneously*, *Start first child and go to next*, or *Sequential*).
- **Network Cue**: Sends HTTP GET/POST/PUT requests to external devices or webhooks.
- **Goto / Stop Cue**: Stops a target cue or jumps the standby playhead to another cue number.

### Keyboard Shortcuts in the Cue Companion Web UI
- **`Space`**: **GO** (Fire standby cue & advance playhead)
- **`Esc`**: **PANIC** (Press once to fade out all active cues; double-press to hard stop immediately)
- **`Up` / `Down` Arrows**: Move Standby Playhead up or down
- **`P`**: Pause / Resume all active cues


