// SettingsMenu.tsx
import React, { useState } from 'react'
import CitySizeInput from './CitySizeInput'
import type { CitySizeInputProps } from './CitySizeInput'

interface SettingsMenuProps {
	citySizeInputProps: CitySizeInputProps
	// Add more props for future settings here
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({ citySizeInputProps }) => {
	const [open, setOpen] = useState(false)
	
	return (
		<>
			{/* Hamburger button in top right */}
			<button
				className="settings-hamburger"
				style={{
					position: 'fixed',
					top: 18,
					right: 18,
					zIndex: 201,
					width: 44,
					height: 44,
					border: 'none',
					background: 'rgba(68,68,68,0.92)',
					borderRadius: '50%',
					boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					cursor: 'pointer',
				}}
				aria-label={open ? 'Close settings' : 'Open settings'}
				aria-expanded={open}
				aria-controls="settings-panel"
				onClick={() => setOpen(o => !o)}
			>
				{/* Hamburger icon or X */}
				{open ? (
					<svg width="28" height="28" viewBox="0 0 28 28"><line x1="7" y1="7" x2="21" y2="21" stroke="#fff" strokeWidth="3" strokeLinecap="round" /><line x1="21" y1="7" x2="7" y2="21" stroke="#fff" strokeWidth="3" strokeLinecap="round" /></svg>
				) : (
					<svg width="28" height="28" viewBox="0 0 28 28"><rect y="6" width="28" height="3" rx="1.5" fill="#fff" /><rect y="13" width="28" height="3" rx="1.5" fill="#fff" /><rect y="20" width="28" height="3" rx="1.5" fill="#fff" /></svg>
				)}
			</button>
			{/* Slide-in settings panel (above minimap via higher z-index) */}
			<div
				className="settings-menu"
				style={{
					position: 'fixed',
					top: 0,
					right: 0,
					height: '100vh',
					width: 320,
					maxWidth: '90vw',
					background: 'rgba(255,255,255,0.97)',
					borderLeft: '2px solid #aaa',
					boxShadow: open ? '-8px 0 24px rgba(0,0,0,0.10)' : 'none',
					zIndex: 200, // ensure above minimap and hamburger
					transform: open ? 'translateX(0)' : 'translateX(110%)',
					transition: 'transform 0.35s cubic-bezier(.7,0,.3,1)',
					padding: open ? 24 : 0,
					overflowY: 'auto',
					display: 'flex',
					flexDirection: 'column',
					gap: 18,
				}}
				id="settings-panel"
				aria-hidden={open ? 'false' : 'true'}
			>
				<h2 style={{ margin: 0, marginBottom: 12, fontSize: '1.3em', color: '#222', fontWeight: 600 }}>Settings</h2>
				{/* Units row above city size */}
				<div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
					<span style={{ fontWeight: 500, color: '#222', fontSize: '1.08em' }}>Units:</span>
					<button
						className="scale-bar-toggle"
						style={{ fontSize: '1em', padding: '4px 16px', borderRadius: 5, border: '1px solid #888', background: '#444', color: '#fff', cursor: 'pointer', marginLeft: 8 }}
						onClick={citySizeInputProps.onUnitToggle}
					>
						{citySizeInputProps.unit.label}
					</button>
				</div>
				<CitySizeInput {...citySizeInputProps} hideUnitToggle />
				{/* Add more settings here in the future */}
			</div>
			{/* Overlay to close settings when clicking outside */}
			{open && (
				<div
					onClick={() => setOpen(false)}
					style={{
						position: 'fixed',
						inset: 0,
						zIndex: 198,
						background: 'rgba(0,0,0,0.08)',
						cursor: 'pointer',
					}}
					aria-hidden="true"
				/>
			)}
		</>
	)
}

export default SettingsMenu
