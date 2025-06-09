// Minimap.tsx
import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import type { ViewState, Unit } from '../../pages/main/types'
import type { CitySizeInputProps } from './CitySizeInput';

interface MinimapProps {
	citySize: CitySizeInputProps['citySize'];
	unit: Unit;
	view: ViewState;
	setView: React.Dispatch<React.SetStateAction<ViewState>>;
	canvasRef: React.RefObject<HTMLCanvasElement>;
	minimapMaxSize: number;
	setMinimapMaxSize: (n: number) => void;
	isMinimapDragging: boolean;
	setIsMinimapDragging: (b: boolean) => void;
	clampOffset: (
		offsetX: number,
		offsetY: number,
		zoom: number,
		canvasWidth: number,
		canvasHeight: number,
		citySize: { x: number; y: number },
		unit: { short: string; scale: number }
	) => { offsetX: number; offsetY: number };
}

const Minimap: React.FC<MinimapProps> = ({
	citySize,
	unit,
	view,
	setView,
	canvasRef,
	minimapMaxSize,
	setMinimapMaxSize,
	isMinimapDragging,
	setIsMinimapDragging,
	clampOffset,
}) => {
	const minimapRef = useRef<SVGSVGElement>(null);
	const border = 8;
	const citySizeMeters = useMemo(() => ({ x: citySize.x * unit.scale, y: citySize.y * unit.scale }), [citySize, unit]);
	const aspect = citySizeMeters.x / citySizeMeters.y;
	let minimapWidth: number, minimapHeight: number, cityDrawWidth: number, cityDrawHeight: number, offsetX: number, offsetY: number, scale: number;
	if (aspect >= 1) {
		minimapWidth = minimapMaxSize;
		minimapHeight = minimapMaxSize / aspect;
		cityDrawWidth = minimapWidth - 2 * border;
		cityDrawHeight = minimapHeight - 2 * border;
		scale = cityDrawWidth / citySizeMeters.x;
		offsetX = border;
		offsetY = border;
	} else {
		minimapHeight = minimapMaxSize;
		minimapWidth = minimapMaxSize * aspect;
		cityDrawHeight = minimapHeight - 2 * border;
		cityDrawWidth = minimapWidth - 2 * border;
		scale = cityDrawHeight / citySizeMeters.y;
		offsetY = border;
		offsetX = border;
	}
	const viewRect = useMemo(() => {
		if (canvasRef.current) {
			const canvas = canvasRef.current;
			const worldLeft = -view.offsetX / view.zoom;
			const worldTop = -view.offsetY / view.zoom;
			const worldW = canvas.width / view.zoom;
			const worldH = canvas.height / view.zoom;
			let x = offsetX + worldLeft * scale;
			let y = offsetY + worldTop * scale;
			let w = worldW * scale;
			let h = worldH * scale;
			if (w > cityDrawWidth) {
				w = cityDrawWidth;
				x = offsetX;
			} else {
				if (x < offsetX) x = offsetX;
				if (x + w > offsetX + cityDrawWidth) x = offsetX + cityDrawWidth - w;
			}
			if (h > cityDrawHeight) {
				h = cityDrawHeight;
				y = offsetY;
			} else {
				if (y < offsetY) y = offsetY;
				if (y + h > offsetY + cityDrawHeight) y = offsetY + cityDrawHeight - h;
			}
			return { x, y, w, h };
		}
		return { x: 0, y: 0, w: 0, h: 0 };
	}, [view, scale, offsetX, offsetY, cityDrawWidth, cityDrawHeight, canvasRef]);

	// --- Define centerViewOnMinimap before refs ---
	const centerViewOnMinimap = useCallback((mouseX: number, mouseY: number) => {
		const minX = offsetX;
		const minY = offsetY;
		const maxX = offsetX + cityDrawWidth;
		const maxY = offsetY + cityDrawHeight;
		const clampedX = Math.max(minX, Math.min(mouseX, maxX));
		const clampedY = Math.max(minY, Math.min(mouseY, maxY));
		const worldX = (clampedX - offsetX) / scale;
		const worldY = (clampedY - offsetY) / scale;
		const canvas = canvasRef.current;
		if (!canvas) return;
		setView((prevView: ViewState) => {
			const viewW = canvas.width / prevView.zoom;
			const viewH = canvas.height / prevView.zoom;
			const newOffsetX = -(worldX - viewW / 2) * prevView.zoom;
			const newOffsetY = -(worldY - viewH / 2) * prevView.zoom;
			const clamped = clampOffset(newOffsetX, newOffsetY, prevView.zoom, canvas.width, canvas.height, citySize, unit);
			return { ...prevView, offsetX: clamped.offsetX, offsetY: clamped.offsetY };
		});
	}, [offsetX, offsetY, cityDrawWidth, cityDrawHeight, scale, citySize, unit, canvasRef, setView, clampOffset]);

	// Mouse drag logic
	const onMinimapMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
		setIsMinimapDragging(true);
		const minimapRect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
		const mouseX = e.clientX - minimapRect.left;
		const mouseY = e.clientY - minimapRect.top;
		centerViewOnMinimap(mouseX, mouseY);
		function onMove(ev: MouseEvent) {
			const rect = (document.getElementById('minimap-container') as HTMLElement).getBoundingClientRect();
			const mx = ev.clientX - rect.left;
			const my = ev.clientY - rect.top;
			centerViewOnMinimap(mx, my);
		}
		function onUp() {
			setIsMinimapDragging(false);
			window.removeEventListener('mousemove', onMove);
			window.removeEventListener('mouseup', onUp);
		}
		window.addEventListener('mousemove', onMove);
		window.addEventListener('mouseup', onUp);
	};

	// Touch drag logic
	const onMinimapTouchStart = (e: React.TouchEvent<SVGSVGElement>) => {
		if (e.touches.length === 1) {
			setIsMinimapDragging(true);
			const minimapRect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
			const touch = e.touches[0];
			const mouseX = touch.clientX - minimapRect.left;
			const mouseY = touch.clientY - minimapRect.top;
			centerViewOnMinimap(mouseX, mouseY);
			function onMove(ev: TouchEvent) {
				if (ev.touches.length === 1) {
					const rect = (document.getElementById('minimap-container') as HTMLElement).getBoundingClientRect();
					const t = ev.touches[0];
					const mx = t.clientX - rect.left;
					const my = t.clientY - rect.top;
					centerViewOnMinimap(mx, my);
				}
			}
			function onUp() {
				setIsMinimapDragging(false);
				window.removeEventListener('touchmove', onMove);
				window.removeEventListener('touchend', onUp);
			}
			window.addEventListener('touchmove', onMove);
			window.addEventListener('touchend', onUp);
		}
	};

	// --- Resizing logic ---
	const [isResizing, setIsResizing] = useState<null | 'left' | 'top'>(null);
	const dragStart = useRef({ x: 0, y: 0, size: minimapMaxSize });

	// Left resize handle
	const onMinimapLeftResize = (e: React.MouseEvent | React.TouchEvent) => {
		if ('touches' in e) {
			const clientX = e.touches[0].clientX;
			dragStart.current = { x: clientX, y: 0, size: minimapMaxSize };
		} else {
			const clientX = (e as React.MouseEvent).clientX;
			dragStart.current = { x: clientX, y: 0, size: minimapMaxSize };
		}
		setIsResizing('left');
		if (e.preventDefault) e.preventDefault();
	};
	// Top resize handle
	const onMinimapTopResize = (e: React.MouseEvent | React.TouchEvent) => {
		if ('touches' in e) {
			const clientY = e.touches[0].clientY;
			dragStart.current = { x: 0, y: clientY, size: minimapMaxSize };
		} else {
			const clientY = (e as React.MouseEvent).clientY;
			dragStart.current = { x: 0, y: clientY, size: minimapMaxSize };
		}
		setIsResizing('top');
		if (e.preventDefault) e.preventDefault();
	};

	useEffect(() => {
		if (!isResizing) return;
		function onMove(e: MouseEvent | TouchEvent) {
			let clientX: number, clientY: number;
			if ('touches' in e) {
				clientX = e.touches[0].clientX;
				clientY = e.touches[0].clientY;
			} else {
				clientX = (e as MouseEvent).clientX;
				clientY = (e as MouseEvent).clientY;
			}
			let delta: number;
			if (isResizing === 'left') {
				delta = dragStart.current.x - clientX;
			} else {
				delta = dragStart.current.y - clientY;
			}
			const newSize = Math.max(80, Math.min(400, dragStart.current.size + delta));
			setMinimapMaxSize(newSize);
		}
		function onUp() {
			setIsResizing(null);
			window.removeEventListener('mousemove', onMove);
			window.removeEventListener('mouseup', onUp);
			window.removeEventListener('touchmove', onMove);
			window.removeEventListener('touchend', onUp);
		}
		window.addEventListener('mousemove', onMove);
		window.addEventListener('mouseup', onUp);
		window.addEventListener('touchmove', onMove);
		window.addEventListener('touchend', onUp);
		return () => {
			window.removeEventListener('mousemove', onMove);
			window.removeEventListener('mouseup', onUp);
			window.removeEventListener('touchmove', onMove);
			window.removeEventListener('touchend', onUp);
		};
	}, [isResizing, setMinimapMaxSize]);

	return (
		<div
			id="minimap-container"
			className={isMinimapDragging ? 'minimap-dragging' : ''}
			style={{ width: minimapWidth, height: minimapHeight, position: 'fixed', right: 0, bottom: 0, zIndex: 100 }}
		>
			{/* Left resize handle */}
			<div
				className="minimap-resize-handle left"
				style={{ position: 'absolute', left: 0, top: 0, height: minimapHeight, width: 8, cursor: 'ew-resize', zIndex: 10 }}
				onMouseDown={onMinimapLeftResize}
				onTouchStart={onMinimapLeftResize}
			>
				<div style={{ width: 4, height: minimapHeight * 0.5, background: '#2a5cff', borderRadius: 2, marginTop: minimapHeight * 0.25 }} />
			</div>
			{/* Top resize handle */}
			<div
				className="minimap-resize-handle top"
				style={{ position: 'absolute', left: 0, top: 0, width: minimapWidth, height: 8, cursor: 'ns-resize', zIndex: 10 }}
				onMouseDown={onMinimapTopResize}
				onTouchStart={onMinimapTopResize}
			>
				<div style={{ height: 4, width: minimapWidth * 0.5, background: '#2a5cff', margin: 'auto', borderRadius: 2, marginLeft: minimapWidth * 0.25 }} />
			</div>
			<svg
				ref={minimapRef}
				width={minimapWidth}
				height={minimapHeight}
				style={{ display: 'block' }}
				onMouseDown={onMinimapMouseDown}
				onTouchStart={onMinimapTouchStart}
			>
				{/* Full map area */}
				<rect x={offsetX} y={offsetY} width={cityDrawWidth} height={cityDrawHeight} fill="#f8f8f8" stroke="#aaa" strokeWidth={2} />
				{/* Dark overlay for out-of-view area */}
				<mask id="minimap-mask">
					<rect x={offsetX} y={offsetY} width={cityDrawWidth} height={cityDrawHeight} fill="white" />
					<rect x={viewRect.x} y={viewRect.y} width={viewRect.w} height={viewRect.h} fill="black" />
				</mask>
				<rect x={offsetX} y={offsetY} width={cityDrawWidth} height={cityDrawHeight} fill="rgba(0,0,0,0.25)" mask="url(#minimap-mask)" />
				{/* Viewport rectangle */}
				<rect
					x={viewRect.x}
					y={viewRect.y}
					width={viewRect.w}
					height={viewRect.h}
					fill="none"
					stroke="#2a5cff"
					strokeWidth={2}
					className="minimap-viewport"
				/>
			</svg>
		</div>
	);
};

export default Minimap;
