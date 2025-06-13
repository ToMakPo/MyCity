// src/services/road.service.ts
// Basic road service for adding roads to the map

export type RoadNode = { id: string, x: number, y: number };
export type RoadSegment = { id: string, from: string, to: string };

export interface Road {
	id: string;
	nodes: RoadNode[];
	segments: RoadSegment[];
}

export class RoadService {
	private roads: Road[] = [];

	addRoad(nodes: RoadNode[], segments: RoadSegment[]): Road {
		const road: Road = {
			id: crypto.randomUUID(),
			nodes,
			segments,
		};
		this.roads.push(road);
		return road;
	}

	getRoads(): Road[] {
		return this.roads;
	}
}

export const roadService = new RoadService();
