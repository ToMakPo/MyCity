// SettingsMenu.tsx
import React, { useState } from 'react'
import CitySizeInput from './city-size-input.component'
import type { CitySizeInputProps } from './city-size-input.component'
import './settings-menu.styles.sass'

/**
 * Props for SettingsMenu.
 * @property citySizeInputProps - Props to pass to the CitySizeInput component.
 */
interface SettingsMenuProps {
	citySizeInputProps: CitySizeInputProps
	// Add more props for future settings here
}

/** Collapsible settings menu that slides in from the right. */
const SettingsMenu: React.FC<SettingsMenuProps> = ({ citySizeInputProps }) => {
	const [open, setOpen] = useState(false)

	return (<>
		{/* Hamburger button to toggle settings menu */}
		<span
			id='settings-toggle'
			className="settings-hamburger icon-btn"
			aria-label={open ? 'Close settings' : 'Open settings'}
			aria-expanded={open}
			aria-controls="settings-panel"
			onClick={() => setOpen(o => !o)}
			role='button'
		>
			{open ? (
				// Close icon (X) when open
				<svg width="25" height="25" viewBox="0 0 25 25">
					<line x1="4" y1="4" x2="21" y2="21" strokeWidth="3" strokeLinecap="round" />
					<line x1="4" y1="21" x2="21" y2="4" strokeWidth="3" strokeLinecap="round" />
				</svg>
			) : (
				// Hamburger icon with three lines
				<svg width="25" height="25" viewBox="0 0 25 25">
					<rect y="3" width="25" height="3" rx="1.5" strokeWidth='0' />
					<rect y="11" width="25" height="3" rx="1.5" strokeWidth='0' />
					<rect y="19" width="25" height="3" rx="1.5" strokeWidth='0' />
				</svg>
			)}
		</span>

		{/* Settings menu panel that slides in */}
		<div
			id="settings-panel"
			style={{
				boxShadow: open ? '-8px 0 24px rgba(0,0,0,0.10)' : 'none',
				transform: open ? 'translateX(0)' : 'translateX(110%)',
				padding: open ? '24px' : '24px 0',
			}}
			aria-hidden={open ? 'false' : 'true'}
		>
			<h2>Settings</h2>

			{/* Units Toggle */}
			<div id='units-toggle'>
				<h3>Units:</h3>
				<button
					className="toggle-button"
					onClick={citySizeInputProps.onUnitToggle}
				>
					{citySizeInputProps.unit.label}
				</button>
			</div>

			<CitySizeInput {...citySizeInputProps} hideUnitToggle />
		</div>

		{/* Overlay to close settings when clicking outside */}
		<div
			id="settings-overlay"
			className={open ? 'visible' : ''}
			onClick={() => setOpen(false)}
			aria-hidden="true"
		/>
	</>)
}

export default SettingsMenu
