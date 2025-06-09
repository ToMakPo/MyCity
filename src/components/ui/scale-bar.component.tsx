// ScaleBar.tsx
import React from 'react'
import type { ViewState, Unit } from '../../pages/main/types'
import './scale-bar.styles.sass'

/**
 * Props for the ScaleBar component.
 * @property view - The current map view state (zoom, etc).
 * @property unit - The current unit system (miles/km).
 * @property canvasRef - Ref to the main map canvas for pixel calculations.
 */
interface ScaleBarProps {
  view: ViewState
  unit: Unit
  canvasRef: React.RefObject<HTMLCanvasElement>
}

/**
 * Renders a dynamic scale bar that reflects the current zoom and unit system.
 * - Shows either sub-units (ft/m) or main units (mi/km) depending on zoom.
 * - Bar length and label update responsively.
 */
const ScaleBar: React.FC<ScaleBarProps> = ({ view, unit, canvasRef }) => {
  // Get the canvas element for pixel calculations
  const canvas = canvasRef.current
  if (!canvas) return null

  // Calculate pixels per sub-unit and main unit
  const pxPerSub = view.zoom * unit.subScale // px per ft or px per m
  const pxPerMain = view.zoom * unit.scale // px per mi or px per km

  // Options for sub-unit and main-unit bar lengths
  const subOptions = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 1500, 2000]
  const mainOptions = [0.25, 0.5, 1, 2, 5, 10, 20, 50, 100]
  const mainThreshold = unit.short === 'mi' ? 1000 : 1000 // 1000 ft for mi/ft, 1000 m for km/m

  // Find the best sub-unit bar length that fits
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

  // Find the best main-unit bar length if needed
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

  // Render the scale bar and label
  return (
    <div id="scale-bar">
      <div className="scale-bar-line" style={{ width: pxLength }} />
      <span className="scale-bar-label">{label}</span>
    </div>
  )
}

export default ScaleBar
