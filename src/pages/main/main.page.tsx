import React, { useEffect, useRef, useState } from 'react'
import Minimap from '../../components/ui/minimap.component';
import SettingsMenu from '../../components/ui/settings/settings-menu.component'
import PanZoomControls from '../../components/ui/pan-zoom-controls.component'
import ScaleBar from '../../components/ui/scale-bar.component'
import ControlPanel from '../../components/ui/control-panel/control-panel.component';
import './main.styles.sass'

const UNITS = [
	{ label: 'miles', scale: 1609.34, short: 'mi', sub: 'ft', subScale: 0.3048 },
	{ label: 'km', scale: 1000, short: 'km', sub: 'm', subScale: 1 },
]

type ViewState = {
	offsetX: number;
	offsetY: number;
	zoom: number;
	isPanning: boolean;
	startPanX: number;
	startPanY: number;
};

// IndexedDB utility for NoSQL-style persistence
function openUIStore(): Promise<IDBObjectStore> {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open('my-city-db', 1);
		req.onupgradeneeded = () => {
			req.result.createObjectStore('ui');
		};
		req.onsuccess = () => {
			const tx = req.result.transaction('ui', 'readwrite');
			resolve(tx.objectStore('ui'));
		};
		req.onerror = () => reject(req.error);
	});
}
async function setUIStateIndexedDB(key: string, value: unknown) {
	const store = await openUIStore();
	store.put(value, key);
	store.transaction.oncomplete = () => store.transaction.db.close();
}
async function getUIStateIndexedDB<T = unknown>(key: string): Promise<T | undefined> {
	const store = await openUIStore();
	return new Promise<T | undefined>((resolve, reject) => {
		const req = store.get(key);
		req.onsuccess = () => {
			store.transaction.db.close();
			resolve(req.result as T | undefined);
		};
		req.onerror = () => {
			store.transaction.db.close();
			reject(req.error);
		};
	});
}

function MainPage() {
	// All hooks must be called unconditionally at the top level
	const canvasRef = useRef<HTMLCanvasElement | null>(null)
	const [loaded, setLoaded] = useState(false)
	const [view, setView] = useState<ViewState>({
		offsetX: 0,
		offsetY: 0,
		zoom: 1,
		isPanning: false,
		startPanX: 0,
		startPanY: 0,
	})
	const viewRef = React.useRef(view)
	const isDraggingRef = React.useRef(false)
	const startPanMouseRef = React.useRef({ x: 0, y: 0 })
	const startPanOffsetRef = React.useRef({ x: 0, y: 0 })
	const [unitIndex, setUnitIndex] = useState(0)
	const [citySize, setCitySize] = useState({ x: 15, y: 15 })
	const [minimapMaxSize, setMinimapMaxSize] = React.useState(180)
	const [isMinimapDragging, setIsMinimapDragging] = React.useState(false)
	const unit = UNITS[unitIndex]
	const panIntervalRef = React.useRef<number | null>(null)
	const zoomIntervalRef = React.useRef<number | null>(null)

	const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
	const [mode, setMode] = useState<string | null>(null);
	const [option, setOption] = useState<string | null>(null);
	const [action, setAction] = useState<string | null>(null);
	const [buildMode, setBuildMode] = useState(false);

	const handleToggleBuildMode = () => setBuildMode(b => !b);

	// Load persisted state from IndexedDB on mount, then set loaded=true
	React.useEffect(() => {
		(async () => {
			const [persistedView, persistedCitySize, persistedUnitIndex, persistedMinimapMaxSize] = await Promise.all([
				getUIStateIndexedDB<ViewState>('view'),
				getUIStateIndexedDB<{ x: number; y: number }>('citySize'),
				getUIStateIndexedDB<number>('unitIndex'),
				getUIStateIndexedDB<number>('minimapMaxSize'),
			]);
			if (persistedView) setView(persistedView);
			if (persistedCitySize) setCitySize(persistedCitySize);
			if (typeof persistedUnitIndex === 'number') setUnitIndex(persistedUnitIndex);
			if (typeof persistedMinimapMaxSize === 'number') setMinimapMaxSize(persistedMinimapMaxSize);
			setLoaded(true);
		})();
	}, []);

	// Persist view, citySize, unitIndex, minimapMaxSize to IndexedDB on change, but only after loaded
	React.useEffect(() => {
		if (!loaded) return;
		setUIStateIndexedDB('view', view);
	}, [view, loaded]);
	React.useEffect(() => {
		if (!loaded) return;
		setUIStateIndexedDB('citySize', citySize);
	}, [citySize, loaded]);
	React.useEffect(() => {
		if (!loaded) return;
		setUIStateIndexedDB('unitIndex', unitIndex);
	}, [unitIndex, loaded]);
	React.useEffect(() => {
		if (!loaded) return;
		setUIStateIndexedDB('minimapMaxSize', minimapMaxSize);
	}, [minimapMaxSize, loaded]);

	// Helper to get min/max zoom and offset bounds
	function getZoomBounds(
		citySize: { x: number; y: number },
		unit: { short: string; scale: number },
		canvasWidth: number,
		canvasHeight: number
	) {
		// Min zoom: fit whole city
		const cityWidthMeters = citySize.x * unit.scale
		const cityHeightMeters = citySize.y * unit.scale
		const minZoom = Math.min(
			canvasWidth / cityWidthMeters,
			canvasHeight / cityHeightMeters
		)
		// Max zoom: 300ft or 100m fills the screen
		const maxMeters = unit.short === 'mi' ? 300 * 0.3048 : 100
		const maxZoom = Math.max(
			canvasWidth / maxMeters,
			canvasHeight / maxMeters
		)
		return { minZoom, maxZoom }
	}

	// Clamp offset so the city always stays in view
	const clampOffset = React.useCallback((
		offsetX: number,
		offsetY: number,
		zoom: number,
		canvasWidth: number,
		canvasHeight: number,
		citySize: { x: number; y: number },
		unit: { short: string; scale: number }
	) => {
		const cityWidthPx = citySize.x * unit.scale * zoom
		const cityHeightPx = citySize.y * unit.scale * zoom
		const minOffsetX = Math.min(0, canvasWidth - cityWidthPx)
		const minOffsetY = Math.min(0, canvasHeight - cityHeightPx)
		const maxOffsetX = 0
		const maxOffsetY = 0
		return {
			offsetX: Math.max(minOffsetX, Math.min(offsetX, maxOffsetX)),
			offsetY: Math.max(minOffsetY, Math.min(offsetY, maxOffsetY)),
		}
	}, []);

	// Handle drawing with pan and zoom
	useEffect(() => {
		const citySizeMeters = { x: citySize.x * unit.scale, y: citySize.y * unit.scale }
		const canvas = canvasRef.current
		if (canvas) {
			const ctx = canvas.getContext('2d')
			if (ctx) {
				ctx.setTransform(1, 0, 0, 1, 0, 0) // Reset transform
				ctx.clearRect(0, 0, canvas.width, canvas.height)
				ctx.setTransform(view.zoom, 0, 0, view.zoom, view.offsetX, view.offsetY)
				// Fill background
				ctx.fillStyle = '#e0e7ef'
				ctx.fillRect(0, 0, citySizeMeters.x, citySizeMeters.y)

				// --- Draw grid ---
				// Shift origin so (0,0) is bottom-left
				ctx.translate(0, citySizeMeters.y)
				ctx.scale(1, -1)
				const majorDist = unit.scale // 1 mile or 1 km in meters
				const minorDist = unit.scale / 4 // 1/4 mile or 1/4 km in meters

				// Minor grid lines (quarter mile/km)
				ctx.save()
				ctx.setLineDash([])
				ctx.strokeStyle = '#bbb'
				ctx.lineWidth = 1 / view.zoom
				for (let x = 0; x <= citySizeMeters.x + 0.0001; x += minorDist) {
					ctx.beginPath()
					ctx.moveTo(x, 0)
					ctx.lineTo(x, citySizeMeters.y)
					ctx.stroke()
				}
				for (let y = 0; y <= citySizeMeters.y + 0.0001; y += minorDist) {
					ctx.beginPath()
					ctx.moveTo(0, y)
					ctx.lineTo(citySizeMeters.x, y)
					ctx.stroke()
				}
				ctx.restore()

				// Major grid lines (mile/km)
				ctx.save()
				ctx.setLineDash([])
				ctx.strokeStyle = '#aaa'
				ctx.lineWidth = 2 / view.zoom
				for (let x = 0; x <= citySizeMeters.x + 0.0001; x += majorDist) {
					ctx.beginPath()
					ctx.moveTo(x, 0)
					ctx.lineTo(x, citySizeMeters.y)
					ctx.stroke()
				}
				for (let y = 0; y <= citySizeMeters.y + 0.0001; y += majorDist) {
					ctx.beginPath()
					ctx.moveTo(0, y)
					ctx.lineTo(citySizeMeters.x, y)
					ctx.stroke()
				}
				ctx.restore()
			}
		}
	}, [view, unitIndex, citySize, unit.scale])

	// Mouse and wheel event handlers for pan and zoom
	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas) return

		const handleWheel = (e: WheelEvent) => {
			e.preventDefault()
			const { minZoom, maxZoom } = getZoomBounds(citySize, unit, canvas.width, canvas.height)
			// Always zoom in/out, centered on mouse
			const zoomIntensity = 0.1
			let newZoom = view.zoom * (e.deltaY < 0 ? 1 + zoomIntensity : 1 - zoomIntensity)
			newZoom = Math.max(minZoom, Math.min(newZoom, maxZoom))
			const rect = canvas.getBoundingClientRect()
			const mouseX = e.clientX - rect.left
			const mouseY = e.clientY - rect.top
			const worldX = (mouseX - view.offsetX) / view.zoom
			const worldY = (mouseY - view.offsetY) / view.zoom
			const newOffsetX = mouseX - worldX * newZoom
			const newOffsetY = mouseY - worldY * newZoom
			const clamped = clampOffset(newOffsetX, newOffsetY, newZoom, canvas.width, canvas.height, citySize, unit)
			setView(v => ({ ...v, zoom: newZoom, offsetX: clamped.offsetX, offsetY: clamped.offsetY }))
		}

		const handleMouseDown = (e: MouseEvent) => {
			if (e.button !== 1) return // Only pan with middle mouse button
			isDraggingRef.current = true
			startPanMouseRef.current = { x: e.clientX, y: e.clientY }
			startPanOffsetRef.current = { x: viewRef.current.offsetX, y: viewRef.current.offsetY }
			setView(v => ({ ...v, isPanning: true, startPanX: e.clientX, startPanY: e.clientY }))
		}
		const handleMouseMove = (e: MouseEvent) => {
			if (!isDraggingRef.current) return
			const dx = e.clientX - startPanMouseRef.current.x
			const dy = e.clientY - startPanMouseRef.current.y
			const newOffsetX = startPanOffsetRef.current.x + dx
			const newOffsetY = startPanOffsetRef.current.y + dy
			const v = viewRef.current
			const clamped = clampOffset(newOffsetX, newOffsetY, v.zoom, canvas.width, canvas.height, citySize, unit)
			setView(v2 => ({ ...v2, offsetX: clamped.offsetX, offsetY: clamped.offsetY }))
		}
		const handleMouseUp = (e: MouseEvent) => {
			if (e.button !== 1) return // Only end pan for middle mouse button
			isDraggingRef.current = false
			setView(v => ({ ...v, isPanning: false }))
		}

		canvas.addEventListener('wheel', handleWheel, { passive: false })
		canvas.addEventListener('mousedown', handleMouseDown)
		window.addEventListener('mousemove', handleMouseMove)
		window.addEventListener('mouseup', handleMouseUp)

		return () => {
			canvas.removeEventListener('wheel', handleWheel)
			canvas.removeEventListener('mousedown', handleMouseDown)
			window.removeEventListener('mousemove', handleMouseMove)
			window.removeEventListener('mouseup', handleMouseUp)
		}
	}, [view, citySize, unit, clampOffset])

	// Center map and clamp offset when zoom or city size/unit changes
	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas) return
		const { minZoom } = getZoomBounds(citySize, unit, canvas.width, canvas.height)
		// Only recenter if the zoom is at minZoom (fully zoomed out)
		if (view.zoom === minZoom) {
			const cityWidthPx = citySize.x * unit.scale * minZoom
			const cityHeightPx = citySize.y * unit.scale * minZoom
			const offsetX = (canvas.width - cityWidthPx) / 2
			const offsetY = (canvas.height - cityHeightPx) / 2
			const clamped = clampOffset(offsetX, offsetY, minZoom, canvas.width, canvas.height, citySize, unit)
			setView(v => ({ ...v, zoom: minZoom, offsetX: clamped.offsetX, offsetY: clamped.offsetY }))
		}
		// Only run when citySize or unit changes, not on view.zoom
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [citySize, unit, canvasRef])

	// Center map when zoomed out all the way or when city size/unit changes
	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas) return
		const { minZoom } = getZoomBounds(citySize, unit, canvas.width, canvas.height)
		if (view.zoom === minZoom) {
			// Center the city
			const cityWidthPx = canvas.width / minZoom
			const cityHeightPx = canvas.height / minZoom
			const offsetX = (canvas.width - cityWidthPx) / 2
			const offsetY = (canvas.height - cityHeightPx) / 2
			setView(v => ({ ...v, offsetX, offsetY }))
		}
	}, [citySize, unit, view.zoom, canvasRef])

	const handleUnitToggle = () => {
		// Calculate new city size in the new unit, rounded to 2 decimals
		const oldUnit = UNITS[unitIndex]
		const newUnitIndex = (unitIndex + 1) % UNITS.length
		const newUnit = UNITS[newUnitIndex]
		const xMeters = citySize.x * oldUnit.scale
		const yMeters = citySize.y * oldUnit.scale
		const newX = +(xMeters / newUnit.scale).toFixed(2)
		const newY = +(yMeters / newUnit.scale).toFixed(2)
		setCitySize({ x: newX, y: newY })
		setUnitIndex(newUnitIndex)
	}

	// Refresh canvas on window resize
	useEffect(() => {
		function handleResize() {
			const canvas = canvasRef.current
			if (canvas) {
				canvas.width = window.innerWidth
				canvas.height = window.innerHeight
				setView(v => ({ ...v })) // Force a redraw
			}
		}
		window.addEventListener('resize', handleResize)
		handleResize()
		return () => window.removeEventListener('resize', handleResize)
	}, [])

	// --- Continuous pan/zoom logic ---
	function startContinuousPan(direction: 'up' | 'down' | 'left' | 'right') {
		if (panIntervalRef.current) clearInterval(panIntervalRef.current)
		const panAmount = 80
		const doPan = () => {
			setView(v => {
				const canvas = canvasRef.current
				if (!canvas) return v
				let next = v
				if (direction === 'up') next = { ...v, offsetY: v.offsetY + panAmount }
				if (direction === 'down') next = { ...v, offsetY: v.offsetY - panAmount }
				if (direction === 'left') next = { ...v, offsetX: v.offsetX + panAmount }
				if (direction === 'right') next = { ...v, offsetX: v.offsetX - panAmount }
				// Clamp to bounds
				const clamped = clampOffset(next.offsetX, next.offsetY, v.zoom, canvas.width, canvas.height, citySize, unit)
				// If clamped is the same as v, stop the interval
				if (clamped.offsetX === v.offsetX && clamped.offsetY === v.offsetY) {
					stopContinuousPan()
					return v
				}
				return { ...v, offsetX: clamped.offsetX, offsetY: clamped.offsetY }
			})
		}
		panIntervalRef.current = setInterval(doPan, 60)
		window.addEventListener('mouseup', stopContinuousPan)
		window.addEventListener('touchend', stopContinuousPan)
	}
	function stopContinuousPan() {
		if (panIntervalRef.current) {
			clearInterval(panIntervalRef.current)
			panIntervalRef.current = null
		}
		window.removeEventListener('mouseup', stopContinuousPan)
		window.removeEventListener('touchend', stopContinuousPan)
	}
	const doSinglePan = React.useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
		const panAmount = 80
		const canvas = canvasRef.current
		setView(v => {
			if (!canvas) return v
			let next = v
			if (direction === 'up') next = { ...v, offsetY: v.offsetY + panAmount }
			if (direction === 'down') next = { ...v, offsetY: v.offsetY - panAmount }
			if (direction === 'left') next = { ...v, offsetX: v.offsetX + panAmount }
			if (direction === 'right') next = { ...v, offsetX: v.offsetX - panAmount }
			const clamped = clampOffset(next.offsetX, next.offsetY, v.zoom, canvas.width, canvas.height, citySize, unit)
			return { ...v, offsetX: clamped.offsetX, offsetY: clamped.offsetY }
		})
	}, [canvasRef, clampOffset, citySize, unit])

	function startContinuousZoom(type: 'in' | 'out') {
		if (zoomIntervalRef.current) clearInterval(zoomIntervalRef.current)
		const doZoom = () => {
			const canvas = canvasRef.current
			if (!canvas) return
			setView(v => {
				const bounds = getZoomBounds(citySize, unit, canvas.width, canvas.height)
				let newZoom = v.zoom
				if (type === 'in') newZoom = Math.min(v.zoom * 1.2, bounds.maxZoom)
				else newZoom = Math.max(v.zoom / 1.2, bounds.minZoom)
				// Center on current viewport center
				const viewportCenterX = canvas.width / 2
				const viewportCenterY = canvas.height / 2
				const worldCenterX = (viewportCenterX - v.offsetX) / v.zoom
				const worldCenterY = (viewportCenterY - v.offsetY) / v.zoom
				const newOffsetX = viewportCenterX - worldCenterX * newZoom
				const newOffsetY = viewportCenterY - worldCenterY * newZoom
				const clamped = clampOffset(newOffsetX, newOffsetY, newZoom, canvas.width, canvas.height, citySize, unit)
				return { ...v, zoom: newZoom, offsetX: clamped.offsetX, offsetY: clamped.offsetY }
			})
		}
		zoomIntervalRef.current = setInterval(doZoom, 60)
		window.addEventListener('mouseup', stopContinuousZoom)
		window.addEventListener('touchend', stopContinuousZoom)
	}
	function stopContinuousZoom() {
		if (zoomIntervalRef.current) {
			clearInterval(zoomIntervalRef.current)
			zoomIntervalRef.current = null
		}
		window.removeEventListener('mouseup', stopContinuousZoom)
		window.removeEventListener('touchend', stopContinuousZoom)
	}
	const doSingleZoom = React.useCallback((type: 'in' | 'out') => {
		const canvas = canvasRef.current
		if (!canvas) return
		const bounds = getZoomBounds(citySize, unit, canvas.width, canvas.height)
		let newZoom = view.zoom
		if (type === 'in') newZoom = Math.min(view.zoom * 1.2, bounds.maxZoom)
		else newZoom = Math.max(view.zoom / 1.2, bounds.minZoom)
		// Center on current viewport center
		const viewportCenterX = canvas.width / 2
		const viewportCenterY = canvas.height / 2
		const worldCenterX = (viewportCenterX - view.offsetX) / view.zoom
		const worldCenterY = (viewportCenterY - view.offsetY) / view.zoom
		const newOffsetX = viewportCenterX - worldCenterX * newZoom
		const newOffsetY = viewportCenterY - worldCenterY * newZoom
		const clamped = clampOffset(newOffsetX, newOffsetY, newZoom, canvas.width, canvas.height, citySize, unit)
		setView(v => ({ ...v, zoom: newZoom, offsetX: clamped.offsetX, offsetY: clamped.offsetY }))
	}, [canvasRef, clampOffset, citySize, unit, view.zoom, view.offsetX, view.offsetY])

	// Prevent browser zooming when ctrl+wheel is used anywhere except the city-canvas
	useEffect(() => {
		function handleGlobalWheel(e: WheelEvent) {
			if (e.ctrlKey) {
				const isCanvas = (e.target as Element)?.closest?.('#city-canvas');
				if (!isCanvas) {
					e.preventDefault();
				}
			}
		}
		window.addEventListener('wheel', handleGlobalWheel, { passive: false });
		return () => window.removeEventListener('wheel', handleGlobalWheel);
	}, []);

	// Keyboard shortcuts for zoom and pan
	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			// Disable shortcuts if settings menu is open or focus is in input/textarea/select/contenteditable
			const active = document.activeElement;
			const isInput = active && (
				active.tagName === 'INPUT' ||
				active.tagName === 'TEXTAREA' ||
				active.tagName === 'SELECT' ||
				(active as HTMLElement).isContentEditable
			);
			if (settingsMenuOpen || isInput) return;

			// Map pan: Arrow keys and WASD
			if (["ArrowUp", "w", "W"].includes(e.key)) {
				doSinglePan('up');
				e.preventDefault();
			}
			if (["ArrowDown", "s", "S"].includes(e.key)) {
				doSinglePan('down');
				e.preventDefault();
			}
			if (["ArrowLeft", "a", "A"].includes(e.key)) {
				doSinglePan('left');
				e.preventDefault();
			}
			if (["ArrowRight", "d", "D"].includes(e.key)) {
				doSinglePan('right');
				e.preventDefault();
			}

			// Map zoom: +, =, -, _ (on main and numpad)
			if (["=", "+", "NumpadAdd"].includes(e.key) || (e.key === "+" && e.shiftKey)) {
				doSingleZoom('in');
				e.preventDefault();
			}
			if (["-", "_", "NumpadSubtract"].includes(e.key)) {
				doSingleZoom('out');
				e.preventDefault();
			}
		}
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [settingsMenuOpen, doSinglePan, doSingleZoom]);

	// Keep viewRef in sync with view
	useEffect(() => {
		viewRef.current = view
	}, [view])

	// Custom cursor for add-road tool
	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		if (mode === 'build' && option === 'roads' && action === 'add-road') {
			canvas.style.cursor = 'crosshair';
		} else {
			canvas.style.cursor = '';
		}
	}, [mode, option, action]);

	// Only render after loaded, but always call all hooks
	const isLoading = !loaded || view === undefined || citySize === undefined || unitIndex === undefined || minimapMaxSize === undefined;
	return (
		isLoading ? (
			<div style={{width: '100vw', height: '100vh', background: '#e0e7ef'}} />
		) : (
			<>
				<div id="MainPage">
					<div id="ui-controls">
						<SettingsMenu
							citySizeInputProps={{
								citySize,
								setCitySize,
								unit,
								onUnitToggle: handleUnitToggle,
							}}
							open={settingsMenuOpen}
							setOpen={setSettingsMenuOpen}
						/>
						<PanZoomControls
							onZoomIn={() => doSingleZoom('in')}
							onZoomOut={() => doSingleZoom('out')}
							onZoomStart={startContinuousZoom}
							onZoomStop={stopContinuousZoom}
							zoomLabel={`Zoom: ${view.zoom.toFixed(2)}x`}
							zoomSliderValue={(() => {
								const bounds = getZoomBounds(citySize, unit, window.innerWidth, window.innerHeight)
								const minZoom = bounds.minZoom
								const maxZoom = bounds.maxZoom
								const logMin = Math.log(minZoom)
								const logMax = Math.log(maxZoom)
								const logZoom = Math.log(view.zoom)
								return (logZoom - logMin) / (logMax - logMin)
							})()}
							onZoomSliderChange={sliderValue => {
								const bounds = getZoomBounds(citySize, unit, window.innerWidth, window.innerHeight)
								const minZoom = bounds.minZoom
								const maxZoom = bounds.maxZoom
								const logMin = Math.log(minZoom)
								const logMax = Math.log(maxZoom)
								const logZoom = logMin + sliderValue * (logMax - logMin)
								const newZoom = Math.exp(logZoom)
								const canvas = canvasRef.current
								if (!canvas) return
								const viewportCenterX = canvas.width / 2
								const viewportCenterY = canvas.height / 2
								const worldCenterX = (viewportCenterX - view.offsetX) / view.zoom
								const worldCenterY = (viewportCenterY - view.offsetY) / view.zoom
								const newOffsetX = viewportCenterX - worldCenterX * newZoom
								const newOffsetY = viewportCenterY - worldCenterY * newZoom
								const clamped = clampOffset(newOffsetX, newOffsetY, newZoom, canvas.width, canvas.height, citySize, unit)
								setView(v => ({ ...v, zoom: newZoom, offsetX: clamped.offsetX, offsetY: clamped.offsetY }))
							}}
							onPan={doSinglePan}
							onPanStart={startContinuousPan}
							onPanStop={stopContinuousPan}
						/>
						<div id="ui-bottom">
							<ScaleBar view={view} unit={unit} canvasRef={canvasRef as React.RefObject<HTMLCanvasElement>} />
							<Minimap
								citySize={citySize}
								unit={unit}
								view={view}
								setView={setView}
								canvasRef={canvasRef as React.RefObject<HTMLCanvasElement>}
								minimapMaxSize={minimapMaxSize}
								setMinimapMaxSize={setMinimapMaxSize}
								isMinimapDragging={isMinimapDragging}
								setIsMinimapDragging={setIsMinimapDragging}
								clampOffset={clampOffset}
							/>
							<ControlPanel
								buildMode={buildMode}
								onToggleBuildMode={handleToggleBuildMode}
								mode={mode}
								setMode={setMode}
								option={option}
								setOption={setOption}
								action={action}
								setAction={setAction}
							/>
						</div>
					</div>
					<canvas
						id="city-canvas"
						ref={canvasRef}
						width={window.innerWidth}
						height={window.innerHeight}
					></canvas>
				</div>
			</>
		)
	)
}

export default MainPage
