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
	const {
		buildMode,
		onToggleBuildMode,
		activeBuildMode,
		onSetBuildMode,
	} = props;

	return (
		<div id="control-panel">
			<div className="sim-controls">
				<button onClick={onToggleBuildMode} className={buildMode ? 'active buildmode-btn' : 'buildmode-btn'} title={buildMode ? 'Exit Build Mode' : 'Enter Build Mode'}>
					<FaHammer />
				</button>
			</div>
			{buildMode && (
				<div className="build-modes">
					{buildModes.map(({ mode, label }) => (
						<button
							key={mode}
							className={activeBuildMode === mode ? 'active' : ''}
							onClick={() => onSetBuildMode(mode)}
						>
							{label}
						</button>
					))}
				</div>
			)}
		</div>
	);
}
