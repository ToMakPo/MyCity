// types.ts
export type ViewState = {
	offsetX: number;
	offsetY: number;
	zoom: number;
	isPanning: boolean;
	startPanX: number;
	startPanY: number;
};

export type Unit = {
	label: string;
	scale: number;
	short: string;
	sub: string;
	subScale: number;
};

export type MapEntity = {
	id: string;
	type: string;
	x: number;
	y: number;
	// Extend as needed
};
