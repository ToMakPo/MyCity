import React from 'react';
import './control-panel.styles.sass';
import { FaHammer } from 'react-icons/fa';

export type BuildMode = 'none' | 'road' | 'water' | 'terrain' | 'building' | 'zoning';

export interface ControlPanelProps {
	buildMode: boolean;
	onToggleBuildMode: () => void;
	activeBuildMode: BuildMode;
	onSetBuildMode: (mode: BuildMode) => void;
}

const buildModes: { mode: BuildMode; label: string }[] = [
	{ mode: 'road', label: 'Road' },
	{ mode: 'water', label: 'Water' },
	{ mode: 'terrain', label: 'Terrain' },
	{ mode: 'building', label: 'Building' },
	{ mode: 'zoning', label: 'Zoning' },
];

export default function ControlPanel(props: ControlPanelProps) {
	const [opened, setOpen] = React.useState(false);

	const {
		buildMode,
		onToggleBuildMode,
		activeBuildMode,
		onSetBuildMode,
	} = props;

	return (
		<div id="control-panel" className={opened ? '' : 'hide'}>
			<div className="sim-controls">
				<span role='button' 
					onClick={onToggleBuildMode} 
					className={buildMode ? 'active build-mode-btn' : 'build-mode-btn'} 
					title={buildMode ? 'Exit Build Mode' : 'Enter Build Mode'}>
					<FaHammer />
				</span>
			</div>
			{buildMode && (
				<div className="build-modes">
					{buildModes.map(({ mode, label }) => (
						<span
							role='button'
							key={mode}
							className={activeBuildMode === mode ? 'active' : ''}
							onClick={() => onSetBuildMode(mode)}
						>
							{label}
						</span>
					))}
				</div>
			)}

			<div id='control-panel-toggle'
				title={opened ? 'Close Control Panel' : 'Open Control Panel'}
				onClick={() => setOpen(!opened)}></div>
		</div>
	);
}
