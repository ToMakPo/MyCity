import React from 'react';
import './control-panel.styles.sass';
import { FaHammer, FaPlus, FaEdit, FaArrowUp, FaArrowDown } from 'react-icons/fa';

export type BuildMode = 'none' | 'road' | 'water' | 'terrain' | 'building' | 'zoning';

export interface ControlPanelProps {
	buildMode: boolean;
	onToggleBuildMode: () => void;
}

const buildOptions = [
	{ key: 'roads', label: 'Roads', icon: '🛣️' },
	{ key: 'buildings', label: 'Buildings', icon: '🏢' },
	{ key: 'terrain', label: 'Terrain', icon: '⛰️' },
	// Add more build options as needed
];

export default function ControlPanel(props: ControlPanelProps) {
	const [opened, setOpen] = React.useState(false);
	const [buildOption, setBuildOption] = React.useState<string | null>(null);
	const [tool, setTool] = React.useState<string | null>(null);

	const {
		buildMode,
		onToggleBuildMode,
	} = props;

	return (
		<div id="control-panel" className={opened ? '' : 'hide'}>
			<div id="controls">
				<span
					id="control-btn--build"
					role='button'
					onClick={onToggleBuildMode}
					className={['control-btn', 'icon-btn', 'left', buildMode ? 'active' : ''].filter(Boolean).join(' ')}
					data-tooltip={buildMode ? 'Exit Build Mode' : 'Enter Build Mode'}
					tabIndex={0}
					aria-pressed={buildMode}
				>
					<FaHammer style={{marginBottom: '0.2em', marginLeft: '0.1em'}}/>
				</span>
			</div>

			{buildMode && (
				<div id="build-options">
					{buildOptions.map(opt => (
						<span
							key={opt.key}
							id={`option-btn--${opt.key}`}
							className={['option-btn', 'icon-btn', buildOption === opt.key ? 'active' : ''].filter(Boolean).join(' ')}
							onClick={() => setBuildOption(opt.key)}
							aria-pressed={buildOption === opt.key}
							data-tooltip={opt.label}
							tabIndex={0}
							role='button'
						>
							<span>{opt.icon}</span>
						</span>
					))}
				</div>
			)}
			
			{buildMode && buildOption && (
				<div id="build-tools">
					{buildOption === 'roads' && (
						<div className='build-group'>
							<div className="tool-header">Tools</div>
							<span
								id="tool-btn--add-road"
								className={["build-option-btn", "icon-btn", tool === 'add-road' ? 'active' : ''].filter(Boolean).join(' ')}
								onClick={() => setTool('add-road')}
								aria-label="Add Road"
								data-tooltip="Add Road"
								tabIndex={0}
								role='button'
							>
								<FaPlus />
							</span>
							<span
								id="tool-btn--edit-road"
								className={["build-option-btn", "icon-btn", tool === 'edit-road' ? 'active' : ''].filter(Boolean).join(' ')}
								onClick={() => setTool('edit-road')}
								aria-label="Edit Road"
								data-tooltip="Edit Road"
								tabIndex={0}
								role='button'
							>
								<FaEdit />
							</span>
						</div>
					)}
					{buildOption === 'terrain' && (
						<div className="build-group">
							<div className="tool-header">Tools</div>
							<span
								id="tool-btn--raise-terrain"
								className={["build-option-btn", "icon-btn", tool === 'raise-terrain' ? 'active' : ''].filter(Boolean).join(' ')}
								onClick={() => setTool('raise-terrain')}
								aria-label="Raise Terrain"
								data-tooltip="Raise Terrain"
								tabIndex={0}
								role='button'
							>
								<FaArrowUp />
							</span>
							<span
								id="tool-btn--lower-terrain"
								className={["build-option-btn", "icon-btn", tool === 'lower-terrain' ? 'active' : ''].filter(Boolean).join(' ')}
								onClick={() => setTool('lower-terrain')}
								aria-label="Lower Terrain"
								data-tooltip="Lower Terrain"
								tabIndex={0}
								role='button'
							>
								<FaArrowDown />
							</span>
						</div>
					)}
				</div>
			)}
			{/* Add more build tool panels as needed */}
			<div id='control-panel-toggle'
				className={['control-panel-toggle', 'icon.btn', opened ? '' : 'closed'].filter(Boolean).join(' ')}
				title={opened ? 'Close Control Panel' : 'Open Control Panel'}
				onClick={() => setOpen(!opened)}>
			</div>
		</div>
	);
}
