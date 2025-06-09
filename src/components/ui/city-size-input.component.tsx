// CitySizeInput.tsx
import React from 'react'
import type { Unit } from '../../pages/main/types'
import './city-size-input.styles.sass'

/**
 * Props for CitySizeInput.
 * @property citySize - The current city size (x/y dimensions).
 * @property setCitySize - Callback to update city size.
 * @property unit - The current unit system (miles/km).
 * @property onUnitToggle - Callback to toggle units.
 * @property hideUnitToggle - If true, hides the unit toggle button (for use in settings menu).
 */
export interface CitySizeInputProps {
	citySize: { x: number; y: number }
	setCitySize: (size: CitySizeInputProps['citySize']) => void
	unit: Unit
	onUnitToggle: () => void
	hideUnitToggle?: boolean
}

/**
 * Renders input fields for city X/Y size and a unit toggle button (optional).
 * Used in the settings menu for city configuration.
 */
const CitySizeInput: React.FC<CitySizeInputProps> = ({ citySize, setCitySize, unit }) => (
	<div id="city-size-input">
		<h3>City Size:</h3>

		<label className="size-label">
			<strong>X</strong>
			<input
				type="number"
				min={1}
				step={1}
				value={citySize.x}
				onChange={e => setCitySize({ ...citySize, x: Number(e.target.value) })}
				className="city-size x"
			/>
			{unit.short}
		</label>

		<label className="size-label">
			<strong>Y</strong>
			<input
				type="number"
				min={1}
				step={1}
				value={citySize.y}
				onChange={e => setCitySize({ ...citySize, y: Number(e.target.value) })}
				className="city-size y"
			/>
			{unit.short}
		</label>
	</div>
)

export default CitySizeInput
