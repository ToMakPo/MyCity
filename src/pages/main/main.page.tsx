import React, { useEffect, useRef, useState, useMemo } from 'react'
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

function MainPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [view, setView] = useState<ViewState>({
    offsetX: 0,
    offsetY: 0,
    zoom: 1,
    isPanning: false,
    startPanX: 0,
    startPanY: 0,
  })
  const [unitIndex, setUnitIndex] = useState(0)
  const [citySize, setCitySize] = useState({ x: 15, y: 15 }) // default 2 miles/km in each direction
  const [minimapMaxSize, setMinimapMaxSize] = React.useState(180)
  const [isMinimapDragging, setIsMinimapDragging] = React.useState(false)
  const unit = UNITS[unitIndex]

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
  function clampOffset(
    offsetX: number,
    offsetY: number,
    zoom: number,
    canvasWidth: number,
    canvasHeight: number,
    citySize: { x: number; y: number },
    unit: { short: string; scale: number }
  ) {
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
  }

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
      if (e.ctrlKey) {
        // Zoom in/out, keeping mouse position fixed in world coords
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
      } else if (e.shiftKey) {
        // Pan horizontally
        const clamped = clampOffset(view.offsetX - e.deltaY, view.offsetY, view.zoom, canvas.width, canvas.height, citySize, unit)
        setView(v => ({ ...v, offsetX: clamped.offsetX }))
      } else {
        // Pan vertically
        const clamped = clampOffset(view.offsetX, view.offsetY - e.deltaY, view.zoom, canvas.width, canvas.height, citySize, unit)
        setView(v => ({ ...v, offsetY: clamped.offsetY }))
      }
    }

    let isDragging = false
    let lastX = 0
    let lastY = 0

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true
      lastX = e.clientX
      lastY = e.clientY
      setView(v => ({ ...v, isPanning: true, startPanX: e.clientX, startPanY: e.clientY }))
    }
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      lastX = e.clientX
      lastY = e.clientY
      const clamped = clampOffset(view.offsetX + dx, view.offsetY + dy, view.zoom, canvas.width, canvas.height, citySize, unit)
      setView(v => ({ ...v, offsetX: clamped.offsetX, offsetY: clamped.offsetY }))
    }
    const handleMouseUp = () => {
      isDragging = false
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
  }, [view, citySize, unit])

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

  // Fix scale bar calculation
  function renderScaleBar() {
    const canvas = canvasRef.current
    if (!canvas) return null
    const pxPerSub = view.zoom * unit.subScale // px per ft or px per m
    const pxPerMain = view.zoom * unit.scale // px per mi or px per km

    const subOptions = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 1500, 2000]
    const mainOptions = [0.25, 0.5, 1, 2, 5, 10, 20, 50, 100]
    const mainThreshold = unit.short === 'mi' ? 2000 : 1000 // 2000 ft for mi/ft, 1000 m for km/m

    let useMain = false
    let bestSub = subOptions[0]
    let bestSubPx = bestSub * pxPerSub
    for (const s of subOptions) {
      const px = s * pxPerSub
      if (px <= 200) {
        bestSub = s
        bestSubPx = px
      }
    }
    if (bestSub >= mainThreshold) useMain = true

    let label = ''
    let pxLength = 0

    if (useMain) {
      let bestMain = mainOptions[0]
      let bestMainPx = bestMain * pxPerMain
      for (const m of mainOptions) {
        const px = m * pxPerMain
        if (px <= 200) {
          bestMain = m
          bestMainPx = px
        }
      }
      pxLength = bestMainPx
      label = `${bestMain} ${unit.short}`
    } else {
      pxLength = bestSubPx
      label = `${bestSub} ${unit.sub}`
    }

    return (
      <div id="scale-bar">
        <div className="scale-bar-line" style={{ width: pxLength + 'px' }} />
        <span className="scale-bar-label">{label}</span>
      </div>
    )
  }

  // In renderScaleBar or above return:
  function renderCitySizeInput() {
    return (
      <div id="city-size-input" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          City Size:
          <input
            type="number"
            min={0.1}
            step={0.1}
            value={citySize.x}
            onChange={e => setCitySize(s => ({ ...s, x: Number(e.target.value) }))}
            className="city-size-x"
            style={{ width: 60 }}
          />
          {unit.short} (X)
          <input
            type="number"
            min={0.1}            git init
            git add .
            git commit -m "Initial commit"
            git branch -M main
            git remote add origin https://github.com/your-username/your-repo-name.git
            git push -u origin main
            step={0.1}
            value={citySize.y}
            onChange={e => setCitySize(s => ({ ...s, y: Number(e.target.value) }))}
            className="city-size-y"
            style={{ width: 60 }}
          />
          {unit.short} (Y)
        </label>
        <button className="scale-bar-toggle" onClick={handleUnitToggle} style={{ marginLeft: 8 }}>
          {unit.label}
        </button>
      </div>
    )
  }

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

  // Minimap as a React component for drag support
  function Minimap({
    citySize,
    unit,
    view,
    setView,
    canvasRef,
    minimapMaxSize,
    setMinimapMaxSize,
    isMinimapDragging,
    setIsMinimapDragging
  }: {
    citySize: { x: number; y: number },
    unit: { short: string; scale: number },
    view: ViewState,
    setView: React.Dispatch<React.SetStateAction<ViewState>>,
    canvasRef: React.RefObject<HTMLCanvasElement>,
    minimapMaxSize: number,
    setMinimapMaxSize: (n: number) => void,
    isMinimapDragging: boolean,
    setIsMinimapDragging: (b: boolean) => void
  }) {
    const minimapRef = React.useRef<SVGSVGElement>(null)
    const border = 8;
    const citySizeMeters = useMemo(() => ({ x: citySize.x * unit.scale, y: citySize.y * unit.scale }), [citySize, unit]);
    const aspect = citySizeMeters.x / citySizeMeters.y;
    let minimapWidth: number, minimapHeight: number, cityDrawWidth: number, cityDrawHeight: number, offsetX: number, offsetY: number, scale: number;
    if (aspect >= 1) {
      // Wider or square: width is max
      minimapWidth = minimapMaxSize;
      minimapHeight = minimapMaxSize / aspect;
      cityDrawWidth = minimapWidth - 2 * border;
      cityDrawHeight = minimapHeight - 2 * border;
      scale = cityDrawWidth / citySizeMeters.x;
      offsetX = border;
      offsetY = border;
    } else {
      // Taller: height is max
      minimapHeight = minimapMaxSize;
      minimapWidth = minimapMaxSize * aspect;
      cityDrawHeight = minimapHeight - 2 * border;
      cityDrawWidth = minimapWidth - 2 * border;
      scale = cityDrawHeight / citySizeMeters.y;
      offsetY = border;
      offsetX = border;
    }
    const viewRect = useMemo(() => {
      if (canvasRef.current) {
        const canvas = canvasRef.current
        const worldLeft = -view.offsetX / view.zoom
        const worldTop = -view.offsetY / view.zoom
        const worldW = canvas.width / view.zoom
        const worldH = canvas.height / view.zoom
        // Clamp viewport to minimap bounds
        let x = offsetX + worldLeft * scale
        let y = offsetY + worldTop * scale
        let w = worldW * scale
        let h = worldH * scale
        // If viewport is larger than minimap, clamp and center
        if (w > cityDrawWidth) {
          w = cityDrawWidth
          x = offsetX
        } else {
          if (x < offsetX) x = offsetX
          if (x + w > offsetX + cityDrawWidth) x = offsetX + cityDrawWidth - w
        }
        if (h > cityDrawHeight) {
          h = cityDrawHeight
          y = offsetY
        } else {
          if (y < offsetY) y = offsetY
          if (y + h > offsetY + cityDrawHeight) y = offsetY + cityDrawHeight - h
        }
        return { x, y, w, h }
      }
      return { x: 0, y: 0, w: 0, h: 0 }
    }, [view, scale, offsetX, offsetY, cityDrawWidth, cityDrawHeight, canvasRef])

    // --- Define centerViewOnMinimap before refs ---
    const centerViewOnMinimap = React.useCallback((mouseX: number, mouseY: number) => {
      const minX = offsetX
      const minY = offsetY
      const maxX = offsetX + cityDrawWidth
      const maxY = offsetY + cityDrawHeight
      const clampedX = Math.max(minX, Math.min(mouseX, maxX))
      const clampedY = Math.max(minY, Math.min(mouseY, maxY))
      const worldX = (clampedX - offsetX) / scale
      const worldY = (clampedY - offsetY) / scale
      const canvas = canvasRef.current
      if (!canvas) return
      setView(prevView => {
        const viewW = canvas.width / prevView.zoom
        const viewH = canvas.height / prevView.zoom
        const newOffsetX = -(worldX - viewW / 2) * prevView.zoom
        const newOffsetY = -(worldY - viewH / 2) * prevView.zoom
        const clamped = clampOffset(newOffsetX, newOffsetY, prevView.zoom, canvas.width, canvas.height, citySize, unit)
        return { ...prevView, offsetX: clamped.offsetX, offsetY: clamped.offsetY }
      })
    }, [offsetX, offsetY, cityDrawWidth, cityDrawHeight, scale, citySize, unit, canvasRef, setView])

    // Mouse drag logic
    const onMinimapMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
      setIsMinimapDragging(true)
      const minimapRect = (e.currentTarget as SVGSVGElement).getBoundingClientRect()
      const mouseX = e.clientX - minimapRect.left
      const mouseY = e.clientY - minimapRect.top
      centerViewOnMinimap(mouseX, mouseY)
      function onMove(ev: MouseEvent) {
        const rect = (document.getElementById('minimap-container') as HTMLElement).getBoundingClientRect()
        const mx = ev.clientX - rect.left
        const my = ev.clientY - rect.top
        centerViewOnMinimap(mx, my)
      }
      function onUp() {
        setIsMinimapDragging(false)
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
      }
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    }

    // Touch drag logic
    const onMinimapTouchStart = (e: React.TouchEvent<SVGSVGElement>) => {
      if (e.touches.length === 1) {
        setIsMinimapDragging(true)
        const minimapRect = (e.currentTarget as SVGSVGElement).getBoundingClientRect()
        const touch = e.touches[0]
        const mouseX = touch.clientX - minimapRect.left
        const mouseY = touch.clientY - minimapRect.top
        centerViewOnMinimap(mouseX, mouseY)
        function onMove(ev: TouchEvent) {
          if (ev.touches.length === 1) {
            const rect = (document.getElementById('minimap-container') as HTMLElement).getBoundingClientRect()
            const t = ev.touches[0]
            const mx = t.clientX - rect.left
            const my = t.clientY - rect.top
            centerViewOnMinimap(mx, my)
          }
        }
        function onUp() {
          setIsMinimapDragging(false)
          window.removeEventListener('touchmove', onMove)
          window.removeEventListener('touchend', onUp)
        }
        window.addEventListener('touchmove', onMove)
        window.addEventListener('touchend', onUp)
      }
    }

    const onMinimapLeftResize = (e: React.MouseEvent) => {
      e.preventDefault();
      dragStart.current = { x: e.clientX, y: e.clientY, size: minimapMaxSize };
      setIsResizing('left');
      function onMove(ev: MouseEvent) {
        const clientX = ev.clientX;
        const delta = dragStart.current.x - clientX;
        const newSize = Math.max(80, Math.min(400, dragStart.current.size + delta));
        setMinimapMaxSize(newSize);
      }
      function onUp() {
        setIsResizing(null);
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      }
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    }

    const onMinimapLeftTouchResize = (e: React.TouchEvent) => {
      const touch = e.touches[0];
      dragStart.current = { x: touch.clientX, y: touch.clientY, size: minimapMaxSize };
      setIsResizing('left');
      function onMove(ev: TouchEvent) {
        if (ev.touches && ev.touches.length === 1) {
          const clientX = ev.touches[0].clientX;
          const delta = dragStart.current.x - clientX;
          const newSize = Math.max(80, Math.min(400, dragStart.current.size + delta));
          setMinimapMaxSize(newSize);
        }
      }
      function onUp() {
        setIsResizing(null);
        window.removeEventListener('touchmove', onMove);
        window.removeEventListener('touchend', onUp);
      }
      window.addEventListener('touchmove', onMove);
      window.addEventListener('touchend', onUp);
    }

    const onMinimapTopResize = (e: React.MouseEvent) => {
      e.preventDefault();
      dragStart.current = { x: e.clientX, y: e.clientY, size: minimapMaxSize };
      setIsResizing('top');
      function onMove(ev: MouseEvent) {
        const clientY = ev.clientY;
        const delta = dragStart.current.y - clientY;
        const newSize = Math.max(80, Math.min(400, dragStart.current.size + delta));
        setMinimapMaxSize(newSize);
      }
      function onUp() {
        setIsResizing(null);
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      }
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    }

    const onMinimapTopTouchResize = (e: React.TouchEvent) => {
      const touch = e.touches[0];
      dragStart.current = { x: touch.clientX, y: touch.clientY, size: minimapMaxSize };
      setIsResizing('top');
      function onMove(ev: TouchEvent) {
        if (ev.touches && ev.touches.length === 1) {
          const clientY = ev.touches[0].clientY;
          const delta = dragStart.current.y - clientY;
          const newSize = Math.max(80, Math.min(400, dragStart.current.size + delta));
          setMinimapMaxSize(newSize);
        }
      }
      function onUp() {
        setIsResizing(null);
        window.removeEventListener('touchmove', onMove);
        window.removeEventListener('touchend', onUp);
      }
      window.addEventListener('touchmove', onMove);
      window.addEventListener('touchend', onUp);
    }

    // --- Resizing logic ---
    const [isResizing, setIsResizing] = React.useState<null | 'left' | 'top'>(null)
    const dragStart = React.useRef({ x: 0, y: 0, size: minimapMaxSize })

    // Mouse/touch handlers for resizing
    React.useEffect(() => {
      if (!isResizing) return
      function onMove(e: MouseEvent | TouchEvent) {
        let clientX: number, clientY: number
        if ('touches' in e) {
          clientX = e.touches[0].clientX
          clientY = e.touches[0].clientY
        } else {
          clientX = e.clientX
          clientY = e.clientY
        }
        let delta: number
        if (isResizing === 'left') {
          delta = dragStart.current.x - clientX
        } else {
          delta = dragStart.current.y - clientY
        }
        const newSize = Math.max(80, Math.min(400, dragStart.current.size + delta))
        setMinimapMaxSize(newSize)
      }
      function onUp() {
        setIsResizing(null)
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
        window.removeEventListener('touchmove', onMove)
        window.removeEventListener('touchend', onUp)
      }
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
      window.addEventListener('touchmove', onMove)
      window.addEventListener('touchend', onUp)
      return () => {
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
        window.removeEventListener('touchmove', onMove)
        window.removeEventListener('touchend', onUp)
      }
    }, [isResizing, setMinimapMaxSize])

    // Use minimapMaxSize from MainPage state
    if (aspect >= 1) {
      // Wider or square: width is max
      minimapWidth = minimapMaxSize;
      minimapHeight = minimapMaxSize / aspect;
      cityDrawWidth = minimapWidth - 2 * border;
      cityDrawHeight = minimapHeight - 2 * border;
      scale = cityDrawWidth / citySizeMeters.x;
      offsetX = border;
      offsetY = border;
    } else {
      // Taller: height is max
      minimapHeight = minimapMaxSize;
      minimapWidth = minimapMaxSize * aspect;
      cityDrawHeight = minimapHeight - 2 * border;
      cityDrawWidth = minimapWidth - 2 * border;
      scale = cityDrawHeight / citySizeMeters.y;
      offsetY = border;
      offsetX = border;
    }

    return (
      <div
        id="minimap-container"
        className={isMinimapDragging ? 'minimap-dragging' : ''}
        style={{ width: minimapWidth, height: minimapHeight, position: 'fixed', right: 0, bottom: 0, zIndex: 100 }}
      >
        {/* Left resize handle */}
        <div
          className="minimap-resize-handle left"
          style={{ position: 'absolute', left: 0, top: 0, height: minimapHeight, width: 8, cursor: 'ew-resize', zIndex: 10 }}
          onMouseDown={onMinimapLeftResize}
          onTouchStart={onMinimapLeftTouchResize}
        >
          <div style={{ width: 4, height: minimapHeight * 0.5, background: '#2a5cff', borderRadius: 2, marginTop: minimapHeight * 0.25 }} />
        </div>
        {/* Top resize handle */}
        <div
          className="minimap-resize-handle top"
          style={{ position: 'absolute', left: 0, top: 0, width: minimapWidth, height: 8, cursor: 'ns-resize', zIndex: 10 }}
          onMouseDown={onMinimapTopResize}
          onTouchStart={onMinimapTopTouchResize}
        >
          <div style={{ height: 4, width: minimapWidth * 0.5, background: '#2a5cff', margin: 'auto', borderRadius: 2, marginLeft: minimapWidth * 0.25 }} />
        </div>
        <svg
          ref={minimapRef}
          width={minimapWidth}
          height={minimapHeight}
          style={{ display: 'block' }}
          onMouseDown={onMinimapMouseDown}
          onTouchStart={onMinimapTouchStart}
        >
          {/* Full map area */}
          <rect x={offsetX} y={offsetY} width={cityDrawWidth} height={cityDrawHeight} fill="#f8f8f8" stroke="#aaa" strokeWidth={2} />
          {/* Dark overlay for out-of-view area */}
          <mask id="minimap-mask">
            <rect x={offsetX} y={offsetY} width={cityDrawWidth} height={cityDrawHeight} fill="white" />
            <rect x={viewRect.x} y={viewRect.y} width={viewRect.w} height={viewRect.h} fill="black" />
          </mask>
          <rect x={offsetX} y={offsetY} width={cityDrawWidth} height={cityDrawHeight} fill="rgba(0,0,0,0.25)" mask="url(#minimap-mask)" />
          {/* Viewport rectangle */}
          <rect
            x={viewRect.x}
            y={viewRect.y}
            width={viewRect.w}
            height={viewRect.h}
            fill="none"
            stroke="#2a5cff"
            strokeWidth={2}
            className="minimap-viewport"
          />
        </svg>
      </div>
    )
  }

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
  const panIntervalRef = React.useRef<number | null>(null)
  const zoomIntervalRef = React.useRef<number | null>(null)

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
  function doSinglePan(direction: 'up' | 'down' | 'left' | 'right') {
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
  }

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
  function doSingleZoom(type: 'in' | 'out') {
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
  }

  React.useEffect(() => {
    return () => {
      const panInterval = panIntervalRef.current
      const zoomInterval = zoomIntervalRef.current
      if (panInterval) clearInterval(panInterval)
      if (zoomInterval) clearInterval(zoomInterval)
    }
  }, [])

  return (
    <div id="MainPage">
      <div id="ui-controls">
        {renderCitySizeInput()}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Zoom Out Icon Button */}
          <span
            role="button"
            aria-label="Zoom Out"
            tabIndex={0}
            style={{
              width: 36,
              height: 36,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#444',
              borderRadius: '50%',
              cursor: 'pointer',
              border: '1px solid #888',
              marginRight: 4,
              userSelect: 'none',
            }}
            onMouseDown={() => startContinuousZoom('out')}
            onMouseUp={stopContinuousZoom}
            onMouseLeave={stopContinuousZoom}
            onTouchStart={() => startContinuousZoom('out')}
            onTouchEnd={stopContinuousZoom}
            onClick={() => doSingleZoom('out')}
          >
            <svg width="20" height="20" viewBox="0 0 20 20">
              <rect x="4" y="9" width="12" height="2" rx="1" fill="#fff" />
            </svg>
          </span>
          {/* Zoom Slider and Level */}
          <input
            type="range"
            min={0}
            max={1}
            step={0.001}
            value={(() => {
              // Map zoom to slider value logarithmically
              const bounds = getZoomBounds(citySize, unit, window.innerWidth, window.innerHeight)
              const minZoom = bounds.minZoom
              const maxZoom = bounds.maxZoom
              const logMin = Math.log(minZoom)
              const logMax = Math.log(maxZoom)
              const logZoom = Math.log(view.zoom)
              return (logZoom - logMin) / (logMax - logMin)
            })()}
            style={{ width: 120 }}
            aria-label="Zoom Level"
            title="Zoom Level"
            onChange={e => {
              const sliderValue = Number(e.target.value)
              const bounds = getZoomBounds(citySize, unit, window.innerWidth, window.innerHeight)
              const minZoom = bounds.minZoom
              const maxZoom = bounds.maxZoom
              // Map slider value to zoom logarithmically
              const logMin = Math.log(minZoom)
              const logMax = Math.log(maxZoom)
              const logZoom = logMin + sliderValue * (logMax - logMin)
              const newZoom = Math.exp(logZoom)
              const canvas = canvasRef.current
              if (!canvas) return
              // Center on current viewport center
              const viewportCenterX = canvas.width / 2
              const viewportCenterY = canvas.height / 2
              const worldCenterX = (viewportCenterX - view.offsetX) / view.zoom
              const worldCenterY = (viewportCenterY - view.offsetY) / view.zoom
              const newOffsetX = viewportCenterX - worldCenterX * newZoom
              const newOffsetY = viewportCenterY - worldCenterY * newZoom
              const clamped = clampOffset(newOffsetX, newOffsetY, newZoom, canvas.width, canvas.height, citySize, unit)
              setView(v => ({ ...v, zoom: newZoom, offsetX: clamped.offsetX, offsetY: clamped.offsetY }))
            }}
          />
          <span style={{ width: 100, display: 'inline-block', textAlign: 'center', color: '#222', fontWeight: 500 }}>
            Zoom: {view.zoom.toFixed(2)}x
          </span>
          {/* Zoom In Icon Button */}
          <span
            role="button"
            aria-label="Zoom In"
            tabIndex={0}
            style={{
              width: 36,
              height: 36,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#444',
              borderRadius: '50%',
              cursor: 'pointer',
              border: '1px solid #888',
              marginLeft: 4,
              userSelect: 'none',
            }}
            onMouseDown={() => startContinuousZoom('in')}
            onMouseUp={stopContinuousZoom}
            onMouseLeave={stopContinuousZoom}
            onTouchStart={() => startContinuousZoom('in')}
            onTouchEnd={stopContinuousZoom}
            onClick={() => doSingleZoom('in')}
          >
            <svg width="20" height="20" viewBox="0 0 20 20">
              <rect x="4" y="9" width="12" height="2" rx="1" fill="#fff" />
              <rect x="9" y="4" width="2" height="12" rx="1" fill="#fff" />
            </svg>
          </span>
        </div>
        {/* Pan Buttons BELOW zoom controls */}
        <div className="ui-pan-buttons" style={{ position: 'relative', width: 80, height: 80, marginTop: 8 }}>
          <svg width="100" height="100" viewBox="0 0 100 100">
            <g role='button' className="donut-button up" aria-label="Pan Up"
              onMouseDown={() => startContinuousPan('up')}
              onMouseUp={stopContinuousPan}
              onMouseLeave={stopContinuousPan}
              onTouchStart={() => startContinuousPan('up')}
              onTouchEnd={stopContinuousPan}
              onClick={() => doSinglePan('up')}
            >
              <path d="M 16.5 12.9 L 39.5 35.9 C 45.7 31.3 54.3 31.3 60.5 35.9 L 83.6 12.9 C 64.5 -4.3 35.5 -4.3 16.5 12.9 Z" />
              <path d="M 50 7 L 40.1 23.6 A 28 28.3 0 0 1 50 21.7 A 28 28.3 0 0 1 59.8 23.5 L 50 7 Z" className="donut-arrow" />
            </g>
            <g role='button' className="donut-button down" aria-label="Pan Down"
              onMouseDown={() => startContinuousPan('down')}
              onMouseUp={stopContinuousPan}
              onMouseLeave={stopContinuousPan}
              onTouchStart={() => startContinuousPan('down')}
              onTouchEnd={stopContinuousPan}
              onClick={() => doSinglePan('down')}
            >
              <path d="M 16.5 87.1 L 39.5 64.1 C 45.7 68.7 54.3 68.7 60.5 64.1 L 83.6 87.1 C 64.5 104.3 35.5 104.3 16.5 87.1 Z" />
              <path d="M 40.1 76.4 L 50 93 L 59.9 76.4 A 28 28.3 0 0 1 50 78.3 A 28 28.3 0 0 1 40.1 76.4 Z" className="donut-arrow" />
            </g>
            <g role='button' className="donut-button left" aria-label="Pan Left"
              onMouseDown={() => startContinuousPan('left')}
              onMouseUp={stopContinuousPan}
              onMouseLeave={stopContinuousPan}
              onTouchStart={() => startContinuousPan('left')}
              onTouchEnd={stopContinuousPan}
              onClick={() => doSinglePan('left')}
            >
              <path d="M 12.9 16.5 L 35.9 39.5 C 31.3 45.7 31.3 54.3 35.9 60.5 L 12.9 83.6 C -4.3 64.5 -4.3 35.5 12.9 16.5 Z" />
              <path d="M 23.9 39.9 L 7 50 L 23.9 60.1 A 28 28.3 0 0 1 22 50 A 28 28.3 0 0 1 23.9 39.9 Z" className="donut-arrow" />
            </g>
            <g role='button' className="donut-button right" aria-label="Pan Right"
              onMouseDown={() => startContinuousPan('right')}
              onMouseUp={stopContinuousPan}
              onMouseLeave={stopContinuousPan}
              onTouchStart={() => startContinuousPan('right')}
              onTouchEnd={stopContinuousPan}
              onClick={() => doSinglePan('right')}
            >
              <path d="M 87.1 16.5 L 64.1 39.5 C 68.7 45.7 68.7 54.3 64.1 60.5 L 87.1 83.6 C 104.3 64.5 104.3 35.5 87.1 16.5 Z" />
              <path d="M 76.2 39.9 A 28 28.3 0 0 1 78 50 A 28 28.3 0 0 1 76.1 60.1 L 76.1 60.2 L 93.1 50.1 L 76.2 39.9 Z" className="donut-arrow" />
            </g>
          </svg>
        </div>
      </div>
      {renderScaleBar()}
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
      />
      <canvas
        id="city-canvas"
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
      ></canvas>
    </div>
  )
}

export default MainPage
