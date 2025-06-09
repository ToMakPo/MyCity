// ScaleBar.tsx
import React from 'react'
import type { ViewState, Unit } from '../../pages/main/types'

interface ScaleBarProps {
  view: ViewState
  unit: Unit
  canvasRef: React.RefObject<HTMLCanvasElement>
}

const ScaleBar: React.FC<ScaleBarProps> = ({ view, unit, canvasRef }) => {
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

export default ScaleBar
