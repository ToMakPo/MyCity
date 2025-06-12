// PanZoomControls.tsx
import React from 'react'
import './pan-zoom-controls.styles.sass'

/**
 * Props for PanZoomControls.
 * @property onZoomIn - Callback for single zoom in.
 * @property onZoomOut - Callback for single zoom out.
 * @property onZoomStart - Callback for continuous zoom start (in/out).
 * @property onZoomStop - Callback for continuous zoom stop.
 * @property zoomLabel - Label for current zoom level.
 * @property zoomSliderValue - Value for zoom slider (0-1, log scale).
 * @property onZoomSliderChange - Callback for slider change.
 * @property onPan - Callback for single pan (direction).
 * @property onPanStart - Callback for continuous pan start (direction).
 * @property onPanStop - Callback for continuous pan stop.
 */
interface PanZoomControlsProps {
	onZoomIn: () => void
	onZoomOut: () => void
	onZoomStart: (type: 'in' | 'out') => void
	onZoomStop: () => void
	zoomLabel: string
	zoomSliderValue: number
	onZoomSliderChange: (value: number) => void
	onPan: (dir: 'up' | 'down' | 'left' | 'right') => void
	onPanStart: (dir: 'up' | 'down' | 'left' | 'right') => void
	onPanStop: () => void
}

/**
 * Renders pan/zoom controls for the city map.
 * - Zoom in/out buttons, slider, and label.
 * - Pan arrows for up/down/left/right movement.
 * - Supports both single and continuous actions.
 */
const PanZoomControls: React.FC<PanZoomControlsProps> = ({
	onZoomIn,
	onZoomOut,
	onZoomStart,
	onZoomStop,
	zoomLabel,
	zoomSliderValue,
	onZoomSliderChange,
	onPan,
	onPanStart,
	onPanStop,
}) => (<>
	{/* Zoom Controls */}
	<div id='zoom-controls'>
		{/* Zoom Out Icon Button */}
		<span
			className='ui-zoom-button zoom-out'
			role="button"
			aria-label="Zoom Out"
			tabIndex={0}
			onMouseDown={() => onZoomStart('out')}
			onMouseUp={onZoomStop}
			onMouseLeave={onZoomStop}
			onTouchStart={() => onZoomStart('out')}
			onTouchEnd={onZoomStop}
			onClick={onZoomOut}
		>
			<svg width="20" height="20" viewBox="0 0 20 20">
				<rect x="4" y="9" width="12" height="2" rx="1" />
			</svg>
		</span>

		{/* Zoom Slider and Level */}
		<input
			type="range"
			min={0}
			max={1}
			step={0.001}
			value={zoomSliderValue}
			aria-label="Zoom Level"
			title="Zoom Level"
			onChange={e => onZoomSliderChange(Number(e.target.value))}
		/>
		<span className='zoom-label'>
			{zoomLabel}
		</span>

		{/* Zoom In Icon Button */}
		<span
			className='ui-zoom-button zoom-in'
			role="button"
			aria-label="Zoom In"
			tabIndex={0}
			onMouseDown={() => onZoomStart('in')}
			onMouseUp={onZoomStop}
			onMouseLeave={onZoomStop}
			onTouchStart={() => onZoomStart('in')}
			onTouchEnd={onZoomStop}
			onClick={onZoomIn}
		>
			<svg width="20" height="20" viewBox="0 0 20 20">
				<rect x="4" y="9" width="12" height="2" rx="1" />
				<rect x="9" y="4" width="2" height="12" rx="1" />
			</svg>
		</span>
	</div>

	{/* Pan Buttons */}
	<div className="ui-pan-buttons">
		<svg width="100" height="100" viewBox="0 0 100 100">
			{/* Pan Up Arrow */}
			<g role='button' className="donut-button up" aria-label="Pan Up"
				onMouseDown={() => onPanStart('up')}
				onMouseUp={onPanStop}
				onMouseLeave={onPanStop}
				onTouchStart={() => onPanStart('up')}
				onTouchEnd={onPanStop}
				onClick={() => onPan('up')}
			>
				<path d="M 16.5 12.9 L 39.5 35.9 C 45.7 31.3 54.3 31.3 60.5 35.9 L 83.6 12.9 C 64.5 -4.3 35.5 -4.3 16.5 12.9 Z" />
				<path d="M 50 7 L 40.1 23.6 A 28 28.3 0 0 1 50 21.7 A 28 28.3 0 0 1 59.8 23.5 L 50 7 Z" className="donut-arrow" />
			</g>
			{/* Pan Down Arrow */}
			<g role='button' className="donut-button down" aria-label="Pan Down"
				onMouseDown={() => onPanStart('down')}
				onMouseUp={onPanStop}
				onMouseLeave={onPanStop}
				onTouchStart={() => onPanStart('down')}
				onTouchEnd={onPanStop}
				onClick={() => onPan('down')}
			>
				<path d="M 16.5 87.1 L 39.5 64.1 C 45.7 68.7 54.3 68.7 60.5 64.1 L 83.6 87.1 C 64.5 104.3 35.5 104.3 16.5 87.1 Z" />
				<path d="M 40.1 76.4 L 50 93 L 59.9 76.4 A 28 28.3 0 0 1 50 78.3 A 28 28.3 0 0 1 40.1 76.4 Z" className="donut-arrow" />
			</g>
			{/* Pan Left Arrow */}
			<g role='button' className="donut-button left" aria-label="Pan Left"
				onMouseDown={() => onPanStart('left')}
				onMouseUp={onPanStop}
				onMouseLeave={onPanStop}
				onTouchStart={() => onPanStart('left')}
				onTouchEnd={onPanStop}
				onClick={() => onPan('left')}
			>
				<path d="M 12.9 16.5 L 35.9 39.5 C 31.3 45.7 31.3 54.3 35.9 60.5 L 12.9 83.6 C -4.3 64.5 -4.3 35.5 12.9 16.5 Z" />
				<path d="M 23.9 39.9 L 7 50 L 23.9 60.1 A 28 28.3 0 0 1 22 50 A 28 28.3 0 0 1 23.9 39.9 Z" className="donut-arrow" />
			</g>
			{/* Pan Right Arrow */}
			<g role='button' className="donut-button right" aria-label="Pan Right"
				onMouseDown={() => onPanStart('right')}
				onMouseUp={onPanStop}
				onMouseLeave={onPanStop}
				onTouchStart={() => onPanStart('right')}
				onTouchEnd={onPanStop}
				onClick={() => onPan('right')}
			>
				<path d="M 87.1 16.5 L 64.1 39.5 C 68.7 45.7 68.7 54.3 64.1 60.5 L 87.1 83.6 C 104.3 64.5 104.3 35.5 87.1 16.5 Z" />
				<path d="M 76.2 39.9 A 28 28.3 0 0 1 78 50 A 28 28.3 0 0 1 76.1 60.1 L 76.1 60.2 L 93.1 50.1 L 76.2 39.9 Z" className="donut-arrow" />
			</g>
		</svg>
	</div>
</>)

export default PanZoomControls
