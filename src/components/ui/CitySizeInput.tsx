import React from 'react'
import type { Unit } from '../../pages/main/types'

export interface CitySizeInputProps {
	citySize: { x: number; y: number }
	setCitySize: (size: CitySizeInputProps['citySize']) => void
	unit: Unit
	onUnitToggle: () => void
	hideUnitToggle?: boolean
}

const CitySizeInput: React.FC<CitySizeInputProps> = ({ citySize, setCitySize, unit, onUnitToggle, hideUnitToggle }) => (
	<div id="city-size-input" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
		<label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
			City Size:
			<input
				type="number"
				min={0.1}
				step={0.1}
				value={citySize.x}
				onChange={e => setCitySize({ ...citySize, x: Number(e.target.value) })}
				className="city-size-x"
				style={{ width: 60 }}
			/>
			{unit.short} (X)
			<input
				type="number"
				min={0.1}
				step={0.1}
				value={citySize.y}
				onChange={e => setCitySize({ ...citySize, y: Number(e.target.value) })}
				className="city-size-y"
				style={{ width: 60 }}
			/>
			{unit.short} (Y)
		</label>
		{!hideUnitToggle && (
			<button className="scale-bar-toggle" onClick={onUnitToggle} style={{ marginLeft: 8 }}>
				{unit.label}
			</button>
		)}
	</div>
)

export default CitySizeInput
