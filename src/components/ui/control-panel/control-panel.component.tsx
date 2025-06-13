import { useEffect, useState, type JSX } from 'react';
import './control-panel.styles.sass';
import { FaHammer, FaPlus, FaEdit, FaArrowUp, FaArrowDown } from 'react-icons/fa';

export type BuildMode = 'none' | 'road' | 'water' | 'terrain' | 'building' | 'zoning';

export interface ControlPanelProps {
	buildMode: boolean;
	onToggleBuildMode: () => void;
}

export interface ControlPanelDesign {
	key: string;
	label: string;
	icon: JSX.Element;
	options?: ControlPanelOption[];
}

export interface ControlPanelOption {
	key: string;
	label: string;
	icon: JSX.Element;
	groups?: ControlPanelActionGroup[];
}

export interface ControlPanelActionGroup {
	key: string;
	label: string;
	actions: ControlPanelAction[];
}

export interface ControlPanelAction {
	key: string;
	label: string;
	icon: JSX.Element;
	onClick: () => void;
}

const design = [
	{ key: 'build', label: 'Build', icon: <FaHammer style={{marginBottom: '0.2em', marginLeft: '0.1em'}} />, options: [
		{ key: 'roads', label: 'Roads', icon: '🛣️', groups: [
			{ key: 'tools', label: 'Tools', 'actions': [
				{ key: 'add-road', label: 'Add Road', icon: <FaPlus />, onClick: () => {} },
				{ key: 'edit-road', label: 'Edit Road', icon: <FaEdit />, onClick: () => {} },
			]},
		]},
		{ key: 'buildings', label: 'Buildings', icon: '🏢', groups: []},
		{ key: 'terrain', label: 'Terrain', icon: '⛰️', groups: [
			{ key: 'tools', label: 'Tools', 'actions': [
				{ key: 'raise-terrain', label: 'Raise Terrain', icon: <FaArrowUp />, onClick: () => {} },
				{ key: 'lower-terrain', label: 'Lower Terrain', icon: <FaArrowDown />, onClick: () => {} },
			]},
		]},
	] },
] as unknown as ControlPanelDesign[]

export default function ControlPanel() {
	const [opened, setOpen] = useState(true);
	const [mode, setMode] = useState<string | null>(null);
	const [option, setOption] = useState<string | null>(null);
	const [action, setAction] = useState<string | null>(null);

	const modeItem = design.find(md => md.key === mode);
	const optionItem = modeItem?.options?.find(opt => opt.key === option);
	
	useEffect(() => {
		setOption(null);
	}, [mode]);

	useEffect(() => {
		setAction(null);
	}, [option]);

	return (
		<div id="control-panel" className={opened ? '' : 'hide'}>
			{/* <div id="test-block">xxx</div> */}
			<div id="control-modes">
				{design.map(md => (
					<span
						key={md.key}
						id={`mode-btn--${md.key}`}
						className={['mode-btn', 'icon-btn', 'tgl', mode === md.key ? 'active' : ''].filter(Boolean).join(' ')}
						onClick={() => setMode(mode !== md.key ? md.key : null)}
						aria-pressed={mode === md.key}
						data-tooltip={md.label}
						tabIndex={0}
						role='button'
					>
						{md.icon}
					</span>
				))}
			</div>

			{modeItem && (<>
				<div id="control-options">
					<div className="options-header">
						{modeItem.label}
					</div>

					{modeItem.options?.map(opt => (<>
						<span
							key={opt.key}
							id={`option-btn--${opt.key}`}
							className={['option-btn', 'icon-btn', 'tgl', option === opt.key ? 'active' : ''].filter(Boolean).join(' ')}
							onClick={() => setOption(option !== opt.key ? opt.key : null)}
							aria-pressed={option === opt.key}
							data-tooltip={opt.label}
							tabIndex={0}
							role='button'
						>
							{opt.icon}
						</span>
					</>))}
				</div>
			</>)}

			{optionItem && (<>
				<div id="control-actions">
					{optionItem.groups?.map(grp => (
						<div key={grp.key}
							id={`action-group--${grp.key}`}
							className="action-group"
						>
							<div className="group-header">{grp.label}</div>

							{grp.actions.map(atn => (
								<span
									key={atn.key}
									id={`action-btn--${atn.key}`}
									className={['action-btn', 'icon-btn', 'tgl', action === atn.key ? 'active' : ''].filter(Boolean).join(' ')}
									onClick={() => {
										setAction(action !== atn.key ? atn.key : null)
										atn.onClick();
									}}
									aria-pressed={action === atn.key}
									data-tooltip={atn.label}
									tabIndex={0}
									role='button'
								>
									{atn.icon}
								</span>
							))}
						</div>
					))}
				</div>
			</>)}

			{/* Add more build tool panels as needed */}
			<div id='control-panel-toggle'
				className={['control-panel-toggle', 'icon-btn', opened ? '' : 'closed'].filter(Boolean).join(' ')}
				data-tooltip={opened ? 'Close Control Panel' : 'Open Control Panel'}
				onClick={() => setOpen(!opened)}></div>
		</div>
	);
}
