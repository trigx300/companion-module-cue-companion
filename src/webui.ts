export function GetCueCompanionWebUiHtml(): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Cue Companion — Bitfocus Companion</title>
<style>
	:root {
		--bg-darkest: #141518;
		--bg-panel: #1e2025;
		--bg-header: #262930;
		--bg-row: #1b1d22;
		--bg-row-alt: #202329;
		--bg-row-selected: #283a5e;
		--bg-row-standby: #3d3118;
		--border-color: #32363f;
		--text-main: #e6e8ec;
		--text-muted: #8b92a0;
		--cc-green: #1db954;
		--cc-green-bright: #25e066;
		--cc-amber: #f59e0b;
		--cc-red: #ef4444;
		--cc-blue: #3b82f6;
		--cc-cyan: #06b6d4;
		--cc-purple: #a855f7;
	}
	* {
		box-sizing: border-box;
		user-select: none;
	}
	body {
		margin: 0;
		padding: 0;
		background: var(--bg-darkest);
		color: var(--text-main);
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
		font-size: 13px;
		height: 100vh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	/* TOP TRANSPORT & STANDBY HEADER */
	.top-bar {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 10px 14px;
		background: linear-gradient(180deg, #2b2e37 0%, #1f2127 100%);
		border-bottom: 1px solid #0e0f12;
		box-shadow: 0 2px 8px rgba(0,0,0,0.4);
		height: 86px;
		flex-shrink: 0;
	}
	.go-btn {
		width: 132px;
		height: 66px;
		border-radius: 8px;
		border: 2px solid #2ee66b;
		background: linear-gradient(180deg, #24c95c 0%, #13883b 100%);
		color: #ffffff;
		font-size: 28px;
		font-weight: 800;
		letter-spacing: 2px;
		cursor: pointer;
		box-shadow: 0 4px 14px rgba(29, 185, 84, 0.35), inset 0 1px 1px rgba(255,255,255,0.35);
		transition: transform 0.06s ease, filter 0.1s ease;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
	.go-btn span.sub {
		font-size: 10px;
		font-weight: 600;
		letter-spacing: 0.8px;
		opacity: 0.85;
		margin-top: -2px;
	}
	.go-btn:hover {
		filter: brightness(1.08);
	}
	.go-btn:active, .go-btn.flash {
		transform: scale(0.97);
		filter: brightness(1.22);
	}

	.standby-display {
		flex: 1;
		height: 66px;
		background: #131519;
		border: 1px solid #353944;
		border-radius: 6px;
		padding: 8px 14px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		overflow: hidden;
		box-shadow: inset 0 2px 6px rgba(0,0,0,0.6);
	}
	.standby-left {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}
	.standby-top {
		display: flex;
		align-items: baseline;
		gap: 10px;
	}
	.standby-badge {
		background: var(--cc-amber);
		color: #000;
		font-weight: 800;
		font-size: 11px;
		padding: 2px 6px;
		border-radius: 3px;
		letter-spacing: 0.5px;
	}
	.standby-qnum {
		font-family: "Consolas", "SF Mono", monospace;
		font-size: 18px;
		font-weight: 700;
		color: var(--cc-amber);
	}
	.standby-title {
		font-size: 18px;
		font-weight: 600;
		color: #fff;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.standby-notes {
		font-size: 12px;
		color: var(--text-muted);
		margin-top: 4px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* TOP RIGHT TRT READOUT (Inside Standby/Media Header) */
	.standby-trt-box {
		display: flex;
		align-items: center;
		gap: 14px;
		padding-left: 16px;
		border-left: 1px solid #2b2f3a;
		flex-shrink: 0;
	}
	.trt-col {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
	}
	.trt-label {
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.8px;
		color: var(--text-muted);
		text-transform: uppercase;
	}
	.trt-value {
		font-family: "Consolas", "SF Mono", monospace;
		font-size: 20px;
		font-weight: 700;
		color: #ffffff;
		line-height: 1.15;
	}
	.trt-value.remaining {
		color: var(--cc-green-bright);
	}
	.trt-value.paused {
		color: var(--cc-amber);
	}
	.trt-sub-badge {
		font-family: "Consolas", monospace;
		font-size: 10px;
		color: var(--cc-cyan);
		margin-top: 2px;
	}

	.transport-cluster {
		display: flex;
		gap: 6px;
		align-items: center;
	}
	.t-btn {
		height: 54px;
		min-width: 64px;
		padding: 0 10px;
		border-radius: 6px;
		border: 1px solid #3c414d;
		background: #272a32;
		color: var(--text-main);
		font-size: 11px;
		font-weight: 600;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 4px;
	}
	.t-btn:hover {
		background: #323641;
	}
	.t-btn.panic {
		border-color: #992323;
		background: linear-gradient(180deg, #5c1919 0%, #3b1010 100%);
		color: #ff9c9c;
	}
	.t-btn.panic:hover {
		background: #7c2020;
		color: #fff;
	}
	.t-btn.paused-active {
		background: var(--cc-amber);
		color: #000;
		border-color: #fbbf24;
	}
	.t-btn .icon {
		font-size: 16px;
	}

	/* VU METER & MASTER GAIN */
	.master-box {
		display: flex;
		align-items: center;
		gap: 10px;
		background: #131519;
		border: 1px solid #353944;
		border-radius: 6px;
		padding: 6px 10px;
		height: 66px;
	}
	.vu-meters {
		display: flex;
		gap: 3px;
		height: 50px;
		align-items: flex-end;
	}
	.vu-bar-wrap {
		width: 8px;
		height: 50px;
		background: #0a0b0d;
		border-radius: 2px;
		overflow: hidden;
		display: flex;
		flex-direction: column-reverse;
	}
	.vu-bar {
		width: 100%;
		height: 0%;
		background: linear-gradient(0deg, #1db954 0%, #1db954 70%, #f59e0b 88%, #ef4444 100%);
		transition: height 0.05s linear;
	}

	/* CUE CREATION TOOLBAR */
	.cue-toolbar {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 14px;
		background: #1c1e24;
		border-bottom: 1px solid var(--border-color);
		flex-shrink: 0;
		flex-wrap: wrap;
	}
	.tool-btn {
		padding: 5px 10px;
		background: #282b34;
		border: 1px solid #3a3f4b;
		border-radius: 4px;
		color: var(--text-main);
		font-size: 12px;
		font-weight: 500;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 5px;
	}
	.tool-btn:hover {
		background: #353945;
		border-color: #505768;
	}
	.tool-sep {
		width: 1px;
		height: 20px;
		background: var(--border-color);
		margin: 0 4px;
	}
	.sel-badge {
		font-size: 11px;
		color: var(--cc-cyan);
		font-weight: 600;
		margin-left: auto;
	}

	/* MAIN WORKSPACE SPLIT: CUE LIST + ACTIVE CUES SIDEBAR */
	.workspace-main {
		flex: 1;
		display: flex;
		overflow: hidden;
	}
	.cuelist-container {
		flex: 1;
		overflow-y: auto;
		background: var(--bg-row);
		position: relative;
	}

	table.cuelist {
		width: 100%;
		border-collapse: collapse;
		table-layout: fixed;
	}
	table.cuelist thead th {
		position: sticky;
		top: 0;
		background: #252830;
		color: var(--text-muted);
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		padding: 6px 8px;
		border-bottom: 1px solid var(--border-color);
		border-right: 1px solid #2e323b;
		text-align: left;
		z-index: 5;
	}
	table.cuelist tbody tr {
		height: 30px;
		border-bottom: 1px solid #24272e;
		cursor: pointer;
		transition: background 0.05s;
	}
	table.cuelist tbody tr:nth-child(even) {
		background: var(--bg-row-alt);
	}
	table.cuelist tbody tr.standby-row {
		background: var(--bg-row-standby) !important;
	}
	table.cuelist tbody tr.selected-row {
		background: var(--bg-row-selected) !important;
	}
	table.cuelist tbody tr.selected-primary {
		outline: 1px solid #60a5fa;
	}
	table.cuelist tbody tr.disarmed {
		opacity: 0.45;
		text-decoration: line-through;
	}

	/* Cue Row Color Tints */
	tr.color-red td.name-cell { border-left: 4px solid #ef4444; }
	tr.color-orange td.name-cell { border-left: 4px solid #f97316; }
	tr.color-yellow td.name-cell { border-left: 4px solid #eab308; }
	tr.color-green td.name-cell { border-left: 4px solid #22c55e; }
	tr.color-blue td.name-cell { border-left: 4px solid #3b82f6; }
	tr.color-purple td.name-cell { border-left: 4px solid #a855f7; }

	table.cuelist td {
		padding: 0 8px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		border-right: 1px solid #23262d;
		position: relative;
		height: 30px;
	}
	td.playhead-cell {
		width: 28px;
		text-align: center;
		font-size: 14px;
		color: var(--cc-amber);
		font-weight: bold;
	}
	td.status-cell {
		width: 32px;
		text-align: center;
		font-size: 13px;
	}
	td.qnum-cell {
		width: 65px;
		font-family: "Consolas", "SF Mono", monospace;
		font-weight: 600;
		color: #c8cdd6;
	}
	td.target-cell {
		width: 195px;
		color: var(--text-muted);
		font-size: 12px;
	}
	td.time-cell {
		width: 102px;
		font-family: "Consolas", "SF Mono", monospace;
		font-size: 12px;
		text-align: right;
	}
	td.cont-cell {
		width: 38px;
		text-align: center;
		font-size: 14px;
		color: var(--text-muted);
	}
	td.cont-cell:hover {
		color: #fff;
		background: rgba(255,255,255,0.06);
	}

	/* Live Progress Fill Bars inside Time Cells */
	.cell-progress {
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 0%;
		pointer-events: none;
		z-index: 0;
	}
	.cell-progress.pre { background: rgba(245, 158, 11, 0.35); }
	.cell-progress.act { background: rgba(29, 185, 84, 0.38); }
	.cell-progress.act.paused { background: rgba(245, 158, 11, 0.42); }
	.cell-progress.post { background: rgba(59, 130, 246, 0.35); }
	.cell-text {
		position: relative;
		z-index: 1;
	}

	/* RIGHT SIDEBAR: ACTIVE CUES DRAWER */
	.active-sidebar {
		width: 295px;
		background: #17191e;
		border-left: 1px solid var(--border-color);
		display: flex;
		flex-direction: column;
		flex-shrink: 0;
	}
	.sidebar-header {
		padding: 8px 12px;
		background: #22252c;
		border-bottom: 1px solid var(--border-color);
		font-weight: 700;
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.6px;
		color: var(--text-muted);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.active-list {
		flex: 1;
		overflow-y: auto;
		padding: 10px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.active-card {
		background: #232730;
		border: 1px solid #383e4c;
		border-radius: 6px;
		padding: 8px 10px;
	}
	.active-card-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-weight: 600;
		margin-bottom: 6px;
		gap: 4px;
	}
	.active-bar-bg {
		height: 8px;
		background: #121418;
		border-radius: 4px;
		overflow: hidden;
		margin-bottom: 6px;
	}
	.active-bar-fill {
		height: 100%;
		background: var(--cc-green);
		width: 0%;
		transition: width 0.08s linear;
	}
	.active-bar-fill.paused {
		background: var(--cc-amber);
	}
	.active-card-meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-family: "Consolas", monospace;
		font-size: 11px;
		color: var(--text-muted);
	}

	/* BOTTOM INSPECTOR DRAWER */
	.inspector {
		height: 240px;
		background: var(--bg-panel);
		border-top: 2px solid #0e0f12;
		display: flex;
		flex-direction: column;
		flex-shrink: 0;
	}
	.inspector-tabs {
		display: flex;
		background: #252830;
		border-bottom: 1px solid var(--border-color);
		padding: 0 12px;
		gap: 4px;
		align-items: center;
	}
	.insp-tab {
		padding: 7px 14px;
		font-size: 12px;
		font-weight: 600;
		color: var(--text-muted);
		cursor: pointer;
		border-bottom: 2px solid transparent;
	}
	.insp-tab.active {
		color: #fff;
		border-bottom-color: var(--cc-amber);
		background: rgba(255,255,255,0.03);
	}
	.inspector-body {
		flex: 1;
		padding: 12px 16px;
		overflow-y: auto;
		display: flex;
		gap: 20px;
		align-items: flex-start;
	}
	.form-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(185px, 1fr));
		gap: 10px 14px;
		flex: 1;
	}
	.field {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.field label {
		font-size: 11px;
		color: var(--text-muted);
		font-weight: 600;
	}
	.field input, .field select {
		background: #14161a;
		border: 1px solid #383d48;
		border-radius: 4px;
		color: #fff;
		padding: 5px 8px;
		font-size: 12px;
		user-select: text;
	}
	.waveform-box {
		width: 440px;
		height: 155px;
		background: #121418;
		border: 1px solid #333842;
		border-radius: 6px;
		display: flex;
		flex-direction: column;
		padding: 8px;
		flex-shrink: 0;
		gap: 4px;
	}
	canvas#waveformCanvas, canvas#trimTimelineCanvas {
		width: 100%;
		height: 85px;
		background: #0d0f12;
		border-radius: 4px;
		cursor: ew-resize;
	}
	.scrubber-controls {
		display: flex;
		align-items: center;
		gap: 6px;
		font-family: "Consolas", "SF Mono", monospace;
		font-size: 11px;
		color: #e2e8f0;
	}
	.scrubber-btn {
		background: #232730;
		border: 1px solid #3b4252;
		color: #e2e8f0;
		border-radius: 4px;
		padding: 3px 6px;
		font-size: 10px;
		font-weight: 700;
		cursor: pointer;
	}
	.scrubber-btn:hover {
		background: #333947;
		border-color: #64748b;
	}
	.scrubber-btn.crop-btn {
		background: #172b3a;
		border-color: #06b6d4;
		color: #67e8f9;
	}
	.scrubber-btn.crop-btn:hover {
		background: #1e3a4c;
	}
	.screen-Modal {
		position: fixed;
		inset: 0;
		background: rgba(0,0,0,0.72);
		display: none;
		align-items: center;
		justify-content: center;
		z-index: 9999;
	}
	.screen-Modal.open {
		display: flex;
	}
	.screen-modal-card {
		background: #1c1f26;
		border: 1px solid #3b4252;
		border-radius: 8px;
		width: 560px;
		max-width: 94vw;
		padding: 16px;
		box-shadow: 0 20px 50px rgba(0,0,0,0.7);
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.screen-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: #13161b;
		border: 1px solid #2e3440;
		border-radius: 6px;
		padding: 10px 12px;
	}
</style>
</head>
<body>

	<!-- BACKGROUND COLOR / GRADIENT CREATOR & EDITOR MODAL -->
	<div class="screen-Modal" id="bgCreatorModal">
		<div class="screen-modal-card" style="width:520px;">
			<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #2e3440;padding-bottom:8px;">
				<div style="font-weight:700;font-size:14px;" id="bgModalHeaderTitle">🎨 Configure Background Color / Gradient</div>
				<button class="tool-btn" onclick="closeBgModal()">✕ Close</button>
			</div>

			<div id="bgModalLivePreview" style="width:100%;height:96px;border-radius:6px;border:1px solid #475569;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;color:rgba(255,255,255,0.9);text-shadow:0 1px 4px rgba(0,0,0,0.85);">
				LIVE STAGE BACKGROUND PREVIEW
			</div>

			<div class="form-grid" style="grid-template-columns:1fr 1fr;gap:10px;">
				<div class="field" style="grid-column: span 2;">
					<label>Cue Name</label>
					<input type="text" id="bgModalName" value="Stage Background Look" oninput="updateBgModalPreview()" />
				</div>
				<div class="field">
					<label>Background Style</label>
					<select id="bgModalStyle" onchange="updateBgModalPreview()">
						<option value="solid">Solid Color</option>
						<option value="linear-gradient" selected>Linear Gradient</option>
						<option value="radial-gradient">Radial Gradient</option>
					</select>
				</div>
				<div class="field" id="bgModalAngleWrap">
					<label>Gradient Angle (<span id="bgModalAngleLbl">135</span>°)</label>
					<input type="range" id="bgModalAngle" min="0" max="360" step="5" value="135" oninput="updateBgModalPreview()" />
				</div>
				<div class="field">
					<label>Primary Color</label>
					<div style="display:flex;gap:6px;align-items:center;">
						<input type="color" id="bgModalColor1" value="#0f172a" style="width:48px;height:32px;padding:2px;cursor:pointer;" oninput="document.getElementById('bgModalColor1Hex').value=this.value;updateBgModalPreview()" />
						<input type="text" id="bgModalColor1Hex" value="#0f172a" style="flex:1;" oninput="document.getElementById('bgModalColor1').value=this.value;updateBgModalPreview()" />
					</div>
				</div>
				<div class="field" id="bgModalColor2Wrap">
					<label>Secondary Gradient Color</label>
					<div style="display:flex;gap:6px;align-items:center;">
						<input type="color" id="bgModalColor2" value="#1e3a8a" style="width:48px;height:32px;padding:2px;cursor:pointer;" oninput="document.getElementById('bgModalColor2Hex').value=this.value;updateBgModalPreview()" />
						<input type="text" id="bgModalColor2Hex" value="#1e3a8a" style="flex:1;" oninput="document.getElementById('bgModalColor2').value=this.value;updateBgModalPreview()" />
					</div>
				</div>
				<div class="field">
					<label>Transition Fade-In Time (s)</label>
					<input type="number" id="bgModalFadeIn" step="0.1" min="0" value="1.0" />
				</div>
				<div class="field">
					<label>Target Stage Screen(s)</label>
					<select id="bgModalTargetScreens">
						<option value="all">All Active Stage Screens</option>
						<option value="0">Screen 1 (Primary)</option>
						<option value="1">Screen 2 (Secondary)</option>
					</select>
				</div>
			</div>

			<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
				<span style="font-size:11px;color:var(--text-muted);margin-right:4px;">Quick Presets:</span>
				<button class="scrubber-btn" onclick="applyBgPreset('solid','#000000','#000000',0,'Blackout Background')">⬛ Blackout</button>
				<button class="scrubber-btn" onclick="applyBgPreset('linear-gradient','#0f172a','#1e3a8a',135,'Deep Royal Blue Gradient')">🟦 Royal Blue</button>
				<button class="scrubber-btn" onclick="applyBgPreset('linear-gradient','#3b0764','#be185d',125,'Sunset Magenta Gradient')">🟪 Sunset</button>
				<button class="scrubber-btn" onclick="applyBgPreset('radial-gradient','#14532d','#022c22',135,'Emerald Stage Glow')">🟩 Emerald</button>
				<button class="scrubber-btn" onclick="applyBgPreset('linear-gradient','#7c2d12','#f59e0b',145,'Warm Amber Wash')">🟧 Warm Amber</button>
			</div>

			<div style="display:flex;justify-content:flex-end;gap:8px;border-top:1px solid #2e3440;padding-top:10px;">
				<button class="tool-btn" onclick="closeBgModal()">Cancel</button>
				<button class="tool-btn" style="background:#14532d;border-color:#22c55e;font-weight:700;" id="bgModalSaveBtn" onclick="saveBgModalCue()">✓ Save Background to Playlist</button>
			</div>
		</div>
	</div>

	<!-- VIDEO DISPLAY / MULTISCREEN ROUTING MODAL -->
	<div class="screen-Modal" id="screenManagerModal">
		<div class="screen-modal-card">
			<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #2e3440;padding-bottom:8px;">
				<div style="font-weight:700;font-size:14px;">🖥️ Video Stage Output & Multi-Screen Assignment</div>
				<button class="tool-btn" onclick="closeScreenModal()">✕ Close</button>
			</div>
			<div style="font-size:12px;color:var(--text-muted);line-height:1.4;">
				Select which display(s) to launch the borderless Video / Background Stage Output on, or click <b>Fullscreen</b> on any active stage window.
			</div>
			<div id="detectedScreensList" style="display:flex;flex-direction:column;gap:8px;max-height:280px;overflow-y:auto;"></div>
			<div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid #2e3440;padding-top:10px;">
				<button class="tool-btn" onclick="detectDisplays(true)">🔄 Detect Connected Screens</button>
				<div style="display:flex;gap:8px;">
					<button class="tool-btn" style="background:#172b3a;border-color:#06b6d4;" onclick="launchStageOnSelectedScreens(false)">🪟 Open Stage on Selected</button>
					<button class="tool-btn" style="background:#14532d;border-color:#22c55e;" onclick="launchStageOnSelectedScreens(true)">⛶ Launch & Fullscreen Selected</button>
				</div>
			</div>
		</div>
	</div>

	<!-- TOP CUE COMPANION HEADER -->
	<div class="top-bar">
		<div style="display:flex;flex-direction:column;justify-content:center;padding-right:6px;border-right:1px solid #383d48;">
			<div style="font-size:15px;font-weight:900;letter-spacing:0.6px;color:#fff;white-space:nowrap;">🎬 CUE COMPANION</div>
			<div style="font-size:10px;color:var(--cc-cyan);font-weight:700;letter-spacing:0.5px;">SHOW CONTROL ENGINE</div>
		</div>
		<button class="go-btn" id="goBtn" onclick="sendTransport('go')" title="Shortcut: Spacebar">
			GO
			<span class="sub">SPACEBAR</span>
		</button>

		<div class="standby-display">
			<div class="standby-left">
				<div class="standby-top">
					<span class="standby-badge" id="standbyBadge">STANDBY</span>
					<span class="standby-qnum" id="standbyQNum">Q 1</span>
					<span class="standby-title" id="standbyTitle">Loading Cue List...</span>
				</div>
				<div class="standby-notes" id="standbyNotes">Select a cue or press Spacebar to fire</div>
			</div>

			<!-- TRT & REMAINING TIME DISPLAY TO THE RIGHT OF MEDIA TITLE / INFO -->
			<div class="standby-trt-box">
				<div class="trt-col">
					<span class="trt-label">TRT (Total)</span>
					<span class="trt-value" id="topTrtVal">00:00.0</span>
					<span class="trt-sub-badge" id="topPauseAtBadge"></span>
				</div>
				<div class="trt-col">
					<span class="trt-label" id="topRemLabel">Remaining</span>
					<span class="trt-value remaining" id="topRemVal">00:00.0</span>
				</div>
			</div>
		</div>

		<div class="transport-cluster">
			<button class="t-btn" onclick="sendTransport('prev')" title="Shortcut: Up Arrow">
				<span class="icon">▲</span>
				<span>Prev</span>
			</button>
			<button class="t-btn" onclick="sendTransport('next')" title="Shortcut: Down Arrow">
				<span class="icon">▼</span>
				<span>Next</span>
			</button>
			<button class="t-btn" id="pauseBtn" onclick="sendTransport('pause_toggle')" title="Shortcut: P">
				<span class="icon">⏸</span>
				<span>Pause</span>
			</button>
			<button class="t-btn panic" onclick="sendTransport('panic')" title="Shortcut: Esc (1x Fade, 2x Cut)">
				<span class="icon">🛑</span>
				<span>PANIC</span>
			</button>
		</div>

		<div class="master-box">
			<div class="vu-meters">
				<div class="vu-bar-wrap"><div class="vu-bar" id="vuL"></div></div>
				<div class="vu-bar-wrap"><div class="vu-bar" id="vuR"></div></div>
			</div>
			<div style="display:flex;flex-direction:column;gap:4px;">
				<label style="font-size:10px;color:var(--text-muted);font-weight:700;">MASTER: <span id="masterDbLabel">0.0 dB</span></label>
				<input type="range" id="masterSlider" min="-60" max="12" step="0.5" value="0" style="width:90px;" oninput="onMasterVolChange(this.value)" />
				<span id="clockReadout" style="font-family:Consolas,monospace;font-size:11px;color:var(--text-muted);">00:00:00</span>
			</div>
		</div>
	</div>

	<!-- CUE CREATION TOOLBAR -->
	<div class="cue-toolbar">
		<button class="tool-btn" onclick="addCue('audio')">🔊 + Audio</button>
		<button class="tool-btn" onclick="addCue('video')">🎬 + Video</button>
		<button class="tool-btn" style="background:#1e293b;border-color:#38bdf8;" onclick="openBgCreatorModal(null)" title="Add solid color or gradient background to playlist">🎨 + Background</button>
		<button class="tool-btn" onclick="addCue('companion')">🎛️ + Companion Btn</button>
		<button class="tool-btn" onclick="addCue('fade')" title="Auto-targets selected cue">📈 + Fade</button>
		<button class="tool-btn" onclick="addCue('stop')" title="Auto-targets selected cue">🛑 + Stop</button>
		<button class="tool-btn" onclick="addCue('wait')">⏱️ + Wait</button>
		<button class="tool-btn" onclick="addCue('group')" id="groupToolBtn" title="Select multiple cues with Shift+Click or Shift+Arrows, then click to wrap in Group!">📁 + Group</button>
		<button class="tool-btn" onclick="addCue('network')">🌐 + Network</button>
		<button class="tool-btn" onclick="addCue('goto')" title="Auto-targets selected cue">↪️ + Goto</button>
		<div class="tool-sep"></div>
		<button class="tool-btn" onclick="moveSelectedCue(-1)">⬆️ Move Up</button>
		<button class="tool-btn" onclick="moveSelectedCue(1)">⬇️ Move Down</button>
		<button class="tool-btn" onclick="duplicateSelectedCue()">📋 Duplicate</button>
		<button class="tool-btn" style="color:#ff8a8a;" onclick="deleteSelectedCue()">🗑️ Delete</button>
		<div class="tool-sep"></div>
		<label class="tool-btn" style="cursor:pointer;">
			📂 Upload Audio/Video
			<input type="file" id="mediaUploadInput" accept="audio/*,video/*" style="display:none;" onchange="uploadMediaFile(this)" />
		</label>
		<button class="tool-btn" style="background:#172b3a;border-color:#06b6d4;" onclick="openScreenModal()">🖥️ Video Output & Screens</button>
		<span class="sel-badge" id="selCountBadge"></span>
	</div>

	<!-- MAIN CUE TABLE + ACTIVE CUES CART -->
	<div class="workspace-main">
		<div class="cuelist-container">
			<table class="cuelist">
				<thead>
					<tr>
						<th style="width:28px;">►</th>
						<th style="width:32px;"></th>
						<th style="width:65px;">Number</th>
						<th>Cue Name</th>
						<th style="width:195px;">Target</th>
						<th style="width:102px;text-align:right;">Pre-Wait</th>
						<th style="width:102px;text-align:right;">Action (TRT)</th>
						<th style="width:102px;text-align:right;">Post-Wait</th>
						<th style="width:38px;text-align:center;" title="Auto-Continue / Auto-Follow">Cont</th>
					</tr>
				</thead>
				<tbody id="cueTableBody"></tbody>
			</table>
		</div>

		<div class="active-sidebar">
			<div class="sidebar-header">
				<span>Active Cues (<span id="activeCountBadge">0</span>)</span>
				<span style="color:var(--cc-green);font-size:10px;">● LIVE SYNC</span>
			</div>
			<div class="active-list" id="activeCuesList"></div>
		</div>
	</div>

	<!-- BOTTOM INSPECTOR -->
	<div class="inspector">
		<div class="inspector-tabs">
			<div class="insp-tab active" onclick="switchTab('basics', this)">Basics & Target</div>
			<div class="insp-tab" onclick="switchTab('timing', this)">Timeline Crop, Scrub & Loops</div>
			<div class="insp-tab" onclick="switchTab('levels', this)">Levels, Visuals & Displays</div>
			<div style="margin-left:auto;font-size:11px;color:var(--text-muted);" id="inspSelectedTitle">No Cue Selected</div>
		</div>
		<div class="inspector-body" id="inspectorContent"></div>
	</div>

<script>
	let cues = [];
	let mediaFiles = [];
	let standbyCueId = null;
	let selectedCueId = null;
	let anchorCueId = null;
	const selectedCueIds = new Set();

	let isPaused = false;
	let masterVolumeDb = 0;
	let currentTab = 'basics';
	let previewPlayheadSec = 0; // Scrubber playhead in source media seconds

	// Multi-Screen Stage Output Management
	const stageWindows = new Map(); // screenIdx -> Window
	let activeNativeStageScreens = new Set(); // screenIdx launched natively by backend
	let detectedScreens = [
		{ index: 0, label: 'Screen 1 (Primary Display)', left: 0, top: 0, width: 1920, height: 1080, isPrimary: true }
	];
	const selectedStageScreenIndices = new Set([0]);
	const stageBc = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('cue_companion_stage_channel') : null;

	function broadcastToStage(msg) {
		if (stageBc) {
			try { stageBc.postMessage(msg); } catch {}
		}
		for (const [idx, win] of stageWindows.entries()) {
			if (win && !win.closed) {
				try { win.postMessage(msg, '*'); } catch {}
			} else {
				stageWindows.delete(idx);
			}
		}
		fetch('/api/stage/broadcast', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ message: msg })
		}).catch(() => {});
	}

	async function detectDisplays(requestPermission = false) {
		try {
			const res = await fetch('/api/screens');
			const data = await res.json();
			if (data && Array.isArray(data.screens) && data.screens.length > 0) {
				detectedScreens = data.screens;
				if (Array.isArray(data.activeStageScreens)) {
					activeNativeStageScreens = new Set(data.activeStageScreens);
				}
				renderScreenModalList();
				if (currentTab === 'levels' || currentTab === 'basics') renderInspector();
				return;
			}
		} catch (err) {
			console.warn('Backend screen detection fallback:', err);
		}

		try {
			if ('getScreenDetails' in window) {
				const details = await window.getScreenDetails();
				detectedScreens = details.screens.map((s, idx) => ({
					index: idx,
					label: (s.label || ('Display ' + (idx + 1))) + ' (' + s.width + 'x' + s.height + ')' + (s.isPrimary ? ' [Primary]' : ''),
					left: s.availLeft ?? s.left ?? 0,
					top: s.availTop ?? s.top ?? 0,
					width: s.availWidth ?? s.width ?? 1920,
					height: s.availHeight ?? s.height ?? 1080,
					isPrimary: !!s.isPrimary,
					rawScreen: s
				}));
			}
		} catch (e) {
			console.warn('Multi-screen enumeration fallback:', e);
		}
		renderScreenModalList();
		if (currentTab === 'levels' || currentTab === 'basics') renderInspector();
	}

	function openScreenModal() {
		document.getElementById('screenManagerModal').classList.add('open');
		detectDisplays(true);
	}

	function closeScreenModal() {
		document.getElementById('screenManagerModal').classList.remove('open');
	}

	function toggleStageScreenSelect(idx, checked) {
		if (checked) selectedStageScreenIndices.add(idx);
		else selectedStageScreenIndices.delete(idx);
		renderScreenModalList();
	}

	function renderScreenModalList() {
		const list = document.getElementById('detectedScreensList');
		if (!list) return;
		list.innerHTML = detectedScreens.map(s => {
			const isPopupOpen = stageWindows.has(s.index) && !stageWindows.get(s.index).closed;
			const isNativeOpen = activeNativeStageScreens.has(s.index);
			const isOpen = isPopupOpen || isNativeOpen;
			const isChecked = selectedStageScreenIndices.has(s.index);
			return \`
				<div class="screen-item">
					<label style="display:flex;align-items:center;gap:10px;cursor:pointer;font-size:13px;">
						<input type="checkbox" \${isChecked ? 'checked' : ''} onchange="toggleStageScreenSelect(\${s.index}, this.checked)" />
						<div>
							<div style="font-weight:700;color:#fff;">Screen \${s.index + 1}: \${s.label}</div>
							<div style="font-size:11px;color:var(--text-muted);">Position: (\${s.left}, \${s.top}) • Resolution: \${s.width}×\${s.height}</div>
						</div>
					</label>
					<div style="display:flex;gap:6px;align-items:center;">
						<span style="font-size:11px;color:\${isOpen ? '#25e066' : '#64748b'};font-weight:700;">\${isOpen ? '● ACTIVE' : '○ CLOSED'}</span>
						<button class="scrubber-btn" onclick="openStageOnScreen(\${s.index}, false)">🪟 Open Window</button>
						<button class="scrubber-btn crop-btn" onclick="openStageOnScreen(\${s.index}, true)">⛶ Fullscreen</button>
						\${isOpen ? \`<button class="scrubber-btn" style="color:#ff8a8a;border-color:#7f1d1d;" onclick="closeStageOnScreen(\${s.index})">✕ Close</button>\` : ''}
					</div>
				</div>
			\`;
		}).join('');
	}

	async function openStageOnScreen(screenIdx, goFullscreen) {
		try {
			const res = await fetch('/api/stage/launch', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ screenIndex: screenIdx, fullscreen: !!goFullscreen })
			});
			const data = await res.json();
			if (data && data.launched) {
				if (Array.isArray(data.activeStageScreens)) {
					activeNativeStageScreens = new Set(data.activeStageScreens);
				} else {
					activeNativeStageScreens.add(screenIdx);
				}
				renderScreenModalList();
				return;
			}
		} catch (e) {
			console.warn('Native stage launch fallback to window.open:', e);
		}

		const s = detectedScreens.find(d => d.index === screenIdx) || detectedScreens[0];
		const features = \`left=\${s.left},top=\${s.top},width=\${s.width},height=\${s.height},menubar=no,toolbar=no,location=no,status=no\`;
		const win = window.open('/stage?screen=' + screenIdx + (goFullscreen ? '&fs=1' : ''), 'CueCompanionStageScreen_' + screenIdx, features);
		if (win) {
			stageWindows.set(screenIdx, win);
			setTimeout(() => {
				try {
					win.moveTo(s.left, s.top);
					win.resizeTo(s.width, s.height);
					if (goFullscreen) {
						broadcastToStage({ type: 'request_fullscreen', targetScreens: String(screenIdx) });
					}
				} catch {}
				renderScreenModalList();
			}, 400);
		}
		renderScreenModalList();
	}

	async function closeStageOnScreen(screenIdx) {
		const win = stageWindows.get(screenIdx);
		if (win && !win.closed) {
			try { win.close(); } catch {}
		}
		stageWindows.delete(screenIdx);
		try {
			const res = await fetch('/api/stage/close', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ screenIndex: screenIdx })
			});
			const data = await res.json();
			if (data && Array.isArray(data.activeStageScreens)) {
				activeNativeStageScreens = new Set(data.activeStageScreens);
			} else {
				activeNativeStageScreens.delete(screenIdx);
			}
		} catch {}
		renderScreenModalList();
	}

	function launchStageOnSelectedScreens(goFullscreen) {
		if (selectedStageScreenIndices.size === 0) selectedStageScreenIndices.add(0);
		for (const idx of selectedStageScreenIndices) {
			openStageOnScreen(idx, goFullscreen);
		}
	}

	// WebAudio Engine
	let audioCtx = null;
	let masterGainNode = null;
	let analyserNode = null;
	const activeAudioNodes = new Map(); // cueId -> { oscs, gainNode, panNode, mediaEl }

	function ensureAudioCtx() {
		if (!audioCtx) {
			const AudioContextClass = window.AudioContext || window.webkitAudioContext;
			audioCtx = new AudioContextClass();
			masterGainNode = audioCtx.createGain();
			analyserNode = audioCtx.createAnalyser();
			analyserNode.fftSize = 256;
			masterGainNode.connect(analyserNode);
			analyserNode.connect(audioCtx.destination);
		}
		if (audioCtx.state === 'suspended') {
			audioCtx.resume();
		}
	}

	function dbToLinear(db) {
		if (db <= -60) return 0;
		return Math.pow(10, db / 20);
	}

	function formatTime(sec) {
		sec = Math.max(0, Number(sec) || 0);
		const m = Math.floor(sec / 60);
		const s = Math.floor(sec % 60);
		const d = Math.floor((sec - Math.floor(sec)) * 10);
		return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0') + '.' + d;
	}

	function cueTypeIcon(type) {
		switch (type) {
			case 'audio': return '🔊';
			case 'video': return '🎬';
			case 'background': return '🎨';
			case 'companion': return '🎛️';
			case 'fade': return '📈';
			case 'wait': return '⏱️';
			case 'group': return '📁';
			case 'network': return '🌐';
			case 'stop': return '🛑';
			case 'goto': return '↪️';
			default: return '•';
		}
	}

	function continueIcon(mode) {
		if (mode === 'auto_continue') return '→';
		if (mode === 'auto_follow') return '⚓';
		return '';
	}

	function getVisibleCues() {
		return cues.filter(cue => {
			if (cue.parentId) {
				const parent = cues.find(p => p.id === cue.parentId);
				if (parent && parent.expanded === false) return false;
			}
			return true;
		});
	}

	// Probe real media file duration (TRT) when a file is assigned
	function probeMediaDuration(filename, cueId) {
		if (!filename || filename.startsWith('synth:')) return;
		const url = filename.startsWith('http') || filename.startsWith('/') ? filename : '/media/' + encodeURIComponent(filename);
		const tempMedia = document.createElement('video');
		tempMedia.preload = 'metadata';
		tempMedia.onloadedmetadata = () => {
			if (tempMedia.duration && isFinite(tempMedia.duration) && tempMedia.duration > 0) {
				const dur = Number(tempMedia.duration.toFixed(2));
				const cue = cues.find(c => c.id === cueId);
				if (cue) {
					cue.sourceDuration = dur;
					cue.startTime = 0;
					cue.endTime = dur;
					cue.duration = dur;
				}
				apiPost('/api/cue/update', {
					cueId,
					updates: { sourceDuration: dur, startTime: 0, endTime: dur, duration: dur }
				});
				renderWorkspace();
				renderInspector();
			}
		};
		tempMedia.src = url;
	}

	function computeBackgroundCss(cue) {
		const c1 = cue.bgColor1 || '#0f172a';
		const c2 = cue.bgColor2 || '#1e3a8a';
		const angle = cue.bgAngle !== undefined ? cue.bgAngle : 135;
		if (cue.bgStyle === 'solid') return c1;
		if (cue.bgStyle === 'radial-gradient') return \`radial-gradient(circle, \${c1} 0%, \${c2} 100%)\`;
		return \`linear-gradient(\${angle}deg, \${c1} 0%, \${c2} 100%)\`;
	}

	function startBackgroundCue(cue) {
		broadcastToStage({
			type: 'set_background',
			cueId: cue.id,
			css: computeBackgroundCss(cue),
			fadeIn: Number(cue.fadeIn) || 0,
			targetScreens: cue.targetScreens || 'all'
		});
		activeAudioNodes.set(cue.id, { isBackground: true });
	}

	function startWebAudioForCue(cue) {
		ensureAudioCtx();
		stopWebAudioForCue(cue.id);

		const gainNode = audioCtx.createGain();
		const panNode = audioCtx.createStereoPanner();
		panNode.pan.value = Number(cue.pan) || 0;

		const targetLin = dbToLinear(cue.volumeDb ?? 0);
		const now = audioCtx.currentTime;
		if (cue.fadeIn > 0) {
			gainNode.gain.setValueAtTime(0.0001, now);
			gainNode.gain.linearRampToValueAtTime(targetLin, now + Number(cue.fadeIn));
		} else {
			gainNode.gain.setValueAtTime(targetLin, now);
		}

		gainNode.connect(panNode);
		panNode.connect(masterGainNode);

		const isLoop = cue.loopMode === 'infinite_loop' || !!cue.loop;
		const pauseAtEnd = cue.loopMode === 'pause_at_end';
		const startSec = Number(cue.startTime) || 0;
		const endSec = Number(cue.endTime) || Number(cue.duration) || 0;

		const fp = cue.filePath || '';
		if (fp.startsWith('synth:')) {
			const preset = fp.split(':')[1];
			const oscs = [];
			if (preset === 'warm_pad') {
				[220, 277.18, 329.63, 440].forEach((freq, idx) => {
					const osc = audioCtx.createOscillator();
					osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
					osc.frequency.value = freq;
					const subGain = audioCtx.createGain();
					subGain.gain.value = 0.18;
					osc.connect(subGain);
					subGain.connect(gainNode);
					osc.start();
					oscs.push(osc);
				});
			} else if (preset === 'chime') {
				[523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
					const osc = audioCtx.createOscillator();
					const env = audioCtx.createGain();
					osc.type = 'sine';
					osc.frequency.value = freq;
					const startAt = now + idx * 0.38;
					env.gain.setValueAtTime(0.001, now);
					env.gain.setValueAtTime(0.35, startAt);
					env.gain.exponentialRampToValueAtTime(0.001, startAt + 2.2);
					osc.connect(env);
					env.connect(gainNode);
					osc.start(startAt);
					osc.stop(startAt + 2.3);
					oscs.push(osc);
				});
			} else if (preset === 'stinger') {
				[261.63, 329.63, 392.00, 523.25, 659.25].forEach((freq, idx) => {
					const osc = audioCtx.createOscillator();
					const env = audioCtx.createGain();
					osc.type = 'sawtooth';
					osc.frequency.value = freq;
					const startAt = now + idx * 0.12;
					env.gain.setValueAtTime(0.001, now);
					env.gain.setValueAtTime(0.18, startAt);
					env.gain.exponentialRampToValueAtTime(0.008, startAt + 3.5);
					osc.connect(env);
					env.connect(gainNode);
					osc.start(startAt);
					osc.stop(startAt + 3.6);
					oscs.push(osc);
				});
			} else {
				const hz = parseFloat(preset) || 440;
				const osc = audioCtx.createOscillator();
				osc.type = 'sine';
				osc.frequency.value = hz;
				osc.connect(gainNode);
				osc.start();
				oscs.push(osc);
			}
			activeAudioNodes.set(cue.id, { oscs, gainNode, panNode });
		} else if (fp) {
			const url = fp.startsWith('http') || fp.startsWith('/') ? fp : '/media/' + encodeURIComponent(fp);
			if (cue.type === 'video') {
				const initOpacity = (Number(cue.fadeIn) || 0) > 0 ? 0 : 1;
				broadcastToStage({
					type: 'play_video',
					cueId: cue.id,
					url,
					startTime: startSec,
					endTime: endSec,
					duration: Number(cue.duration) || (endSec - startSec) || 5,
					fadeIn: Number(cue.fadeIn) || 0,
					fadeOut: Number(cue.fadeOut) || 0,
					opacity: initOpacity,
					loop: isLoop,
					pauseAtEnd,
					volume: 0, // Audio is routed through WebAudio master bus in workspace
					targetScreens: cue.targetScreens || 'all'
				});
			}
			const mediaEl = new Audio(url);
			mediaEl.crossOrigin = 'anonymous';
			mediaEl.loop = false; // Handled manually so startTime/endTime crop points work seamlessly
			mediaEl.currentTime = startSec;
			mediaEl.ontimeupdate = () => {
				if (endSec > startSec && mediaEl.currentTime >= endSec) {
					if (isLoop) {
						mediaEl.currentTime = startSec;
						mediaEl.play().catch(() => {});
					} else {
						mediaEl.pause();
						mediaEl.currentTime = startSec;
					}
				}
			};
			const srcNode = audioCtx.createMediaElementSource(mediaEl);
			srcNode.connect(gainNode);
			mediaEl.play().catch(e => console.warn('Audio play blocked until user click:', e));
			activeAudioNodes.set(cue.id, { mediaEl, gainNode, panNode, cueType: cue.type, startSec });
		}
	}

	function pauseWebAudioForCue(cueId) {
		const entry = activeAudioNodes.get(cueId);
		if (!entry) return;
		if (entry.mediaEl) {
			entry.mediaEl.pause();
		} else if (entry.gainNode && audioCtx) {
			entry.gainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.02);
		}
		const cue = cues.find(c => c.id === cueId);
		if (cue && cue.type === 'video') {
			broadcastToStage({ type: 'pause_video', cueId, heldAtLastFrame: !!cue.heldAtLastFrame });
		}
	}

	function resumeWebAudioForCue(cue) {
		const entry = activeAudioNodes.get(cue.id);
		if (!entry) {
			startWebAudioForCue(cue);
			return;
		}
		const liveDb = cue.currentVolumeDb !== undefined ? cue.currentVolumeDb : cue.volumeDb;
		if (entry.gainNode && audioCtx) {
			entry.gainNode.gain.setTargetAtTime(dbToLinear(liveDb), audioCtx.currentTime, 0.02);
		}
		if (entry.mediaEl) {
			entry.mediaEl.play().catch(() => {});
		}
		if (cue.type === 'video') {
			broadcastToStage({ type: 'resume_video', cueId: cue.id });
		}
	}

	function stopWebAudioForCue(cueId) {
		const entry = activeAudioNodes.get(cueId);
		const cue = cues.find(c => c.id === cueId);
		if (entry && entry.isBackground) {
			broadcastToStage({ type: 'clear_background', cueId });
			activeAudioNodes.delete(cueId);
			return;
		}
		if (!entry) {
			if (cue && cue.type === 'video') {
				broadcastToStage({ type: 'stop_video', cueId, resetTime: Number(cue.startTime) || 0 });
			}
			return;
		}
		try {
			if (entry.oscs) entry.oscs.forEach(o => { try { o.stop(); } catch {} });
			if (entry.mediaEl) {
				entry.mediaEl.pause();
				entry.mediaEl.currentTime = Number(cue?.startTime ?? entry.startSec ?? 0);
				entry.mediaEl.src = '';
			}
			if (entry.gainNode) entry.gainNode.disconnect();
		} catch {}
		activeAudioNodes.delete(cueId);
		if (!cue || cue.type === 'video') {
			broadcastToStage({ type: 'stop_video', cueId, resetTime: Number(cue?.startTime || 0) });
		}
		if (selectedCueId === cueId && cue) {
			previewPlayheadSec = Number(cue.startTime) || 0;
			const slider = document.getElementById('timelineScrubSlider');
			if (slider) slider.value = String(previewPlayheadSec);
			drawWaveformEnvelope(cue, 'trimTimelineCanvas');
			drawWaveformEnvelope(cue, 'waveformCanvas');
		}
	}

	function computeVideoOpacity(cue) {
		const dur = Number(cue.duration) || 0;
		const elapsed = Number(cue.actionElapsed) || 0;
		const fadeIn = Number(cue.fadeIn) || 0;
		const fadeOut = Number(cue.fadeOut) || 0;
		const isLoop = cue.loopMode === 'infinite_loop' || !!cue.loop;
		let op = 1.0;

		if (fadeIn > 0 && elapsed < fadeIn) {
			op = Math.max(0, Math.min(1, elapsed / fadeIn));
		}
		if (!isLoop && fadeOut > 0 && dur > 0) {
			const rem = dur - elapsed;
			if (rem <= fadeOut) {
				op = Math.min(op, Math.max(0, rem / fadeOut));
			}
		}
		// Also scale visual opacity if a Fade cue or Panic fade is actively fading this video cue down to -60 dB
		if (cue.currentVolumeDb !== undefined && cue.volumeDb !== undefined && cue.currentVolumeDb < cue.volumeDb - 0.5) {
			const span = Math.max(1, (cue.volumeDb ?? 0) - -60);
			const faderRatio = Math.max(0, Math.min(1, (cue.currentVolumeDb - -60) / span));
			op = Math.min(op, faderRatio);
		}
		return Number(op.toFixed(3));
	}

	function syncAudioEngineWithState(prevCues, nextCues) {
		const prevMap = new Map(prevCues.map(c => [c.id, c]));
		for (const cue of nextCues) {
			const prev = prevMap.get(cue.id);
			if (cue.type === 'background') {
				if ((cue.state === 'running' || cue.state === 'paused') && !activeAudioNodes.has(cue.id)) {
					startBackgroundCue(cue);
				} else if (cue.state === 'idle' && activeAudioNodes.has(cue.id)) {
					stopWebAudioForCue(cue.id);
				}
			} else if (cue.type === 'audio' || cue.type === 'video') {
				if (cue.state === 'running' && (!prev || prev.state === 'idle' || prev.state === 'prewait')) {
					startWebAudioForCue(cue);
				} else if (cue.state === 'running' && prev && prev.state === 'paused') {
					// If it was held at last frame and got re-fired from 0, restart cleanly from startTime!
					if (prev.heldAtLastFrame && (cue.actionElapsed || 0) < 0.25) {
						startWebAudioForCue(cue);
					} else {
						resumeWebAudioForCue(cue);
					}
				} else if (cue.state === 'paused' && prev && prev.state === 'running') {
					pauseWebAudioForCue(cue.id);
				} else if (cue.state !== 'running' && cue.state !== 'paused' && activeAudioNodes.has(cue.id)) {
					stopWebAudioForCue(cue.id);
				} else if (cue.state === 'running' && activeAudioNodes.has(cue.id)) {
					// If looped back to 0, ensure stage video also loops cleanly
					if (prev && (cue.actionElapsed || 0) < (prev.actionElapsed || 0) - 0.5) {
						const entry = activeAudioNodes.get(cue.id);
						if (entry && entry.mediaEl) {
							entry.mediaEl.currentTime = Number(cue.startTime) || 0;
							entry.mediaEl.play().catch(() => {});
						}
					}
					const node = activeAudioNodes.get(cue.id);
					if (node && node.gainNode && audioCtx) {
						const liveDb = cue.currentVolumeDb !== undefined ? cue.currentVolumeDb : cue.volumeDb;
						node.gainNode.gain.setTargetAtTime(dbToLinear(liveDb), audioCtx.currentTime, 0.04);
					}
					if (cue.type === 'video') {
						broadcastToStage({
							type: 'video_opacity',
							cueId: cue.id,
							opacity: computeVideoOpacity(cue),
							targetScreens: cue.targetScreens || 'all'
						});
					}
				}
			}
		}
	}

	function renderTargetSummary(cue) {
		switch (cue.type) {
			case 'audio':
			case 'video': {
				const cropInfo = (cue.startTime > 0 || (cue.sourceDuration && cue.endTime < cue.sourceDuration))
					? \` [\${formatTime(cue.startTime)}-\${formatTime(cue.endTime)}]\`
					: '';
				const modeTag = cue.loopMode === 'pause_at_end' ? ' [⏸ Last Frame]' : (cue.loopMode === 'infinite_loop' || cue.loop ? ' [🔁 Loop]' : '');
				return (cue.filePath || '(No file selected)') + cropInfo + modeTag;
			}
			case 'background': {
				const swCss = computeBackgroundCss(cue);
				const swatch = \`<span onclick="event.stopPropagation();openBgCreatorModal('\${cue.id}')" title="Click to edit Background Color / Gradient" style="display:inline-block;width:28px;height:14px;border-radius:3px;border:1px solid rgba(255,255,255,0.45);vertical-align:middle;margin-right:6px;cursor:pointer;background:\${swCss};"></span>\`;
				const label = cue.bgStyle === 'solid'
					? \`Solid (\${cue.bgColor1 || '#0f172a'})\`
					: \`\${(cue.bgStyle || 'linear-gradient').replace('-', ' ').toUpperCase()} (\${cue.bgColor1 || '#0f172a'} → \${cue.bgColor2 || '#1e3a8a'})\`;
				return swatch + \`<span onclick="event.stopPropagation();openBgCreatorModal('\${cue.id}')" style="cursor:pointer;text-decoration:underline dotted;" title="Click to customize Background Color / Gradient">\${label}</span>\`;
			}
			case 'companion':
				return 'Page ' + cue.companionPage + ' [' + cue.companionRow + '/' + cue.companionCol + '] (' + cue.companionAction + ')';
			case 'fade':
			case 'stop':
			case 'goto': {
				const t = cues.find(c => c.id === cue.targetCueId);
				const label = t ? ('Q ' + t.qNumber + ' ' + t.name) : '(No target)';
				return cue.type === 'fade' ? (label + ' -> ' + cue.volumeDb + ' dB') : label;
			}
			case 'network':
				return cue.networkMethod + ' ' + (cue.networkUrl || '');
			case 'group':
				return 'Group (' + (cue.groupMode || 'simultaneous') + ')';
			default:
				return '';
		}
	}

	function handleRowClick(e, cue) {
		const visible = getVisibleCues();
		if (e.shiftKey && anchorCueId) {
			const idxA = visible.findIndex(c => c.id === anchorCueId);
			const idxB = visible.findIndex(c => c.id === cue.id);
			if (idxA !== -1 && idxB !== -1) {
				const start = Math.min(idxA, idxB);
				const end = Math.max(idxA, idxB);
				selectedCueIds.clear();
				for (let i = start; i <= end; i++) {
					selectedCueIds.add(visible[i].id);
				}
				selectedCueId = cue.id;
			}
		} else if (e.ctrlKey || e.metaKey) {
			if (selectedCueIds.has(cue.id)) {
				selectedCueIds.delete(cue.id);
			} else {
				selectedCueIds.add(cue.id);
			}
			selectedCueId = cue.id;
			anchorCueId = cue.id;
		} else {
			selectedCueIds.clear();
			selectedCueIds.add(cue.id);
			selectedCueId = cue.id;
			anchorCueId = cue.id;
		}
		renderWorkspace();
		renderInspector();
	}

	function renderWorkspace() {
		// Top Standby + Active TRT Header
		const activeRunning = cues.find(c => c.state === 'running' || c.state === 'paused');
		const standby = cues.find(c => c.id === standbyCueId);
		const selected = cues.find(c => c.id === selectedCueId);
		const headerCue = activeRunning || standby || selected;

		document.getElementById('standbyQNum').textContent = standby ? ('Q ' + standby.qNumber) : 'END';
		document.getElementById('standbyTitle').textContent = standby ? standby.name : 'End of Cue List';
		document.getElementById('standbyNotes').textContent = standby ? (standby.notes || renderTargetSummary(standby)) : 'Press Up/Top to reset playhead';

		// Update TRT & Remaining to the right of the Media Title / Info
		const trtEl = document.getElementById('topTrtVal');
		const remEl = document.getElementById('topRemVal');
		const remLabel = document.getElementById('topRemLabel');
		const pauseBadge = document.getElementById('topPauseAtBadge');

		if (headerCue) {
			const trt = Number(headerCue.duration) || 0;
			const elapsed = Number(headerCue.actionElapsed) || 0;
			const rem = Math.max(0, trt - elapsed);
			trtEl.textContent = formatTime(trt);

			if (headerCue.state === 'running') {
				remLabel.textContent = 'REMAINING (Q ' + headerCue.qNumber + ')';
				remEl.textContent = '-' + formatTime(rem);
				remEl.className = 'trt-value remaining';
			} else if (headerCue.state === 'paused') {
				remLabel.textContent = 'PAUSED (Q ' + headerCue.qNumber + ')';
				remEl.textContent = '-' + formatTime(rem);
				remEl.className = 'trt-value paused';
			} else {
				remLabel.textContent = 'STANDBY TRT';
				remEl.textContent = formatTime(trt);
				remEl.className = 'trt-value';
			}

			if (headerCue.loopMode === 'pause_at_end') {
				pauseBadge.textContent = '⏸ HOLD LAST FRAME';
			} else if (headerCue.loopMode === 'infinite_loop' || headerCue.loop) {
				pauseBadge.textContent = '🔁 INFINITE LOOP';
			} else {
				pauseBadge.textContent = '';
			}
		} else {
			trtEl.textContent = '00:00.0';
			remEl.textContent = '00:00.0';
			pauseBadge.textContent = '';
		}

		// Update multi-selection badge & group button label
		const selBadge = document.getElementById('selCountBadge');
		const groupBtn = document.getElementById('groupToolBtn');
		if (selectedCueIds.size > 1) {
			selBadge.textContent = selectedCueIds.size + ' Cues Selected (Shift+Click / Shift+Arrows)';
			groupBtn.innerHTML = '📁 Group Selected (' + selectedCueIds.size + ')';
		} else {
			selBadge.textContent = selectedCueIds.size === 1 ? '1 Cue Selected' : '';
			groupBtn.innerHTML = '📁 + Group';
		}

		const pauseBtn = document.getElementById('pauseBtn');
		if (isPaused || cues.some(c => c.state === 'paused')) pauseBtn.classList.add('paused-active');
		else pauseBtn.classList.remove('paused-active');

		// Cue List Table
		const tbody = document.getElementById('cueTableBody');
		tbody.innerHTML = '';

		const visible = getVisibleCues();
		visible.forEach(cue => {
			const tr = document.createElement('tr');
			if (cue.id === standbyCueId) tr.classList.add('standby-row');
			if (selectedCueIds.has(cue.id)) tr.classList.add('selected-row');
			if (cue.id === selectedCueId) tr.classList.add('selected-primary');
			if (!cue.armed) tr.classList.add('disarmed');
			if (cue.color && cue.color !== 'none') tr.classList.add('color-' + cue.color);

			tr.onclick = (e) => handleRowClick(e, cue);
			tr.ondblclick = () => setStandby(cue.id);

			const prePct = cue.preWait > 0 ? Math.min(100, ((cue.preWaitElapsed || 0) / cue.preWait) * 100) : 0;
			const actPct = cue.duration > 0 ? Math.min(100, ((cue.actionElapsed || 0) / cue.duration) * 100) : 0;
			const postPct = cue.postWait > 0 ? Math.min(100, ((cue.postWaitElapsed || 0) / cue.postWait) * 100) : 0;

			let statusSym = cueTypeIcon(cue.type);
			if (cue.state === 'running') statusSym = '<span style="color:#25e066;">▶</span>';
			else if (cue.state === 'prewait') statusSym = '<span style="color:#f59e0b;">⏳</span>';
			else if (cue.state === 'paused') statusSym = '<span style="color:#f59e0b;">⏸</span>';

			const indent = cue.parentId ? 'padding-left: 24px;' : '';
			const groupToggle = cue.type === 'group'
				? '<span onclick="event.stopPropagation();toggleGroupExpand(\\'' + cue.id + '\\')" style="margin-right:5px;cursor:pointer;">' + (cue.expanded === false ? '▶' : '▼') + '</span>'
				: '';

			const pauseMarker = cue.loopMode === 'pause_at_end'
				? ' <span style="font-size:10px;color:#06b6d4;margin-left:6px;" title="Pauses at Last Frame">[⏸ End]</span>'
				: '';

			tr.innerHTML = \`
				<td class="playhead-cell" onclick="event.stopPropagation();setStandby('\${cue.id}')" title="Click to set Standby Playhead">\${cue.id === standbyCueId ? '►' : ''}</td>
				<td class="status-cell">\${statusSym}</td>
				<td class="qnum-cell">\${cue.qNumber}</td>
				<td class="name-cell" style="\${indent}">\${groupToggle}\${cue.name}\${pauseMarker}</td>
				<td class="target-cell">\${renderTargetSummary(cue)}</td>
				<td class="time-cell">
					<div class="cell-progress pre" style="width:\${prePct}%"></div>
					<span class="cell-text">\${cue.preWait > 0 ? formatTime(cue.preWait - (cue.preWaitElapsed || 0)) : '00:00.0'}</span>
				</td>
				<td class="time-cell">
					<div class="cell-progress act \${cue.state === 'paused' ? 'paused' : ''}" style="width:\${actPct}%"></div>
					<span class="cell-text">\${(cue.state === 'running' || cue.state === 'paused') ? formatTime(Math.max(0, cue.duration - (cue.actionElapsed || 0))) : formatTime(cue.duration)}</span>
				</td>
				<td class="time-cell">
					<div class="cell-progress post" style="width:\${postPct}%"></div>
					<span class="cell-text">\${cue.postWait > 0 ? formatTime(cue.postWait - (cue.postWaitElapsed || 0)) : '00:00.0'}</span>
				</td>
				<td class="cont-cell" onclick="event.stopPropagation();cycleContinueMode('\${cue.id}')" title="Click to cycle Continue Mode">\${continueIcon(cue.continueMode)}</td>
			\`;
			tbody.appendChild(tr);
		});

		// Active Cues Sidebar
		const activeList = document.getElementById('activeCuesList');
		const runningCues = cues.filter(c => c.state && c.state !== 'idle');
		document.getElementById('activeCountBadge').textContent = String(runningCues.length);
		activeList.innerHTML = '';

		if (runningCues.length === 0) {
			activeList.innerHTML = '<div style="color:var(--text-muted);text-align:center;margin-top:30px;font-size:12px;">No Active Cues Running</div>';
		} else {
			runningCues.forEach(c => {
				const total = (c.duration || 1);
				const elapsed = c.actionElapsed || 0;
				const pct = Math.min(100, (elapsed / total) * 100);
				const rem = Math.max(0, total - elapsed);
				const isCuePaused = c.state === 'paused';
				const card = document.createElement('div');
				card.className = 'active-card';
				card.innerHTML = \`
					<div class="active-card-top">
						<span style="overflow:hidden;text-overflow:ellipsis;">Q \${c.qNumber} — \${c.name}</span>
						<div style="display:flex;gap:4px;flex-shrink:0;">
							<button onclick="pauseCueById('\${c.id}')" style="background:#3b3216;border:1px solid #f59e0b;color:#fff;border-radius:3px;font-size:10px;cursor:pointer;padding:2px 6px;">\${isCuePaused ? '▶ RESUME' : '⏸ PAUSE'}</button>
							<button onclick="stopCueById('\${c.id}')" style="background:#5c1919;border:1px solid #992323;color:#fff;border-radius:3px;font-size:10px;cursor:pointer;padding:2px 6px;">STOP</button>
						</div>
					</div>
					<div class="active-bar-bg">
						<div class="active-bar-fill \${isCuePaused ? 'paused' : ''}" style="width:\${pct}%"></div>
					</div>
					<div class="active-card-meta">
						<span style="color:\${isCuePaused ? '#f59e0b' : '#25e066'};">\${c.state.toUpperCase()}</span>
						<span>Elapsed: \${formatTime(elapsed)}</span>
						<span style="color:#fff;font-weight:700;">-\${formatTime(rem)}</span>
					</div>
				\`;
				activeList.appendChild(card);
			});
		}
	}

	function switchTab(tab, el) {
		currentTab = tab;
		document.querySelectorAll('.insp-tab').forEach(t => t.classList.remove('active'));
		el.classList.add('active');
		renderInspector();
	}

	function renderInspector() {
		const container = document.getElementById('inspectorContent');

		// Multi-selection bulk inspector
		if (selectedCueIds.size > 1) {
			document.getElementById('inspSelectedTitle').textContent = selectedCueIds.size + ' Cues Selected (Bulk Edit)';
			const groupOptions = '<option value="">(Move to Root Level)</option>' +
				cues.filter(g => g.type === 'group' && !selectedCueIds.has(g.id))
					.map(g => '<option value="' + g.id + '">Group Q ' + g.qNumber + ': ' + g.name + '</option>').join('');

			container.innerHTML = \`
				<div class="form-grid">
					<div class="field">
						<label>Wrap Selected Cues in New Group</label>
						<button class="tool-btn" onclick="addCue('group')">📁 Wrap \${selectedCueIds.size} Cues in New Group</button>
					</div>
					<div class="field">
						<label>Move Selected Cues into Existing Group</label>
						<select onchange="batchAssignGroup(this.value)">
							<option value="__none__">-- Choose Group --</option>
							\${groupOptions}
						</select>
					</div>
					<div class="field">
						<label>Delete All Selected (\${selectedCueIds.size} Cues)</label>
						<button class="tool-btn" style="color:#ff8a8a;" onclick="deleteSelectedCue()">🗑️ Delete \${selectedCueIds.size} Selected Cues</button>
					</div>
				</div>
			\`;
			return;
		}

		const cue = cues.find(c => c.id === selectedCueId) || cues.find(c => c.id === standbyCueId);
		if (!cue) {
			document.getElementById('inspSelectedTitle').textContent = 'No Cue Selected';
			container.innerHTML = '<div style="color:var(--text-muted);">Click any cue in the cue list to inspect and edit its parameters.</div>';
			return;
		}
		selectedCueId = cue.id;
		if (selectedCueIds.size === 0) selectedCueIds.add(cue.id);
		document.getElementById('inspSelectedTitle').textContent = 'Inspecting: Q ' + cue.qNumber + ' — ' + cue.name + ' (' + cue.type.toUpperCase() + ' | TRT: ' + formatTime(cue.duration) + ')';

		const groupOptions = '<option value="">(Root Level)</option>' +
			cues.filter(g => g.type === 'group' && g.id !== cue.id)
				.map(g => '<option value="' + g.id + '" ' + (cue.parentId === g.id ? 'selected' : '') + '>Group Q ' + g.qNumber + ': ' + g.name + '</option>').join('');

		const targetCueOptions = '<option value="">(Select Target Cue)</option>' +
			cues.filter(t => t.id !== cue.id)
				.map(t => '<option value="' + t.id + '" ' + (cue.targetCueId === t.id ? 'selected' : '') + '>Q ' + t.qNumber + ' — ' + t.name + '</option>').join('');

		const mediaPresetOptions = [
			'synth:warm_pad',
			'synth:chime',
			'synth:stinger',
			'synth:440',
			'synth:1000',
			...mediaFiles
		].map(f => '<option value="' + f + '" ' + (cue.filePath === f ? 'selected' : '') + '>' + f + '</option>').join('');

		if (currentTab === 'basics') {
			const screenTargetOptions = [
				'<option value="all" ' + ((cue.targetScreens || 'all') === 'all' ? 'selected' : '') + '>All Active Stage Screens</option>',
				...detectedScreens.map(s => '<option value="' + s.index + '" ' + (String(cue.targetScreens) === String(s.index) ? 'selected' : '') + '>Screen ' + (s.index + 1) + ': ' + s.label + '</option>')
			].join('');

			container.innerHTML = \`
				<div class="form-grid">
					<div class="field">
						<label>Cue Number (Q#)</label>
						<input type="text" value="\${cue.qNumber}" onchange="updateCueField('\${cue.id}', 'qNumber', this.value)" />
					</div>
					<div class="field" style="grid-column: span 2;">
						<label>Cue Name</label>
						<input type="text" value="\${cue.name}" onchange="updateCueField('\${cue.id}', 'name', this.value)" />
					</div>
					<div class="field">
						<label>Cue Type</label>
						<select onchange="updateCueField('\${cue.id}', 'type', this.value)">
							\${['audio','video','background','companion','fade','wait','group','network','stop','goto'].map(t => '<option value="'+t+'" '+(cue.type===t?'selected':'')+'>'+t.toUpperCase()+'</option>').join('')}
						</select>
					</div>
					<div class="field">
						<label>Row Color</label>
						<select onchange="updateCueField('\${cue.id}', 'color', this.value)">
							\${['none','red','orange','yellow','green','blue','purple'].map(c => '<option value="'+c+'" '+(cue.color===c?'selected':'')+'>'+c.toUpperCase()+'</option>').join('')}
						</select>
					</div>
					<div class="field">
						<label>Parent Group</label>
						<select onchange="updateCueField('\${cue.id}', 'parentId', this.value || null)">\${groupOptions}</select>
					</div>
					\${(cue.type === 'audio' || cue.type === 'video') ? \`
					<div class="field" style="grid-column: span 2;">
						<label>Audio / Video Source (Synth Preset or Uploaded File)</label>
						<select onchange="onMediaSourceSelect('\${cue.id}', this.value)">
							<option value="">-- Choose Media or Upload Above --</option>
							\${mediaPresetOptions}
						</select>
					</div>\` : ''}
					\${(cue.type === 'video' || cue.type === 'background') ? \`
					<div class="field">
						<label style="color:var(--cc-cyan);">Target Output Screen(s)</label>
						<div style="display:flex;gap:4px;">
							<select style="flex:1;" onchange="updateCueField('\${cue.id}', 'targetScreens', this.value)">
								\${screenTargetOptions}
							</select>
							<button class="scrubber-btn crop-btn" onclick="openScreenModal()" title="Open Multi-Screen & Fullscreen Manager">🖥️ Screens</button>
						</div>
					</div>\` : ''}
					\${(cue.type === 'background') ? \`
					<div class="field">
						<label>Background Style</label>
						<select onchange="updateCueField('\${cue.id}', 'bgStyle', this.value)">
							<option value="solid" \${cue.bgStyle==='solid'?'selected':''}>Solid Color</option>
							<option value="linear-gradient" \${(!cue.bgStyle || cue.bgStyle==='linear-gradient')?'selected':''}>Linear Gradient</option>
							<option value="radial-gradient" \${cue.bgStyle==='radial-gradient'?'selected':''}>Radial Gradient</option>
						</select>
					</div>
					<div class="field">
						<label>Primary Color</label>
						<div style="display:flex;gap:4px;">
							<input type="color" value="\${cue.bgColor1 || '#0f172a'}" style="width:42px;height:30px;padding:2px;cursor:pointer;" oninput="updateCueField('\${cue.id}', 'bgColor1', this.value)" />
							<input type="text" value="\${cue.bgColor1 || '#0f172a'}" style="flex:1;" onchange="updateCueField('\${cue.id}', 'bgColor1', this.value)" />
						</div>
					</div>
					\${cue.bgStyle !== 'solid' ? \`
					<div class="field">
						<label>Secondary Gradient Color</label>
						<div style="display:flex;gap:4px;">
							<input type="color" value="\${cue.bgColor2 || '#1e3a8a'}" style="width:42px;height:30px;padding:2px;cursor:pointer;" oninput="updateCueField('\${cue.id}', 'bgColor2', this.value)" />
							<input type="text" value="\${cue.bgColor2 || '#1e3a8a'}" style="flex:1;" onchange="updateCueField('\${cue.id}', 'bgColor2', this.value)" />
						</div>
					</div>
					<div class="field">
						<label>Gradient Angle (\${cue.bgAngle ?? 135}°)</label>
						<input type="range" min="0" max="360" step="5" value="\${cue.bgAngle ?? 135}" oninput="updateCueField('\${cue.id}', 'bgAngle', Number(this.value))" />
					</div>\` : ''}
					<div class="field" style="grid-column: span 2;">
						<label>Live Stage Background Preview (Click to Open Designer)</label>
						<div onclick="openBgCreatorModal('\${cue.id}')" style="height:36px;border-radius:5px;border:1px solid #475569;cursor:pointer;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;color:#fff;text-shadow:0 1px 3px #000;background:\${computeBackgroundCss(cue)};">
							🎨 Click to Open Full Color / Gradient Picker & Presets
						</div>
					</div>
					\` : ''}
					\${(cue.type === 'companion') ? \`
					<div class="field">
						<label>Companion Page</label>
						<input type="number" min="1" max="99" value="\${cue.companionPage}" onchange="updateCueField('\${cue.id}', 'companionPage', Number(this.value))" />
					</div>
					<div class="field">
						<label>Companion Row (0-indexed)</label>
						<input type="number" min="0" max="15" value="\${cue.companionRow}" onchange="updateCueField('\${cue.id}', 'companionRow', Number(this.value))" />
					</div>
					<div class="field">
						<label>Companion Column (0-indexed)</label>
						<input type="number" min="0" max="15" value="\${cue.companionCol}" onchange="updateCueField('\${cue.id}', 'companionCol', Number(this.value))" />
					</div>\` : ''}
					\${(cue.type === 'fade' || cue.type === 'stop' || cue.type === 'goto') ? \`
					<div class="field" style="grid-column: span 2;">
						<label>Target Cue</label>
						<select onchange="updateCueField('\${cue.id}', 'targetCueId', this.value)">\${targetCueOptions}</select>
					</div>\` : ''}
					\${(cue.type === 'network') ? \`
					<div class="field">
						<label>HTTP Method</label>
						<select onchange="updateCueField('\${cue.id}', 'networkMethod', this.value)">
							<option value="POST" \${cue.networkMethod==='POST'?'selected':''}>POST</option>
							<option value="GET" \${cue.networkMethod==='GET'?'selected':''}>GET</option>
							<option value="PUT" \${cue.networkMethod==='PUT'?'selected':''}>PUT</option>
						</select>
					</div>
					<div class="field" style="grid-column: span 2;">
						<label>Target URL</label>
						<input type="text" value="\${cue.networkUrl || ''}" placeholder="http://10.101.10.100:8000/api/..." onchange="updateCueField('\${cue.id}', 'networkUrl', this.value)" />
					</div>\` : ''}
					<div class="field" style="grid-column: span 2;">
						<label>Notes / Script Cue Line</label>
						<input type="text" value="\${cue.notes || ''}" onchange="updateCueField('\${cue.id}', 'notes', this.value)" />
					</div>
				</div>
			\`;
		} else if (currentTab === 'timing') {
			const srcDur = Number(cue.sourceDuration) || Number(cue.endTime) || Number(cue.duration) || 10;
			const st = Number(cue.startTime) || 0;
			const et = Number(cue.endTime) || Number(cue.duration) || srcDur;
			const curLoopMode = cue.loopMode || (cue.loop ? 'infinite_loop' : 'one_shot');
			const livePlayhead = (cue.state === 'running' || cue.state === 'paused')
				? (st + (Number(cue.actionElapsed) || 0))
				: Math.max(st, Math.min(et, previewPlayheadSec || st));

			container.innerHTML = \`
				<div class="form-grid">
					<div class="field">
						<label>Start / Crop In (s)</label>
						<div style="display:flex;gap:4px;">
							<input type="number" step="0.1" min="0" max="\${et - 0.1}" value="\${st}" style="flex:1;" onchange="updateCueField('\${cue.id}', 'startTime', Number(this.value))" />
							<button class="scrubber-btn crop-btn" onclick="setCropPointFromPlayhead('\${cue.id}', 'in')" title="Crop Start (In-Point) to current Scrubber Playhead">[ Set In</button>
						</div>
					</div>
					<div class="field">
						<label>End / Crop Out (s)</label>
						<div style="display:flex;gap:4px;">
							<input type="number" step="0.1" min="\${st + 0.1}" value="\${et}" style="flex:1;" onchange="updateCueField('\${cue.id}', 'endTime', Number(this.value))" />
							<button class="scrubber-btn crop-btn" onclick="setCropPointFromPlayhead('\${cue.id}', 'out')" title="Crop End (Out-Point) to current Scrubber Playhead">Set Out ]</button>
						</div>
					</div>
					<div class="field">
						<label>Cropped Action TRT (s)</label>
						<div style="display:flex;gap:4px;">
							<input type="number" step="0.1" min="0.1" value="\${cue.duration}" style="flex:1;" onchange="updateCueField('\${cue.id}', 'duration', Number(this.value))" />
							<button class="scrubber-btn" onclick="resetCropPoints('\${cue.id}')" title="Reset Crop to full media duration">Reset Crop</button>
						</div>
					</div>
					<div class="field">
						<label style="color:var(--cc-amber);">Loop / End Action</label>
						<select onchange="updateCueField('\${cue.id}', 'loopMode', this.value)">
							<option value="one_shot" \${curLoopMode==='one_shot'?'selected':''}>One-Shot (Stop at End)</option>
							<option value="infinite_loop" \${curLoopMode==='infinite_loop'?'selected':''}>Infinite Loop (Repeat)</option>
							<option value="pause_at_end" \${curLoopMode==='pause_at_end'?'selected':''}>⏸ Pause at Last Frame (Hold End)</option>
						</select>
					</div>
					<div class="field">
						<label>Pre-Wait (s)</label>
						<input type="number" step="0.1" min="0" value="\${cue.preWait}" onchange="updateCueField('\${cue.id}', 'preWait', Number(this.value))" />
					</div>
					<div class="field">
						<label>Post-Wait (s)</label>
						<input type="number" step="0.1" min="0" value="\${cue.postWait}" onchange="updateCueField('\${cue.id}', 'postWait', Number(this.value))" />
					</div>
					<div class="field">
						<label>Fade In / Out (s)</label>
						<div style="display:flex;gap:4px;">
							<input type="number" step="0.1" min="0" value="\${cue.fadeIn || 0}" placeholder="In" style="width:50%;" onchange="updateCueField('\${cue.id}', 'fadeIn', Number(this.value))" />
							<input type="number" step="0.1" min="0" value="\${cue.fadeOut || 0}" placeholder="Out" style="width:50%;" onchange="updateCueField('\${cue.id}', 'fadeOut', Number(this.value))" />
						</div>
					</div>
					<div class="field">
						<label>Continue Mode</label>
						<select onchange="updateCueField('\${cue.id}', 'continueMode', this.value)">
							<option value="none" \${cue.continueMode==='none'?'selected':''}>Do Not Continue</option>
							<option value="auto_continue" \${cue.continueMode==='auto_continue'?'selected':''}>Auto-Continue (→)</option>
							<option value="auto_follow" \${cue.continueMode==='auto_follow'?'selected':''}>Auto-Follow (⚓)</option>
						</select>
					</div>
				</div>

				<!-- INTERACTIVE TIMELINE SCRUBBER & CROP EDITOR -->
				<div class="waveform-box">
					<div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text-muted);">
						<span>TIMELINE SCRUBBER & IN/OUT CROP</span>
						<span id="scrubberReadout">Playhead: \${formatTime(livePlayhead)} | Crop: [\${formatTime(st)} – \${formatTime(et)}] (TRT: \${formatTime(cue.duration)})</span>
					</div>
					<canvas id="trimTimelineCanvas" width="420" height="75" onmousedown="onTimelineCanvasMouseDown(event, '\${cue.id}')"></canvas>
					<div class="scrubber-controls">
						<button class="scrubber-btn" onclick="stepScrubPlayhead('\${cue.id}', -1.0)">-1.0s</button>
						<button class="scrubber-btn" onclick="stepScrubPlayhead('\${cue.id}', -0.1)">-0.1s</button>
						<input type="range" id="timelineScrubSlider" min="0" max="\${srcDur}" step="0.05" value="\${livePlayhead}" style="flex:1;" oninput="onScrubSliderInput('\${cue.id}', Number(this.value))" />
						<button class="scrubber-btn" onclick="stepScrubPlayhead('\${cue.id}', 0.1)">+0.1s</button>
						<button class="scrubber-btn" onclick="stepScrubPlayhead('\${cue.id}', 1.0)">+1.0s</button>
					</div>
				</div>
			\`;
			drawWaveformEnvelope(cue, 'trimTimelineCanvas');
		} else if (currentTab === 'levels') {
			container.innerHTML = \`
				<div class="form-grid">
					\${cue.type === 'background' ? \`
					<div class="field">
						<label>Background Style</label>
						<select onchange="updateCueField('\${cue.id}', 'bgStyle', this.value)">
							<option value="solid" \${cue.bgStyle==='solid'?'selected':''}>Solid Color</option>
							<option value="linear-gradient" \${(!cue.bgStyle || cue.bgStyle==='linear-gradient')?'selected':''}>Linear Gradient</option>
							<option value="radial-gradient" \${cue.bgStyle==='radial-gradient'?'selected':''}>Radial Gradient</option>
						</select>
					</div>
					<div class="field">
						<label>Primary Color</label>
						<input type="color" value="\${cue.bgColor1 || '#0f172a'}" style="height:30px;padding:2px;" oninput="updateCueField('\${cue.id}', 'bgColor1', this.value)" />
					</div>
					\${cue.bgStyle !== 'solid' ? \`
					<div class="field">
						<label>Secondary Color</label>
						<input type="color" value="\${cue.bgColor2 || '#1e3a8a'}" style="height:30px;padding:2px;" oninput="updateCueField('\${cue.id}', 'bgColor2', this.value)" />
					</div>
					<div class="field">
						<label>Gradient Angle (\${cue.bgAngle ?? 135}°)</label>
						<input type="range" min="0" max="360" step="5" value="\${cue.bgAngle ?? 135}" oninput="updateCueField('\${cue.id}', 'bgAngle', Number(this.value))" />
					</div>\` : ''}
					\` : \`
					<div class="field">
						<label>Target Volume / Fade Level (\${cue.volumeDb} dB)</label>
						<input type="range" min="-60" max="12" step="0.5" value="\${cue.volumeDb}" oninput="updateCueField('\${cue.id}', 'volumeDb', Number(this.value))" />
					</div>
					<div class="field">
						<label>Stereo Pan (\${cue.pan})</label>
						<input type="range" min="-1" max="1" step="0.1" value="\${cue.pan || 0}" oninput="updateCueField('\${cue.id}', 'pan', Number(this.value))" />
					</div>
					\`}
					\${cue.type === 'fade' ? \`
					<div class="field">
						<label>Stop Target When Fade Finishes</label>
						<select onchange="updateCueField('\${cue.id}', 'stopTargetWhenDone', this.value === 'true')">
							<option value="true" \${cue.stopTargetWhenDone?'selected':''}>Yes (Fade & Stop)</option>
							<option value="false" \${!cue.stopTargetWhenDone?'selected':''}>No (Keep Running at New Level)</option>
						</select>
					</div>\` : ''}
					<div class="field">
						<label>Audition Cue</label>
						<button class="tool-btn" onclick="fireCueById('\${cue.id}')">▶ Preview / Fire This Cue</button>
					</div>
					<div class="field">
						<label>Video Stage & Screens</label>
						<button class="tool-btn" style="background:#172b3a;border-color:#06b6d4;" onclick="openScreenModal()">🖥️ Configure Screens & Fullscreen</button>
					</div>
				</div>
				<div class="waveform-box">
					<div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text-muted);margin-bottom:4px;">
						<span>WAVEFORM, CROP & FADE ENVELOPE</span>
						<span>TRT: \${formatTime(cue.duration)} | End: \${(cue.loopMode || 'one_shot').toUpperCase()}</span>
					</div>
					<canvas id="waveformCanvas" width="420" height="105" onmousedown="onTimelineCanvasMouseDown(event, '\${cue.id}')"></canvas>
				</div>
			\`;
			drawWaveformEnvelope(cue, 'waveformCanvas');
		}
	}

	function drawWaveformEnvelope(cue, canvasId = 'waveformCanvas') {
		const canvas = document.getElementById(canvasId);
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		const w = canvas.width;
		const h = canvas.height;
		ctx.clearRect(0, 0, w, h);

		if (cue.type === 'background') {
			const grad = ctx.createLinearGradient(0, 0, w, h);
			grad.addColorStop(0, cue.bgColor1 || '#0f172a');
			grad.addColorStop(1, cue.bgStyle === 'solid' ? (cue.bgColor1 || '#0f172a') : (cue.bgColor2 || '#1e3a8a'));
			ctx.fillStyle = grad;
			ctx.fillRect(0, 0, w, h);
			ctx.fillStyle = 'rgba(255,255,255,0.85)';
			ctx.font = 'bold 12px Segoe UI, sans-serif';
			ctx.fillText('STAGE BACKGROUND PREVIEW (' + (cue.bgStyle || 'linear-gradient').toUpperCase() + ')', 12, h / 2 + 4);
			return;
		}

		const srcDur = Math.max(0.5, Number(cue.sourceDuration) || Number(cue.endTime) || Number(cue.duration) || 5);
		const st = Math.max(0, Number(cue.startTime) || 0);
		const et = Math.min(srcDur, Math.max(st + 0.1, Number(cue.endTime) || Number(cue.duration) || srcDur));
		const inX = (st / srcDur) * w;
		const outX = (et / srcDur) * w;

		// Center line
		ctx.strokeStyle = '#252932';
		ctx.beginPath();
		ctx.moveTo(0, h / 2);
		ctx.lineTo(w, h / 2);
		ctx.stroke();

		// Waveform bars across source duration
		const gainScale = Math.max(0.05, Math.min(1.2, (cue.volumeDb + 60) / 65));
		for (let x = 2; x < w - 2; x += 4) {
			const isInsideCrop = x >= inX && x <= outX;
			ctx.fillStyle = isInsideCrop ? '#1db954' : '#2d3748';
			const n = Math.sin(x * 0.17 + cue.id.length) * Math.cos(x * 0.07) * 0.8 + 0.2;
			const barH = Math.abs(n) * (h * 0.78) * gainScale;
			ctx.fillRect(x, (h - barH) / 2, 2, barH);
		}

		// Dimmed cropped-out regions (left of Start In-Point and right of End Out-Point)
		ctx.fillStyle = 'rgba(0, 0, 0, 0.62)';
		if (inX > 0) ctx.fillRect(0, 0, inX, h);
		if (outX < w) ctx.fillRect(outX, 0, w - outX, h);

		// Crop In / Out handles (Cyan brackets)
		ctx.strokeStyle = '#06b6d4';
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(inX + 6, 1); ctx.lineTo(inX, 1); ctx.lineTo(inX, h - 1); ctx.lineTo(inX + 6, h - 1);
		ctx.moveTo(outX - 6, 1); ctx.lineTo(outX, 1); ctx.lineTo(outX, h - 1); ctx.lineTo(outX - 6, h - 1);
		ctx.stroke();

		// Fade In / Fade Out envelope curve inside cropped region
		const cropWidth = Math.max(4, outX - inX);
		const cropDur = Math.max(0.1, et - st);
		const fadeInX = inX + Math.min(cropWidth * 0.45, ((cue.fadeIn || 0) / cropDur) * cropWidth);
		const fadeOutX = Math.max(fadeInX, outX - Math.min(cropWidth * 0.45, ((cue.fadeOut || 0) / cropDur) * cropWidth));
		const topY = h * (1 - gainScale * 0.85);

		ctx.strokeStyle = '#f59e0b';
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(inX, cue.fadeIn > 0 ? h : topY);
		ctx.lineTo(fadeInX, topY);
		ctx.lineTo(fadeOutX, topY);
		ctx.lineTo(outX, cue.fadeOut > 0 ? h : topY);
		ctx.stroke();

		// Draw live or scrubbed playhead line
		const playheadSec = (cue.state === 'running' || cue.state === 'paused')
			? (st + (Number(cue.actionElapsed) || 0))
			: Math.max(0, Math.min(srcDur, previewPlayheadSec || st));
		const playX = (playheadSec / srcDur) * w;

		ctx.strokeStyle = '#ffffff';
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(playX, 0);
		ctx.lineTo(playX, h);
		ctx.stroke();

		ctx.fillStyle = '#ffffff';
		ctx.beginPath();
		ctx.moveTo(playX - 5, 0);
		ctx.lineTo(playX + 5, 0);
		ctx.lineTo(playX, 7);
		ctx.closePath();
		ctx.fill();
	}

	function onScrubSliderInput(cueId, sourceSec) {
		const cue = cues.find(c => c.id === cueId);
		if (!cue) return;
		previewPlayheadSec = Math.max(0, Number(sourceSec) || 0);
		const st = Number(cue.startTime) || 0;
		const et = Number(cue.endTime) || Number(cue.duration) || 10;
		const relElapsed = Math.max(0, Math.min(cue.duration || (et - st), previewPlayheadSec - st));

		// Update live audio/video element if running or paused
		const entry = activeAudioNodes.get(cueId);
		if (entry && entry.mediaEl) {
			entry.mediaEl.currentTime = previewPlayheadSec;
		}
		if (cue.type === 'video') {
			broadcastToStage({
				type: 'scrub_video',
				cueId: cue.id,
				url: cue.filePath ? (cue.filePath.startsWith('http') || cue.filePath.startsWith('/') ? cue.filePath : '/media/' + encodeURIComponent(cue.filePath)) : '',
				currentTime: previewPlayheadSec,
				targetScreens: cue.targetScreens || 'all'
			});
		}
		if (cue.state === 'running' || cue.state === 'paused') {
			cue.actionElapsed = relElapsed;
			apiPost('/api/cue/seek', { cueId, elapsed: relElapsed });
		}

		const readout = document.getElementById('scrubberReadout');
		if (readout) {
			readout.textContent = \`Playhead: \${formatTime(previewPlayheadSec)} | Crop: [\${formatTime(st)} – \${formatTime(et)}] (TRT: \${formatTime(cue.duration)})\`;
		}
		drawWaveformEnvelope(cue, 'trimTimelineCanvas');
		drawWaveformEnvelope(cue, 'waveformCanvas');
	}

	function stepScrubPlayhead(cueId, deltaSec) {
		const cue = cues.find(c => c.id === cueId);
		if (!cue) return;
		const srcDur = Number(cue.sourceDuration) || Number(cue.endTime) || Number(cue.duration) || 10;
		const st = Number(cue.startTime) || 0;
		const base = (cue.state === 'running' || cue.state === 'paused') ? (st + (Number(cue.actionElapsed) || 0)) : (previewPlayheadSec || st);
		const nextSec = Math.max(0, Math.min(srcDur, Number((base + deltaSec).toFixed(2))));
		const slider = document.getElementById('timelineScrubSlider');
		if (slider) slider.value = String(nextSec);
		onScrubSliderInput(cueId, nextSec);
	}

	function setCropPointFromPlayhead(cueId, which) {
		const cue = cues.find(c => c.id === cueId);
		if (!cue) return;
		const st = Number(cue.startTime) || 0;
		const et = Number(cue.endTime) || Number(cue.duration) || 10;
		const cur = (cue.state === 'running' || cue.state === 'paused') ? (st + (Number(cue.actionElapsed) || 0)) : (previewPlayheadSec || st);
		if (which === 'in') {
			const newIn = Math.max(0, Math.min(et - 0.1, Number(cur.toFixed(2))));
			updateCueField(cueId, 'startTime', newIn);
		} else {
			const newOut = Math.max(st + 0.1, Number(cur.toFixed(2)));
			updateCueField(cueId, 'endTime', newOut);
		}
	}

	function resetCropPoints(cueId) {
		const cue = cues.find(c => c.id === cueId);
		if (!cue) return;
		const srcDur = Number(cue.sourceDuration) || Number(cue.endTime) || Number(cue.duration) || 5;
		cue.startTime = 0;
		cue.endTime = srcDur;
		cue.duration = srcDur;
		apiPost('/api/cue/update', { cueId, updates: { startTime: 0, endTime: srcDur, duration: srcDur } });
		renderWorkspace();
		renderInspector();
	}

	function onTimelineCanvasMouseDown(evt, cueId) {
		const cue = cues.find(c => c.id === cueId);
		if (!cue) return;
		const canvas = evt.currentTarget;
		const srcDur = Math.max(0.5, Number(cue.sourceDuration) || Number(cue.endTime) || Number(cue.duration) || 5);

		const scrubFromEvent = (e) => {
			const rect = canvas.getBoundingClientRect();
			const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
			const sec = Number((ratio * srcDur).toFixed(2));
			const slider = document.getElementById('timelineScrubSlider');
			if (slider) slider.value = String(sec);
			onScrubSliderInput(cueId, sec);
		};

		scrubFromEvent(evt);
		const onMove = (e) => scrubFromEvent(e);
		const onUp = () => {
			window.removeEventListener('mousemove', onMove);
			window.removeEventListener('mouseup', onUp);
		};
		window.addEventListener('mousemove', onMove);
		window.addEventListener('mouseup', onUp);
	}

	// API Calls
	async function apiPost(endpoint, body = {}) {
		ensureAudioCtx();
		const res = await fetch(endpoint, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		});
		try {
			return await res.json();
		} catch {
			return {};
		}
	}

	function sendTransport(action) {
		if (action === 'go') {
			const btn = document.getElementById('goBtn');
			btn.classList.add('flash');
			setTimeout(() => btn.classList.remove('flash'), 120);
		}
		if (action === 'panic') {
			for (const id of activeAudioNodes.keys()) stopWebAudioForCue(id);
		}
		apiPost('/api/transport', { action });
	}

	function setStandby(cueId) {
		apiPost('/api/standby', { cueId });
	}

	function fireCueById(cueId) {
		apiPost('/api/cue/fire', { cueId });
	}

	function pauseCueById(cueId) {
		apiPost('/api/cue/pause', { cueId });
	}

	function stopCueById(cueId) {
		stopWebAudioForCue(cueId);
		apiPost('/api/cue/stop', { cueId });
	}

	function cycleContinueMode(cueId) {
		const cue = cues.find(c => c.id === cueId);
		if (!cue) return;
		const order = ['none', 'auto_continue', 'auto_follow'];
		const next = order[(order.indexOf(cue.continueMode) + 1) % order.length];
		updateCueField(cueId, 'continueMode', next);
	}

	function toggleGroupExpand(cueId) {
		const cue = cues.find(c => c.id === cueId);
		if (!cue) return;
		updateCueField(cueId, 'expanded', cue.expanded === false ? true : false);
	}

	function onMediaSourceSelect(cueId, filename) {
		updateCueField(cueId, 'filePath', filename);
		probeMediaDuration(filename, cueId);
	}

	function captureCurrentTimeAsPause(cueId) {
		const cue = cues.find(c => c.id === cueId);
		if (!cue) return;
		const t = Number((cue.actionElapsed || 0).toFixed(1));
		if (t > 0) {
			updateCueField(cueId, 'pauseAtTime', t);
		}
	}

	function updateCueField(cueId, field, value) {
		const cue = cues.find(c => c.id === cueId);
		if (cue) cue[field] = value;
		apiPost('/api/cue/update', { cueId, updates: { [field]: value } });
		if (cue && cue.type === 'background' && (cue.state === 'running' || cue.state === 'paused')) {
			startBackgroundCue(cue);
		}
		renderWorkspace();
		renderInspector();
	}

	let editingBgCueId = null;

	function openBgCreatorModal(existingCueId = null) {
		editingBgCueId = existingCueId;
		const existing = existingCueId ? cues.find(c => c.id === existingCueId) : null;
		document.getElementById('bgModalHeaderTitle').textContent = existing
			? ('🎨 Edit Background: Q ' + existing.qNumber + ' — ' + existing.name)
			: '🎨 Add Background Color / Gradient to Playlist';
		document.getElementById('bgModalSaveBtn').textContent = existing
			? '✓ Save Changes'
			: '✓ Add Background Cue to Playlist';

		document.getElementById('bgModalName').value = existing ? existing.name : 'Stage Background Look';
		document.getElementById('bgModalStyle').value = existing ? (existing.bgStyle || 'linear-gradient') : 'linear-gradient';
		const c1 = existing ? (existing.bgColor1 || '#0f172a') : '#0f172a';
		const c2 = existing ? (existing.bgColor2 || '#1e3a8a') : '#1e3a8a';
		const ang = existing && existing.bgAngle !== undefined ? existing.bgAngle : 135;
		document.getElementById('bgModalColor1').value = c1;
		document.getElementById('bgModalColor1Hex').value = c1;
		document.getElementById('bgModalColor2').value = c2;
		document.getElementById('bgModalColor2Hex').value = c2;
		document.getElementById('bgModalAngle').value = String(ang);
		document.getElementById('bgModalFadeIn').value = String(existing ? (existing.fadeIn || 0) : 1.0);
		document.getElementById('bgModalTargetScreens').value = existing ? (existing.targetScreens || 'all') : 'all';

		updateBgModalPreview();
		document.getElementById('bgCreatorModal').classList.add('open');
	}

	function closeBgModal() {
		document.getElementById('bgCreatorModal').classList.remove('open');
		editingBgCueId = null;
	}

	function applyBgPreset(style, c1, c2, angle, presetName) {
		document.getElementById('bgModalStyle').value = style;
		document.getElementById('bgModalColor1').value = c1;
		document.getElementById('bgModalColor1Hex').value = c1;
		document.getElementById('bgModalColor2').value = c2;
		document.getElementById('bgModalColor2Hex').value = c2;
		document.getElementById('bgModalAngle').value = String(angle);
		if (!editingBgCueId) {
			document.getElementById('bgModalName').value = presetName;
		}
		updateBgModalPreview();
	}

	function updateBgModalPreview() {
		const style = document.getElementById('bgModalStyle').value;
		const c1 = document.getElementById('bgModalColor1Hex').value || '#0f172a';
		const c2 = document.getElementById('bgModalColor2Hex').value || '#1e3a8a';
		const angle = Number(document.getElementById('bgModalAngle').value) || 135;
		document.getElementById('bgModalAngleLbl').textContent = String(angle);

		document.getElementById('bgModalColor2Wrap').style.display = style === 'solid' ? 'none' : 'flex';
		document.getElementById('bgModalAngleWrap').style.display = style === 'linear-gradient' ? 'flex' : 'none';

		const css = computeBackgroundCss({ bgStyle: style, bgColor1: c1, bgColor2: c2, bgAngle: angle });
		const prev = document.getElementById('bgModalLivePreview');
		prev.style.background = css;
		prev.textContent = style === 'solid'
			? ('SOLID COLOR: ' + c1.toUpperCase())
			: (style.toUpperCase() + ' (' + c1.toUpperCase() + ' → ' + c2.toUpperCase() + ')');
	}

	async function saveBgModalCue() {
		const name = document.getElementById('bgModalName').value || 'Stage Background Look';
		const bgStyle = document.getElementById('bgModalStyle').value;
		const bgColor1 = document.getElementById('bgModalColor1Hex').value || '#0f172a';
		const bgColor2 = document.getElementById('bgModalColor2Hex').value || '#1e3a8a';
		const bgAngle = Number(document.getElementById('bgModalAngle').value) || 135;
		const fadeIn = Number(document.getElementById('bgModalFadeIn').value) || 0;
		const targetScreens = document.getElementById('bgModalTargetScreens').value || 'all';

		if (editingBgCueId) {
			const cue = cues.find(c => c.id === editingBgCueId);
			const updates = { name, bgStyle, bgColor1, bgColor2, bgAngle, fadeIn, duration: Math.max(0.2, fadeIn), targetScreens };
			if (cue) Object.assign(cue, updates);
			await apiPost('/api/cue/update', { cueId: editingBgCueId, updates });
			if (cue && (cue.state === 'running' || cue.state === 'paused')) {
				startBackgroundCue(cue);
			}
		} else {
			const targetAfterId = selectedCueId || standbyCueId;
			const data = await apiPost('/api/cue/add', {
				type: 'background',
				afterCueId: targetAfterId,
				selectedCueIds: Array.from(selectedCueIds),
			});
			if (data && data.createdCueId) {
				await apiPost('/api/cue/update', {
					cueId: data.createdCueId,
					updates: { name, bgStyle, bgColor1, bgColor2, bgAngle, fadeIn, duration: Math.max(0.2, fadeIn), targetScreens }
				});
				selectedCueIds.clear();
				selectedCueIds.add(data.createdCueId);
				selectedCueId = data.createdCueId;
				anchorCueId = data.createdCueId;
			}
		}
		closeBgModal();
		renderWorkspace();
		renderInspector();
	}

	async function addCue(type) {
		const targetAfterId = selectedCueId || standbyCueId;
		const data = await apiPost('/api/cue/add', {
			type,
			afterCueId: targetAfterId,
			selectedCueIds: Array.from(selectedCueIds),
		});
		if (data && data.createdCueId) {
			selectedCueIds.clear();
			selectedCueIds.add(data.createdCueId);
			selectedCueId = data.createdCueId;
			anchorCueId = data.createdCueId;
		}
	}

	function moveSelectedCue(dir) {
		const ids = selectedCueIds.size > 0 ? Array.from(selectedCueIds) : (selectedCueId ? [selectedCueId] : []);
		if (ids.length > 0) apiPost('/api/cue/move', { cueIds: ids, direction: dir });
	}

	function duplicateSelectedCue() {
		const ids = selectedCueIds.size > 0 ? Array.from(selectedCueIds) : (selectedCueId ? [selectedCueId] : []);
		if (ids.length > 0) apiPost('/api/cue/duplicate', { cueIds: ids });
	}

	function deleteSelectedCue() {
		const ids = selectedCueIds.size > 0 ? Array.from(selectedCueIds) : (selectedCueId ? [selectedCueId] : []);
		if (ids.length > 0) {
			ids.forEach(id => stopWebAudioForCue(id));
			selectedCueIds.clear();
			selectedCueId = null;
			apiPost('/api/cue/delete', { cueIds: ids });
		}
	}

	function batchAssignGroup(parentId) {
		if (parentId === '__none__') return;
		const ids = Array.from(selectedCueIds);
		apiPost('/api/cue/batch_group', { cueIds: ids, parentId: parentId || null });
	}

	function onMasterVolChange(val) {
		const db = Number(val);
		document.getElementById('masterDbLabel').textContent = (db > 0 ? '+' : '') + db.toFixed(1) + ' dB';
		if (masterGainNode && audioCtx) {
			masterGainNode.gain.setTargetAtTime(dbToLinear(db), audioCtx.currentTime, 0.03);
		}
		apiPost('/api/transport', { action: 'master_vol', db });
	}

	async function uploadMediaFile(input) {
		if (!input.files || !input.files[0]) return;
		const file = input.files[0];
		const res = await fetch('/api/media/upload?filename=' + encodeURIComponent(file.name), {
			method: 'POST',
			body: file,
		});
		const data = await res.json();
		if (data.filename && selectedCueId) {
			updateCueField(selectedCueId, 'filePath', data.filename);
			probeMediaDuration(data.filename, selectedCueId);
		}
		input.value = '';
	}

	function openVideoStage() {
		videoStageWin = window.open('/stage', 'CueCompanionVideoStage', 'width=960,height=540');
	}

	// Keyboard Shortcuts (Including Shift+Arrow Multi-Select & Delete!)
	window.addEventListener('keydown', (e) => {
		if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

		if (e.code === 'Space') {
			e.preventDefault();
			sendTransport('go');
		} else if (e.code === 'Escape') {
			e.preventDefault();
			sendTransport('panic');
		} else if (e.code === 'ArrowDown' || e.code === 'ArrowUp') {
			e.preventDefault();
			const visible = getVisibleCues();
			if (visible.length === 0) return;

			const curId = selectedCueId || standbyCueId || visible[0].id;
			const curIdx = visible.findIndex(c => c.id === curId);
			const step = e.code === 'ArrowDown' ? 1 : -1;
			const nextIdx = Math.max(0, Math.min(visible.length - 1, curIdx + step));
			const nextCue = visible[nextIdx];

			if (e.shiftKey) {
				if (!anchorCueId) anchorCueId = curId;
				const idxA = visible.findIndex(c => c.id === anchorCueId);
				const start = Math.min(idxA, nextIdx);
				const end = Math.max(idxA, nextIdx);
				selectedCueIds.clear();
				for (let i = start; i <= end; i++) {
					selectedCueIds.add(visible[i].id);
				}
				selectedCueId = nextCue.id;
				renderWorkspace();
				renderInspector();
			} else {
				selectedCueIds.clear();
				selectedCueIds.add(nextCue.id);
				selectedCueId = nextCue.id;
				anchorCueId = nextCue.id;
				setStandby(nextCue.id);
				renderWorkspace();
				renderInspector();
			}
		} else if (e.code === 'KeyP') {
			e.preventDefault();
			sendTransport('pause_toggle');
		} else if (e.code === 'Delete' || e.code === 'Backspace') {
			e.preventDefault();
			deleteSelectedCue();
		}
	});

	// Live VU Meter & Wall Clock Loop
	function updateMetersAndClock() {
		document.getElementById('clockReadout').textContent = new Date().toLocaleTimeString();
		if (analyserNode && activeAudioNodes.size > 0 && !isPaused) {
			const data = new Uint8Array(analyserNode.frequencyBinCount);
			analyserNode.getByteTimeDomainData(data);
			let peak = 0;
			for (let i = 0; i < data.length; i++) {
				const v = Math.abs(data[i] - 128) / 128;
				if (v > peak) peak = v;
			}
			const pct = Math.min(100, Math.pow(peak, 0.6) * 125);
			document.getElementById('vuL').style.height = pct + '%';
			document.getElementById('vuR').style.height = Math.max(0, pct - 3) + '%';
		} else {
			document.getElementById('vuL').style.height = '0%';
			document.getElementById('vuR').style.height = '0%';
		}
		requestAnimationFrame(updateMetersAndClock);
	}
	requestAnimationFrame(updateMetersAndClock);

	// Connect SSE Live Stream
	function connectSse() {
		const es = new EventSource('/api/events');
		es.onmessage = (evt) => {
			try {
				const payload = JSON.parse(evt.data);
				if (payload.stageEvent && !payload.cues) {
					return;
				}
				const oldCues = cues;
				cues = payload.cues || [];
				mediaFiles = payload.mediaFiles || [];
				standbyCueId = payload.standbyCueId;
				isPaused = !!payload.isPaused;
				masterVolumeDb = payload.masterVolumeDb ?? 0;

				if (Array.isArray(payload.screens) && payload.screens.length > 0) {
					detectedScreens = payload.screens;
				}
				if (Array.isArray(payload.activeStageScreens)) {
					activeNativeStageScreens = new Set(payload.activeStageScreens);
				}

				if (!selectedCueId && standbyCueId) {
					selectedCueId = standbyCueId;
					anchorCueId = standbyCueId;
					selectedCueIds.add(standbyCueId);
				}

				syncAudioEngineWithState(oldCues, cues);
				renderWorkspace();
				renderScreenModalList();
				if (payload.fullRefresh) renderInspector();
				else {
					const activeInspectorCue = cues.find(c => c.id === selectedCueId) || cues.find(c => c.id === standbyCueId);
					if (activeInspectorCue && (activeInspectorCue.state === 'running' || activeInspectorCue.state === 'paused')) {
						drawWaveformEnvelope(activeInspectorCue, 'trimTimelineCanvas');
						drawWaveformEnvelope(activeInspectorCue, 'waveformCanvas');
					}
				}
			} catch (err) {
				console.error('SSE parse error:', err);
			}
		};
		es.onerror = () => {
			setTimeout(connectSse, 2000);
		};
	}
	connectSse();
	detectDisplays(false);
</script>
</body>
</html>`
}

export function GetVideoStageHtml(): string {
	return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>Cue Companion Stage Output</title>
<style>
	* { box-sizing: border-box; }
	html, body {
		margin: 0;
		padding: 0;
		width: 100vw;
		height: 100vh;
		background: #000000;
		overflow: hidden;
		user-select: none;
		cursor: none;
	}
	body.show-cursor {
		cursor: default;
	}
	#bgLayer {
		position: fixed;
		inset: 0;
		width: 100vw;
		height: 100vh;
		background: #000000;
		z-index: 1;
		transition: background 0.35s ease, opacity 0.35s ease;
	}
	video#stageVideo {
		position: fixed;
		inset: 0;
		width: 100vw;
		height: 100vh;
		object-fit: contain;
		z-index: 2;
		display: none;
		background: transparent;
		opacity: 1;
		transition: opacity 0.06s linear;
	}
	#fsButtonOverlay {
		position: fixed;
		top: 12px;
		right: 12px;
		z-index: 10;
		background: rgba(15, 23, 42, 0.85);
		border: 1px solid rgba(255, 255, 255, 0.2);
		color: #e2e8f0;
		padding: 6px 12px;
		border-radius: 6px;
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
		font-size: 12px;
		cursor: pointer;
		opacity: 0;
		transition: opacity 0.2s ease;
		pointer-events: none;
	}
	body.show-cursor:not(:fullscreen) #fsButtonOverlay {
		opacity: 1;
		pointer-events: auto;
	}
</style>
</head>
<body ondblclick="enterStageFullscreen()">
	<div id="bgLayer"></div>
	<video id="stageVideo" playsinline></video>
	<button id="fsButtonOverlay" onclick="enterStageFullscreen()">⛶ Enter Fullscreen</button>
	<script>
		const params = new URLSearchParams(window.location.search);
		const myScreenIdx = String(params.get('screen') ?? '0');
		const wantAutoFs = params.get('fs') === '1';
		document.title = 'Cue Companion Stage Output - Screen ' + (Number(myScreenIdx) + 1);

		const bgLayer = document.getElementById('bgLayer');
		const vid = document.getElementById('stageVideo');
		let currentVideoEndTime = 0;
		let currentVideoStartTime = 0;
		let currentVideoFadeIn = 0;
		let currentVideoFadeOut = 0;
		let currentVideoLoop = false;
		let currentVideoPauseAtEnd = false;
		let cursorTimer = null;

		window.addEventListener('mousemove', () => {
			document.body.classList.add('show-cursor');
			if (cursorTimer) clearTimeout(cursorTimer);
			cursorTimer = setTimeout(() => document.body.classList.remove('show-cursor'), 1800);
		});

		async function enterStageFullscreen() {
			try {
				if (!document.fullscreenElement) {
					await document.documentElement.requestFullscreen();
				} else {
					await document.exitFullscreen();
				}
			} catch (e) {}
		}

		if (wantAutoFs) {
			window.addEventListener('load', () => {
				setTimeout(() => { enterStageFullscreen(); }, 200);
			});
			window.addEventListener('click', () => {
				if (!document.fullscreenElement) enterStageFullscreen();
			}, { once: true });
		}

		function isTargetedForThisScreen(targetScreens) {
			if (!targetScreens || targetScreens === 'all') return true;
			const parts = String(targetScreens).split(',').map(s => s.trim());
			return parts.includes(myScreenIdx);
		}

		vid.ontimeupdate = () => {
			const elapsed = Math.max(0, vid.currentTime - currentVideoStartTime);
			const dur = currentVideoEndTime > currentVideoStartTime ? (currentVideoEndTime - currentVideoStartTime) : Math.max(0, (vid.duration || 0) - currentVideoStartTime);
			let localOp = 1.0;
			if (currentVideoFadeIn > 0 && elapsed < currentVideoFadeIn) {
				localOp = Math.max(0, Math.min(1, elapsed / currentVideoFadeIn));
				vid.style.opacity = String(localOp);
			} else if (!currentVideoLoop && currentVideoFadeOut > 0 && dur > 0 && (dur - elapsed) <= currentVideoFadeOut) {
				localOp = Math.max(0, Math.min(1, (dur - elapsed) / currentVideoFadeOut));
				vid.style.opacity = String(localOp);
			}

			if (currentVideoEndTime > currentVideoStartTime && vid.currentTime >= currentVideoEndTime) {
				if (currentVideoLoop) {
					vid.currentTime = currentVideoStartTime;
					vid.play().catch(() => {});
				} else if (currentVideoPauseAtEnd) {
					vid.pause();
					vid.currentTime = Math.max(currentVideoStartTime, currentVideoEndTime - 0.04);
				} else {
					vid.pause();
					vid.currentTime = currentVideoStartTime;
					vid.style.opacity = '0';
					vid.style.display = 'none';
				}
			}
		};

		vid.onended = () => {
			if (currentVideoLoop) {
				vid.currentTime = currentVideoStartTime;
				vid.play().catch(() => {});
			} else if (currentVideoPauseAtEnd) {
				vid.pause();
			} else {
				vid.pause();
				vid.currentTime = currentVideoStartTime;
				vid.style.opacity = '0';
				vid.style.display = 'none';
			}
		};

		function handleStageMessage(msg) {
			if (!msg || !msg.type) return;
			if (msg.targetScreens && !isTargetedForThisScreen(msg.targetScreens)) return;

			if (msg.type === 'request_fullscreen') {
				enterStageFullscreen();
			} else if (msg.type === 'set_background') {
				bgLayer.style.transition = msg.fadeIn > 0 ? ('background ' + msg.fadeIn + 's ease') : 'none';
				bgLayer.style.background = msg.css || '#000000';
			} else if (msg.type === 'clear_background') {
				bgLayer.style.background = '#000000';
			} else if (msg.type === 'play_video') {
				currentVideoStartTime = Number(msg.startTime) || 0;
				currentVideoEndTime = Number(msg.endTime) || 0;
				currentVideoFadeIn = Number(msg.fadeIn) || 0;
				currentVideoFadeOut = Number(msg.fadeOut) || 0;
				currentVideoLoop = !!msg.loop;
				currentVideoPauseAtEnd = !!msg.pauseAtEnd;
				vid.style.opacity = String(msg.opacity !== undefined ? msg.opacity : (currentVideoFadeIn > 0 ? 0 : 1));
				vid.style.display = 'block';
				if (vid.getAttribute('data-url') !== msg.url) {
					vid.setAttribute('data-url', msg.url);
					vid.src = msg.url;
				}
				vid.loop = false;
				vid.volume = msg.volume ?? 0;
				vid.currentTime = currentVideoStartTime;
				vid.play().catch(() => {});
			} else if (msg.type === 'video_opacity') {
				if (msg.opacity !== undefined) {
					vid.style.opacity = String(msg.opacity);
				}
			} else if (msg.type === 'scrub_video') {
				if (msg.url) {
					vid.style.opacity = '1';
					vid.style.display = 'block';
					if (vid.getAttribute('data-url') !== msg.url) {
						vid.setAttribute('data-url', msg.url);
						vid.src = msg.url;
					}
					vid.currentTime = Number(msg.currentTime) || 0;
				}
			} else if (msg.type === 'pause_video') {
				vid.pause();
			} else if (msg.type === 'resume_video') {
				vid.style.display = 'block';
				vid.play().catch(() => {});
			} else if (msg.type === 'stop_video') {
				vid.pause();
				vid.currentTime = Number(msg.resetTime) || currentVideoStartTime || 0;
				vid.style.opacity = '0';
				vid.style.display = 'none';
			}
		}

		window.addEventListener('message', (e) => handleStageMessage(e.data));
		if (typeof BroadcastChannel !== 'undefined') {
			const bc = new BroadcastChannel('cue_companion_stage_channel');
			bc.onmessage = (e) => handleStageMessage(e.data);
		}

		function connectStageSse() {
			const es = new EventSource('/api/events');
			es.onmessage = (evt) => {
				try {
					const payload = JSON.parse(evt.data);
					if (payload && payload.stageEvent) {
						handleStageMessage(payload.stageEvent);
					}
				} catch {}
			};
			es.onerror = () => {
				setTimeout(connectStageSse, 1500);
			};
		}
		connectStageSse();
	</script>
</body>
</html>`
}
